import type { Product, Customer, Order, Invoice, Payment } from "@/types";
import { cache, CACHE_KEYS } from "./cache";
import { INITIAL_CUSTOMERS_DATA } from "./initialCustomers";

export interface InventoryEntry {
  id: string;
  productId: string;
  productName: string;
  amount: number;
  date: string;
  notes?: string;
  createdAt: string;
}

// LocalStorage keys
const STORAGE_KEYS = {
  PRODUCTS: "matzos_products",
  CUSTOMERS: "matzos_customers",
  ORDERS: "matzos_orders",
  INVOICES: "matzos_invoices",
  INVENTORY: "matzos_inventory",
  SETTINGS: "matzos_settings",
  PAYMENTS: "matzos_payments",
};

// Initial products setup
const INITIAL_PRODUCTS: Product[] = [
  {
    id: "1",
    name: "Rashi Matzoh",
    nameHebrew: "מצה רש\"י",
    pricePerLb: 0,
    category: "rashi",
    description: "Traditional Rashi style matzoh",
    inStock: true,
    currentInventory: 0,
  },
  {
    id: "2",
    name: "Regular Matzoh",
    nameHebrew: "מצה רעגולער",
    pricePerLb: 0,
    category: "regular",
    description: "Standard matzoh",
    inStock: true,
    currentInventory: 0,
  },
  {
    id: "3",
    name: "Spelt Matzoh",
    nameHebrew: "מצה ספעלט",
    pricePerLb: 0,
    category: "spelt",
    description: "Made with spelt flour",
    inStock: true,
    currentInventory: 0,
  },
  {
    id: "4",
    name: "Whole Wheat Matzoh",
    nameHebrew: "מצה האל וויט",
    pricePerLb: 0,
    category: "wholewheat",
    description: "Whole wheat matzoh",
    inStock: true,
    currentInventory: 0,
  },
  {
    id: "5",
    name: "Matzoh Flour",
    nameHebrew: "מצה מעהל",
    pricePerLb: 0,
    category: "flour",
    description: "Fine matzoh flour",
    inStock: true,
    currentInventory: 0,
  },
  {
    id: "6",
    name: "Shvurim Matzoh",
    nameHebrew: "מצה שברים",
    pricePerLb: 0,
    category: "shvurim",
    description: "Broken matzoh pieces",
    inStock: true,
    currentInventory: 0,
  },
];

const INITIAL_CUSTOMERS: Customer[] = INITIAL_CUSTOMERS_DATA;

// Helper to check if we're on the client
const isClient = typeof window !== "undefined";

// Products with caching
export const getProducts = (): Product[] => {
  const cached = cache.get<Product[]>(CACHE_KEYS.PRODUCTS);
  if (cached) return cached;

  if (!isClient) return INITIAL_PRODUCTS;
  const stored = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
  let products: Product[];
  
  if (!stored) {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
    products = INITIAL_PRODUCTS;
  } else {
    products = JSON.parse(stored);
  }
  
  cache.set(CACHE_KEYS.PRODUCTS, products);
  return products;
};

export const saveProducts = (products: Product[]): void => {
  if (!isClient) return;
  localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  cache.invalidate(CACHE_KEYS.PRODUCTS);
  cache.invalidate(CACHE_KEYS.STATS);
};

export const updateProduct = (product: Product): void => {
  const products = getProducts();
  const index = products.findIndex((p) => p.id === product.id);
  if (index !== -1) {
    products[index] = product;
    saveProducts(products);
  }
};

// Customers with caching
export const getCustomers = (): Customer[] => {
  const cached = cache.get<Customer[]>(CACHE_KEYS.CUSTOMERS);
  if (cached) return cached;

  if (!isClient) return INITIAL_CUSTOMERS;
  const stored = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
  
  if (!stored) {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(INITIAL_CUSTOMERS));
    return INITIAL_CUSTOMERS;
  }
  
  const customers = JSON.parse(stored);
  cache.set(CACHE_KEYS.CUSTOMERS, customers);
  return customers;
};

