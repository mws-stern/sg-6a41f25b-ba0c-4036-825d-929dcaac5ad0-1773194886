import type { Product, Order, Invoice } from "@/types";
import { getProducts, getOrders, getInvoices, createInvoiceFromOrder } from "./store";

export interface AutomationAlert {
  id: string;
  type: "low_stock" | "overdue_payment" | "order_ready" | "inventory_added";
  severity: "info" | "warning" | "critical";
  title: string;
  message: string;
  productId?: string;
  orderId?: string;
  invoiceId?: string;
  createdAt: string;
  read: boolean;
}

// Low stock threshold (in lbs)
const LOW_STOCK_THRESHOLD = 50;
const CRITICAL_STOCK_THRESHOLD = 20;

// Check for low stock products
export const checkLowStock = (): AutomationAlert[] => {
  const products = getProducts();
  const alerts: AutomationAlert[] = [];

  products.forEach(product => {
    const stock = product.currentInventory || 0;
    
    if (stock <= CRITICAL_STOCK_THRESHOLD && stock > 0) {
      alerts.push({
        id: `low-stock-${product.id}-${Date.now()}`,
        type: "low_stock",
        severity: "critical",
        title: "Critical Stock Alert",
        message: `${product.name} is critically low (${stock} lbs remaining)`,
        productId: product.id,
        createdAt: new Date().toISOString(),
        read: false,
      });
    } else if (stock <= LOW_STOCK_THRESHOLD && stock > CRITICAL_STOCK_THRESHOLD) {
      alerts.push({
        id: `low-stock-${product.id}-${Date.now()}`,
        type: "low_stock",
        severity: "warning",
        title: "Low Stock Warning",
        message: `${product.name} is running low (${stock} lbs remaining)`,
        productId: product.id,
        createdAt: new Date().toISOString(),
        read: false,
      });
    } else if (stock === 0) {
      alerts.push({
        id: `out-stock-${product.id}-${Date.now()}`,
        type: "low_stock",
        severity: "critical",
        title: "Out of Stock",
        message: `${product.name} is out of stock!`,
        productId: product.id,
        createdAt: new Date().toISOString(),
        read: false,
      });
    }
  });

  return alerts;
};

// Check for overdue payments
export const checkOverduePayments = (): AutomationAlert[] => {
  const invoices = getInvoices();
  const alerts: AutomationAlert[] = [];
  const now = new Date();

  invoices.forEach(invoice => {
    if (invoice.paymentStatus !== "paid") {
      const dueDate = new Date(invoice.dueDate);
      const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysOverdue > 0) {
        alerts.push({
          id: `overdue-${invoice.id}-${Date.now()}`,
          type: "overdue_payment",
          severity: daysOverdue > 30 ? "critical" : "warning",
          title: `Payment Overdue - ${invoice.invoiceNumber}`,
          message: `${invoice.customerName} payment is ${daysOverdue} days overdue ($${invoice.amountDue.toFixed(2)})`,
          invoiceId: invoice.id,
          createdAt: new Date().toISOString(),
          read: false,
        });
      }
    }
  });

  return alerts;
};

// Auto-generate invoices for delivered orders without invoices
export const autoGenerateInvoices = (): Invoice[] => {
  const orders = getOrders();
  const invoices = getInvoices();
  const newInvoices: Invoice[] = [];

  const deliveredOrders = orders.filter(
    order => order.status === "delivered" && 
    !invoices.some(invoice => invoice.orderId === order.id)
  );

  deliveredOrders.forEach(order => {
    const invoice = createInvoiceFromOrder(order);
    newInvoices.push(invoice);
  });

  return newInvoices;
};

// Calculate profit margin for products
export const calculateProfitMargin = (costPerLb: number, pricePerLb: number): number => {
  if (pricePerLb === 0) return 0;
  return ((pricePerLb - costPerLb) / pricePerLb) * 100;
};

// Get all active alerts
export const getAllAlerts = (): AutomationAlert[] => {
  return [
    ...checkLowStock(),
    ...checkOverduePayments(),
  ].sort((a, b) => {
    // Sort by severity first, then by date
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    if (severityOrder[a.severity] !== severityOrder[b.severity]) {
      return severityOrder[a.severity] - severityOrder[b.severity];
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
};