import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Tables = Database["public"]["Tables"];

export const supabaseService = {
  client: supabase,

  // CUSTOMERS
  async getCustomers() {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .order("first_name", { ascending: true });

     
    console.log("[supabaseService.getCustomers]", { dataLength: data?.length, error });

    return { data, error };
  },

  async getCustomer(id: string) {
    return supabase
      .from("customers")
      .select("*")
      .eq("id", id)
      .maybeSingle();
  },

  async addCustomer(payload: Tables["customers"]["Insert"]) {
    return supabase
      .from("customers")
      .insert(payload)
      .select("*")
      .maybeSingle();
  },

  async updateCustomer(id: string, updates: Tables["customers"]["Update"]) {
    return supabase
      .from("customers")
      .update(updates)
      .eq("id", id)
      .select("*")
      .maybeSingle();
  },

  // PRODUCTS
  async getProducts() {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("name", { ascending: true });

     
    console.log("[supabaseService.getProducts]", { dataLength: data?.length, error });

    return { data, error };
  },

  async getProduct(id: string) {
    return supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .maybeSingle();
  },

  async addProduct(payload: Tables["products"]["Insert"]) {
    return supabase
      .from("products")
      .insert(payload)
      .select("*")
      .maybeSingle();
  },

  async updateProduct(id: string, updates: Tables["products"]["Update"]) {
    return supabase
      .from("products")
      .update(updates)
      .eq("id", id)
      .select("*")
      .maybeSingle();
  },

  // ORDERS
  async getOrders() {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

     
    console.log("[supabaseService.getOrders]", { dataLength: data?.length, error });

    return { data, error };
  },

  async getOrder(id: string) {
    return supabase
      .from("orders")
      .select("*")
      .eq("id", id)
      .maybeSingle();
  },

  async addOrder(payload: Tables["orders"]["Insert"]) {
    return supabase
      .from("orders")
      .insert(payload)
      .select("*")
      .maybeSingle();
  },

  async updateOrder(id: string, updates: Tables["orders"]["Update"]) {
    return supabase
      .from("orders")
      .update(updates)
      .eq("id", id)
      .select("*")
      .maybeSingle();
  },

  async deleteOrder(id: string) {
    return supabase
      .from("orders")
      .delete()
      .eq("id", id);
  },

  // INVOICES
  async getInvoices() {
    return supabase
      .from("invoices")
      .select("*")
      .order("created_at", { ascending: false });
  },

  async getInvoice(id: string) {
    return supabase
      .from("invoices")
      .select("*")
      .eq("id", id)
      .maybeSingle();
  },

  // INVENTORY ENTRIES (history / movements table)
  async getInventory() {
    return supabase
      .from("inventory_entries")
      .select("*")
      .order("created_at", { ascending: false });
  },

  async addInventoryEntry(payload: Tables["inventory_entries"]["Insert"]) {
    return supabase
      .from("inventory_entries")
      .insert(payload)
      .select("*")
      .maybeSingle();
  },

  // PAYMENTS
  async getAllPayments() {
    return supabase
      .from("payments")
      .select("*")
      .order("payment_date", { ascending: false });
  },

  // SETTINGS (single row)
  async getSettings() {
    return supabase
      .from("settings")
      .select("*")
      .limit(1)
      .maybeSingle();
  },

  async saveSettings(updates: Tables["settings"]["Update"]) {
    if (!updates.id) {
      throw new Error("saveSettings requires an 'id' field in updates.");
    }

    return supabase
      .from("settings")
      .update(updates)
      .eq("id", updates.id)
      .select("*")
      .maybeSingle();
  },
};

export type SupabaseService = typeof supabaseService;