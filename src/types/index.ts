export interface Product {
  id: string;
  name: string;
  nameHebrew?: string;
  pricePerLb: number;
  category: "rashi" | "regular" | "spelt" | "wholewheat" | "flour" | "shvurim";
  description?: string;
  inStock: boolean;
  minOrder?: number;
  currentInventory?: number;
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

export interface Payment {
  id: string;
  orderId: string;
  invoiceId?: string;
  amount: number;
  paymentMethod: "credit_card" | "cash" | "e_transfer" | "check" | "voucher";
  paymentDate: string;
  notes?: string;
  creditCardNumber?: string;
  creditCardLast4?: string;
  creditCardExpiry?: string;
  creditCardCVV?: string;
  checkNumber?: string;
  eTransferReference?: string;
  voucherCode?: string;
  confirmed?: boolean;
  confirmedAt?: string;
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
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
  createdAt: string;
  updatedAt: string;
  deliveryDate?: string;
  orderTime?: string;
  inventoryDeducted?: boolean;
}

export interface Invoice {
  id: string;
  orderId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
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
  dueDate: string;
}

export interface Report {
  period: string;
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  productsSold: Record<string, number>;
  topProducts: Array<{ name: string; quantity: number; revenue: number }>;
}

export interface ReceivablesSummary {
  totalRevenue: number;
  totalCollected: number;
  totalPending: number;
  percentageCollected: number;
  recentPayments: Payment[];
  unpaidInvoices: Invoice[];
}