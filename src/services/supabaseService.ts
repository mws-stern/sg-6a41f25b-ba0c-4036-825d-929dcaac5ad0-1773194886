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

      if (error) {
        console.error("[supabaseService.getCustomers] error", error);
      }
      return { data: data ?? [], error };
    } catch (err: any) {
      console.error("[supabaseService.getCustomers] thrown error", {
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

      if (error) {
        console.error("[supabaseService.getCustomer] error", error);
      }
      return { data, error };
    } catch (err: any) {
      console.error("[supabaseService.getCustomer] thrown error", {
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

      if (error) {
        console.error("[supabaseService.addCustomer] error", error);
      }
      return { data, error };
    } catch (err: any) {
      console.error("[supabaseService.addCustomer] thrown error", {
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

      if (error) {
        console.error("[supabaseService.updateCustomer] error", error);
      }
      return { data, error };
    } catch (err: any) {
      console.error("[supabaseService.updateCustomer] thrown error", {
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

      if (error) {
        console.error("[supabaseService.getProducts] error", error);
      }
      return { data: data ?? [], error };
    } catch (err: any) {
      console.error("[supabaseService.getProducts] thrown error", {
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

      if (error) {
        console.error("[supabaseService.getProduct] error", error);
      }
      return { data, error };
    } catch (err: any) {
      console.error("[supabaseService.getProduct] thrown error", {
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

      if (error) {
        console.error("[supabaseService.addProduct] error", error);
      }
      return { data, error };
    } catch (err: any) {
      console.error("[supabaseService.addProduct] thrown error", {
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

      if (error) {
        console.error("[supabaseService.updateProduct] error", error);
      }
      return { data, error };
    } catch (err: any) {
      console.error("[supabaseService.updateProduct] thrown error", {
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

      if (error) {
        console.error("[supabaseService.getOrders] error", error);
      }
      return { data: data ?? [], error };
    } catch (err: any) {
      console.error("[supabaseService.getOrders] thrown error", {
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

      if (error) {
        console.error("[supabaseService.getOrder] error", error);
      }
      return { data, error };
    } catch (err: any) {
      console.error("[supabaseService.getOrder] thrown error", {
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

      if (error) {
        console.error("[supabaseService.addOrder] error", error);
      }
      return { data, error };
    } catch (err: any) {
      console.error("[supabaseService.addOrder] thrown error", {
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

      if (error) {
        console.error("[supabaseService.updateOrder] error", error);
      }
      return { data, error };
    } catch (err: any) {
      console.error("[supabaseService.updateOrder] thrown error", {
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

      if (error) {
        console.error("[supabaseService.deleteOrder] error", error);
      }
      return { error };
    } catch (err: any) {
      console.error("[supabaseService.deleteOrder] thrown error", {
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

      if (error) {
        console.error("[supabaseService.getInvoices] error", error);
      }
      return { data: data ?? [], error };
    } catch (err: any) {
      console.error("[supabaseService.getInvoices] thrown error", {
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

      if (error) {
        console.error("[supabaseService.getInvoice] error", error);
      }
      return { data, error };
    } catch (err: any) {
      console.error("[supabaseService.getInvoice] thrown error", {
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

      if (error) {
        console.error("[supabaseService.getInventory] error", error);
      }
      return { data: data ?? [], error };
    } catch (err: any) {
      console.error("[supabaseService.getInventory] thrown error", {
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

      if (error) {
        console.error("[supabaseService.addInventoryEntry] error", error);
      }
      return { data, error };
    } catch (err: any) {
      console.error("[supabaseService.addInventoryEntry] thrown error", {
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

      if (error) {
        console.error("[supabaseService.getAllPayments] error", error);
      }
      return { data: data ?? [], error };
    } catch (err: any) {
      console.error("[supabaseService.getAllPayments] thrown error", {
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

      if (error) {
        console.error("[supabaseService.getSettings] error", error);
      }
      return { data, error };
    } catch (err: any) {
      console.error("[supabaseService.getSettings] thrown error", {
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

      if (error) {
        console.error("[supabaseService.saveSettings] error", error);
      }
      return { data, error };
    } catch (err: any) {
      console.error("[supabaseService.saveSettings] thrown error", {
        message: err?.message,
        stack: err?.stack,
        error: err,
      });
      return { data: null, error: err };
    }
  },
};

export type SupabaseService = typeof supabaseService;