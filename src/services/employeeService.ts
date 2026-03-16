import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Employee = Tables<"employees">;

export const employeeService = {
  // Get all employees (excluding soft-deleted)
  async getAll() {
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .is("deleted_at", null)
      .order("name");

    console.log("getAll employees:", { data, error });
    if (error) throw error;
    return data || [];
  },

  // Get active employees only (excluding soft-deleted)
  async getActive() {
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .eq("is_active", true)
      .is("deleted_at", null)
      .order("name");

    console.log("getActive employees:", { data, error });
    if (error) throw error;
    return data || [];
  },

  // Get inactive employees only (excluding soft-deleted)
  async getInactive() {
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .eq("is_active", false)
      .is("deleted_at", null)
      .order("name");

    console.log("getInactive employees:", { data, error });
    if (error) throw error;
    return data || [];
  },

  // Get soft-deleted employees
  async getDeleted() {
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false });

    console.log("getDeleted employees:", { data, error });
    if (error) throw error;
    return data || [];
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .eq("id", id)
      .is("deleted_at", null)
      .single();

    console.log("getById employee:", { data, error });
    if (error) throw error;
    return data;
  },

  async create(employee: Omit<Employee, "id" | "created_at" | "deleted_at" | "updated_at">) {
    const { data, error } = await supabase
      .from("employees")
      .insert(employee)
      .select()
      .single();

    console.log("create employee:", { data, error });
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<Employee>) {
    const { data, error } = await supabase
      .from("employees")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    console.log("update employee:", { data, error });
    if (error) throw error;
    return data;
  },

  // Soft delete: Set deleted_at timestamp
  async softDelete(id: string) {
    const { data, error } = await supabase
      .from("employees")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    console.log("softDelete employee:", { data, error });
    if (error) throw error;
    return data;
  },

  // Restore soft-deleted employee
  async restore(id: string) {
    const { data, error } = await supabase
      .from("employees")
      .update({ deleted_at: null })
      .eq("id", id)
      .select()
      .single();

    console.log("restore employee:", { data, error });
    if (error) throw error;
    return data;
  },

  // Permanent delete: Actually remove from database (admin action)
  async permanentDelete(id: string) {
    const { error } = await supabase
      .from("employees")
      .delete()
      .eq("id", id);

    console.log("permanentDelete employee:", { error });
    if (error) throw error;
  },

  async activate(id: string) {
    return this.update(id, { is_active: true });
  },

  async deactivate(id: string) {
    return this.update(id, { is_active: false });
  },
};

export const getEmployees = employeeService.getAll;
export const getActiveEmployees = employeeService.getActive;
export const getEmployeeById = employeeService.getById;
