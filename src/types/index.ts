export interface Product {
  id: string;
  name: string;
  nameHebrew?: string;
  pricePerLb: number;
  category: "rashi" | "regular" | "spelt" | "wholewheat";
  description?: string;
  inStock: boolean;
  minOrder?: number;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  notes?: string;
  createdAt: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  pricePerLb: number;
  totalPrice: number;
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
  status: "pending" | "confirmed" | "preparing" | "ready" | "delivered" | "cancelled";
  notes?: string;
  createdAt: string;
  updatedAt: string;
  deliveryDate?: string;
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