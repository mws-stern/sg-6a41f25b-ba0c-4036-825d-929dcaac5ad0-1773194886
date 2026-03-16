import { SEO } from "@/components/SEO";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FileText, Download, Calendar, Printer, CalendarRange } from "lucide-react";
import { employeeService } from "@/services/employeeService";
import { getAllBatchTimeData } from "@/services/timeEntryService";
import { adjustmentService } from "@/services/adjustmentService";
import { timeEntryService } from "@/services/timeEntryService";
import type { Database } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import XLSX from "xlsx";
import JSZip from "jszip";
import { format } from "date-fns";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { formatTime12h } from "@/lib/utils";
import { formatDate, formatTime, formatDateTime, formatDateShort, formatDateRange } from "@/lib/dateUtils";

type Employee = Database["public"]["Tables"]["employees"]["Row"];
type TimeEntry = Database["public"]["Tables"]["time_entries"]["Row"];

interface ReportData {
  employee: Employee;
  entries: TimeEntry[];
  totalHours: number;
  totalEarnings: number;
  regularHours?: number;
  manualHours?: number;
  pickupTrips?: number;
}

interface DailyStats {
  date: string;
  employeeCount: number;
  uniqueEmployees: Set<string>;
  totalHours: number;
  totalWages: number;
}

