import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type { 
  PayrollTransaction, 
  EmployeePayrollBalance, 
  PayrollSummary,
  Employee,
  TimeEntry,
  ManualAdjustment
} from "@/types";

type PayrollPeriod = Database["public"]["Tables"]["payroll_periods"]["Row"];
type PayrollEntry = Database["public"]["Tables"]["payroll_entries"]["Row"];
type PayrollEntryInsert = Database["public"]["Tables"]["payroll_entries"]["Insert"];

export const payrollService = {
  // Get employee's current balance
  async getEmployeeBalance(employeeId: string): Promise<number> {
    const { data, error } = await supabase
      .from("employee_payroll_balances")
      .select("balance")
      .eq("employee_id", employeeId)
      .maybeSingle();

    if (error) throw error;
    return data?.balance || 0;
  },

  // Get all employee balances
  async getAllBalances(): Promise<EmployeePayrollBalance[]> {
    const { data, error } = await supabase
      .from("employee_payroll_balances")
      .select("*")
      .order("balance", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Calculate payroll for a date range
  async calculatePayrollForRange(
    startDate: string,
    endDate: string
  ): Promise<PayrollSummary[]> {
    // Get all active employees
    const { data: employees, error: empError } = await supabase
      .from("employees")
      .select("*")
      .eq("is_active", true)
      .order("name");

    if (empError) throw empError;
    if (!employees) return [];

    // Get ALL time entries for ALL employees in ONE query (exclude paid ones)
    const { data: allTimeEntries, error: timeError } = await supabase
      .from("time_entries")
      .select("*")
      .eq("paid", false)
      .gte("clock_in", startDate)
      .lte("clock_in", endDate + "T23:59:59")
      .order("clock_in");

    if (timeError) throw timeError;

    // Get ALL adjustments for ALL employees in ONE query (exclude paid ones)
    const { data: allAdjustments, error: adjError } = await supabase
      .from("manual_adjustments")
      .select("*")
      .eq("paid", false)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date");

    if (adjError) throw adjError;

    // Get ALL employee balances in ONE query
    const { data: allBalances, error: balError } = await supabase
      .from("employee_payroll_balances")
      .select("*");

    if (balError) throw balError;

    // Build a map of employee balances for quick lookup
    const balanceMap = new Map<string, number>();
    (allBalances || []).forEach(b => {
      balanceMap.set(b.employee_id, b.balance || 0);
    });

    const summaries: PayrollSummary[] = [];

    for (const employee of employees) {
      // Filter time entries for this employee
      const timeEntries = (allTimeEntries || []).filter(
        entry => entry.employee_id === employee.id
      );

      // Filter adjustments for this employee
      const adjustments = (allAdjustments || []).filter(
        adj => adj.employee_id === employee.id
      );

      // Calculate hours from time entries
      const timeHours = timeEntries.reduce((sum, entry) => 
        sum + (entry.hours_worked || 0), 0
      );

      // Calculate earnings from time entries
      const timeEarnings = timeHours * employee.hourly_rate;

      // Calculate adjustments totals
      let adjustmentHours = 0;
      let adjustmentEarnings = 0;

      adjustments.forEach(adj => {
        switch (adj.adjustment_type) {
          case "manual_hours":
            // Manual hours: add hours and calculate earnings
            adjustmentHours += adj.hours || 0;
            adjustmentEarnings += (adj.hours || 0) * employee.hourly_rate;
            break;
          case "bonus":
          case "pickup_trip":
            // Bonuses and pickup trips: add to earnings
            adjustmentEarnings += adj.amount || 0;
            break;
          case "deduction":
            // Deductions: subtract from earnings
            adjustmentEarnings -= adj.amount || 0;
            break;
        }
      });

      // Total hours and earnings
      const totalHours = timeHours + adjustmentHours;
      const calculatedAmount = timeEarnings + adjustmentEarnings;

      // Get current balance from map
      const currentBalance = balanceMap.get(employee.id) || 0;

      summaries.push({
        employee,
        timeEntries: timeEntries || [],
        adjustments: (adjustments as unknown as ManualAdjustment[]) || [],
        totalHours,
        calculatedAmount,
        currentBalance,
        paidAmount: 0,
        newBalance: currentBalance + calculatedAmount
      });
    }

    return summaries;
  },

  // Process payroll payment
  async processPayment(
    employeeId: string,
    startDate: string,
    endDate: string,
    totalHours: number,
    calculatedAmount: number,
    paidAmount: number,
    notes?: string
  ): Promise<void> {
    // Get current balance
    const currentBalance = await this.getEmployeeBalance(employeeId);
    
    // Calculate balance change 
    // New Balance = Old Balance + Earned - Paid
    // If Earned > Paid, Balance increases (Owe more)
    // If Earned < Paid, Balance decreases (Owe less/Overpaid)
    const newBalance = currentBalance + calculatedAmount - paidAmount;

    // Create transaction record
    const { error: transError } = await supabase
      .from("payroll_transactions")
      .insert({
        employee_id: employeeId,
        transaction_type: 'payment',
        date_range_start: startDate,
        date_range_end: endDate,
        hours_worked: totalHours,
        amount_earned: calculatedAmount,
        amount_paid: paidAmount,
        balance_before: currentBalance,
        balance_after: newBalance,
        notes: notes,
        transaction_date: new Date().toISOString()
      });

    if (transError) throw transError;

    // Update employee balance
    const { error: balanceError } = await supabase
      .from("employee_payroll_balances")
      .upsert({
        employee_id: employeeId,
        balance: newBalance,
        last_updated: new Date().toISOString()
      }, { onConflict: "employee_id" });

    if (balanceError) throw balanceError;

    // Mark time entries as paid
    const { error: timeError } = await supabase
      .from("time_entries")
      .update({ paid: true })
      .eq("employee_id", employeeId)
      .gte("clock_in", startDate)
      .lte("clock_in", endDate + "T23:59:59");

    if (timeError) throw timeError;

    // Mark adjustments as paid
    const { error: adjError } = await supabase
      .from("manual_adjustments")
      .update({ paid: true })
      .eq("employee_id", employeeId)
      .gte("date", startDate)
      .lte("date", endDate);

    if (adjError) throw adjError;

    console.log("Payment processed:", { 
      employeeId, 
      calculatedAmount, 
      paidAmount, 
      balanceBefore: currentBalance,
      balanceAfter: newBalance 
    });
  },

  // Get transaction history
  async getTransactionHistory(
    employeeId?: string,
    startDate?: string,
    endDate?: string
  ): Promise<PayrollTransaction[]> {
    try {
      const params = new URLSearchParams();
      if (employeeId) params.append("employeeId", employeeId);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      
      const queryString = params.toString() ? `?${params.toString()}` : "";
      
      const response = await fetch(`/api/payroll/transactions${queryString}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch transactions");
      }

      const transactions = await response.json();
      return transactions;
    } catch (error) {
      console.error("Error in getTransactionHistory:", error);
      throw error;
    }
  },

  // Adjust employee balance manually
  async adjustBalance(
    employeeId: string,
    adjustment: number,
    reason: string
  ): Promise<void> {
    const currentBalance = await this.getEmployeeBalance(employeeId);
    const newBalance = currentBalance + adjustment;

    // Create transaction record
    const { error: transError } = await supabase
      .from("payroll_transactions")
      .insert({
        employee_id: employeeId,
        transaction_type: 'adjustment',
        date_range_start: new Date().toISOString().split("T")[0],
        date_range_end: new Date().toISOString().split("T")[0],
        hours_worked: 0,
        amount_earned: 0,
        amount_paid: -adjustment, // Negative paid = balance increase
        balance_before: currentBalance,
        balance_after: newBalance,
        notes: reason,
        transaction_date: new Date().toISOString()
      });

    if (transError) throw transError;

    // Update balance
    const { error: balanceError } = await supabase
      .from("employee_payroll_balances")
      .upsert({
        employee_id: employeeId,
        balance: newBalance,
        last_updated: new Date().toISOString()
      }, { onConflict: "employee_id" });

    if (balanceError) throw balanceError;

    console.log("Balance adjusted:", { employeeId, adjustment, newBalance });
  },

  // Update an existing payment transaction
  async updatePaymentTransaction(
    transactionId: string,
    updates: {
      amount_paid?: number;
      notes?: string;
      transaction_date?: string;
    }
  ): Promise<void> {
    try {
      const response = await fetch("/api/payroll/transactions", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: transactionId, ...updates }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update transaction");
      }
    } catch (error) {
      console.error("Error in updatePaymentTransaction:", error);
      throw error;
    }
  },

  // Delete a payment transaction and recalculate balance
  async deletePaymentTransaction(transactionId: string): Promise<void> {
    try {
      const response = await fetch(`/api/payroll/transactions?id=${transactionId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete transaction");
      }
    } catch (error) {
      console.error("Error in deletePaymentTransaction:", error);
      throw error;
    }
  },

  // Legacy methods (kept for backward compatibility)
  async getCurrentPeriod(): Promise<PayrollPeriod | null> {
    const { data, error } = await supabase
      .from("payroll_periods")
      .select("*")
      .eq("status", "open")
      .order("start_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async getAllPeriods(): Promise<PayrollPeriod[]> {
    const { data, error } = await supabase
      .from("payroll_periods")
      .select("*")
      .order("start_date", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createPeriod(startDate: string, endDate: string): Promise<PayrollPeriod> {
    const { data, error } = await supabase
      .from("payroll_periods")
      .insert({
        start_date: startDate,
        end_date: endDate,
        status: "open"
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getEntriesForPeriod(periodId: string): Promise<PayrollEntry[]> {
    const { data, error } = await supabase
      .from("payroll_entries")
      .select("*")
      .eq("payroll_period_id", periodId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getAllEntries(): Promise<PayrollEntry[]> {
    const { data, error } = await supabase
      .from("payroll_entries")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getAdjustmentsForPeriod(startDate: string, endDate: string): Promise<ManualAdjustment[]> {
    const { data, error } = await supabase
      .from("manual_adjustments")
      .select("*")
      .gte("date", startDate)
      .lte("date", endDate);

    if (error) throw error;
    return (data as unknown as ManualAdjustment[]) || [];
  },

  async createPayrollEntry(entry: Omit<PayrollEntryInsert, "id" | "created_at">): Promise<PayrollEntry> {
    const { data, error } = await supabase
      .from("payroll_entries")
      .insert(entry)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updatePayrollEntry(
    id: string,
    updates: Partial<Omit<PayrollEntryInsert, "id" | "created_at">>
  ): Promise<PayrollEntry> {
    const { data, error } = await supabase
      .from("payroll_entries")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async markTimeEntriesAsPaid(employeeId: string, startDate: string, endDate: string): Promise<void> {
    const { error } = await supabase
      .from("time_entries")
      .update({ paid: true })
      .eq("employee_id", employeeId)
      .gte("clock_in", startDate)
      .lte("clock_in", endDate);

    if (error) throw error;
  },

  async markAdjustmentsAsPaid(employeeId: string, startDate: string, endDate: string): Promise<void> {
    const { error } = await supabase
      .from("manual_adjustments")
      .update({ paid: true })
      .eq("employee_id", employeeId)
      .gte("date", startDate)
      .lte("date", endDate);

    if (error) throw error;
  },

  async updateCustomPaymentAmount(entryId: string, amount: number | null): Promise<PayrollEntry> {
    const { data, error } = await supabase
      .from("payroll_entries")
      .update({ custom_payment_amount: amount })
      .eq("id", entryId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};