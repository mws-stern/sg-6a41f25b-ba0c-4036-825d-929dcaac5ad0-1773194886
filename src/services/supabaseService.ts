import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Tables = Database["public"]["Tables"];

export const supabaseService = {
  client: supabase,

  // CUSTOMERS
  async getCustomers() {
    try {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("first_name", { ascending: true });

       
      console.log("[supabaseService.getCustomers]", {
        dataLength: data?.length,
        error,
      });

      return { data: data ?? [], error };
    } catch (err: any) {
       
      console.log("[supabaseService.getCustomers] thrown error", {
        message: err?.message,
        stack: err?.stack,
        error: err,
      });
      return { data: [], error: err };
    }
  },

  async getCustomer(id: string) {
    try {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("id", id)
        .maybeSingle();

       
      console.log("[supabaseService.getCustomer]", { hasData: Boolean(data), error });

      return { data, error };
    } catch (err: any) {
       
      console.log("[supabaseService.getCustomer] thrown error", {
        message: err?.message,
        stack: err?.stack,
        error: err,
      });
      return { data: null, error: err };
    }
  },

  async addCustomer(payload: Tables["customers"]["Insert"]) {
    try {
      const { data, error } = await supabase
        .from("customers")
        .insert(payload)
        .select("*")
        .maybeSingle();

       
      console.log("[supabaseService.addCustomer]", { hasData: Boolean(data), error });

      return { data, error };
    } catch (err: any) {
       
      console.log("[supabaseService.addCustomer] thrown error", {
        message: err?.message,
        stack: err?.stack,
        error: err,
      });
      return { data: null, error: err };
    }
  },

  async updateCustomer(id: string, updates: Tables["customers"]["Update"]) {
    try {
      const { data, error } = await supabase
        .from("customers")
        .update(updates)
        .eq("id", id)
        .select("*")
        .maybeSingle();

       
      console.log("[supabaseService.updateCustomer]", { hasData: Boolean(data), error });

      return { data, error };
    } catch (err: any) {
       
      console.log("[supabaseService.updateCustomer] thrown error", {
        message: err?.message,
        stack: err?.stack,
        error: err,
      });
      return { data: null, error: err };
    }
  },

  // PRODUCTS
  async getProducts() {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("name", { ascending: true });

       
      console.log("[supabaseService.getProducts]", {
        dataLength: data?.length,
        error,
      });

      return { data: data ?? [], error };
    } catch (err: any) {
       
      console.log("[supabaseService.getProducts] thrown error", {
        message: err?.message,
        stack: err?.stack,
        error: err,
      });
      return { data: [], error: err };
    }
  },

  async getProduct(id: string) {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .maybeSingle();

       
      console.log("[supabaseService.getProduct]", { hasData: Boolean(data), error });

      return { data, error };
    } catch (err: any) {
       
      console.log("[supabaseService.getProduct] thrown error", {
        message: err?.message,
        stack: err?.stack,
        error: err,
      });
      return { data: null, error: err };
    }
  },

  async addProduct(payload: Tables["products"]["Insert"]) {
    try {
      const { data, error } = await supabase
        .from("products")
        .insert(payload)
        .select("*")
        .maybeSingle();

       
      console.log("[supabaseService.addProduct]", { hasData: Boolean(data), error });

      return { data, error };
    } catch (err: any) {
       
      console.log("[supabaseService.addProduct] thrown error", {
        message: err?.message,
        stack: err?.stack,
        error: err,
      });
      return { data: null, error: err };
    }
  },

  async updateProduct(id: string, updates: Tables["products"]["Update"]) {
    try {
      const { data, error } = await supabase
        .from("products")
        .update(updates)
        .eq("id", id)
        .select("*")
        .maybeSingle();

       
      console.log("[supabaseService.updateProduct]", { hasData: Boolean(data), error });

      return { data, error };
    } catch (err: any) {
       
      console.log("[supabaseService.updateProduct] thrown error", {
        message: err?.message,
        stack: err?.stack,
        error: err,
      });
      return { data: null, error: err };
    }
  },

  // ORDERS
  async getOrders() {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

       
      console.log("[supabaseService.getOrders]", {
        dataLength: data?.length,
        error,
      });

      return { data: data ?? [], error };
    } catch (err: any) {
       
      console.log("[supabaseService.getOrders] thrown error", {
        message: err?.message,
        stack: err?.stack,
        error: err,
      });
      return { data: [], error: err };
    }
  },

  async getOrder(id: string) {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", id)
        .maybeSingle();

       
      console.log("[supabaseService.getOrder]", { hasData: Boolean(data), error });

      return { data, error };
    } catch (err: any) {
       
      console.log("[supabaseService.getOrder] thrown error", {
        message: err?.message,
        stack: err?.stack,
        error: err,
      });
      return { data: null, error: err };
    }
  },

  async addOrder(payload: Tables["orders"]["Insert"]) {
    try {
      const { data, error } = await supabase
        .from("orders")
        .insert(payload)
        .select("*")
        .maybeSingle();

       
      console.log("[supabaseService.addOrder]", { hasData: Boolean(data), error });

      return { data, error };
    } catch (err: any) {
       
      console.log("[supabaseService.addOrder] thrown error", {
        message: err?.message,
        stack: err?.stack,
        error: err,
      });
      return { data: null, error: err };
    }
  },

  async updateOrder(id: string, updates: Tables["orders"]["Update"]) {
    try {
      const { data, error } = await supabase
        .from("orders")
        .update(updates)
        .eq("id", id)
        .select("*")
        .maybeSingle();

       
      console.log("[supabaseService.updateOrder]", { hasData: Boolean(data), error });

      return { data, error };
    } catch (err: any) {
       
      console.log("[supabaseService.updateOrder] thrown error", {
        message: err?.message,
        stack: err?.stack,
        error: err,
      });
      return { data: null, error: err };
    }
  },

  async deleteOrder(id: string) {
    try {
      const { error } = await supabase
        .from("orders")
        .delete()
        .eq("id", id);

       
      console.log("[supabaseService.deleteOrder]", { error });

      return { error };
    } catch (err: any) {
       
      console.log("[supabaseService.deleteOrder] thrown error", {
        message: err?.message,
        stack: err?.stack,
        error: err,
      });
      return { error: err };
    }
  },

  // INVOICES
  async getInvoices() {
    try {
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .order("created_at", { ascending: false });

       
      console.log("[supabaseService.getInvoices]", {
        dataLength: data?.length,
        error,
      });

      return { data: data ?? [], error };
    } catch (err: any) {
       
      console.log("[supabaseService.getInvoices] thrown error", {
        message: err?.message,
        stack: err?.stack,
        error: err,
      });
      return { data: [], error: err };
    }
  },

  async getInvoice(id: string) {
    try {
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("id", id)
        .maybeSingle();

       
      console.log("[supabaseService.getInvoice]", { hasData: Boolean(data), error });

      return { data, error };
    } catch (err: any) {
       
      console.log("[supabaseService.getInvoice] thrown error", {
        message: err?.message,
        stack: err?.stack,
        error: err,
      });
      return { data: null, error: err };
    }
  },

  // INVENTORY ENTRIES (history / movements table)
  async getInventory() {
    try {
      const { data, error } = await supabase
        .from("inventory_entries")
        .select("*")
        .order("created_at", { ascending: false });

       
      console.log("[supabaseService.getInventory]", {
        dataLength: data?.length,
        error,
      });

      return { data: data ?? [], error };
    } catch (err: any) {
       
      console.log("[supabaseService.getInventory] thrown error", {
        message: err?.message,
        stack: err?.stack,
        error: err,
      });
      return { data: [], error: err };
    }
  },

  async addInventoryEntry(payload: Tables["inventory_entries"]["Insert"]) {
    try {
      const { data, error } = await supabase
        .from("inventory_entries")
        .insert(payload)
        .select("*")
        .maybeSingle();

       
      console.log("[supabaseService.addInventoryEntry]", { hasData: Boolean(data), error });

      return { data, error };
    } catch (err: any) {
       
      console.log("[supabaseService.addInventoryEntry] thrown error", {
        message: err?.message,
        stack: err?.stack,
        error: err,
      });
      return { data: null, error: err };
    }
  },

  // PAYMENTS
  async getAllPayments() {
    try {
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .order("payment_date", { ascending: false });

       
      console.log("[supabaseService.getAllPayments]", {
        dataLength: data?.length,
        error,
      });

      return { data: data ?? [], error };
    } catch (err: any) {
       
      console.log("[supabaseService.getAllPayments] thrown error", {
        message: err?.message,
        stack: err?.stack,
        error: err,
      });
      return { data: [], error: err };
    }
  },

  // SETTINGS (single row)
  async getSettings() {
    try {
      const { data, error } = await supabase
        .from("settings")
        .select("*")
        .limit(1)
        .maybeSingle();

       
      console.log("[supabaseService.getSettings]", { hasData: Boolean(data), error });

      return { data, error };
    } catch (err: any) {
       
      console.log("[supabaseService.getSettings] thrown error", {
        message: err?.message,
        stack: err?.stack,
        error: err,
      });
      return { data: null, error: err };
    }
  },

  async saveSettings(updates: Tables["settings"]["Update"]) {
    try {
      if (!updates.id) {
        throw new Error("saveSettings requires an 'id' field in updates.");
      }

      const { data, error } = await supabase
        .from("settings")
        .update(updates)
        .eq("id", updates.id)
        .select("*")
        .maybeSingle();

       
      console.log("[supabaseService.saveSettings]", { hasData: Boolean(data), error });

      return { data, error };
    } catch (err: any) {
       
      console.log("[supabaseService.saveSettings] thrown error", {
        message: err?.message,
        stack: err?.stack,
        error: err,
      });
      return { data: null, error: err };
    }
  },
};

export type SupabaseService = typeof supabaseService;