export default function ReportsPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all");
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split("T")[0],
    end: new Date().toISOString().split("T")[0]
  });
  const [sortBy, setSortBy] = useState<"name" | "hours" | "earnings">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [reportType, setReportType] = useState<"daily" | "weekly">("weekly");
  const [reportData, setReportData] = useState<ReportData[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState<{
    dailyTrend: Array<{ date: string; hours: number; earnings: number }>;
  }>({
    dailyTrend: []
  });
  const { toast } = useToast();

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      const data = await employeeService.getAll();
      setEmployees(data);
    } catch (error) {
      console.error("Error loading employees:", error);
      toast({
        title: "Error",
        description: "Failed to load employees",
        variant: "destructive"
      });
    }
  };

  const loadReportData = async () => {
    if (!dateRange.start || !dateRange.end) return;
    
    setLoading(true);
    try {
      const [employeesData, batchData] = await Promise.all([
        employeeService.getAll(),
        getAllBatchTimeData()
      ]);
      
      setEmployees(employeesData);
      
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59, 999);
      
      // Filter batch data by date range
      const filteredEntries = (batchData.entries as any[]).filter(entry => {
        const entryDate = new Date(entry.clock_in);
        return entryDate >= startDate && entryDate <= endDate;
      });
      
      const filteredAdjustments = (batchData.adjustments as any[]).filter(adj => {
        const adjDate = new Date(adj.date);
        return adjDate >= startDate && adjDate <= endDate;
      });
      
      // Calculate Daily Stats
      const dailyMap = new Map<string, DailyStats>();
      
      // Helper to ensure day exists
      const getDayStats = (dateStr: string) => {
        if (!dailyMap.has(dateStr)) {
          dailyMap.set(dateStr, {
            date: dateStr,
            employeeCount: 0,
            uniqueEmployees: new Set(),
            totalHours: 0,
            totalWages: 0
          });
        }
        return dailyMap.get(dateStr)!;
      };

      // Process entries for daily stats
      filteredEntries.forEach((entry: any) => {
        if (!entry.clock_out) return;
        const dateStr = entry.clock_in.split('T')[0];
        const day = getDayStats(dateStr);
        
        day.uniqueEmployees.add(entry.employee_id);
        const hours = (new Date(entry.clock_out).getTime() - new Date(entry.clock_in).getTime()) / (1000 * 60 * 60);
        day.totalHours += hours;
        
        const emp = employeesData.find(e => e.id === entry.employee_id);
        if (emp) {
          day.totalWages += hours * emp.hourly_rate;
        }
      });

      // Process adjustments for daily stats
      filteredAdjustments.forEach((adj: any) => {
        const dateStr = adj.date.split('T')[0];
        const day = getDayStats(dateStr);
        
        day.uniqueEmployees.add(adj.employee_id);
        
        if (adj.type === "manual_hours") {
          day.totalHours += adj.hours || 0;
          const emp = employeesData.find(e => e.id === adj.employee_id);
          if (emp) {
            day.totalWages += (adj.hours || 0) * emp.hourly_rate;
          }
        } else if (adj.type === "pickup_trip") {
           day.totalWages += adj.amount || 10;
        } else if (adj.type === "bonus") {
           day.totalWages += adj.amount || 0;
        } else if (adj.type === "deduction") {
           day.totalWages -= adj.amount || 0;
        }
      });

      // Finalize daily stats - ensure ALL dates in range are included
      const allDates: string[] = [];
      const currDate = new Date(startDate);
      while (currDate <= endDate) {
        allDates.push(currDate.toISOString().split('T')[0]);
        currDate.setDate(currDate.getDate() + 1);
      }

      const completeDailyStats = allDates.map(dateStr => {
        const day = dailyMap.get(dateStr) || {
          date: dateStr,
          employeeCount: 0,
          uniqueEmployees: new Set(),
          totalHours: 0,
          totalWages: 0
        };
        return {
          ...day,
          employeeCount: day.uniqueEmployees.size
        };
      }).sort((a, b) => a.date.localeCompare(b.date));

      setDailyStats(completeDailyStats);

      // Group and calculate totals for ReportData
      const employeeData = new Map<string, ReportData>();
      
      filteredEntries.forEach((entry: any) => {
        if (!entry.clock_out) return;
        
        const empId = entry.employee_id;
        if (!employeeData.has(empId)) {
          const emp = employeesData.find(e => e.id === empId);
          if (!emp) return;
          employeeData.set(empId, {
            employee: emp,
            entries: [],
            totalHours: 0,
            manualHours: 0,
            pickupTrips: 0,
            totalEarnings: 0,
            regularHours: 0
          });
        }
        
        const hours = (new Date(entry.clock_out).getTime() - new Date(entry.clock_in).getTime()) / (1000 * 60 * 60);
        const data = employeeData.get(empId)!;
        data.entries.push(entry);
        data.regularHours = (data.regularHours || 0) + hours;
        data.totalHours += hours;
        data.totalEarnings += hours * data.employee.hourly_rate;
      });
      
      filteredAdjustments.forEach((adj: any) => {
        const empId = adj.employee_id;
        if (!employeeData.has(empId)) {
          const emp = employeesData.find(e => e.id === empId);
          if (!emp) return;
          employeeData.set(empId, {
            employee: emp,
            entries: [],
            totalHours: 0,
            manualHours: 0,
            pickupTrips: 0,
            totalEarnings: 0,
            regularHours: 0
          });
        }
        
        const data = employeeData.get(empId)!;
        if (adj.type === "manual_hours") {
          data.manualHours = (data.manualHours || 0) + (adj.hours || 0);
          data.totalHours += adj.hours || 0;
          data.totalEarnings += (adj.hours || 0) * data.employee.hourly_rate;
        } else if (adj.type === "pickup_trip") {
          data.pickupTrips = (data.pickupTrips || 0) + 1;
          data.totalEarnings += adj.amount || 10;
        }
      });
      
      let finalReportData = Array.from(employeeData.values());
      
      // Filter by selected employee
      if (selectedEmployee !== "all") {
        finalReportData = finalReportData.filter(d => d.employee.id === selectedEmployee);
      }
      
      // Sort data
      finalReportData.sort((a, b) => {
        let comparison = 0;
        if (sortBy === "name") {
          comparison = a.employee.name.localeCompare(b.employee.name);
        } else if (sortBy === "hours") {
          comparison = a.totalHours - b.totalHours;
        } else if (sortBy === "earnings") {
          comparison = a.totalEarnings - b.totalEarnings;
        }
        return sortOrder === "asc" ? comparison : -comparison;
      });

      setReportData(finalReportData);

      // Generate Chart Data (Aggregate if multiple, or single if one)
      if (finalReportData.length > 0) {
        // Collect all entries from visible reports
        const allEntries = finalReportData.flatMap(r => r.entries);
        
        const dailyData = allEntries.reduce((acc, entry) => {
          const date = new Date(entry.clock_in).toLocaleDateString("en-US", { month: "short", day: "numeric" });
          const existing = acc.find(d => d.date === date);
          
          if (existing) {
            existing.hours += entry.hours_worked || 0;
            existing.earnings += entry.earnings || 0;
          } else {
            acc.push({
              date,
              hours: entry.hours_worked || 0,
              earnings: entry.earnings || 0
            });
          }
          
          return acc;
        }, [] as Array<{ date: string; hours: number; earnings: number }>);
        
        // Sort by date
        dailyData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setChartData({ dailyTrend: dailyData });
      } else {
        setChartData({ dailyTrend: [] });
      }

    } catch (error) {
      console.error("Error loading report:", error);
      toast({
        title: "Error",
        description: "Failed to load report data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    if (!selectedEmployee) return;

    setLoading(true);
    try {
      const employee = employees.find(e => e.id === selectedEmployee);
      if (!employee) return;

      const today = new Date();
      let startDate: Date;
      const endDate = today;

      if (reportType === "daily") {
        startDate = new Date(today);
        startDate.setHours(0, 0, 0, 0);
      } else {
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 7);
      }

      const entries = await timeEntryService.getEntriesForPeriod(
        selectedEmployee,
        startDate.toISOString(),
        endDate.toISOString()
      );

      const totalHours = entries.reduce((sum, entry) => sum + (entry.hours_worked || 0), 0);
      const totalEarnings = entries.reduce((sum, entry) => sum + (entry.earnings || 0), 0);

      setReportData([
        {
          employee,
          entries,
          totalHours,
          totalEarnings
        }
      ]);

      // Calculate chart data - group by date
      const dailyData = entries.reduce((acc, entry) => {
        const date = new Date(entry.clock_in).toLocaleDateString("en-US", { month: "short", day: "numeric" });
        const existing = acc.find(d => d.date === date);
        
        if (existing) {
          existing.hours += entry.hours_worked || 0;
          existing.earnings += entry.earnings || 0;
        } else {
          acc.push({
            date,
            hours: entry.hours_worked || 0,
            earnings: entry.earnings || 0
          });
        }
        
        return acc;
      }, [] as Array<{ date: string; hours: number; earnings: number }>);

      setChartData({ dailyTrend: dailyData });
    } catch (error) {
      console.error("Error generating report:", error);
      toast({
        title: "Error",
        description: "Failed to generate report",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!reportData || reportData.length === 0) return;
    const data = reportData[0];

    const csvRows = [
      ["Employee", "Date", "Clock In", "Clock Out", "Hours", "Earnings"],
      ...data.entries.map(entry => [
        data.employee.name,
        new Date(entry.clock_in).toLocaleDateString(),
        formatTime12h(entry.clock_in),
        entry.clock_out ? formatTime12h(entry.clock_out) : "Active",
        entry.hours_worked?.toFixed(2) || "0",
        entry.earnings?.toFixed(2) || "0"
      ]),
      [],
      ["Total Hours", "", "", "", data.totalHours.toFixed(2), ""],
      ["Total Earnings", "", "", "", "", `$${data.totalEarnings.toFixed(2)}`]
    ];

    const csvContent = csvRows.map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${data.employee.name}_${reportType}_report_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: "Report exported successfully"
    });
  };

  const exportToPDF = () => {
    if (!reportData || reportData.length === 0) return;
    const data = reportData[0];

    const doc = new jsPDF();
    const tableData = data.entries.map(entry => [
      new Date(entry.clock_in).toLocaleDateString(),
      formatTime12h(entry.clock_in),
      entry.clock_out ? formatTime12h(entry.clock_out) : "Active",
      entry.hours_worked?.toFixed(2) || "0",
      `$${entry.earnings?.toFixed(2) || "0.00"}`
    ]);

    autoTable(doc, {
      head: [["Date", "Clock In", "Clock Out", "Hours", "Earnings"]],
      body: tableData,
      theme: "grid",
      styles: { halign: "center" },
      headStyles: { fillColor: [221, 221, 221] },
      margin: { top: 20 }
    });

    doc.text(`${data.employee.name} - ${reportType === "daily" ? "Daily" : "Weekly"} Report`, 14, 10);
    doc.text(`Total Hours: ${data.totalHours.toFixed(2)}`, 14, doc.internal.pageSize.height - 10);
    doc.text(`Total Earnings: $${data.totalEarnings.toFixed(2)}`, 14, doc.internal.pageSize.height - 20);
    doc.text(`Hourly Rate: $${data.employee.hourly_rate.toFixed(2)}`, 14, doc.internal.pageSize.height - 30);

    doc.save(`${data.employee.name}_${reportType}_report_${new Date().toISOString().split("T")[0]}.pdf`);

    toast({
      title: "Success",
      description: "Report exported successfully"
    });
  };

  // Generate Summary Report PDF
  const generateSummaryReportPDF = async () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;

    // Add Logo
    try {
      const imgData = await fetch("/SmartSelect_20260224_194609_Adobe_Acrobat.jpg")
        .then((res) => res.blob())
        .then((blob) => {
          return new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
        });
      doc.addImage(imgData, "JPEG", pageWidth / 2 - 15, 10, 30, 30);
    } catch (error) {
      console.error('Error loading logo:', error);
    }

    // Header
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("PAYROLL SUMMARY REPORT", pageWidth / 2, 20, { align: "center" });
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("Bakery Employees Management", pageWidth / 2, 28, { align: "center" });
    
    doc.setFontSize(10);
    doc.text(`Period: ${formatDate(dateRange.start)} - ${formatDate(dateRange.end)}`, pageWidth / 2, 35, { align: "center" });
    doc.text(`Generated: ${formatDate(new Date())}`, pageWidth / 2, 42, { align: "center" });

    let yPos = 55;

    // Calculate stats from reportData
    const stats = reportData.map(d => ({
      name: d.employee.name,
      totalHours: d.totalHours,
      totalEarned: d.totalEarnings
    }));

    // Summary Statistics
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Summary", margin, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Total Employees: ${stats.length}`, margin, yPos);
    yPos += 7;
    doc.text(`Total Hours Worked: ${stats.reduce((sum, e) => sum + e.totalHours, 0).toFixed(2)} hrs`, margin, yPos);
    yPos += 7;
    doc.text(`Total Wages Earned: $${stats.reduce((sum, e) => sum + e.totalEarned, 0).toFixed(2)}`, margin, yPos);
    yPos += 15;

    // Employee Breakdown
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Employee Breakdown", margin, yPos);
    yPos += 10;

    // Table headers
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    const colWidths = [80, 40, 50];
    const headers = ["Employee", "Hours", "Earned"];
    let xPos = margin;
    
    headers.forEach((header, i) => {
      doc.text(header, xPos, yPos);
      xPos += colWidths[i];
    });
    yPos += 7;

    // Table rows
    doc.setFont("helvetica", "normal");
    stats.forEach(emp => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }

      xPos = margin;
      doc.text(emp.name, xPos, yPos);
      xPos += colWidths[0];
      doc.text(emp.totalHours.toFixed(2), xPos, yPos);
      xPos += colWidths[1];
      doc.text(`$${emp.totalEarned.toFixed(2)}`, xPos, yPos);
      yPos += 7;
    });

    // Daily Breakdown
    if (dailyStats.length > 0) {
      yPos += 10;
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Daily Breakdown", margin, yPos);
      yPos += 10;

      // Table headers
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      const dailyColWidths = [50, 40, 40, 40];
      const dailyHeaders = ["Date", "Employees", "Hours", "Wages"];
      xPos = margin;
      
      dailyHeaders.forEach((header, i) => {
        doc.text(header, xPos, yPos);
        xPos += dailyColWidths[i];
      });
      yPos += 7;

      // Table rows
      doc.setFont("helvetica", "normal");
      dailyStats.forEach(day => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }

        xPos = margin;
        doc.text(format(new Date(day.date), "MMM dd, yyyy"), xPos, yPos);
        xPos += dailyColWidths[0];
        doc.text(day.employeeCount.toString(), xPos, yPos);
        xPos += dailyColWidths[1];
        doc.text(day.totalHours.toFixed(2), xPos, yPos);
        xPos += dailyColWidths[2];
        doc.text(`$${day.totalWages.toFixed(2)}`, xPos, yPos);
        yPos += 7;
      });
    }

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text(
        `Page ${i} of ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: "center" }
      );
    }

    doc.save(`payroll-summary-${format(new Date(dateRange.start), "yyyy-MM-dd")}-to-${format(new Date(dateRange.end), "yyyy-MM-dd")}.pdf`);
  };

  return (
    <>
      <SEO 
        title="Reports - Bakery Management"
        description="View employee hours and payroll reports"
      />

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .print-page-break { page-break-after: always; }
          @page { margin: 1cm; }
        }
      `}</style>
      
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 p-4 md:p-8 print:bg-white">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-purple-900 mb-2">Reports</h1>
            <p className="text-purple-700">Generate and export employee time tracking reports</p>
          </div>

          <div className="max-w-4xl mx-auto space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-6 w-6" />
                  Generate Report
                </CardTitle>
                <CardDescription>Select employee and report type</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Employee</Label>
                    <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select employee" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map((emp) => (
                          <SelectItem key={emp.id} value={emp.id}>
                            {emp.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Report Type</Label>
                    <Select value={reportType} onValueChange={(v) => setReportType(v as "daily" | "weekly")}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily (Today)</SelectItem>
                        <SelectItem value="weekly">Weekly (Last 7 Days)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button 
                  onClick={loadReportData}
                  disabled={loading}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Generate Report
                </Button>
              </CardContent>
            </Card>

            {/* Controls */}
            <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="space-y-2">
                    <Label>Employee</Label>
                    <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                      <SelectTrigger className="bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Employees</SelectItem>
                        {employees.map(emp => (
                          <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                      className="bg-white"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                      className="bg-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Sort By</Label>
                    <div className="flex gap-2">
                      <Select value={sortBy} onValueChange={(value: "name" | "hours" | "earnings") => setSortBy(value)}>
                        <SelectTrigger className="bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="name">Name</SelectItem>
                          <SelectItem value="hours">Hours</SelectItem>
                          <SelectItem value="earnings">Earnings</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                        className="bg-white"
                      >
                        {sortOrder === "asc" ? "↑" : "↓"}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <Button onClick={loadReportData} className="bg-amber-600 hover:bg-amber-700 flex-1">
                    <FileText className="w-4 h-4 mr-2" />
                    Generate Report
                  </Button>
                  <Button 
                    onClick={() => window.print()} 
                    variant="outline"
                    className="print:hidden"
                  >
                    <Printer className="w-4 h-4 mr-2" />
                    Print
                  </Button>
                </div>
              </CardContent>
            </Card>

            {reportData.length > 0 && (
              <div className="space-y-6">
                {selectedEmployee === "all" ? (
                  // Summary View for All Employees
                  <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Daily Breakdown</CardTitle>
                          <CardDescription>
                            Daily totals for {new Date(dateRange.start).toLocaleDateString()} - {new Date(dateRange.end).toLocaleDateString()}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Employees Working</TableHead>
                            <TableHead>Total Hours</TableHead>
                            <TableHead>Total Wages</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {dailyStats.map((day) => (
                            <TableRow key={day.date}>
                              <TableCell className="font-medium">{formatDate(day.date)}</TableCell>
                              <TableCell>{day.employeeCount}</TableCell>
                              <TableCell>{day.totalHours.toFixed(2)}</TableCell>
                              <TableCell className="font-bold text-green-700">${day.totalWages.toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                          <TableRow className="bg-muted/50 font-bold">
                            <TableCell>TOTALS</TableCell>
                            <TableCell>-</TableCell>
                            <TableCell>{dailyStats.reduce((sum, d) => sum + d.totalHours, 0).toFixed(2)}</TableCell>
                            <TableCell>${dailyStats.reduce((sum, d) => sum + d.totalWages, 0).toFixed(2)}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>All Employees Summary</CardTitle>
                          <CardDescription>
                            {new Date(dateRange.start).toLocaleDateString()} - {new Date(dateRange.end).toLocaleDateString()}
                          </CardDescription>
                        </div>
                        <div className="flex gap-2 print:hidden">
                           <Button onClick={() => window.print()} variant="outline">
                            <Printer className="mr-2 h-4 w-4" />
                            Print Summary
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Employee</TableHead>
                            <TableHead>Total Hours</TableHead>
                            <TableHead>Manual Hrs</TableHead>
                            <TableHead>Pickup Trips</TableHead>
                            <TableHead>Total Earnings</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {reportData.map((data) => (
                            <TableRow key={data.employee.id}>
                              <TableCell className="font-medium">{data.employee.name}</TableCell>
                              <TableCell>{data.totalHours.toFixed(2)}</TableCell>
                              <TableCell>{data.manualHours?.toFixed(2) || "-"}</TableCell>
                              <TableCell>{data.pickupTrips || "-"}</TableCell>
                              <TableCell className="font-bold text-green-700">${data.totalEarnings.toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                          <TableRow className="bg-muted/50 font-bold">
                            <TableCell>TOTALS</TableCell>
                            <TableCell>{reportData.reduce((sum, d) => sum + d.totalHours, 0).toFixed(2)}</TableCell>
                            <TableCell>{reportData.reduce((sum, d) => sum + (d.manualHours || 0), 0).toFixed(2)}</TableCell>
                            <TableCell>{reportData.reduce((sum, d) => sum + (d.pickupTrips || 0), 0)}</TableCell>
                            <TableCell>${reportData.reduce((sum, d) => sum + d.totalEarnings, 0).toFixed(2)}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
                ) : (
                  // Detailed View for Single Employee
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>{reportData[0].employee.name} - Report</CardTitle>
                          <CardDescription>
                             {new Date(dateRange.start).toLocaleDateString()} - {new Date(dateRange.end).toLocaleDateString()}
                          </CardDescription>
                        </div>
                        <div className="flex gap-2 print:hidden">
                          <Button onClick={exportToCSV} disabled={loading || reportData[0].entries.length === 0}>
                            <Download className="mr-2 h-4 w-4" />
                            Export CSV
                          </Button>
                          <Button onClick={exportToPDF} disabled={loading || reportData[0].entries.length === 0} variant="outline">
                            <Download className="mr-2 h-4 w-4" />
                            Export PDF
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-6 grid md:grid-cols-3 gap-4">
                        <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                          <p className="text-sm text-purple-600 font-medium">Total Hours</p>
                          <p className="text-3xl font-bold text-purple-900">{reportData[0].totalHours.toFixed(2)}</p>
                          <p className="text-xs text-purple-600 mt-1">
                            Regular: {reportData[0].regularHours?.toFixed(2) || "0.00"} | Manual: {reportData[0].manualHours?.toFixed(2) || "0.00"}
                          </p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                          <p className="text-sm text-green-600 font-medium">Total Earnings</p>
                          <p className="text-3xl font-bold text-green-900">${reportData[0].totalEarnings.toFixed(2)}</p>
                        </div>
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                          <p className="text-sm text-blue-600 font-medium">Hourly Rate</p>
                          <p className="text-3xl font-bold text-blue-900">${reportData[0].employee.hourly_rate.toFixed(2)}</p>
                        </div>
                      </div>

                      {reportData[0].entries.length > 0 && (
                        <div className="grid md:grid-cols-2 gap-6 mb-6 print:hidden">
                          {/* Daily Hours Trend */}
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-lg">Daily Hours Trend</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <ResponsiveContainer width="100%" height={250}>
                                <LineChart data={chartData.dailyTrend}>
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis dataKey="date" />
                                  <YAxis />
                                  <Tooltip />
                                  <Legend />
                                  <Line type="monotone" dataKey="hours" stroke="#8b5cf6" strokeWidth={2} name="Hours" />
                                </LineChart>
                              </ResponsiveContainer>
                            </CardContent>
                          </Card>

                          {/* Daily Earnings Trend */}
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-lg">Daily Earnings Trend</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={chartData.dailyTrend}>
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis dataKey="date" />
                                  <YAxis />
                                  <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
                                  <Legend />
                                  <Bar dataKey="earnings" fill="#10b981" name="Earnings" />
                                </BarChart>
                              </ResponsiveContainer>
                            </CardContent>
                          </Card>
                        </div>
                      )}

                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Clock In</TableHead>
                            <TableHead>Clock Out</TableHead>
                            <TableHead>Hours</TableHead>
                            <TableHead>Earnings</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {reportData[0].entries.map((entry) => (
                            <TableRow key={entry.id}>
                              <TableCell>{formatDateShort(entry.clock_in)}</TableCell>
                              <TableCell>{formatTime(entry.clock_in)}</TableCell>
                              <TableCell>
                                {entry.clock_out ? formatTime(entry.clock_out) : "Still clocked in"}
                              </TableCell>
                              <TableCell>{entry.hours_worked?.toFixed(2) || "0.00"}</TableCell>
                              <TableCell>${entry.earnings?.toFixed(2) || "0.00"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}