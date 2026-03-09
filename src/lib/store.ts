import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product, Customer, Order, Invoice, AppState } from "@/types";
import { supabaseService } from "@/services/supabaseService";
import { supabase } from "@/integrations/supabase/client";

// Memoization cache
const cache = new Map<string, { value: any; timestamp: number }>();
const CACHE_TTL = 5000; // 5 seconds

function memoize<T>(key: string, fn: () => T): T {
  const cached = cache.get(key);
  const now = Date.now();

  if (cached && now - cached.timestamp < CACHE_TTL) {
    return cached.value;
  }

  const value = fn();
  cache.set(key, { value, timestamp: now });
  return value;
}

const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      products: [],
      customers: [],
      orders: [],
      invoices: [],
      isLoading: false,
      isInitializing: false,
      lastSync: null,
      isInitialized: false,

      // Initialize store with authentication check
      initialize: async () => {
        const state = get();
        
        // Prevent
        if (state.isInitialized) return;

        set({ isInitializing: true });

        try {
          // Check if user is authenticated
          const { data: { session } } = await supabase.auth.getSession();
          
          if (!session) {
            // User not authenticated, don't try to load data
            set({ isInitialized: true, isLoading: false });
            return;
          }

          // User is authenticated, load data progressively
          set({ isLoading: true });

          // Load products first (most important for order creation)
          const products = await supabaseService.getProducts();
          set({ products, isInitialized: true });

          // Load customers and orders in background
          Promise.all([
            supabaseService.getCustomers(),
            supabaseService.getOrders(),
          ]).then(([customers, orders]) => {
            set({ customers, orders, isLoading: false, lastSync: Date.now() });
          }).catch(error => {
            console.error("Background data load error:", error);
            set({ isLoading: false });
          });

        } catch (error) {
          console.error("Store initialization error:", error);
          set({ isLoading: false, isInitialized: true });
        }

        set({ isInitializing: false });
      },

      refreshData: async () => {
        try {
          // Check authentication before refreshing
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) return;

          set({ isLoading: true });
          const [products, customers, orders] = await Promise.all([
            supabaseService.getProducts(),
            supabaseService.getCustomers(),
            supabaseService.getOrders(),
          ]);
          set({
            products,
            customers,
            orders,
            lastSync: Date.now(),
            isLoading: false,
          });
        } catch (error) {
          console.error("Error refreshing data:", error);
          set({ isLoading: false });
        }
      },

      addProduct: async (product: Omit<Product, "id">) => {
        try {
          const newProduct = await supabaseService.addProduct(product);
          set((state) => ({
            products: [...state.products, newProduct],
          }));
          return newProduct;
        } catch (error) {
          console.error("Error adding product:", error);
          throw error;
        }
      },

      updateProduct: async (id: string, updates: Partial<Product>) => {
        try {
          const state = get();
          const existing = state.products.find((p) => p.id === id);
          if (!existing) return;
          const updated = { ...existing, ...updates } as Product;
          await supabaseService.updateProduct(updated);
          set((state) => ({
            products: state.products.map((p) => (p.id === id ? updated : p)),
          }));
        } catch (error) {
          console.error("Error updating product:", error);
          throw error;
        }
      },

      deleteProduct: async (id: string) => {
        try {
          await supabaseService.deleteProduct(id);
          set((state) => ({
            products: state.products.filter((p) => p.id !== id),
          }));
        } catch (error) {
          console.error("Error deleting product:", error);
          throw error;
        }
      },

      addCustomer: async (customer: Omit<Customer, "id">) => {
        try {
          const newCustomer = await supabaseService.addCustomer(customer);
          set((state) => ({
            customers: [...state.customers, newCustomer],
          }));
          return newCustomer;
        } catch (error) {
          console.error("Error adding customer:", error);
          throw error;
        }
      },

      updateCustomer: async (id: string, updates: Partial<Customer>) => {
        try {
          const state = get();
          const existing = state.customers.find((c) => c.id === id);
          if (!existing) return;
          const updated = { ...existing, ...updates } as Customer;
          await supabaseService.updateCustomer(updated);
          set((state) => ({
            customers: state.customers.map((c) => (c.id === id ? updated : c)),
          }));
        } catch (error) {
          console.error("Error updating customer:", error);
          throw error;
        }
      },

      deleteCustomer: async (id: string) => {
        try {
          await supabaseService.deleteCustomer(id);
          set((state) => ({
            customers: state.customers.filter((c) => c.id !== id),
          }));
        } catch (error) {
          console.error("Error deleting customer:", error);
          throw error;
        }
      },

      addOrder: async (order: Omit<Order, "id">) => {
        try {
          const newOrder = await supabaseService.addOrder(order);
          set((state) => ({
            orders: [...state.orders, newOrder],
          }));
          return newOrder;
        } catch (error) {
          console.error("Error adding order:", error);
          throw error;
        }
      },

      updateOrder: async (id: string, updates: Partial<Order>) => {
        try {
          const state = get();
          const existing = state.orders.find((o) => o.id === id);
          if (!existing) return;
          const updated = { ...existing, ...updates } as Order;
          await supabaseService.updateOrder(updated);
          set((state) => ({
            orders: state.orders.map((o) => (o.id === id ? updated : o)),
          }));
        } catch (error) {
          console.error("Error updating order:", error);
          throw error;
        }
      },

      deleteOrder: async (id: string) => {
        try {
          // Direct deletion since supabaseService doesn't have deleteOrder
          set((state) => ({
            orders: state.orders.filter((o) => o.id !== id),
          }));
        } catch (error) {
          console.error("Error deleting order:", error);
          throw error;
        }
      },

      // Memoized calculations with caching
      getTotalRevenue: () => {
        return memoize("totalRevenue", () => {
          const state = get();
          return state.orders
            .filter((o) => o.status === "delivered")
            .reduce((sum, order) => sum + Number(order.subtotal - (order.discount || 0)), 0);
        });
      },

      getPendingOrders: () => {
        return memoize("pendingOrders", () => {
          const state = get();
          return state.orders.filter((o) => o.status === "pending");
        });
      },

      getCompletedOrders: () => {
        return memoize("completedOrders", () => {
          const state = get();
          return state.orders.filter(
            (o) => o.status === "delivered"
          );
        });
      },

      getTopCustomers: (limit = 5) => {
        return memoize(`topCustomers:${limit}`, () => {
          const state = get();
          const customerTotals = state.orders
            .filter((o) => o.status === "delivered")
            .reduce((acc, order) => {
              const customerId = order.customerId;
              if (!acc[customerId]) {
                acc[customerId] = 0;
              }
              acc[customerId] += Number(order.subtotal - (order.discount || 0));
              return acc;
            }, {} as Record<string, number>);

          return Object.entries(customerTotals)
            .sort(([, a], [, b]) => b - a)
            .slice(0, limit)
            .map(([customerId, total]) => ({
              ...state.customers.find((c) => c.id === customerId)!,
              totalSpent: total,
            }));
        });
      },

      getLowStockProducts: () => {
        return memoize("lowStockProducts", () => {
          const state = get();
          return state.products.filter(
            (p) => (p.currentInventory || 0) < 10
          );
        });
      },

      getRecentOrders: (limit = 5) => {
        return memoize(`recentOrders:${limit}`, () => {
          const state = get();
          return [...state.orders]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, limit);
        });
      },
    }),
    {
      name: "bakery-store",
      partialize: (state) => ({
        products: state.products,
        customers: state.customers,
        orders: state.orders,
        lastSync: state.lastSync,
      }),
    }
  )
);

export default useStore;