export const saveCustomers = (customers: Customer[]): void => {
  if (!isClient) return;
  localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
  cache.invalidate(CACHE_KEYS.CUSTOMERS);
  cache.invalidate(CACHE_KEYS.STATS);
};

export const addCustomer = (customer: Omit<Customer, "id" | "createdAt">): Customer => {
  const customers = getCustomers();
  const newCustomer: Customer = {
    ...customer,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  };
  customers.push(newCustomer);
  saveCustomers(customers);
  return newCustomer;
};

export const getCustomer = (id: string): Customer | undefined => {
  return getCustomers().find((c) => c.id === id);
};

// Orders with caching
export const getOrders = (): Order[] => {
  const cached = cache.get<Order[]>(CACHE_KEYS.ORDERS);
  if (cached) return cached;

  if (!isClient) return [];
  const stored = localStorage.getItem(STORAGE_KEYS.ORDERS);
  const orders = stored ? JSON.parse(stored) : [];
  
  cache.set(CACHE_KEYS.ORDERS, orders);
  return orders;
};

export const saveOrders = (orders: Order[]): void => {
  if (!isClient) return;
  localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  cache.invalidate(CACHE_KEYS.ORDERS);
  cache.invalidate(CACHE_KEYS.STATS);
  cache.invalidate(CACHE_KEYS.RECEIVABLES);
};

export const addOrder = (order: Omit<Order, "id" | "orderNumber" | "createdAt" | "updatedAt" | "paymentStatus" | "amountPaid" | "amountDue" | "inventoryDeducted">): Order => {
  const orders = getOrders();
  const orderNumber = `ORD-${Date.now()}`;
  const now = new Date();
  const newOrder: Order = {
    ...order,
    id: Date.now().toString(),
    orderNumber,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    orderTime: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
    paymentStatus: "unpaid",
    amountPaid: 0,
    amountDue: order.total,
    inventoryDeducted: false,
  };
  orders.push(newOrder);
  saveOrders(orders);
  return newOrder;
};

export const updateOrder = (order: Order): void => {
  const orders = getOrders();
  const index = orders.findIndex((o) => o.id === order.id);
  if (index !== -1) {
    const previousOrder = orders[index];
    const updatedOrder = { ...order, updatedAt: new Date().toISOString() };
    
    // Deduct inventory when order is marked as delivered (only once)
    if (order.status === "delivered" && !previousOrder.inventoryDeducted) {
      order.items.forEach(item => {
        reduceInventory(item.productId, item.quantity);
      });
      updatedOrder.inventoryDeducted = true;
    }
    
    orders[index] = updatedOrder;
    saveOrders(orders);
  }
};

export const getOrder = (id: string): Order | undefined => {
  return getOrders().find((o) => o.id === id);
};

// Invoices with caching
export const getInvoices = (): Invoice[] => {
  const cached = cache.get<Invoice[]>(CACHE_KEYS.INVOICES);
  if (cached) return cached;

  if (!isClient) return [];
  const stored = localStorage.getItem(STORAGE_KEYS.INVOICES);
  const invoices = stored ? JSON.parse(stored) : [];
  
  cache.set(CACHE_KEYS.INVOICES, invoices);
  return invoices;
};

export const saveInvoices = (invoices: Invoice[]): void => {
  if (!isClient) return;
  localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
  cache.invalidate(CACHE_KEYS.INVOICES);
  cache.invalidate(CACHE_KEYS.RECEIVABLES);
};

export const createInvoiceFromOrder = (order: Order): Invoice => {
  const invoices = getInvoices();
  const invoiceNumber = `INV-${Date.now()}`;
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 30);
  
  const newInvoice: Invoice = {
    id: Date.now().toString(),
    orderId: order.id,
    invoiceNumber,
    customerId: order.customerId,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    items: order.items,
    subtotal: order.subtotal,
    tax: order.tax,
    total: order.total,
    paid: false,
    paymentStatus: order.paymentStatus,
    amountPaid: order.amountPaid,
    amountDue: order.amountDue,
    createdAt: new Date().toISOString(),
    dueDate: dueDate.toISOString(),
  };
  
  invoices.push(newInvoice);
  saveInvoices(invoices);
  return newInvoice;
};

