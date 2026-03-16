import { SEO } from "@/components/SEO";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, LogIn, LogOut, Calendar, DollarSign, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { employeeService } from "@/services/employeeService";
import { timeEntryService } from "@/services/timeEntryService";
import type { Employee, TimeEntry } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { formatTime, formatDate, formatDateTime, getNowNY } from "@/lib/dateUtils";

interface EmployeeWithStatus extends Employee {
  isClockedIn: boolean;
  activeEntry?: TimeEntry;
  todayHours: number;
}

export default function TimeClockPage() {
  const { toast } = useToast();
  const [employees, setEmployees] = useState<EmployeeWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(getNowNY());
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    loadEmployees();
    
    // Update current time every second
    const timer = setInterval(() => {
      setCurrentTime(getNowNY());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const employeesData = await employeeService.getAll();
      const allEntries = await timeEntryService.getAll();
      
      // Get today's date range
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      
      // Process each employee to determine clock status
      const employeesWithStatus: EmployeeWithStatus[] = employeesData.map(emp => {
        // Find active entry (clocked in, no clock out)
        const activeEntry = allEntries.find(
          e => e.employee_id === emp.id && e.clock_in && !e.clock_out
        );
        
        // Calculate today's hours
        const todayEntries = allEntries.filter(e => {
          const clockIn = new Date(e.clock_in);
          return e.employee_id === emp.id && 
                 clockIn >= today && 
                 clockIn < tomorrow &&
                 e.clock_out;
        });
        
        const todayHours = todayEntries.reduce((sum, entry) => {
          if (entry.clock_out) {
            const hours = (new Date(entry.clock_out).getTime() - new Date(entry.clock_in).getTime()) / (1000 * 60 * 60);
            return sum + hours;
          }
          return sum;
        }, 0);
        
        return {
          ...emp,
          isClockedIn: !!activeEntry,
          activeEntry,
          todayHours: Math.round(todayHours * 10) / 10
        };
      });
      
      setEmployees(employeesWithStatus);
      console.log("Employees loaded with clock status:", employeesWithStatus);
      
    } catch (error) {
      console.error("Error loading employees:", error);
      toast({
        title: "Error",
        description: "Failed to load employees",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClockIn = async (employeeId: string) => {
    try {
      setProcessingId(employeeId);
      
      // Check if already clocked in
      const employee = employees.find(e => e.id === employeeId);
      if (employee?.isClockedIn) {
        toast({
          title: "Already Clocked In",
          description: `${employee.name} is already clocked in. Please clock out first.`,
          variant: "destructive"
        });
        return;
      }
      
      await timeEntryService.clockIn(employeeId);
      
      toast({
        title: "Clocked In",
        description: `${employee?.name} has been clocked in successfully`,
      });
      
      // Reload to update status
      await loadEmployees();
      
    } catch (error) {
      console.error("Error clocking in:", error);
      toast({
        title: "Error",
        description: "Failed to clock in. Please try again.",
        variant: "destructive"
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleClockOut = async (employeeId: string) => {
    try {
      setProcessingId(employeeId);
      
      const employee = employees.find(e => e.id === employeeId);
      
      // Check if not clocked in
      if (!employee?.isClockedIn || !employee.activeEntry) {
        toast({
          title: "Not Clocked In",
          description: `${employee?.name} is not currently clocked in.`,
          variant: "destructive"
        });
        return;
      }
      
      await timeEntryService.clockOut(employee.activeEntry.id, employeeId, employee.hourly_rate);
      
      // Calculate hours worked for this shift
      const clockIn = new Date(employee.activeEntry.clock_in);
      const clockOut = new Date();
      const hoursWorked = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60);
      const earnings = hoursWorked * employee.hourly_rate;
      
      toast({
        title: "Clocked Out",
        description: `${employee.name} worked ${hoursWorked.toFixed(2)} hours. Earned ${new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(earnings)}`,
      });
      
      // Reload to update status
      await loadEmployees();
      
    } catch (error) {
      console.error("Error clocking out:", error);
      toast({
        title: "Error",
        description: "Failed to clock out. Please try again.",
        variant: "destructive"
      });
    } finally {
      setProcessingId(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const clockedInCount = employees.filter(e => e.isClockedIn).length;
  const todayTotalHours = employees.reduce((sum, e) => sum + e.todayHours, 0);
  const todayTotalEarnings = employees.reduce((sum, e) => sum + (e.todayHours * e.hourly_rate), 0);

  return (
    <>
      <SEO title="Time Clock - Bakery Employees" />
      
      <div className="min-h-screen p-4 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header with Live Clock */}
          <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2 text-amber-900 mb-2">
                  <Clock className="h-6 w-6" />
                  <h2 className="text-lg font-semibold">Current Time</h2>
                </div>
                {mounted ? (
                  <>
                    <div className="text-5xl font-bold text-amber-900 font-mono">
                      {formatTime(currentTime)}
                    </div>
                    <div className="text-lg text-amber-700">
                      {formatDate(currentTime)}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-5xl font-bold text-amber-900 font-mono">
                      --:--:--
                    </div>
                    <div className="text-lg text-amber-700">
                      Loading...
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Today's Summary */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Currently Clocked In</CardTitle>
                <LogIn className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{clockedInCount}</div>
                <p className="text-xs text-muted-foreground">
                  Active employees
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today's Hours</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{todayTotalHours.toFixed(1)}</div>
                <p className="text-xs text-muted-foreground">
                  Total hours worked
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today's Earnings</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(todayTotalEarnings)}</div>
                <p className="text-xs text-muted-foreground">
                  Total earnings
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Employee Clock In/Out Grid */}
          <div>
            <h2 className="text-2xl font-bold text-amber-900 mb-4">Employee Time Clock</h2>
            
            {loading ? (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
                    <p className="mt-4 text-amber-700">Loading employees...</p>
                  </div>
                </CardContent>
              </Card>
            ) : employees.length === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center">
                    <AlertCircle className="h-12 w-12 text-amber-400 mx-auto mb-3" />
                    <p className="text-amber-700">No employees found</p>
                    <p className="text-sm text-amber-600 mt-2">
                      Add employees first in the Employees section
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {employees.map((employee) => (
                  <Card 
                    key={employee.id} 
                    className={employee.isClockedIn ? "border-emerald-300 bg-emerald-50" : "border-amber-200"}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{employee.name}</CardTitle>
                          <CardDescription className="mt-1">
                            {employee.phone}
                          </CardDescription>
                          <p className="text-sm text-amber-700 mt-1">
                            ${employee.hourly_rate}/hour
                          </p>
                        </div>
                        {employee.isClockedIn ? (
                          <Badge className="bg-emerald-600 text-white">
                            Clocked In
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-600">
                            Off Duty
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {employee.isClockedIn && employee.activeEntry && (
                        <div className="text-sm space-y-1 bg-white p-3 rounded-lg border border-emerald-200">
                          <p className="font-medium text-emerald-900">Current Shift</p>
                          <p className="text-emerald-700">
                            Started: {formatTime(employee.activeEntry.clock_in)}
                          </p>
                          <p className="text-emerald-700">
                            Duration: {Math.floor((currentTime.getTime() - new Date(employee.activeEntry.clock_in).getTime()) / (1000 * 60))} minutes
                          </p>
                        </div>
                      )}
                      
                      {employee.todayHours > 0 && (
                        <div className="text-sm bg-amber-50 p-3 rounded-lg border border-amber-200">
                          <p className="font-medium text-amber-900">Today's Total</p>
                          <p className="text-amber-700">
                            Hours: {employee.todayHours.toFixed(1)}
                          </p>
                          <p className="text-amber-700">
                            Earned: {formatCurrency(employee.todayHours * employee.hourly_rate)}
                          </p>
                        </div>
                      )}
                      
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleClockIn(employee.id)}
                          disabled={employee.isClockedIn || processingId === employee.id}
                          className="flex-1"
                          variant={employee.isClockedIn ? "outline" : "default"}
                        >
                          <LogIn className="h-4 w-4 mr-2" />
                          {processingId === employee.id ? "Processing..." : "Clock In"}
                        </Button>
                        
                        <Button
                          onClick={() => handleClockOut(employee.id)}
                          disabled={!employee.isClockedIn || processingId === employee.id}
                          className="flex-1"
                          variant={employee.isClockedIn ? "default" : "outline"}
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          {processingId === employee.id ? "Processing..." : "Clock Out"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}