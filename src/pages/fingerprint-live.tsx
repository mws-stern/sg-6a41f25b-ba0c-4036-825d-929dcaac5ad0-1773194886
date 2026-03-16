import { useState, useEffect } from "react";
import Link from "next/link";
import { Layout } from "@/components/Layout";
import { SEO } from "@/components/SEO";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import {
  Fingerprint,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Wifi,
  WifiOff,
  RefreshCw
} from "lucide-react";
import {
  getDevice,
  getPunchLogs,
  canEmployeePunch,
  logFingerprintPunch,
  getDailyPunches,
  type FingerprintPunchLog
} from "@/services/fingerprintService";
import { getEmployees, type Employee } from "@/services/employeeService";
import { clockIn, clockOut, getActiveEntry } from "@/services/timeEntryService";
import { formatTime, formatDateTime } from "@/lib/dateUtils";

export default function FingerprintLive() {
  const { toast } = useToast();
  const [deviceOnline, setDeviceOnline] = useState(false);
  const [recentPunches, setRecentPunches] = useState<any[]>([]);
  const [scanning, setScanning] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadInitialData();
    
    // Auto-refresh every 5 seconds if enabled
    const interval = setInterval(() => {
      if (autoRefresh) {
        checkDeviceStatus();
        loadRecentPunches();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const loadInitialData = async () => {
    try {
      const [device, punches, employeeData] = await Promise.all([
        getDevice(),
        getPunchLogs(20),
        getEmployees()
      ]);

      setDeviceOnline(device?.is_online || false);
      setRecentPunches(punches);
      setEmployees(employeeData);
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const checkDeviceStatus = async () => {
    try {
      const device = await getDevice();
      setDeviceOnline(device?.is_online || false);
    } catch (error) {
      console.error("Error checking device:", error);
    }
  };

  const loadRecentPunches = async () => {
    try {
      const punches = await getPunchLogs(20);
      setRecentPunches(punches);
    } catch (error) {
      console.error("Error loading punches:", error);
    }
  };

  // Simulate fingerprint scan (in production, this would be triggered by device)
  const simulateFingerprintScan = async (employeeId: string) => {
    if (scanning) return;

    let determinedPunchType: "clock_in" | "clock_out" = "clock_in";

    try {
      setScanning(true);

      // Get employee info
      const employee = employees.find(e => e.id === employeeId);
      if (!employee) {
        throw new Error("Employee not found");
      }

      // Get daily punches to determine what action is needed
      const dailyPunches = await getDailyPunches(employeeId);
      const hasClockIn = dailyPunches.some(p => p.punch_type === "clock_in");
      const hasClockOut = dailyPunches.some(p => p.punch_type === "clock_out");

      // Determine punch type based on current state
      if (!hasClockIn) {
        determinedPunchType = "clock_in";
      } else if (!hasClockOut) {
        determinedPunchType = "clock_out";
      } else {
        throw new Error("You have already completed your shift for today");
      }

      // Check if punch is allowed
      const { canPunch, reason } = await canEmployeePunch(employeeId, determinedPunchType);
      
      if (!canPunch) {
        throw new Error(reason || "Cannot punch at this time");
      }

      // Create time entry
      if (determinedPunchType === "clock_in") {
        await clockIn(employeeId);
      } else {
        const activeEntry = await getActiveEntry(employeeId);
        if (!activeEntry) {
          throw new Error("No active clock-in found for this employee");
        }
        await clockOut(activeEntry.id, employeeId, employee.hourly_rate || 0);
      }

      // Log the successful punch with all required arguments
      await logFingerprintPunch(employeeId, determinedPunchType, true);

      // Show success
      toast({
        title: "Success!",
        description: `${employee.name} clocked ${determinedPunchType === "clock_in" ? "in" : "out"} successfully`,
      });

      // Refresh data
      await loadRecentPunches();
    } catch (error) {
      console.error("Error processing fingerprint:", error);
      
      toast({
        title: "Punch Failed",
        description: error instanceof Error ? error.message : "Failed to process fingerprint",
        variant: "destructive"
      });

      // Log failed punch with all required arguments
      await logFingerprintPunch(
        employeeId,
        determinedPunchType,
        false,
        error instanceof Error ? error.message : "Unknown error"
      );
    } finally {
      setScanning(false);
    }
  };

  return (
    <Layout>
      <SEO 
        title="Live Fingerprint Clock - Bakery Employees"
        description="Real-time fingerprint-based time clock"
      />

      <div className="container mx-auto p-6 max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Fingerprint className="w-8 h-8" />
              Live Fingerprint Clock
            </h1>
            <p className="text-muted-foreground mt-1">
              Real-time fingerprint-based attendance tracking
            </p>
          </div>
          <Badge
            variant={deviceOnline ? "default" : "secondary"}
            className="text-sm px-3 py-1"
          >
            {deviceOnline ? (
              <><Wifi className="w-4 h-4 mr-1" /> Device Online</>
            ) : (
              <><WifiOff className="w-4 h-4 mr-1" /> Device Offline</>
            )}
          </Badge>
        </div>

        {/* Device Status Alert */}
        {!deviceOnline && (
          <Alert variant="destructive">
            <AlertDescription>
              Fingerprint device is offline. Please check device connection in{" "}
              <Link href="/fingerprint-setup" className="underline font-semibold">
                Device Setup
              </Link>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Scan Status Card */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Fingerprint className="w-6 h-6" />
                  Waiting for Fingerprint Scan
                </span>
                <Badge variant={scanning ? "default" : "secondary"}>
                  {scanning ? "Scanning..." : "Ready"}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 space-y-6">
                <div className="relative">
                  <div className={`w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center ${scanning ? "animate-pulse" : ""}`}>
                    <Fingerprint className="w-16 h-16 text-primary" />
                  </div>
                  {scanning && (
                    <div className="absolute inset-0 rounded-full border-4 border-primary animate-ping" />
                  )}
                </div>
                <div className="text-center">
                  <p className="text-xl font-semibold">
                    {scanning ? "Processing fingerprint..." : "Place finger on scanner"}
                  </p>
                  <p className="text-muted-foreground mt-2">
                    {deviceOnline 
                      ? "System will automatically clock you in or out"
                      : "Device offline - Cannot process scans"}
                  </p>
                </div>

                {/* Demo Buttons (Remove in production when connected to real device) */}
                <Alert>
                  <AlertDescription>
                    <p className="font-semibold mb-2">Demo Mode - Select Employee to Simulate Scan:</p>
                    <div className="flex flex-wrap gap-2">
                      {employees.slice(0, 6).map(emp => (
                        <button
                          key={emp.id}
                          onClick={() => simulateFingerprintScan(emp.id)}
                          disabled={scanning || !deviceOnline}
                          className="px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 text-sm"
                        >
                          {emp.name}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      * In production, this will be automatic when employee scans fingerprint
                    </p>
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>

          {/* Recent Punches */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Recent Punches
                </span>
                <button
                  onClick={loadRecentPunches}
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentPunches.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No punches recorded yet
                </p>
              ) : (
                <div className="space-y-3">
                  {recentPunches.map((punch) => (
                    <div
                      key={punch.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div>
                          {punch.success ? (
                            <CheckCircle2 className="w-6 h-6 text-green-600" />
                          ) : (
                            <XCircle className="w-6 h-6 text-red-600" />
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <User className="w-5 h-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">
                              {punch.employees?.name || "Unknown Employee"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {punch.employees?.employee_number || "N/A"}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant={
                            punch.punch_type === "clock_in"
                              ? "default"
                              : "secondary"
                          }
                          className="mb-2"
                        >
                          {punch.punch_type === "clock_in" ? "CLOCK IN" : "CLOCK OUT"}
                        </Badge>
                        <p className="text-sm text-muted-foreground">
                          {formatDateTime(punch.punch_time)}
                        </p>
                        {!punch.success && punch.failure_reason && (
                          <p className="text-xs text-red-600 mt-1">
                            {punch.failure_reason}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}