export const getInvoice = (id: string): Invoice | undefined => {
  return getInvoices().find((i) => i.id === id);
};

export const updateInvoice = (invoice: Invoice): void => {
  const invoices = getInvoices();
  const index = invoices.findIndex((i) => i.id === invoice.id);
  if (index !== -1) {
    invoices[index] = invoice;
    saveInvoices(invoices);
  }
};

// Inventory Management
export const getInventory = (): InventoryEntry[] => {
  const cached = cache.get<InventoryEntry[]>(CACHE_KEYS.INVENTORY);
  if (cached) return cached;

  if (!isClient) return [];
  const stored = localStorage.getItem(STORAGE_KEYS.INVENTORY);
  const inventory = stored ? JSON.parse(stored) : [];
  
  cache.set(CACHE_KEYS.INVENTORY, inventory);
  return inventory;
};

export const saveInventory = (inventory: InventoryEntry[]): void => {
  if (!isClient) return;
  localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(inventory));
  cache.invalidate(CACHE_KEYS.INVENTORY);
  cache.invalidate(CACHE_KEYS.PRODUCTS);
};

export const addInventoryEntry = (entry: Omit<InventoryEntry, "id" | "createdAt">): InventoryEntry => {
  const inventory = getInventory();
  const newEntry: InventoryEntry = {
    ...entry,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  };
  inventory.push(newEntry);
  saveInventory(inventory);
  
  // Update product inventory
  const products = getProducts();
  const productIndex = products.findIndex(p => p.id === entry.productId);
  if (productIndex !== -1) {
    products[productIndex].currentInventory = (products[productIndex].currentInventory || 0) + entry.amount;
    saveProducts(products);
  }
  
  return newEntry;
};

export const getInventoryByProduct = (productId: string): InventoryEntry[] => {
  return getInventory().filter(entry => entry.productId === productId);
};

export const getTotalInventoryForProduct = (productId: string): number => {
  const product = getProducts().find(p => p.id === productId);
  return product?.currentInventory || 0;
};

export const reduceInventory = (productId: string, amount: number): void => {
  const products = getProducts();
  const productIndex = products.findIndex(p => p.id === productId);
  if (productIndex !== -1) {
    products[productIndex].currentInventory = Math.max(0, (products[productIndex].currentInventory || 0) - amount);
    saveProducts(products);
  }
};

// Settings
export interface Settings {
  companyName: string;
  companyNameHebrew: string;
  email: string;
  phone: string;
  address: string;
  taxRate: number;
  currency: string;
}

export const getSettings = (): Settings => {
  if (typeof window === "undefined") {
    return {
      companyName: "Satmar Montreal Matzos",
      companyNameHebrew: "סאטמאר מאנטרעאל מצות",
      email: "matzoh@satmarmtl.com",
      phone: "(438) 300-8425",
      address: "2765 Chemin de la Côte-Sainte-Catherine, Montreal, QC H3T 1B6",
      taxRate: 14.975,
      currency: "USD",
    };
  }
  
  const stored = localStorage.getItem("settings");
  if (stored) {
    return JSON.parse(stored);
  }
  
  const defaultSettings: Settings = {
    companyName: "Satmar Montreal Matzos",
    companyNameHebrew: "סאטמאר מאנטרעאל מצות",
    email: "matzoh@satmarmtl.com",
    phone: "(438) 300-8425",
    address: "2765 Chemin de la Côte-Sainte-Catherine, Montreal, QC H3T 1B6",
    taxRate: 14.975,
    currency: "USD",
  };
  
  saveSettings(defaultSettings);
  return defaultSettings;
};

export const saveSettings = (settings: Settings): void => {
  if (!isClient) return;
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
};

