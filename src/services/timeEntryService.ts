import { supabase } from "@/integrations/supabase/client";
import { getStartOfDayNY, getEndOfDayNY } from "@/lib/dateUtils";
import type { Database } from "@/integrations/supabase/types";

type TimeEntry = Database["public"]["Tables"]["time_entries"]["Row"];
type TimeEntryInsert = Database["public"]["Tables"]["time_entries"]["Insert"];
type Employee = Database["public"]["Tables"]["employees"]["Row"];

export const timeEntryService = {
  async clockIn(employeeId: string): Promise<TimeEntry> {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("time_entries")
      .insert({
        employee_id: employeeId,
        clock_in: now
      })
      .select()
      .single();

    console.log("clockIn:", { data, error });
    if (error) throw error;
    return data;
  },

  async clockOut(entryId: string, employeeId: string, hourlyRate: number): Promise<TimeEntry> {
    const clockOut = new Date();
    
    // Get the entry to calculate hours
    const { data: entry, error: fetchError } = await supabase
      .from("time_entries")
      .select("*")
      .eq("id", entryId)
      .single();

    if (fetchError) throw fetchError;

    const clockIn = new Date(entry.clock_in);
    const hoursWorked = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60);
    const earnings = hoursWorked * hourlyRate;

    const { data, error } = await supabase
      .from("time_entries")
      .update({
        clock_out: clockOut.toISOString(),
        hours_worked: hoursWorked,
        earnings: earnings
      })
      .eq("id", entryId)
      .eq("employee_id", employeeId)
      .select()
      .single();

    console.log("clockOut:", { data, error });
    if (error) throw error;
    return data;
  },

  async getActiveEntry(employeeId: string): Promise<TimeEntry | null> {
    const { data, error } = await supabase
      .from("time_entries")
      .select("*")
      .eq("employee_id", employeeId)
      .is("clock_out", null)
      .order("clock_in", { ascending: false })
      .limit(1)
      .maybeSingle();

    console.log("getActiveEntry:", { data, error });
    if (error) throw error;
    return data;
  },

  async getAllActiveEntries(): Promise<Array<TimeEntry & { employee: Employee }>> {
    const { data, error } = await supabase
      .from("time_entries")
      .select("*, employee:employees(*)")
      .is("clock_out", null)
      .order("clock_in", { ascending: false });

    console.log("getAllActiveEntries:", { data, error });
    if (error) throw error;
    
    // Transform the data to match our expected type
    return data as Array<TimeEntry & { employee: Employee }>;
  },

  async getEntriesForPeriod(employeeId: string, startDate: string, endDate: string): Promise<TimeEntry[]> {
    // Accept both plain YYYY-MM-DD and full ISO strings
    // If plain date, convert to NY-timezone-aware UTC boundaries
    const start = startDate.length === 10 ? getStartOfDayNY(startDate) : startDate;
    const end   = endDate.length   === 10 ? getEndOfDayNY(endDate)     : endDate;

    const { data, error } = await supabase
      .from("time_entries")
      .select("*")
      .eq("employee_id", employeeId)
      .gte("clock_in", start)
      .lte("clock_in", end)
      .order("clock_in", { ascending: false });

    console.log("getEntriesForPeriod:", { data, error });
    if (error) throw error;
    return data || [];
  },

  async getEntriesForEmployee(employeeId: string): Promise<TimeEntry[]> {
    const { data, error } = await supabase
      .from("time_entries")
      .select("*")
      .eq("employee_id", employeeId)
      .order("clock_in", { ascending: false });

    console.log("getEntriesForEmployee:", { data, error });
    if (error) throw error;
    return data || [];
  },

  async getUnpaidEntriesForEmployee(employeeId: string): Promise<TimeEntry[]> {
    const { data, error } = await supabase
      .from("time_entries")
      .select("*")
      .eq("employee_id", employeeId)
      .is("paid", false)
      .not("clock_out", "is", null)
      .order("clock_in", { ascending: false });

    console.log("getUnpaidEntriesForEmployee:", { data, error });
    if (error) throw error;
    return data || [];
  },

  async create(entry: TimeEntryInsert): Promise<TimeEntry> {
    const { data, error } = await supabase
      .from("time_entries")
      .insert(entry)
      .select()
      .single();

    console.log("create:", { data, error });
    if (error) throw error;
    return data;
  },

  async deleteEntry(entryId: string): Promise<void> {
    const { error } = await supabase
      .from("time_entries")
      .delete()
      .eq("id", entryId);

    if (error) {
      console.error("Error deleting entry:", error);
      throw error;
    }
  },

  async getAll(): Promise<TimeEntry[]> {
    const { data, error } = await supabase
      .from("time_entries")
      .select("*")
      .order("clock_in", { ascending: false });

    console.log("getAll:", { data, error });
    if (error) throw error;
    return data || [];
  },

  async update(entryId: string, updates: Partial<TimeEntryInsert>): Promise<TimeEntry> {
    const { data, error } = await supabase
      .from("time_entries")
      .update(updates)
      .eq("id", entryId)
      .select()
      .single();

    console.log("update:", { data, error });
    if (error) throw error;
    return data;
  }
};

