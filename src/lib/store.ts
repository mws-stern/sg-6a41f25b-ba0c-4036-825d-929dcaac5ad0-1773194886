import type { Product, Customer, Order, Invoice } from "@/types";

export interface InventoryEntry {
  id: string;
  productId: string;
  productName: string;
  amount: number;
  date: string;
  notes?: string;
}

// LocalStorage keys
const STORAGE_KEYS = {
  PRODUCTS: "matzos_products",
  CUSTOMERS: "matzos_customers",
  ORDERS: "matzos_orders",
  INVOICES: "matzos_invoices",
  INVENTORY: "matzos_inventory",
  SETTINGS: "matzos_settings",
};

// Initial products setup
const INITIAL_PRODUCTS: Product[] = [
  {
    id: "1",
    name: "Rashi Matzoh",
    nameHebrew: "רש\"י",
    pricePerLb: 0,
    category: "rashi",
    description: "Traditional Rashi style matzoh",
    inStock: true,
    currentInventory: 0,
  },
  {
    id: "2",
    name: "Regular Matzoh",
    nameHebrew: "רעגולער מצה",
    pricePerLb: 0,
    category: "regular",
    description: "Standard matzoh",
    inStock: true,
    currentInventory: 0,
  },
  {
    id: "3",
    name: "Spelt Matzoh",
    nameHebrew: "ספעלט מצה",
    pricePerLb: 0,
    category: "spelt",
    description: "Made with spelt flour",
    inStock: true,
    currentInventory: 0,
  },
  {
    id: "4",
    name: "Whole Wheat Matzoh",
    nameHebrew: "האל וויט מצה",
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
    nameHebrew: "שברים מצה",
    pricePerLb: 0,
    category: "shvurim",
    description: "Broken matzoh pieces",
    inStock: true,
    currentInventory: 0,
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

// Inventory Management
export const getInventory = (): InventoryEntry[] => {
  if (!isClient) return [];
  const stored = localStorage.getItem(STORAGE_KEYS.INVENTORY);
  return stored ? JSON.parse(stored) : [];
};

export const saveInventory = (inventory: InventoryEntry[]): void => {
  if (!isClient) return;
  localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(inventory));
};

export const addInventoryEntry = (entry: Omit<InventoryEntry, "id">): InventoryEntry => {
  const inventory = getInventory();
  const newEntry: InventoryEntry = {
    ...entry,
    id: Date.now().toString(),
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