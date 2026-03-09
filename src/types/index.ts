export interface User {
  id: string;
  name: string;
  nameHebrew: string;
  titleHebrew: string;
  titleEnglish: string;
  first_name_hebrew: string;
  last_name_hebrew: string;
  first_name: string;
  last_name: string;
  house_number: string;
  apt: string;
  street: string;
  email: string;
  phone: string;
  mobile: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  notes: string;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  nameHebrew: string;
  pricePerLb: number;
  category: "rashi" | "regular" | "spelt" | "wholewheat" | "flour" | "shvurim";
  description: string;
  inStock: boolean;
  currentInventory: number;
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
  discount: number;
  discountType: "fixed" | "percent";
  status: "draft" | "pending" | "confirmed" | "preparing" | "ready" | "delivered" | "cancelled";
  paymentStatus: "unpaid" | "partial" | "paid";
  amountPaid: number;
  amountDue: number;
  notes: string;
  deliveryDate: string;
  orderTime: string;
  inventoryDeducted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  productNameHebrew: string;
  quantity: number;
  pricePerLb: number;
  totalPrice: number;
  discount: number;
  discountType: "fixed" | "percent";
  finalPrice: number;
}

export interface Settings {
  id: string;
  companyName: string;
  companyNameHebrew: string;
  email: string;
  phone: string;
  address: string;
  taxRate: number;
  currency: string;
}

export interface Payment {
  id: string;
  orderId: string;
  invoiceId: string;
  amount: number;
  paymentMethod: "cash" | "check" | "credit_card" | "bank_transfer";
  paymentDate: string;
  notes: string;
  creditCardLast4: string;
  confirmed: boolean;
  confirmedAt: string;
}

export interface InventoryEntry {
  id: string;
  productId: string;
  productName: string;
  amount: number;
  date: string;
  notes: string;
  createdAt: string;
}

// Add missing types that might be referenced
export type Invoice = {
  id: string;
  order_id: string;
  invoice_number: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  items_json: string;
  subtotal: number;
  tax: number;
  total: number;
  paid: boolean;
  payment_status: "unpaid" | "partial" | "paid";
  amount_paid: number;
  amount_due: number;
  due_date: string;
};

export type Customer = User;
export type Order = Order;
export type Product = Product;
export type Payment = Payment;
export type InventoryEntry = InventoryEntry;
export type Settings = Settings;
export type Invoice = Invoice;