import { SEO } from "@/components/SEO";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Clock, DollarSign, Users, TrendingUp, Download, Eye, Pencil, Trash2, X, Save, Calendar, Edit } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { employeeService } from "@/services/employeeService";
import { timeEntryService } from "@/services/timeEntryService";
import { adjustmentService } from "@/services/adjustmentService";
import { supabase } from "@/integrations/supabase/client";
import type { Employee, TimeEntry, ManualAdjustment } from "@/types";
import { formatDate, formatTime, formatDateTime, formatDateShort, formatTime12h, formatDateTime12h } from "@/lib/dateUtils";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

// Extend jsPDF type to include autoTable
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface EmployeeHours {
  employee: Employee;
  weekHours: number;
  weekEarnings: number;
  periodHours: number;
  periodEarnings: number;
  isClockedIn: boolean;
  currentShiftStart?: string;
  timeEntries: TimeEntry[];
  adjustments: ManualAdjustment[];
}

export default function CurrentHours() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [employeeHours, setEmployeeHours] = useState<EmployeeHours[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeHours | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editClockIn, setEditClockIn] = useState("");
  const [editClockOut, setEditClockOut] = useState("");
  const [dailyData, setDailyData] = useState<Array<{
    date: string;
    hours: number;
    cost: number;
    displayDate: string;
  }>>([]);
  const [employeeDistribution, setEmployeeDistribution] = useState<Array<{
    name: string;
    hours: number;
    cost: number;
  }>>([]);
  const [editingManualAdjustment, setEditingManualAdjustment] = useState<ManualAdjustment | null>(null);
  const [editManualDate, setEditManualDate] = useState("");
  const [editManualClockIn, setEditManualClockIn] = useState("");
  const [editManualClockOut, setEditManualClockOut] = useState("");
  const [editManualReason, setEditManualReason] = useState("");

  const COLORS = ["#4F46E5", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4", "#84CC16"];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load employees and time entries in parallel
      const [employeesData, entriesData] = await Promise.all([
        employeeService.getAll(),
        timeEntryService.getAll(),
      ]);

      // Load adjustments separately with error handling
      let adjustmentsData: ManualAdjustment[] = [];
      try {
        const rawAdjustments = await adjustmentService.getAll();
        adjustmentsData = rawAdjustments as ManualAdjustment[];
      } catch (adjustmentError) {
        console.error("Failed to load adjustments, continuing without them:", adjustmentError);
        toast({
          title: "Warning",
          description: "Could not load manual adjustments. Time entries will still be displayed.",
          variant: "destructive",
        });
      }

      // Calculate current week
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
      startOfWeek.setHours(0, 0, 0, 0);

      // Enhancement G: Remove payroll_periods dependency.
      // "Period" now means all unpaid entries from the beginning of time
      // so nothing is ever silently excluded. periodStart set to epoch.
      const periodStart = new Date(0);
      const periodEnd = now;

      const hoursData: EmployeeHours[] = await Promise.all(
        employeesData.map(async (employee) => {
          // Get employee's time entries and adjustments
          const employeeEntries = entriesData.filter((e: TimeEntry) => e.employee_id === employee.id);
          const employeeAdjustments = adjustmentsData.filter((a: any) => a.employee_id === employee.id) as ManualAdjustment[];

          // Find active entry (clocked in)
          const activeEntry = employeeEntries.find((e: TimeEntry) => !e.clock_out);
          const isClockedIn = !!activeEntry;

          // Calculate week hours and earnings
          let weekHours = 0;
          let weekEarnings = 0;

          employeeEntries.forEach((entry: TimeEntry) => {
            const entryDate = new Date(entry.clock_in);
            if (entryDate >= startOfWeek && entryDate <= now) {
              weekHours += entry.hours_worked || 0;
              weekEarnings += entry.earnings || 0;
            }
          });

          // Add adjustment hours and amounts to week totals
          employeeAdjustments.forEach((adj: ManualAdjustment) => {
            const adjDate = new Date(adj.date);
            if (adjDate >= startOfWeek && adjDate <= now) {
              weekHours += adj.hours || 0;
              const amount = adj.adjustment_type === "pickup_trip" ? adj.amount || 0 : (adj.hours || 0) * employee.hourly_rate;
              weekEarnings += amount;
            }
          });

          // Calculate period hours and earnings
          let periodHours = 0;
          let periodEarnings = 0;

          employeeEntries.forEach((entry: TimeEntry) => {
            const entryDate = new Date(entry.clock_in);
            if (entryDate >= periodStart && entryDate <= periodEnd) {
              periodHours += entry.hours_worked || 0;
              periodEarnings += entry.earnings || 0;
            }
          });

          employeeAdjustments.forEach((adj: ManualAdjustment) => {
            const adjDate = new Date(adj.date);
            if (adjDate >= periodStart && adjDate <= periodEnd) {
              periodHours += adj.hours || 0;
              const amount = adj.adjustment_type === "pickup_trip" ? adj.amount || 0 : (adj.hours || 0) * employee.hourly_rate;
              periodEarnings += amount;
            }
          });

          return {
            employee,
            weekHours: Math.round(weekHours * 100) / 100,
            weekEarnings: Math.round(weekEarnings * 100) / 100,
            periodHours: Math.round(periodHours * 100) / 100,
            periodEarnings: Math.round(periodEarnings * 100) / 100,
            isClockedIn,
            currentShiftStart: activeEntry?.clock_in,
            timeEntries: employeeEntries,
            adjustments: employeeAdjustments
          };
        })
      );

      setEmployeeHours(hoursData);
      
      // Calculate daily data for charts
      const dailyMap = new Map<string, { hours: number; cost: number }>();
      
      // Initialize last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split("T")[0];
        dailyMap.set(dateStr, { hours: 0, cost: 0 });
      }

      // Aggregate time entries by date
      hoursData.forEach((empData) => {
        empData.timeEntries.forEach((entry) => {
          const entryDate = new Date(entry.clock_in).toISOString().split("T")[0];
          if (dailyMap.has(entryDate)) {
            const current = dailyMap.get(entryDate)!;
            const hours = entry.hours_worked || 0;
            const cost = hours * empData.employee.hourly_rate;
            dailyMap.set(entryDate, {
              hours: current.hours + hours,
              cost: current.cost + cost,
            });
          }
        });

        // Add adjustments to daily data
        empData.adjustments.forEach((adj) => {
          const adjDate = new Date(adj.date).toISOString().split("T")[0];
          if (dailyMap.has(adjDate)) {
            const current = dailyMap.get(adjDate)!;
            const hours = adj.hours || 0;
            const amount = adj.amount || (hours * empData.employee.hourly_rate);
            dailyMap.set(adjDate, {
              hours: current.hours + hours,
              cost: current.cost + amount,
            });
          }
        });
      });

      // Convert to array for charts
      const dailyArray = Array.from(dailyMap.entries()).map(([date, data]) => {
        const dateObj = new Date(date + "T00:00:00");
        return {
          date,
          displayDate: formatDateShort(dateObj.toISOString()),
          hours: Math.round(data.hours * 100) / 100,
          cost: Math.round(data.cost * 100) / 100,
        };
      });

      setDailyData(dailyArray);

      // Calculate employee distribution for pie chart
      const empDistribution = hoursData
        .map((empData) => ({
          name: empData.employee.name,
          hours: Math.round(empData.weekHours * 100) / 100,
          cost: Math.round(empData.weekEarnings * 100) / 100,
        }))
        .filter((emp) => emp.hours > 0)
        .sort((a, b) => b.hours - a.hours)
        .slice(0, 8); // Top 8 employees

      setEmployeeDistribution(empDistribution);
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Error",
        description: "Failed to load current hours data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = ["Employee", "Phone", "Hourly Rate", "Status", "Week Hours", "Week Earnings", "Period Hours", "Period Earnings"];
    const rows = employeeHours.map((eh) => [
      eh.employee.name,
      eh.employee.phone || "",
      `$${eh.employee.hourly_rate.toFixed(2)}`,
      eh.isClockedIn ? "Clocked In" : "Off Duty",
      eh.weekHours.toFixed(2),
      `$${eh.weekEarnings.toFixed(2)}`,
      eh.periodHours.toFixed(2),
      `$${eh.periodEarnings.toFixed(2)}`
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `current-hours-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const exportToPDF = () => {
    // Calculate dates
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    // Calculate period (same logic as loadData)
    const referenceDate = new Date("2024-01-01");
    const daysSinceReference = Math.floor((now.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24));
    const periodNumber = Math.floor(daysSinceReference / 14);
    const periodStart = new Date(referenceDate);
    periodStart.setDate(referenceDate.getDate() + periodNumber * 14);
    const periodEnd = new Date(periodStart);
    periodEnd.setDate(periodStart.getDate() + 13);

    // Calculate totals
    const currentTotals = employeeHours.reduce(
      (acc, curr) => ({
        weekHours: acc.weekHours + curr.weekHours,
        weekEarnings: acc.weekEarnings + curr.weekEarnings,
        periodHours: acc.periodHours + curr.periodHours,
        periodEarnings: acc.periodEarnings + curr.periodEarnings
      }),
      { weekHours: 0, weekEarnings: 0, periodHours: 0, periodEarnings: 0 }
    );

    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text("Current Hours Report", 14, 20);
    
    // Add date range
    doc.setFontSize(11);
    doc.text(`Week: ${formatDateShort(weekStart.toISOString())} - ${formatDateShort(weekEnd.toISOString())}`, 14, 28);
    doc.text(`Pay Period: ${formatDateShort(periodStart.toISOString())} - ${formatDateShort(periodEnd.toISOString())}`, 14, 34);
    
    // Add summary section
    doc.setFontSize(12);
    doc.text("Summary", 14, 44);
    
    const summaryData = [
      ["This Week Hours", `${currentTotals.weekHours.toFixed(2)} hrs`],
      ["This Week Earnings", `$${currentTotals.weekEarnings.toFixed(2)}`],
      ["Pay Period Hours", `${currentTotals.periodHours.toFixed(2)} hrs`],
      ["Pay Period Earnings", `$${currentTotals.periodEarnings.toFixed(2)}`],
    ];
    
    doc.autoTable({
      startY: 48,
      head: [["Metric", "Value"]],
      body: summaryData,
      theme: "grid",
      headStyles: { fillColor: [79, 70, 229] },
    });
    
    // Add employee details table
    doc.setFontSize(12);
    const finalY = (doc as any).lastAutoTable.finalY || 48;
    doc.text("Employee Breakdown", 14, finalY + 10);
    
    const employeeData = employeeHours.map(emp => [
      emp.employee.name,
      emp.employee.phone || "N/A",
      emp.isClockedIn ? "Clocked In" : "Off Duty",
      `${emp.weekHours.toFixed(2)} hrs`,
      `$${emp.weekEarnings.toFixed(2)}`,
      `${emp.periodHours.toFixed(2)} hrs`,
      `$${emp.periodEarnings.toFixed(2)}`,
    ]);
    
    // Add totals row
    employeeData.push([
      "TOTAL",
      "",
      "",
      `${currentTotals.weekHours.toFixed(2)} hrs`,
      `$${currentTotals.weekEarnings.toFixed(2)}`,
      `${currentTotals.periodHours.toFixed(2)} hrs`,
      `$${currentTotals.periodEarnings.toFixed(2)}`,
    ]);
    
    doc.autoTable({
      startY: finalY + 14,
      head: [["Name", "Phone", "Status", "Week Hours", "Week Earnings", "Period Hours", "Period Earnings"]],
      body: employeeData,
      theme: "grid",
      headStyles: { fillColor: [79, 70, 229] },
      styles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 25 },
        2: { cellWidth: 20 },
        3: { cellWidth: 22 },
        4: { cellWidth: 25 },
        5: { cellWidth: 22 },
        6: { cellWidth: 25 },
      },
    });
    
    // Add footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(
        `Generated: ${formatDateTime(new Date().toISOString())} | Page ${i} of ${pageCount}`,
        14,
        doc.internal.pageSize.height - 10
      );
    }
    
    // Save the PDF
    doc.save(`current-hours-${format(new Date(), "yyyy-MM-dd")}.pdf`);
    toast({
      title: "PDF Downloaded",
      description: "Current hours report has been exported to PDF",
    });
  };

  const showDetails = (employeeHours: EmployeeHours) => {
    setSelectedEmployee(employeeHours);
    setDetailsOpen(true);
  };

  const openEditDialog = (entry: TimeEntry) => {
    setEditingEntry(entry);
    setEditClockIn(entry.clock_in);
    setEditClockOut(entry.clock_out || "");
    setEditDialogOpen(true);
  };

  const saveEdit = async () => {
    if (!editingEntry || !editClockIn) {
      toast({
        title: "Error",
        description: "Clock in time is required",
        variant: "destructive"
      });
      return;
    }

    try {
      const clockInDate = new Date(editClockIn);
      const clockOutDate = editClockOut ? new Date(editClockOut) : null;

      // Calculate hours and earnings
      let hoursWorked = 0;
      let earnings = 0;

      if (clockOutDate) {
        hoursWorked = (clockOutDate.getTime() - clockInDate.getTime()) / (1000 * 60 * 60);
        const employee = employeeHours.find((eh) => eh.employee.id === editingEntry.employee_id)?.employee;
        if (employee) {
          earnings = hoursWorked * employee.hourly_rate;
        }
      }

      await timeEntryService.update(editingEntry.id, {
        clock_in: editClockIn,
        clock_out: editClockOut || null,
        hours_worked: clockOutDate ? Math.round(hoursWorked * 100) / 100 : null,
        earnings: clockOutDate ? Math.round(earnings * 100) / 100 : null
      });

      toast({
        title: "Success",
        description: "Time entry updated successfully"
      });

      setEditDialogOpen(false);
      setEditingEntry(null);
      await loadData();
    } catch (error) {
      console.error("Error updating entry:", error);
      toast({
        title: "Error",
        description: "Failed to update time entry",
        variant: "destructive"
      });
    }
  };

  const deleteEntry = async (entryId: string) => {
    if (!confirm("Are you sure you want to delete this time entry?")) {
      return;
    }

    try {
      await timeEntryService.deleteEntry(entryId);
      toast({
        title: "Success",
        description: "Time entry deleted successfully"
      });
      await loadData();
      setDetailsOpen(false);
    } catch (error) {
      console.error("Error deleting entry:", error);
      toast({
        title: "Error",
        description: "Failed to delete time entry",
        variant: "destructive"
      });
    }
  };

  const totals = employeeHours.reduce(
    (acc, curr) => ({
      weekHours: acc.weekHours + curr.weekHours,
      weekEarnings: acc.weekEarnings + curr.weekEarnings,
      periodHours: acc.periodHours + curr.periodHours,
      periodEarnings: acc.periodEarnings + curr.periodEarnings
    }),
    { weekHours: 0, weekEarnings: 0, periodHours: 0, periodEarnings: 0 }
  );

  return (
    <>
      <SEO 
        title="Current Earnings - Bakery Employees"
        description="View current employee hours and earnings"
      />
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold">Current Earnings</h1>
          <div className="flex gap-2">
            <Button onClick={exportToCSV} variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button onClick={exportToPDF} variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">This Week Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                <span className="text-2xl font-bold">{totals.weekHours.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">This Week Earnings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                <span className="text-2xl font-bold">${totals.weekEarnings.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pay Period Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-purple-600" />
                <span className="text-2xl font-bold">{totals.periodHours.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pay Period Earnings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-orange-600" />
                <span className="text-2xl font-bold">${totals.periodEarnings.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Visual Charts Section */}
        <div className="grid gap-6 md:grid-cols-2 mb-6">
          {/* Daily Hours Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-indigo-600" />
                Daily Hours Worked (Last 7 Days)
              </CardTitle>
              <CardDescription>Total hours worked per day</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                  <XAxis 
                    dataKey="displayDate" 
                    tick={{ fill: "#6B7280", fontSize: 12 }}
                  />
                  <YAxis 
                    tick={{ fill: "#6B7280", fontSize: 12 }}
                    label={{ value: "Hours", angle: -90, position: "insideLeft", style: { fill: "#6B7280" } }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "#FFF", 
                      border: "1px solid #E5E7EB",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
                    }}
                    formatter={(value: number) => [`${value} hrs`, "Hours"]}
                  />
                  <Bar dataKey="hours" fill="#4F46E5" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Daily Cost Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-emerald-600" />
                Daily Labor Cost (Last 7 Days)
              </CardTitle>
              <CardDescription>Total labor cost per day</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                  <XAxis 
                    dataKey="displayDate" 
                    tick={{ fill: "#6B7280", fontSize: 12 }}
                  />
                  <YAxis 
                    tick={{ fill: "#6B7280", fontSize: 12 }}
                    label={{ value: "Cost ($)", angle: -90, position: "insideLeft", style: { fill: "#6B7280" } }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "#FFF", 
                      border: "1px solid #E5E7EB",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
                    }}
                    formatter={(value: number) => [`$${value.toFixed(2)}`, "Cost"]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="cost" 
                    stroke="#10B981" 
                    strokeWidth={3}
                    dot={{ fill: "#10B981", r: 6 }}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Employee Distribution Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-amber-600" />
                Employee Hours Distribution (This Week)
              </CardTitle>
              <CardDescription>Hours worked by employee this week</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={employeeDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}h`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="hours"
                  >
                    {employeeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "#FFF", 
                      border: "1px solid #E5E7EB",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
                    }}
                    formatter={(value: number, name: string) => {
                      const emp = employeeDistribution.find(e => e.hours === value);
                      return [`${value} hrs ($${emp?.cost.toFixed(2) || 0})`, name];
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Weekly Summary Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-purple-600" />
                Top Employees by Cost (This Week)
              </CardTitle>
              <CardDescription>Labor cost by employee this week</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={employeeDistribution} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                  <XAxis 
                    type="number"
                    tick={{ fill: "#6B7280", fontSize: 12 }}
                  />
                  <YAxis 
                    type="category"
                    dataKey="name" 
                    tick={{ fill: "#6B7280", fontSize: 12 }}
                    width={100}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "#FFF", 
                      border: "1px solid #E5E7EB",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
                    }}
                    formatter={(value: number) => [`$${value.toFixed(2)}`, "Cost"]}
                  />
                  <Bar dataKey="cost" fill="#8B5CF6" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Employee Breakdown Table */}
        <Card>
          <CardHeader>
            <CardTitle>Employee Breakdown</CardTitle>
            <CardDescription>Detailed hours and earnings for each employee</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : employeeHours.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No employee data available</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Employee</th>
                      <th className="text-left p-2">Phone</th>
                      <th className="text-left p-2">Rate</th>
                      <th className="text-left p-2">Status</th>
                      <th className="text-right p-2">Week Hours</th>
                      <th className="text-right p-2">Week Earnings</th>
                      <th className="text-right p-2">All Unpaid Hrs</th>
                      <th className="text-right p-2 text-amber-700 font-bold">Total Unpaid $</th>
                      <th className="text-center p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employeeHours.map((eh) => (
                      <tr key={eh.employee.id} className="border-b hover:bg-muted/50">
                        <td className="p-2 font-medium">{eh.employee.name}</td>
                        <td className="p-2 text-sm text-muted-foreground">{eh.employee.phone || "N/A"}</td>
                        <td className="p-2">${eh.employee.hourly_rate.toFixed(2)}/hr</td>
                        <td className="p-2">
                          <div className="flex flex-col gap-1">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium w-fit ${
                                eh.isClockedIn
                                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                  : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                              }`}
                            >
                              {eh.isClockedIn ? "Clocked In" : "Off Duty"}
                            </span>
                            {eh.isClockedIn && eh.currentShiftStart && (
                              <span className="text-xs text-muted-foreground">
                                Since {formatTime12h(eh.currentShiftStart)}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-2 text-right">{eh.weekHours.toFixed(2)}</td>
                        <td className="p-2 text-right">${eh.weekEarnings.toFixed(2)}</td>
                        <td className="p-2 text-right">{eh.periodHours.toFixed(2)}</td>
                        <td className="p-2 text-right font-bold text-amber-700">${eh.periodEarnings.toFixed(2)}</td>
                        <td className="p-2 text-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => showDetails(eh)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Details
                          </Button>
                        </td>
                      </tr>
                    ))}
                    <tr className="font-bold bg-muted/50">
                      <td colSpan={4} className="p-2">Total</td>
                      <td className="p-2 text-right">{totals.weekHours.toFixed(2)}</td>
                      <td className="p-2 text-right">${totals.weekEarnings.toFixed(2)}</td>
                      <td className="p-2 text-right">{totals.periodHours.toFixed(2)}</td>
                      <td className="p-2 text-right text-amber-700">${totals.periodEarnings.toFixed(2)}</td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Details Dialog */}
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedEmployee?.employee.name} - Time Details
              </DialogTitle>
              <DialogDescription>
                View and edit all time entries and adjustments
              </DialogDescription>
            </DialogHeader>

            {selectedEmployee && (
              <div className="space-y-6">
                {/* Time Entries */}
                <div>
                  <h3 className="font-semibold mb-3">Time Entries</h3>
                  {selectedEmployee.timeEntries.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No time entries found</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedEmployee.timeEntries.map((entry) => (
                        <div
                          key={entry.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-4">
                              <div>
                                <p className="text-sm font-medium">
                                  {formatDateTime12h(entry.clock_in)}
                                </p>
                                <p className="text-xs text-muted-foreground">Clock In</p>
                              </div>
                              {entry.clock_out && (
                                <>
                                  <span className="text-muted-foreground"></span>
                                  <div>
                                    <p className="text-sm font-medium">
                                      {formatDateTime12h(entry.clock_out)}
                                    </p>
                                    <p className="text-xs text-muted-foreground">Clock Out</p>
                                  </div>
                                </>
                              )}
                            </div>
                            {entry.hours_worked && (
                              <div className="mt-2 flex gap-4 text-sm">
                                <span className="text-blue-600 font-medium">
                                  {entry.hours_worked.toFixed(2)} hours
                                </span>
                                <span className="text-green-600 font-medium">
                                  ${entry.earnings?.toFixed(2) || "0.00"}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(entry)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteEntry(entry.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Adjustments */}
                <div>
                  <h3 className="font-semibold mb-3">Manual Adjustments</h3>
                  {selectedEmployee.adjustments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No adjustments found</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedEmployee.adjustments.map((adj) => {
                        const isManualHours = adj.adjustment_type === "manual_hours";
                        const isPickup = adj.adjustment_type === "pickup_trip";
                        const isBonus = adj.adjustment_type === "bonus";
                        const isDeduction = adj.adjustment_type === "deduction";

                        // Compute display amount:
                        let displayAmount = adj.amount || 0;
                        if (isManualHours && (!displayAmount || displayAmount === 0) && adj.hours && selectedEmployee.employee.hourly_rate) {
                          displayAmount = adj.hours * selectedEmployee.employee.hourly_rate;
                        }

                        return (
                          <div
                            key={adj.id}
                            className="flex items-center justify-between p-3 border rounded-lg gap-4"
                          >
                            <div className="flex-1">
                              <p className="font-medium">
                                {isManualHours
                                  ? "Manual Hours"
                                  : isPickup
                                  ? "Pickup Trip"
                                  : isBonus
                                  ? "Bonus"
                                  : "Deduction"}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {formatDateShort(adj.date)}
                              </p>
                              {adj.reason && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {adj.reason}
                                </p>
                              )}
                              {isManualHours && adj.clock_in && adj.clock_out && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {formatTime12h(`${adj.date}T${adj.clock_in}`)} - {formatTime12h(`${adj.date}T${adj.clock_out}`)} ({adj.hours?.toFixed(2)} hrs)
                                </p>
                              )}
                              {isManualHours && (!adj.clock_in || !adj.clock_out) && adj.hours && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {adj.hours.toFixed(2)} hours
                                </p>
                              )}
                            </div>

                            {/* Amount column */}
                            <div className="text-right min-w-[90px]">
                              {isManualHours && displayAmount > 0 && (
                                <p className="text-sm font-semibold text-green-600">
                                  ${displayAmount.toFixed(2)}
                                </p>
                              )}
                              {isPickup && adj.amount !== undefined && (
                                <p className="text-sm font-semibold text-green-600">
                                  ${adj.amount.toFixed(2)}
                                </p>
                              )}
                              {(isBonus || isDeduction) && adj.amount !== undefined && (
                                <p className={`text-sm font-semibold ${isBonus ? "text-green-600" : "text-red-600"}`}>
                                  ${adj.amount.toFixed(2)}
                                </p>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2">
                              {isManualHours && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setEditingManualAdjustment(adj);
                                      setEditManualDate(adj.date);
                                      setEditManualClockIn(adj.clock_in ? adj.clock_in.slice(0, 5) : "");
                                      setEditManualClockOut(adj.clock_out ? adj.clock_out.slice(0, 5) : "");
                                      setEditManualReason(adj.reason || "");
                                    }}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={async () => {
                                      if (!confirm("Are you sure you want to delete this manual hours adjustment?")) {
                                        return;
                                      }
                                      try {
                                        await adjustmentService.deleteManualAdjustment(adj.id);
                                        toast({
                                          title: "Success",
                                          description: "Manual hours adjustment deleted successfully",
                                        });
                                        await loadData();
                                        if (selectedEmployee) {
                                          const updated = employeeHours.find((eh) => eh.employee.id === selectedEmployee.employee.id);
                                          if (updated) {
                                            setSelectedEmployee(updated);
                                          }
                                        }
                                      } catch (error) {
                                        console.error("Error deleting manual adjustment:", error);
                                        toast({
                                          title: "Error",
                                          description: "Failed to delete manual adjustment",
                                          variant: "destructive",
                                        });
                                      }
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Entry Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Time Entry</DialogTitle>
              <DialogDescription>
                Modify clock in and clock out times
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="clock-in">Clock In</Label>
                <Input
                  id="clock-in"
                  type="datetime-local"
                  value={editClockIn}
                  onChange={(e) => setEditClockIn(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="clock-out">Clock Out</Label>
                <Input
                  id="clock-out"
                  type="datetime-local"
                  value={editClockOut}
                  onChange={(e) => setEditClockOut(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={saveEdit}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Manual Hours Adjustment Dialog */}
        <Dialog open={!!editingManualAdjustment} onOpenChange={(open) => {
          if (!open) {
            setEditingManualAdjustment(null);
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Manual Hours</DialogTitle>
              <DialogDescription>
                Update the date, times, and reason for this manual hours adjustment.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="manual-date">Date</Label>
                <Input
                  id="manual-date"
                  type="date"
                  value={editManualDate}
                  onChange={(e) => setEditManualDate(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="manual-clock-in">Clock In</Label>
                  <Input
                    id="manual-clock-in"
                    type="time"
                    value={editManualClockIn}
                    onChange={(e) => setEditManualClockIn(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manual-clock-out">Clock Out</Label>
                  <Input
                    id="manual-clock-out"
                    type="time"
                    value={editManualClockOut}
                    onChange={(e) => setEditManualClockOut(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="manual-reason">Reason</Label>
                <Textarea
                  id="manual-reason"
                  value={editManualReason}
                  onChange={(e) => setEditManualReason(e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingManualAdjustment(null)}>
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (!editingManualAdjustment) return;

                  if (!editManualDate || !editManualClockIn || !editManualClockOut) {
                    toast({
                      title: "Error",
                      description: "Date, clock in, and clock out are required",
                      variant: "destructive"
                    });
                    return;
                  }

                  try {
                    await adjustmentService.updateManualHours(
                      editingManualAdjustment.id,
                      editManualClockIn,
                      editManualClockOut,
                      editManualReason,
                      editManualDate
                    );
                    toast({
                      title: "Success",
                      description: "Manual hours adjustment updated"
                    });
                    setEditingManualAdjustment(null);
                    await loadData();
                    if (selectedEmployee) {
                      const updated = employeeHours.find(eh => eh.employee.id === selectedEmployee.employee.id);
                      if (updated) {
                        setSelectedEmployee(updated);
                      }
                    }
                  } catch (error) {
                    console.error("Error updating manual hours adjustment:", error);
                    toast({
                      title: "Error",
                      description: "Failed to update manual hours adjustment",
                      variant: "destructive"
                    });
                  }
                }}
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}