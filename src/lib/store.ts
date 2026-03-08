import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product, Customer, Order, AppState } from "@/types";
import { supabaseService } from "@/services/supabaseService";

// Memoization cache for expensive computations
const memoCache = new Map<string, { value: any; timestamp: number }>();
const CACHE_DURATION = 5000; // 5 seconds

function memoize<T>(key: string, fn: () => T): T {
  const cached = memoCache.get(key);
  const now = Date.now();
  
  if (cached && now - cached.timestamp < CACHE_DURATION) {
    return cached.value;
  }
  
  const value = fn();
  memoCache.set(key, { value, timestamp: now });
  return value;
}

const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      products: [],
      customers: [],
      orders: [],
      isLoading: false,
      lastSync: null,
      
      // Optimized initialization - don't load everything at once
      initializeStore: async () => {
        const state = get();
        if (state.isLoading) return; // Prevent duplicate loads
        
        set({ isLoading: true });
        try {
          // Load only critical data first (products for order creation)
          const products = await supabaseService.getProducts();
          set({ products, lastSync: new Date().toISOString() });
          
          // Defer loading customers and orders
          setTimeout(async () => {
            const [customers, orders] = await Promise.all([
              supabaseService.getCustomers(),
              supabaseService.getOrders()
            ]);
            set({ customers, orders });
          }, 100);
        } catch (error) {
          console.error("Error initializing store:", error);
        } finally {
          set({ isLoading: false });
        }
      },

      // Lazy load customers only when needed
      loadCustomersIfNeeded: async () => {
        const state = get();
        if (state.customers.length > 0) return;
        
        try {
          const customers = await supabaseService.getCustomers();
          set({ customers });
        } catch (error) {
          console.error("Error loading customers:", error);
        }
      },

      // Lazy load orders only when needed
      loadOrdersIfNeeded: async () => {
        const state = get();
        if (state.orders.length > 0) return;
        
        try {
          const orders = await supabaseService.getOrders();
          set({ orders });
        } catch (error) {
          console.error("Error loading orders:", error);
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
          const productToUpdate = get().products.find(p => p.id === id);
          if (!productToUpdate) throw new Error("Product not found");
          
          const updatedProduct = { ...productToUpdate, ...updates };
          await supabaseService.updateProduct(updatedProduct);
          set((state) => ({
            products: state.products.map((p) => (p.id === id ? updatedProduct : p)),
          }));
        } catch (error) {
          console.error("Error updating product:", error);
          throw error;
        }
      },

      deleteProduct: async (id: string) => {
        try {
          // Soft delete or handle missing method
          // await supabaseService.deleteProduct(id);
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
          const customerToUpdate = get().customers.find(c => c.id === id);
          if (!customerToUpdate) throw new Error("Customer not found");
          
          const updatedCustomer = { ...customerToUpdate, ...updates };
          await supabaseService.updateCustomer(updatedCustomer);
          set((state) => ({
            customers: state.customers.map((c) => (c.id === id ? updatedCustomer : c)),
          }));
        } catch (error) {
          console.error("Error updating customer:", error);
          throw error;
        }
      },

      deleteCustomer: async (id: string) => {
        try {
          // Soft delete or handle missing method
          // await supabaseService.deleteCustomer(id);
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
            orders: [newOrder, ...state.orders],
          }));
          return newOrder;
        } catch (error) {
          console.error("Error adding order:", error);
          throw error;
        }
      },

      updateOrder: async (id: string, updates: Partial<Order>) => {
        try {
          const orderToUpdate = get().orders.find(o => o.id === id);
          if (!orderToUpdate) throw new Error("Order not found");
          
          const updatedOrder = { ...orderToUpdate, ...updates };
          await supabaseService.updateOrder(updatedOrder);
          set((state) => ({
            orders: state.orders.map((o) => (o.id === id ? updatedOrder : o)),
          }));
        } catch (error) {
          console.error("Error updating order:", error);
          throw error;
        }
      },

      deleteOrder: async (id: string) => {
        try {
          // await supabaseService.deleteOrder(id);
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
          const orders = get().orders;
          return orders.reduce((sum, order) => {
            const orderTotal = order.discount 
              ? order.subtotal - order.discount 
              : order.subtotal;
            return sum + orderTotal;
          }, 0);
        });
      },

      getPendingOrders: () => {
        return memoize("pendingOrders", () => {
          return get().orders.filter((order) => order.status === "pending");
        });
      },

      getCompletedOrders: () => {
        return memoize("completedOrders", () => {
          return get().orders.filter((order) => order.status === "completed");
        });
      },

      getLowStockProducts: () => {
        return memoize("lowStockProducts", () => {
          return get().products.filter(
            (product) => product.stock <= (product.minStock || 10)
          );
        });
      },

      getTopCustomers: (limit = 5) => {
        return memoize(`topCustomers-${limit}`, () => {
          const { customers, orders } = get();
          const customerSpending = customers.map((customer) => {
            const customerOrders = orders.filter((o) => o.customerId === customer.id);
            const totalSpent = customerOrders.reduce((sum, order) => {
              const orderTotal = order.discount 
                ? order.subtotal - order.discount 
                : order.subtotal;
              return sum + orderTotal;
            }, 0);
            return { ...customer, totalSpent };
          });

          return customerSpending
            .sort((a, b) => b.totalSpent - a.totalSpent)
            .slice(0, limit);
        });
      },

      getRecentOrders: (limit = 5) => {
        return memoize(`recentOrders-${limit}`, () => {
          return [...get().orders]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, limit);
        });
      },

      refreshData: async () => {
        set({ isLoading: true });
        try {
          const [products, customers, orders] = await Promise.all([
            supabaseService.getProducts(),
            supabaseService.getCustomers(),
            supabaseService.getOrders(),
          ]);
          
          // Clear memoization cache on refresh
          memoCache.clear();
          
          set({
            products,
            customers,
            orders,
            lastSync: new Date().toISOString(),
            isLoading: false,
          });
        } catch (error) {
          console.error("Error refreshing data:", error);
          set({ isLoading: false });
        }
      },
    }),
    {
      name: "bakery-storage",
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