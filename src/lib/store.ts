import type { Product, Customer, Order, Invoice } from "@/types";

// LocalStorage keys
const STORAGE_KEYS = {
  PRODUCTS: "matzos_products",
  CUSTOMERS: "matzos_customers",
  ORDERS: "matzos_orders",
  INVOICES: "matzos_invoices",
  SETTINGS: "matzos_settings",
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
  },
  {
    id: "2",
    name: "Regular Matzoh",
    nameHebrew: "מצה רגילה",
    pricePerLb: 0,
    category: "regular",
    description: "Standard matzoh",
    inStock: true,
  },
  {
    id: "3",
    name: "Spelt Matzoh",
    nameHebrew: "מצה כוסמין",
    pricePerLb: 0,
    category: "spelt",
    description: "Made with spelt flour",
    inStock: true,
  },
  {
    id: "4",
    name: "Whole Wheat Matzoh",
    nameHebrew: "מצה חיטה מלאה",
    pricePerLb: 0,
    category: "wholewheat",
    description: "Whole wheat matzoh",
    inStock: true,
  },
];

// Helper to check if we're on the client
const isClient = typeof window !== "undefined";

// Products
export const getProducts = (): Product[] => {
  if (!isClient) return INITIAL_PRODUCTS;
  const stored = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
  if (!stored) {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
    return INITIAL_PRODUCTS;
  }
  return JSON.parse(stored);
};

export const saveProducts = (products: Product[]): void => {
  if (!isClient) return;
  localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
};

export const updateProduct = (product: Product): void => {
  const products = getProducts();
  const index = products.findIndex((p) => p.id === product.id);
  if (index !== -1) {
    products[index] = product;
    saveProducts(products);
  }
};

// Customers
export const getCustomers = (): Customer[] => {
  if (!isClient) return [];
  const stored = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
  return stored ? JSON.parse(stored) : [];
};

export const saveCustomers = (customers: Customer[]): void => {
  if (!isClient) return;
  localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
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

// Orders
export const getOrders = (): Order[] => {
  if (!isClient) return [];
  const stored = localStorage.getItem(STORAGE_KEYS.ORDERS);
  return stored ? JSON.parse(stored) : [];
};

export const saveOrders = (orders: Order[]): void => {
  if (!isClient) return;
  localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
};

export const addOrder = (order: Omit<Order, "id" | "orderNumber" | "createdAt" | "updatedAt">): Order => {
  const orders = getOrders();
  const orderNumber = `ORD-${Date.now()}`;
  const newOrder: Order = {
    ...order,
    id: Date.now().toString(),
    orderNumber,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  orders.push(newOrder);
  saveOrders(orders);
  return newOrder;
};

export const updateOrder = (order: Order): void => {
  const orders = getOrders();
  const index = orders.findIndex((o) => o.id === order.id);
  if (index !== -1) {
    orders[index] = { ...order, updatedAt: new Date().toISOString() };
    saveOrders(orders);
  }
};

export const getOrder = (id: string): Order | undefined => {
  return getOrders().find((o) => o.id === id);
};

// Invoices
export const getInvoices = (): Invoice[] => {
  if (!isClient) return [];
  const stored = localStorage.getItem(STORAGE_KEYS.INVOICES);
  return stored ? JSON.parse(stored) : [];
};

export const saveInvoices = (invoices: Invoice[]): void => {
  if (!isClient) return;
  localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
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
  if (!isClient) {
    return {
      companyName: "Satmar Montreal Matzos",
      companyNameHebrew: "סאטמאר מאנטרעאל מצות",
      email: "info@satmarmatzos.com",
      phone: "(514) 555-0100",
      address: "Montreal, QC",
      taxRate: 0,
      currency: "USD",
    };
  }
  const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
  if (!stored) {
    const defaultSettings: Settings = {
      companyName: "Satmar Montreal Matzos",
      companyNameHebrew: "סאטמאר מאנטרעאל מצות",
      email: "info@satmarmatzos.com",
      phone: "(514) 555-0100",
      address: "Montreal, QC",
      taxRate: 0,
      currency: "USD",
    };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(defaultSettings));
    return defaultSettings;
  }
  return JSON.parse(stored);
};

export const saveSettings = (settings: Settings): void => {
  if (!isClient) return;
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
};