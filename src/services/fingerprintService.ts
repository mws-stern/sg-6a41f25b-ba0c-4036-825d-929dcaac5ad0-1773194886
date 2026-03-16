import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type FingerprintDevice = Tables<"fingerprint_devices">;
export type EmployeeFingerprint = Tables<"employee_fingerprints">;
export type FingerprintPunchLog = Tables<"fingerprint_punch_logs">;

// Device Management
export async function getDevice() {
  const { data, error } = await supabase
    .from("fingerprint_devices")
    .select("*")
    .limit(1)
    .maybeSingle();
  
  if (error && error.code !== "PGRST116") throw error;
  return data;
}

export async function createOrUpdateDevice(device: Partial<FingerprintDevice>) {
  const existing = await getDevice();
  
  // Map frontend fields to DB columns if needed (though we should use DB columns directly)
  const dbDevice = {
    device_name: device.device_name || "Primary Device",
    device_ip: device.device_ip, // mapped from ip_address in UI if needed
    device_port: device.device_port || 80,
    device_model: device.device_model || "ZKTeco K40",
    api_key: device.api_key,
    is_active: device.is_active ?? true
  };

  if (existing) {
    const { data, error } = await supabase
      .from("fingerprint_devices")
      .update(dbDevice)
      .eq("id", existing.id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } else {
    const { data, error } = await supabase
      .from("fingerprint_devices")
      .insert(dbDevice)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
}

export async function updateDeviceStatus(isOnline: boolean, lastSync?: string) {
  const device = await getDevice();
  if (!device) return;
  
  const { error } = await supabase
    .from("fingerprint_devices")
    .update({
      is_online: isOnline,
      last_sync: lastSync || new Date().toISOString()
    })
    .eq("id", device.id);
  
  if (error) throw error;
}

// Employee Fingerprint Management
export async function getEmployeeFingerprints() {
  const { data, error } = await supabase
    .from("employee_fingerprints")
    .select(`
      *,
      employees (
        id,
        name,
        employee_number,
        position
      )
    `)
    .order("enrolled_at", { ascending: false });
  
  if (error) throw error;
  return data || [];
}

export async function getEmployeeFingerprintByEmployeeId(employeeId: string) {
  const { data, error } = await supabase
    .from("employee_fingerprints")
    .select("*")
    .eq("employee_id", employeeId)
    .maybeSingle();
  
  if (error) throw error;
  return data;
}

export async function enrollFingerprint(
  employeeId: string,
  templateData: string,
  deviceTemplateId?: string,
  fingerIndex: number = 1
) {
  const existing = await getEmployeeFingerprintByEmployeeId(employeeId);
  
  const fingerprintData = {
    employee_id: employeeId,
    fingerprint_template: templateData,
    device_template_id: deviceTemplateId,
    finger_index: fingerIndex,
    is_active: true,
    enrolled_at: new Date().toISOString()
  };

  if (existing) {
    const { data, error } = await supabase
      .from("employee_fingerprints")
      .update(fingerprintData)
      .eq("id", existing.id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } else {
    const { data, error } = await supabase
      .from("employee_fingerprints")
      .insert(fingerprintData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
}

export async function deleteFingerprint(fingerprintId: string) {
  const { error } = await supabase
    .from("employee_fingerprints")
    .delete()
    .eq("id", fingerprintId);
  
  if (error) throw error;
}

// Punch Log Management
export async function logFingerprintPunch(
  employeeId: string,
  punchType: "clock_in" | "clock_out",
  success: boolean,
  failureReason?: string
) {
  const device = await getDevice();
  
  const { data, error } = await supabase
    .from("fingerprint_punch_logs")
    .insert({
      employee_id: employeeId,
      device_id: device?.id,
      punch_type: punchType,
      punch_time: new Date().toISOString(),
      success,
      failure_reason: failureReason
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function getPunchLogs(limit: number = 50) {
  const { data, error } = await supabase
    .from("fingerprint_punch_logs")
    .select(`
      *,
      employees (
        id,
        name,
        employee_number
      )
    `)
    .order("punch_time", { ascending: false })
    .limit(limit);
  
  if (error) throw error;
  return data || [];
}

export async function getLastPunchForEmployee(employeeId: string) {
  const { data, error } = await supabase
    .from("fingerprint_punch_logs")
    .select("*")
    .eq("employee_id", employeeId)
    .eq("success", true)
    .order("punch_time", { ascending: false })
    .limit(1)
    .maybeSingle();
  
  if (error) throw error;
  return data;
}

export async function getDailyPunches(employeeId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const { data, error } = await supabase
    .from("fingerprint_punch_logs")
    .select("*")
    .eq("employee_id", employeeId)
    .eq("success", true)
    .gte("punch_time", today.toISOString())
    .order("punch_time", { ascending: true });
    
  if (error) throw error;
  return data || [];
}

// Check if employee can punch (prevents duplicate punches)
export async function canEmployeePunch(
  employeeId: string,
  punchType: "clock_in" | "clock_out"
): Promise<{ canPunch: boolean; reason?: string }> {
  const dailyPunches = await getDailyPunches(employeeId);
  
  // Strict Rule: Only one clock-in and one clock-out per day
  const clockIns = dailyPunches.filter(p => p.punch_type === "clock_in");
  const clockOuts = dailyPunches.filter(p => p.punch_type === "clock_out");

  if (punchType === "clock_in") {
    if (clockIns.length > 0) {
      return {
        canPunch: false,
        reason: "You have already clocked in today. Only one shift allowed per day."
      };
    }
  }

  if (punchType === "clock_out") {
    if (clockIns.length === 0) {
      return {
        canPunch: false,
        reason: "You haven't clocked in yet today."
      };
    }
    if (clockOuts.length > 0) {
      return {
        canPunch: false,
        reason: "You have already clocked out today."
      };
    }
  }
  
  const lastPunch = await getLastPunchForEmployee(employeeId);
  
  if (!lastPunch) {
    return { canPunch: punchType === "clock_in" };
  }
  
  // Check if last punch was within 2 minutes (prevent accidental double scans)
  const lastPunchTime = new Date(lastPunch.punch_time).getTime();
  const now = new Date().getTime();
  const twoMinutes = 2 * 60 * 1000;
  
  if (now - lastPunchTime < twoMinutes) {
    return {
      canPunch: false,
      reason: "Please wait 2 minutes between punches"
    };
  }
  
  return { canPunch: true };
}

// Sync Functions (placeholder - will be implemented based on device API)
export async function syncEmployeesToDevice() {
  const device = await getDevice();
  if (!device || !device.is_online) {
    throw new Error("Device is not online");
  }
  
  const fingerprints = await getEmployeeFingerprints();
  
  // TODO: Implement actual device API call based on device model
  // For now, just update last sync time
  await updateDeviceStatus(true, new Date().toISOString());
  
  return {
    success: true,
    synced: fingerprints.length,
    message: `Synced ${fingerprints.length} fingerprints to device`
  };
}

export async function testDeviceConnection(ipAddress: string, port: number) {
  try {
    // TODO: Implement actual device ping based on device API
    // For now, simulate connection test
    return {
      success: true,
      message: "Device connection successful",
      deviceInfo: {
        model: "ZKTeco K40",
        firmware: "1.0.0",
        capacity: 3000
      }
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Connection failed"
    };
  }
}