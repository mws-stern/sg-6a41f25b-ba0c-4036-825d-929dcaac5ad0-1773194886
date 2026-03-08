export interface Customer {
  id: string;
  name: string;
  nameHebrew?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  notes?: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  nameHebrew?: string;
  pricePerLb: number;
  category: "rashi" | "regular" | "spelt" | "wholewheat" | "flour" | "shvurim";
  description?: string;
  inStock: boolean;
  currentInventory?: number;
}

export interface OrderItem {
  productId: string;
  productName: string;
  productNameHebrew?: string;
  quantity: number;
  pricePerLb: number;
  totalPrice: number;
  discount?: number;
  discountType?: "percent" | "fixed";
  finalPrice?: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerEmail?: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  discount?: number;
  discountType?: "percent" | "fixed";
  status: "draft" | "pending" | "confirmed" | "preparing" | "ready" | "delivered" | "cancelled";
  paymentStatus: "unpaid" | "partial" | "paid";
  amountPaid: number;
  amountDue: number;
  notes?: string;
  deliveryDate?: string;
  orderTime?: string;
  inventoryDeducted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  orderId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  customerEmail?: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  paid: boolean;
  paymentStatus: "unpaid" | "partial" | "paid";
  amountPaid: number;
  amountDue: number;
  paidAt?: string;
  createdAt: string;
  dueDate?: string;
}

export interface Payment {
  id: string;
  orderId: string;
  invoiceId?: string;
  amount: number;
  paymentMethod: "cash" | "check" | "credit_card" | "bank_transfer";
  paymentDate: string;
  notes?: string;
  createdAt: string;
  creditCardNumber?: string;
  creditCardLast4?: string;
  creditCardExpiry?: string;
  checkNumber?: string;
  confirmed: boolean;
  confirmedAt?: string | null;
}

export interface Settings {
  companyName: string;
  companyNameHebrew?: string;
  email: string;
  phone: string;
  address: string;
  taxRate: number;
  currency: string;
}

export interface InventoryEntry {
  id: string;
  productId: string;
  productName: string;
  amount: number;
  date: string;
  notes?: string;
  createdAt: string;
}

export interface EmailLog {
  id: string;
  orderId: string | null;
  customerId: string | null;
  customerEmail: string;
  customerName: string | null;
  emailType: "order_confirmation" | "invoice";
  subject: string;
  status: "sent" | "failed" | "pending";
  errorMessage?: string | null;
  sentAt: string;
  createdAt: string;
}

export interface AppState {
  products: Product[];
  customers: Customer[];
  orders: Order[];
  isLoading: boolean;
  lastSync: string | null;
  
  initializeStore: () => Promise<void>;
  loadCustomersIfNeeded: () => Promise<void>;
  loadOrdersIfNeeded: () => Promise<void>;
  
  addProduct: (product: Omit<Product, "id">) => Promise<Product>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  
  addCustomer: (customer: Omit<Customer, "id">) => Promise<Customer>;
  updateCustomer: (id: string, updates: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  
  addOrder: (order: Omit<Order, "id">) => Promise<Order>;
  updateOrder: (id: string, updates: Partial<Order>) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
  
  getTotalRevenue: () => number;
  getPendingOrders: () => Order[];
  getCompletedOrders: () => Order[];
  getLowStockProducts: () => Product[];
  getTopCustomers: (limit?: number) => (Customer & { totalSpent: number })[];
  getRecentOrders: (limit?: number) => Order[];
  refreshData: () => Promise<void>;
}