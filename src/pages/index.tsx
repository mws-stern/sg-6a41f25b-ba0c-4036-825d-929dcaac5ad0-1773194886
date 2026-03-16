import { SEO } from "@/components/SEO";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Clock, DollarSign, TrendingUp, UserCheck, AlertCircle, Calendar } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { employeeService } from "@/services/employeeService";
import { timeEntryService } from "@/services/timeEntryService";
import { payrollService } from "@/services/payrollService";
import { adjustmentService } from "@/services/adjustmentService";
import type { Employee, TimeEntry, PayrollPeriod, ManualAdjustment } from "@/types";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { getAllBatchTimeData } from "@/services/timeEntryService";
import { useToast } from "@/hooks/use-toast";
import { formatTime, formatDate, formatDateShort } from "@/lib/dateUtils";

interface ClockedInEmployee extends TimeEntry {
  employee: Employee;
}

export default function HomePage() {
  const { toast } = useToast();
  
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [clockedInEmployees, setClockedInEmployees] = useState<ClockedInEmployee[]>([]);
  const [nextPayroll, setNextPayroll] = useState<string | null>(null);
  // Enhancement I: top employees owed
  const [topOwed, setTopOwed] = useState<Array<{name: string; balance: number}>>([]);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    clockedIn: 0,
    pendingPayroll: 0,
    currentWeekHours: 0
  });

  const [chartData, setChartData] = useState<{
    payrollTrend: Array<{ date: string; amount: number }>;
    employeeHours: Array<{ name: string; hours: number; earnings: number }>;
    earningsDistribution: Array<{ name: string; value: number }>;
  }>({
    payrollTrend: [],
    employeeHours: [],
    earningsDistribution: []
  });

  const COLORS = ["#f59e0b", "#ea580c", "#dc2626", "#9333ea", "#3b82f6", "#10b981", "#f97316", "#ec4899"];

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Fetch all employees
      const employeesData = await employeeService.getAll();
      console.log("Employees loaded:", employeesData);
      setEmployees(employeesData);
      
      // Count active employees
      const activeCount = employeesData.filter(emp => emp.is_active).length;
      
      // Fetch batch time data (entries + adjustments)
      const batchData = await getAllBatchTimeData();
      console.log("Batch data loaded:", batchData);
      
      // Filter unpaid entries and adjustments  use correct field name "paid" not "is_paid"
      const unpaidEntries = (batchData.entries || []).filter((e: any) => !e.paid);
      const unpaidAdjustments = (batchData.adjustments || []).filter((a: any) => !a.paid);
      
      console.log("Unpaid entries:", unpaidEntries.length);
      console.log("Unpaid adjustments:", unpaidAdjustments.length);
      
      // Calculate clocked in count (entries without clock_out)
      const clockedInCount = unpaidEntries.filter(entry => !entry.clock_out).length;
      
      // Calculate total hours and earnings from unpaid time entries
      let totalEarnings = 0;
      
      unpaidEntries.forEach(entry => {
        if (entry.clock_in && entry.clock_out) {
          const hours = (new Date(entry.clock_out).getTime() - new Date(entry.clock_in).getTime()) / (1000 * 60 * 60);
          
          const employee = employeesData.find(e => e.id === entry.employee_id);
          if (employee?.hourly_rate) {
            totalEarnings += hours * employee.hourly_rate;
          }
        }
      });
      
      // Add adjustment hours and earnings
      unpaidAdjustments.forEach(adj => {
        const hours = adj.hours || 0;
        
        const employee = employeesData.find(e => e.id === adj.employee_id);
        if (employee?.hourly_rate) {
          totalEarnings += hours * employee.hourly_rate;
        }
        
        // Add adjustment amount (for flat bonuses, deductions, etc.)
        totalEarnings += adj.amount || 0;
      });
      
      console.log("Total earnings calculated:", totalEarnings);
      
      // Get current week's date range (Sunday to Saturday)
      const now = new Date();
      const dayOfWeek = now.getDay();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - dayOfWeek);
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      
      // Calculate current week hours
      let currentWeekHours = 0;
      
      unpaidEntries.forEach(entry => {
        const clockIn = new Date(entry.clock_in);
        if (clockIn >= weekStart && clockIn <= weekEnd && entry.clock_out) {
          const hours = (new Date(entry.clock_out).getTime() - clockIn.getTime()) / (1000 * 60 * 60);
          currentWeekHours += hours;
        }
      });
      
      unpaidAdjustments.forEach(adj => {
        const adjDate = new Date(adj.date);
        if (adjDate >= weekStart && adjDate <= weekEnd) {
          currentWeekHours += adj.hours || 0;
        }
      });
      
      console.log("Current week hours:", currentWeekHours);
      
      // Fetch payroll data for next payroll date
      const payrollPeriods = await payrollService.getAllPeriods();
      console.log("Payroll periods loaded:", payrollPeriods.length);
      
      // Find active period or next upcoming period
      const activePeriod = payrollPeriods.find(p => p.status === "open");
      const nextPayDate = activePeriod?.end_date || null;
      setNextPayroll(nextPayDate);
      
      // Update all stats
      setStats({
        totalEmployees: employeesData.length,
        activeEmployees: activeCount,
        clockedIn: clockedInCount,
        pendingPayroll: totalEarnings,
        currentWeekHours
      });
      
      // Calculate chart data - cast to correct type
      await calculateChartData(employeesData, payrollPeriods as PayrollPeriod[]);
      
      // Get clocked in employees with their time entries
      const clockedInData = unpaidEntries
        .filter(entry => !entry.clock_out)
        .map(entry => {
          const emp = employeesData.find(e => e.id === entry.employee_id);
          if (!emp) return null;
          return {
            ...entry,
            employee: emp
          };
        })
        .filter((item): item is ClockedInEmployee => item !== null);
      
      setClockedInEmployees(clockedInData);

      // Enhancement I: load top owed balances
      try {
        const balancesData = await payrollService.getAllBalances();
        const top = balancesData
          .filter(b => b.balance > 0)
          .sort((a, b) => b.balance - a.balance)
          .slice(0, 3)
          .map(b => ({
            name: employeesData.find(e => e.id === b.employee_id)?.name || "Unknown",
            balance: b.balance
          }));
        setTopOwed(top);
      } catch (e) {
        console.error("Could not load balances for dashboard:", e);
      }

      console.log("Dashboard data loaded successfully");
      
    } catch (error) {
      console.error("Error loading dashboard:", error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data. Please refresh the page.",
        variant: "destructive"
      });
      // Set default values on error
      setStats({ 
        totalEmployees: 0, 
        activeEmployees: 0, 
        clockedIn: 0,
        pendingPayroll: 0, 
        currentWeekHours: 0 
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateChartData = async (employees: Employee[], payrollPeriods: PayrollPeriod[]) => {
    try {
      // Get last 30 days of payroll history
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      // Calculate total paid for each period by summing all entries
      const payrollTrend = await Promise.all(
        payrollPeriods
          .filter(period => new Date(period.end_date) >= thirtyDaysAgo)
          .map(async (period) => {
            const entries = await payrollService.getEntriesForPeriod(period.id);
            const totalPaid = entries.reduce((sum, entry) => sum + (entry.gross_pay || 0), 0);
            return {
              date: new Date(period.end_date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
              amount: totalPaid
            };
          })
      );

      // Take last 10 periods only
      const sortedTrend = payrollTrend.slice(-10);

      // Employee hours and earnings (current month)
      const employeeStats = await Promise.all(
        employees.map(async (emp) => {
          const entries = await timeEntryService.getEntriesForEmployee(emp.id);
          const thisMonth = entries.filter(e => {
            const entryDate = new Date(e.clock_in);
            const now = new Date();
            return entryDate.getMonth() === now.getMonth() && 
                   entryDate.getFullYear() === now.getFullYear();
          });
          
          const totalHours = thisMonth.reduce((sum, entry) => {
            if (entry.clock_out) {
              return sum + ((new Date(entry.clock_out).getTime() - new Date(entry.clock_in).getTime()) / (1000 * 60 * 60));
            }
            return sum;
          }, 0);
          
          const totalEarnings = totalHours * emp.hourly_rate;
          
          return {
            name: emp.name.split(" ")[0], // First name only
            hours: Math.round(totalHours * 10) / 10,
            earnings: Math.round(totalEarnings * 100) / 100
          };
        })
      );

      // Filter out employees with no hours
      const employeeHours = employeeStats.filter(stat => stat.hours > 0);
      const earningsDistribution = employeeStats
        .filter(stat => stat.earnings > 0)
        .map(stat => ({
          name: stat.name,
          value: stat.earnings
        }));

      setChartData({
        payrollTrend: sortedTrend,
        employeeHours,
        earningsDistribution
      });
    } catch (error) {
      console.error("Error calculating chart data:", error);
    }
  };

  useEffect(() => {
    loadData();
    
    // Refresh data when tab becomes visible (user returns to dashboard)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        loadData();
      }
    };
    
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  return (
    <>
      <SEO
        title="Dashboard - Bakery Employee Management"
        description="Manage your bakery employees, time tracking, and payroll"
      />
      
      <div className="min-h-screen p-4 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-amber-900">Dashboard</h1>
            <p className="text-lg text-amber-700">
              Welcome to your bakery management system
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalEmployees}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.activeEmployees} active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Currently Clocked In</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.clockedIn}</div>
                <p className="text-xs text-muted-foreground">
                  Active shifts
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Payroll</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(stats.pendingPayroll)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Unpaid hours & adjustments
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Current Week Hours</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.currentWeekHours.toFixed(1)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {nextPayroll ? (
                    <>
                      Period ends: {formatDateShort(nextPayroll)}
                    </>
                  ) : (
                    "No active period"
                  )}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Enhancement I: Urgent Payments Widget */}
          {topOwed.length > 0 && (
            <Card className="border-red-200 bg-red-50/50">
              <CardHeader>
                <CardTitle className="text-red-800 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  Needs Payment Urgently
                </CardTitle>
                <CardDescription>Employees with highest outstanding balance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {topOwed.map((emp, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-200">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {emp.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-red-900">{emp.name}</span>
                      </div>
                      <span className="font-bold text-red-700 text-lg">${emp.balance.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <Link href="/payroll">
                  <button className="mt-3 w-full text-sm text-red-700 font-medium py-2 px-4 rounded-lg border border-red-300 hover:bg-red-100 transition-colors">
                     Go to Payroll
                  </button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Currently Clocked In */}
          <Card className="border-amber-200 bg-white/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-amber-900 flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Currently Clocked In
              </CardTitle>
              <CardDescription>
                Employees working right now
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-center text-amber-700 py-8">Loading...</p>
              ) : clockedInEmployees.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-amber-400 mx-auto mb-3" />
                  <p className="text-amber-700">No employees currently clocked in</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {clockedInEmployees.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg border border-emerald-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold">
                          {entry.employee.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-emerald-900">
                            {entry.employee.name}
                          </p>
                          <p className="text-sm text-emerald-700">
                            {entry.employee.phone}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-emerald-900">
                          Started at {formatTime(entry.clock_in)}
                        </p>
                        <p className="text-xs text-emerald-700">
                          ${entry.employee.hourly_rate}/hour
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Charts Section */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Payroll Trend Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Payroll Trend (Last 10 Periods)</CardTitle>
                <CardDescription>Total payroll paid over time</CardDescription>
              </CardHeader>
              <CardContent>
                {chartData.payrollTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData.payrollTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="amount" 
                        stroke="#f59e0b" 
                        strokeWidth={2}
                        name="Total Paid"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No payroll history available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Employee Hours Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Hours This Month</CardTitle>
                <CardDescription>Hours worked by each employee</CardDescription>
              </CardHeader>
              <CardContent>
                {chartData.employeeHours.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData.employeeHours}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="hours" fill="#f59e0b" name="Hours Worked" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No hours data available for this month
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Earnings Distribution Pie Chart */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Earnings Distribution This Month</CardTitle>
                <CardDescription>Total earnings breakdown by employee</CardDescription>
              </CardHeader>
              <CardContent>
                {chartData.earningsDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                      <Pie
                        data={chartData.earningsDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {chartData.earningsDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                    No earnings data available for this month
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/employees">
              <Card className="border-amber-200 bg-white/80 backdrop-blur hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-amber-900 flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Employees
                  </CardTitle>
                  <CardDescription>
                    Manage your team
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/timeclock">
              <Card className="border-amber-200 bg-white/80 backdrop-blur hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-amber-900 flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Time Clock
                  </CardTitle>
                  <CardDescription>
                    Clock in/out
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/payroll">
              <Card className="border-amber-200 bg-white/80 backdrop-blur hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-amber-900 flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Payroll
                  </CardTitle>
                  <CardDescription>
                    Process payments
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/reports">
              <Card className="border-amber-200 bg-white/80 backdrop-blur hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-amber-900 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Reports
                  </CardTitle>
                  <CardDescription>
                    View analytics
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
