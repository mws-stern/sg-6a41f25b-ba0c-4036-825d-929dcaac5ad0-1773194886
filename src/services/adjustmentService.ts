import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type { ManualAdjustment } from "@/types";

type ManualAdjustmentRow = Database["public"]["Tables"]["manual_adjustments"]["Row"];
type ManualAdjustmentInsert = Database["public"]["Tables"]["manual_adjustments"]["Insert"];

export const adjustmentService = {
  async getAll(): Promise<ManualAdjustment[]> {
    console.log("Fetching all manual adjustments...");
    
    const { data, error } = await supabase
      .from("manual_adjustments")
      .select(`*, employees!manual_adjustments_employee_id_fkey(name, phone)`)
      .order("created_at", { ascending: false });

    console.log("Manual adjustments query result:", { data, error });

    if (error) {
      console.error("Error fetching manual adjustments:", error);
      throw error;
    }
    
    // Cast the response to match our application type
    return (data || []) as unknown as ManualAdjustment[];
  },

  async getByEmployee(employeeId: string): Promise<ManualAdjustment[]> {
    const { data, error } = await supabase
      .from("manual_adjustments")
      .select(`
        *,
        employees!manual_adjustments_employee_id_fkey(name, phone)
      `)
      .eq("employee_id", employeeId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []) as unknown as ManualAdjustment[];
  },

  async getByDateRange(startDate: string, endDate: string): Promise<ManualAdjustment[]> {
    const { data, error } = await supabase
      .from("manual_adjustments")
      .select(`
        *,
        employees!manual_adjustments_employee_id_fkey(name, phone)
      `)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: false });

    if (error) throw error;
    return (data || []) as unknown as ManualAdjustment[];
  },

  async addManualHours(
    employeeId: string, 
    clockIn: string,
    clockOut: string,
    reason: string, 
    date?: string
  ) {
    // Use the provided date string directly without any conversion
    const adjustmentDate = date || new Date().toISOString().split("T")[0];
    
    // Extract just the time portion (HH:MM:SS) from the input
    // Input format: "YYYY-MM-DDTHH:MM:SS" or "HH:MM"
    const clockInTime = clockIn.includes("T") ? clockIn.split("T")[1] : `${clockIn}:00`;
    const clockOutTime = clockOut.includes("T") ? clockOut.split("T")[1] : `${clockOut}:00`;
    
    // Calculate hours from the time strings directly
    const [inHour, inMin] = clockInTime.split(":").map(Number);
    const [outHour, outMin] = clockOutTime.split(":").map(Number);
    
    // Calculate total minutes and convert to hours
    const inMinutes = inHour * 60 + inMin;
    const outMinutes = outHour * 60 + outMin;
    const hours = (outMinutes - inMinutes) / 60;
    
    const adjustment: ManualAdjustmentInsert = {
      employee_id: employeeId,
      adjustment_type: "manual_hours",
      hours,
      amount: 0,
      reason,
      date: adjustmentDate,
      clock_in: clockInTime, // Store as TIME: "HH:MM:SS"
      clock_out: clockOutTime // Store as TIME: "HH:MM:SS"
    };

    const { data, error } = await supabase
      .from("manual_adjustments")
      .insert(adjustment)
      .select()
      .single();

    console.log("addManualHours:", { data, error });
    if (error) throw error;
    return data as unknown as ManualAdjustment;
  },

  async addManualEarnings(
    employeeId: string, 
    amount: number, 
    reason: string, 
    date?: string,
    isDeduction: boolean = false
  ) {
    const adjustmentDate = date || new Date().toISOString().split("T")[0];
    
    const adjustment: ManualAdjustmentInsert = {
      employee_id: employeeId,
      adjustment_type: isDeduction ? "deduction" : "bonus",
      hours: 0,
      amount: Math.abs(amount), // Store as positive, type determines if it's added or subtracted
      reason,
      date: adjustmentDate
    };

    const { data, error } = await supabase
      .from("manual_adjustments")
      .insert(adjustment)
      .select()
      .single();

    console.log("addManualEarnings:", { data, error });
    if (error) throw error;
    return data;
  },

  async addPickupTrip(employeeId: string, reason: string, date?: string) {
    const adjustmentDate = date || new Date().toISOString().split("T")[0];
    
    const adjustment: ManualAdjustmentInsert = {
      employee_id: employeeId,
      adjustment_type: "pickup_trip",
      hours: 0,
      amount: 10, // Fixed $10 per trip
      reason,
      date: adjustmentDate
    };

    const { data, error } = await supabase
      .from("manual_adjustments")
      .insert(adjustment)
      .select()
      .single();

    console.log("addPickupTrip:", { data, error });
    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from("manual_adjustments")
      .delete()
      .eq("id", id);

    console.log("delete adjustment:", { error });
    if (error) throw error;
  },

  async getUnpaidByEmployee(employeeId: string) {
    const { data, error } = await supabase
      .from("manual_adjustments")
      .select("*")
      .eq("employee_id", employeeId)
      .eq("paid", false)
      .order("date", { ascending: false });

    if (error) throw error;
    return data;
  },

  async getUnpaidAdjustments() {
    const { data, error } = await supabase
      .from("manual_adjustments")
      .select("*")
      .eq("paid", false);

    if (error) throw error;
    return data;
  },

  async updateManualHours(
    id: string,
    clockIn: string,
    clockOut: string,
    reason: string,
    date: string
  ) {
    const adjustmentDate = date || new Date().toISOString().split("T")[0];

    // Normalize time format: if it already has seconds (HH:MM:SS), use it; otherwise add :00
    const formatTime = (time: string) => {
      if (time.includes("T")) {
        return time.split("T")[1]; // Extract time part from datetime
      }
      const parts = time.split(":");
      if (parts.length === 3) {
        return time; // Already has seconds (HH:MM:SS)
      }
      return `${time}:00`; // Add seconds to HH:MM
    };

    const clockInTime = formatTime(clockIn);
    const clockOutTime = formatTime(clockOut);

    const [inHour, inMin] = clockInTime.split(":").map(Number);
    const [outHour, outMin] = clockOutTime.split(":").map(Number);

    const inMinutes = inHour * 60 + inMin;
    const outMinutes = outHour * 60 + outMin;
    const hours = (outMinutes - inMinutes) / 60;

    const { data, error } = await supabase
      .from("manual_adjustments")
      .update({
        date: adjustmentDate,
        clock_in: clockInTime,
        clock_out: clockOutTime,
        hours,
        reason
      })
      .eq("id", id)
      .select()
      .single();

    console.log("updateManualHours:", { data, error });
    if (error) throw error;
    return data as unknown as ManualAdjustment;
  },

  async deleteManualAdjustment(id: string) {
    const { error } = await supabase
      .from("manual_adjustments")
      .delete()
      .eq("id", id);

    console.log("deleteManualAdjustment:", { error });
    if (error) throw error;
  },

  async updateAdjustment(
    id: string,
    updates: {
      amount?: number;
      adjustment_type?: string;
      reason?: string;
      date?: string;
    }
  ) {
    const { error } = await supabase
      .from("manual_adjustments")
      .update(updates)
      .eq("id", id);
    
    if (error) throw error;
  }
};

export async function deleteAdjustment(id: string): Promise<void> {
  const { error } = await supabase.from("manual_adjustments").delete().eq("id", id);
  if (error) throw error;
}