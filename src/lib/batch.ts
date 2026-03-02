import type { Order, Product, Customer } from "@/types";
import { getOrders, saveOrders, getProducts, saveProducts, cache, CACHE_KEYS } from "./store";

// Batch update order statuses
export const batchUpdateOrderStatus = (
  orderIds: string[],
  status: Order["status"]
): { success: number; failed: number } => {
  const orders = getOrders();
  let success = 0;
  let failed = 0;

  const updatedOrders = orders.map(order => {
    if (orderIds.includes(order.id)) {
      try {
        success++;
        return { ...order, status, updatedAt: new Date().toISOString() };
      } catch (e) {
        failed++;
        return order;
      }
    }
    return order;
  });

  saveOrders(updatedOrders);
  cache.invalidate(CACHE_KEYS.ORDERS);
  
  return { success, failed };
};

// Batch update product prices
export const batchUpdatePrices = (
  updates: Array<{ id: string; pricePerLb: number }>
): { success: number; failed: number } => {
  const products = getProducts();
  let success = 0;
  let failed = 0;

  const updatedProducts = products.map(product => {
    const update = updates.find(u => u.id === product.id);
    if (update) {
      try {
        success++;
        return { ...product, pricePerLb: update.pricePerLb };
      } catch (e) {
        failed++;
        return product;
      }
    }
    return product;
  });

  saveProducts(updatedProducts);
  cache.invalidate(CACHE_KEYS.PRODUCTS);
  
  return { success, failed };
};

// Quick order templates
export interface OrderTemplate {
  id: string;
  name: string;
  customerId: string;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  notes?: string;
  createdAt: string;
}

const TEMPLATES_KEY = "order_templates";

export const getOrderTemplates = (): OrderTemplate[] => {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(TEMPLATES_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const saveOrderTemplate = (
  template: Omit<OrderTemplate, "id" | "createdAt">
): OrderTemplate => {
  const templates = getOrderTemplates();
  const newTemplate: OrderTemplate = {
    ...template,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  };
  templates.push(newTemplate);
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
  return newTemplate;
};

export const deleteOrderTemplate = (id: string): void => {
  const templates = getOrderTemplates().filter(t => t.id !== id);
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
};

// Duplicate order
export const duplicateOrder = (orderId: string): Order | null => {
  const orders = getOrders();
  const order = orders.find(o => o.id === orderId);
  if (!order) return null;

  const newOrder: Order = {
    ...order,
    id: Date.now().toString(),
    orderNumber: `ORD-${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: "pending",
    paymentStatus: "unpaid",
    amountPaid: 0,
    amountDue: order.total,
    inventoryDeducted: false,
  };

  orders.push(newOrder);
  saveOrders(orders);
  cache.invalidate(CACHE_KEYS.ORDERS);
  
  return newOrder;
};

// Bulk operations result type
export interface BulkOperationResult {
  success: number;
  failed: number;
  total: number;
  errors?: string[];
}