export const clockIn = timeEntryService.clockIn;
export const clockOut = timeEntryService.clockOut;
export const getActiveEntry = timeEntryService.getActiveEntry;

// Batch fetch ALL time entries and adjustments (for dashboard and reports)
export const getAllBatchTimeData = async () => {
  try {
    // Single query to get all time entries with employee data
    const { data: entries, error: entriesError } = await supabase
      .from("time_entries")
      .select(`
        *,
        employees!time_entries_employee_id_fkey(id, name, hourly_rate, is_active)
      `)
      .order("clock_in", { ascending: false });

    if (entriesError) {
      console.error("Error fetching time entries:", entriesError);
      throw entriesError;
    }

    // Single query to get all adjustments with employee data
    const { data: adjustments, error: adjError } = await supabase
      .from("manual_adjustments")
      .select(`
        *,
        employees!manual_adjustments_employee_id_fkey(id, name, hourly_rate, is_active)
      `)
      .order("date", { ascending: false });

    if (adjError) {
      console.error("Error fetching adjustments:", adjError);
      throw adjError;
    }

    return { 
      entries: entries || [], 
      adjustments: adjustments || [], 
      error: null 
    };
  } catch (error) {
    console.error("Error fetching batch time data:", error);
    return { entries: [], adjustments: [], error };
  }
};

// Batch fetch FILTERED time entries and adjustments (for payroll with custom date ranges)
export const getBatchTimeData = async (
  employeeIds: string[],
  startDate: string,
  endDate: string
) => {
  try {
    // Fetch unpaid time entries for the specified employees and date range
    const timePromises = employeeIds.map(async (empId) => {
      const { data: entries, error } = await supabase
        .from("time_entries")
        .select("*")
        .eq("employee_id", empId)
        .eq("paid", false)
        .not("clock_out", "is", null)
        .gte("clock_in", getStartOfDayNY(startDate))
        .lte("clock_in", getEndOfDayNY(endDate));

      if (error) throw error;

      const totalHours = (entries || []).reduce((sum, e) => sum + (e.hours_worked || 0), 0);
      const totalEarnings = (entries || []).reduce((sum, e) => sum + (e.earnings || 0), 0);

      return {
        employee_id: empId,
        total_hours: totalHours,
        total_earnings: totalEarnings
      };
    });

    // Fetch unpaid adjustments for the specified employees and date range
    const adjPromises = employeeIds.map(async (empId) => {
      const { data: adjustments, error } = await supabase
        .from("manual_adjustments")
        .select("*")
        .eq("employee_id", empId)
        .eq("paid", false)
        .gte("date", startDate)
        .lte("date", endDate);

      if (error) throw error;

      console.log(`Adjustments for employee ${empId}:`, {
        count: adjustments?.length || 0,
        adjustments: adjustments
      });

      const manualHours = (adjustments || [])
        .filter(a => a.adjustment_type === "manual_hours")
        .reduce((sum, a) => sum + (a.hours || 0), 0);

      const bonuses = (adjustments || [])
        .filter(a => a.adjustment_type === "bonus")
        .reduce((sum, a) => sum + (a.amount || 0), 0);

      const deductions = (adjustments || [])
        .filter(a => a.adjustment_type === "deduction")
        .reduce((sum, a) => sum + (a.amount || 0), 0);

      console.log(`Employee ${empId} adjustment totals:`, {
        manual_hours: manualHours,
        bonuses: bonuses,
        deductions: deductions
      });

      return {
        employee_id: empId,
        manual_hours: manualHours,
        bonuses: bonuses,
        deductions: deductions
      };
    });

    const timeResults = await Promise.all(timePromises);
    const adjResults = await Promise.all(adjPromises);

    console.log("Time results:", timeResults);
    console.log("Adjustment results:", adjResults);

    // Combine results
    return employeeIds.map((empId) => {
      const timeData = timeResults.find(t => t.employee_id === empId);
      const adjData = adjResults.find(a => a.employee_id === empId);

      const totalHours = (timeData?.total_hours || 0) + (adjData?.manual_hours || 0);
      const totalEarnings = (timeData?.total_earnings || 0) + (adjData?.bonuses || 0) - (adjData?.deductions || 0);

      console.log(`Combined totals for employee ${empId}:`, {
        time_hours: timeData?.total_hours || 0,
        manual_hours: adjData?.manual_hours || 0,
        total_hours: totalHours,
        total_earnings: totalEarnings
      });

      return {
        employee_id: empId,
        total_hours: totalHours,
        total_earnings: totalEarnings
      };
    });
  } catch (error) {
    console.error("Error fetching batch time data:", error);
    throw error;
  }
};