// Payment Management with caching
export const getPayments = (): Payment[] => {
  const cached = cache.get<Payment[]>(CACHE_KEYS.PAYMENTS);
  if (cached) return cached;

  if (!isClient) return [];
  const stored = localStorage.getItem(STORAGE_KEYS.PAYMENTS);
  const payments = stored ? JSON.parse(stored) : [];
  
  cache.set(CACHE_KEYS.PAYMENTS, payments);
  return payments;
};

export const savePayments = (payments: Payment[]): void => {
  if (!isClient) return;
  localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(payments));
  cache.invalidate(CACHE_KEYS.PAYMENTS);
  cache.invalidate(CACHE_KEYS.RECEIVABLES);
};

export const addPayment = (payment: Omit<Payment, "id" | "createdAt">): Payment => {
  const payments = getPayments();
  const newPayment: Payment = {
    ...payment,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    creditCardLast4: payment.creditCardNumber ? payment.creditCardNumber.slice(-4) : undefined,
    confirmed: payment.confirmed || false,
    confirmedAt: payment.confirmed ? new Date().toISOString() : undefined,
  };
  
  payments.push(newPayment);
  savePayments(payments);
  
  // Update order payment status
  const orders = getOrders();
  const orderIndex = orders.findIndex(o => o.id === payment.orderId);
  if (orderIndex !== -1) {
    const order = orders[orderIndex];
    order.amountPaid = (order.amountPaid || 0) + payment.amount;
    order.amountDue = order.total - order.amountPaid;
    
    if (order.amountPaid >= order.total) {
      order.paymentStatus = "paid";
    } else if (order.amountPaid > 0) {
      order.paymentStatus = "partial";
    }
    
    orders[orderIndex] = order;
    saveOrders(orders);
  }
  
  // Update invoice if exists
  if (payment.invoiceId) {
    const invoices = getInvoices();
    const invoiceIndex = invoices.findIndex(i => i.id === payment.invoiceId);
    if (invoiceIndex !== -1) {
      const invoice = invoices[invoiceIndex];
      invoice.amountPaid = (invoice.amountPaid || 0) + payment.amount;
      invoice.amountDue = invoice.total - invoice.amountPaid;
      
      if (invoice.amountPaid >= invoice.total) {
        invoice.paymentStatus = "paid";
        invoice.paid = true;
        invoice.paidAt = new Date().toISOString();
      } else if (invoice.amountPaid > 0) {
        invoice.paymentStatus = "partial";
      }
      
      invoices[invoiceIndex] = invoice;
      saveInvoices(invoices);
    }
  }
  
  return newPayment;
};

export const getPaymentsByOrder = (orderId: string): Payment[] => {
  return getPayments().filter(p => p.orderId === orderId);
};

export const getPaymentsByInvoice = (invoiceId: string): Payment[] => {
  return getPayments().filter(p => p.invoiceId === invoiceId);
};

export const getReceivablesSummary = () => {
  const cached = cache.get<any>(CACHE_KEYS.RECEIVABLES);
  if (cached) return cached;

  const orders = getOrders();
  const payments = getPayments();
  
  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const totalCollected = orders.reduce((sum, order) => sum + (order.amountPaid || 0), 0);
  const totalPending = totalRevenue - totalCollected;
  const percentageCollected = totalRevenue > 0 ? (totalCollected / totalRevenue) * 100 : 0;
  
  const recentPayments = payments
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);
  
  const invoices = getInvoices();
  const unpaidInvoices = invoices.filter(i => i.paymentStatus !== "paid");
  
  const summary = {
    totalRevenue,
    totalCollected,
    totalPending,
    percentageCollected,
    recentPayments,
    unpaidInvoices,
  };

  cache.set(CACHE_KEYS.RECEIVABLES, summary, 2 * 60 * 1000); // 2 minutes TTL
  return summary;
};

export const updatePaymentConfirmation = (paymentId: string, confirmed: boolean): void => {
  const payments = getPayments();
  const index = payments.findIndex(p => p.id === paymentId);
  if (index !== -1) {
    payments[index].confirmed = confirmed;
    payments[index].confirmedAt = confirmed ? new Date().toISOString() : undefined;
    savePayments(payments);
  }
};

// Export cache for external use
export { cache, CACHE_KEYS };