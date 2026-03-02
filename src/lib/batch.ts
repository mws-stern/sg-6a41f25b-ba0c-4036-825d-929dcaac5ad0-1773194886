import type { Order, Product, Customer } from "@/types";
import { getOrders, saveOrders, getProducts, saveProducts, getCustomers, saveCustomers, createInvoiceFromOrder } from "./store";

export interface BulkOperationResult {
  success: number;
  failed: number;
  total: number;
  errors?: string[];
}

/**
 * Bulk update order status
 */
export const bulkUpdateOrderStatus = (
  orderIds: string[], 
  status: Order["status"]
): BulkOperationResult => {
  const orders = getOrders();
  let successCount = 0;
  const failedCount = 0;
  const errors: string[] = [];

  const updatedOrders = orders.map(order => {
    if (orderIds.includes(order.id)) {
      // Skip if status is already the same
      if (order.status === status) {
        return order;
      }
      
      successCount++;
      return { ...order, status, updatedAt: new Date().toISOString() };
    }
    return order;
  });

  if (successCount > 0) {
    saveOrders(updatedOrders);
  }

  return {
    success: successCount,
    failed: failedCount,
    total: orderIds.length,
    errors: errors.length > 0 ? errors : undefined
  };
};

/**
 * Bulk create invoices for orders
 */
export const bulkCreateInvoices = (orderIds: string[]): BulkOperationResult => {
  const orders = getOrders();
  let successCount = 0;
  let failedCount = 0;
  const errors: string[] = [];

  orderIds.forEach(orderId => {
    const order = orders.find(o => o.id === orderId);
    if (order) {
      try {
        createInvoiceFromOrder(order);
        successCount++;
      } catch (error) {
        failedCount++;
        errors.push(`Failed to create invoice for order ${order.orderNumber}`);
      }
    } else {
      failedCount++;
      errors.push(`Order ${orderId} not found`);
    }
  });

  return {
    success: successCount,
    failed: failedCount,
    total: orderIds.length,
    errors: errors.length > 0 ? errors : undefined
  };
};

/**
 * Bulk update product prices
 */
export const bulkUpdateProductPrices = (
  updates: { id: string; price: number }[]
): BulkOperationResult => {
  const products = getProducts();
  let successCount = 0;
  const failedCount = 0;

  const updatedProducts = products.map(product => {
    const update = updates.find(u => u.id === product.id);
    if (update) {
      successCount++;
      return { ...product, pricePerLb: update.price };
    }
    return product;
  });

  if (successCount > 0) {
    saveProducts(updatedProducts);
  }

  return {
    success: successCount,
    failed: failedCount,
    total: updates.length
  };
};

/**
 * Bulk update inventory
 */
export const bulkUpdateInventory = (
  updates: { id: string; amount: number }[]
): BulkOperationResult => {
  const products = getProducts();
  let successCount = 0;
  const failedCount = 0;

  const updatedProducts = products.map(product => {
    const update = updates.find(u => u.id === product.id);
    if (update) {
      successCount++;
      return { ...product, currentInventory: (product.currentInventory || 0) + update.amount };
    }
    return product;
  });

  if (successCount > 0) {
    saveProducts(updatedProducts);
  }

  return {
    success: successCount,
    failed: failedCount,
    total: updates.length
  };
};