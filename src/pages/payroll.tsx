import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SEO } from "@/components/SEO";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Download, DollarSign, Clock, TrendingUp, Receipt, Users, Plus, Save, CalendarRange, FileText, AlertCircle, CheckCircle2, Trash2 } from "lucide-react";
import { employeeService } from "@/services/employeeService";
import { payrollService } from "@/services/payrollService";
import type { Employee, PayrollSummary, PayrollTransaction, EmployeePayrollBalance } from "@/types";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatDate, formatDateShort, formatDateRange, formatDateTime, formatTime, toLocalDateString } from "@/lib/dateUtils";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import JSZip from "jszip";

export default function PayrollPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [balances, setBalances] = useState<EmployeePayrollBalance[]>([]);
  const [currentSummaries, setCurrentSummaries] = useState<PayrollSummary[]>([]);
  const [transactions, setTransactions] = useState<PayrollTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Date range for current payroll calculation
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Payment editing states
  const [paymentAmounts, setPaymentAmounts] = useState<Record<string, string>>({});
  const [paymentNotes, setPaymentNotes] = useState<Record<string, string>>({});

  // Transaction history filters
  const [historyStartDate, setHistoryStartDate] = useState<string>("");
  const [historyEndDate, setHistoryEndDate] = useState<string>("");
  const [historyEmployee, setHistoryEmployee] = useState<string>("all");

  // Edit transaction state
  const [editingTransaction, setEditingTransaction] = useState<PayrollTransaction | null>(null);
  const [editPaidAmount, setEditPaidAmount] = useState<string>("");
  const [editNotes, setEditNotes] = useState<string>("");
  const [editDate, setEditDate] = useState<string>("");

  // Enhancement A: expanded breakdown rows
  const [expandedEmployees, setExpandedEmployees] = useState<Set<string>>(new Set());

  // Enhancement B: already-paid warnings per employee
  const [alreadyPaidWarnings, setAlreadyPaidWarnings] = useState<Record<string, string>>({});

  // Enhancement D: confirm before pay dialog
  const [confirmingPayment, setConfirmingPayment] = useState<PayrollSummary | null>(null);
  const [confirmingAll, setConfirmingAll] = useState(false);

  const toggleExpanded = (employeeId: string) => {
    setExpandedEmployees(prev => {
      const next = new Set(prev);
      if (next.has(employeeId)) next.delete(employeeId);
      else next.add(employeeId);
      return next;
    });
  };

  const { toast } = useToast();

  const generatePayslipPDF = async (transaction: PayrollTransaction, returnBlob: boolean = false) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;

    // Add logo at full width
    const imgData = await fetch("/bakery-logo.png")
      .then((res) => res.blob())
      .then((blob) => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      });
    
    // Calculate dimensions to maintain aspect ratio
    const img = new Image();
    img.src = imgData;
    await new Promise((resolve) => {
      img.onload = resolve;
    });
    
    const aspectRatio = img.width / img.height;
    const logoWidth = pageWidth - 20; // 10mm margin on each side
    const logoHeight = logoWidth / aspectRatio;
    
    doc.addImage(imgData, "PNG", 10, 10, logoWidth, logoHeight);

    // Header - positioned below logo
    const headerYPos = 10 + logoHeight + 10;
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("PAYROLL SLIP", pageWidth / 2, headerYPos, { align: "center" });
    yPos = headerYPos + 10;
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("Bakery Employees Management", pageWidth / 2, yPos, { align: "center" });
    yPos += 15;

    // Employee & Period Info
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Employee Details:", 20, yPos);
    
    const startY = yPos;
    yPos += 7;
    doc.setFont("helvetica", "normal");
    
    // Look up employee name
    const employee = employees.find(e => e.id === transaction.employee_id);
    const employeeName = employee?.name || "Unknown";
    
    doc.text(`Name: ${employeeName}`, 20, yPos);
    yPos += 6;
    doc.text(`Employee ID: ${transaction.employee_id.substring(0, 8)}`, 20, yPos);
    yPos += 6;

    doc.setFont("helvetica", "bold");
    doc.text("Payment Details:", 120, startY);
    
    // Reset yPos for right column match
    let rightYPos = startY + 7;
    doc.setFont("helvetica", "normal");
    doc.text(`Pay Date: ${formatDateShort(transaction.transaction_date)}`, 120, rightYPos);
    rightYPos += 6;
    doc.text(`Period: ${formatDateRange(transaction.date_range_start, transaction.date_range_end)}`, 120, rightYPos);

    yPos = Math.max(yPos, rightYPos) + 10;

    // Get detailed breakdown from current summaries if available
    const summary = currentSummaries.find(s => s.employee.id === transaction.employee_id);
    
    if (summary && (summary.timeEntries.length > 0 || summary.adjustments.length > 0)) {
      // Time Entries Section
      if (summary.timeEntries.length > 0) {
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text("Time Entries:", 20, yPos);
        yPos += 7;

        const timeEntriesData = summary.timeEntries.map(entry => [
          formatDateShort(entry.clock_in),
          formatTime(entry.clock_in),
          entry.clock_out ? formatTime(entry.clock_out) : "Active",
          entry.hours_worked?.toFixed(2) || "0.00",
          `$${entry.earnings?.toFixed(2) || "0.00"}`
        ]);

        autoTable(doc, {
          startY: yPos,
          head: [["Date", "Clock In", "Clock Out", "Hours", "Earnings"]],
          body: timeEntriesData,
          theme: "grid",
          headStyles: { fillColor: [139, 69, 19], textColor: 255, fontSize: 9 },
          styles: { fontSize: 8 },
          columnStyles: {
            0: { cellWidth: 35 },
            1: { cellWidth: 30, halign: "center" },
            2: { cellWidth: 30, halign: "center" },
            3: { cellWidth: 25, halign: "right" },
            4: { cellWidth: 30, halign: "right" }
          }
        });

        yPos = (doc as any).lastAutoTable.finalY + 10;
      }

      // Adjustments Section
      if (summary.adjustments.length > 0) {
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text("Adjustments & Side Earnings:", 20, yPos);
        yPos += 7;

        const adjustmentsData = summary.adjustments.map(adj => {
          let description = "";
          let amount = "";
          
          if (adj.adjustment_type === "manual_hours") {
            description = `Manual Hours: ${adj.reason || "No reason"}`;
            amount = `${adj.hours?.toFixed(2) || "0.00"} hrs = $${adj.amount?.toFixed(2) || "0.00"}`;
          } else if (adj.adjustment_type === "pickup_trip") {
            description = `Pickup Trip: ${adj.reason || "Delivery"}`;
            amount = `$${adj.amount?.toFixed(2) || "10.00"}`;
          } else if (adj.adjustment_type === "bonus") {
            description = `Bonus: ${adj.reason || "Performance"}`;
            amount = `+$${adj.amount?.toFixed(2) || "0.00"}`;
          } else if (adj.adjustment_type === "deduction") {
            description = `Deduction: ${adj.reason || ""}`;
            amount = `-$${adj.amount?.toFixed(2) || "0.00"}`;
          }

          return [
            formatDateShort(adj.date),
            description,
            amount
          ];
        });

        autoTable(doc, {
          startY: yPos,
          head: [["Date", "Description", "Amount"]],
          body: adjustmentsData,
          theme: "grid",
          headStyles: { fillColor: [139, 69, 19], textColor: 255, fontSize: 9 },
          styles: { fontSize: 8 },
          columnStyles: {
            0: { cellWidth: 35 },
            1: { cellWidth: 90 },
            2: { cellWidth: 25, halign: "right" }
          }
        });

        yPos = (doc as any).lastAutoTable.finalY + 10;
      }
    } else {
      // Fallback: Simple financial summary
      autoTable(doc, {
        startY: yPos,
        head: [["Description", "Hours / Rate", "Amount"]],
        body: [
          ["Gross Earnings", `${transaction.hours_worked.toFixed(2)} hrs`, `$${transaction.amount_earned.toFixed(2)}`],
          ["Amount Paid", "-", `$${transaction.amount_paid.toFixed(2)}`],
        ],
        theme: "grid",
        headStyles: { fillColor: [139, 69, 19], textColor: 255 },
        columnStyles: {
          0: { cellWidth: 100 },
          1: { cellWidth: 40, halign: "right" },
          2: { cellWidth: 40, halign: "right" }
        }
      });

      yPos = (doc as any).lastAutoTable.finalY + 10;
    }

    // Balances Box
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(120, yPos, 70, 35, 3, 3, "FD");
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Balance Before:", 125, yPos + 10);
    doc.text(`$${transaction.balance_before.toFixed(2)}`, 185, yPos + 10, { align: "right" });
    
    doc.text("Balance After:", 125, yPos + 25);
    doc.setFont("helvetica", "bold");
    doc.text(`$${transaction.balance_after.toFixed(2)}`, 185, yPos + 25, { align: "right" });

    // Notes if any
    if (transaction.notes && transaction.notes.trim() !== "") {
      yPos += 45;
      doc.setFontSize(9);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(100, 100, 100);
      doc.text(`Notes: ${transaction.notes}`, 20, yPos);
    }

    // Footer
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(100, 100, 100);
    doc.text("Thank you for your hard work!", 105, 280, { align: "center" });

    if (returnBlob) {
      return doc.output("blob");
    }
    return doc;
  };

  const downloadSinglePayslip = async (transaction: PayrollTransaction) => {
    const employee = employees.find(e => e.id === transaction.employee_id);
    try {
      const doc = await generatePayslipPDF(transaction) as jsPDF;
      doc.save(`Payslip_${employee?.name.replace(/\s+/g, '_')}_${transaction.transaction_date.split('T')[0]}.pdf`);
      toast({
        title: "Payslip downloaded",
        description: "PDF has been saved to your downloads"
      });
    } catch (e) {
      console.error("Error downloading payslip:", e);
      toast({
        title: "Error",
        description: "Failed to generate payslip",
        variant: "destructive"
      });
    }
  };

  const downloadBulkPayslips = async () => {
    const filteredTransactions = transactions.filter(t => {
      if (historyEmployee !== "all" && t.employee_id !== historyEmployee) return false;
      if (historyStartDate && t.transaction_date < historyStartDate) return false;
      if (historyEndDate && t.transaction_date > historyEndDate + "T23:59:59") return false;
      return true;
    });

    if (filteredTransactions.length === 0) {
      toast({
        title: "No transactions",
        description: "No payslips available for the selected filters",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder("Payslips");
      
      for (const t of filteredTransactions) {
        const employee = employees.find(e => e.id === t.employee_id);
        const blob = await generatePayslipPDF(t, true) as Blob;
        const filename = `Payslip_${employee?.name.replace(/\s+/g, '_')}_${t.transaction_date.split('T')[0]}.pdf`;
        folder?.file(filename, blob);
      }
      
      const content = await zip.generateAsync({ type: "blob" });
      const url = window.URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Payslips_Batch_${new Date().toISOString().split('T')[0]}.zip`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Success",
        description: `Downloaded ${filteredTransactions.length} payslips`
      });
    } catch (error) {
      console.error("Error generating zip:", error);
      toast({
        title: "Error",
        description: "Failed to generate ZIP file",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Initialize with last 2 weeks by default
  useEffect(() => {
    const today = new Date();
    const twoWeeksAgo = new Date(today);
    twoWeeksAgo.setDate(today.getDate() - 14);

    // Use toLocalDateString (not toISOString) to avoid UTC-shift off-by-one-day bug
    setStartDate(toLocalDateString(twoWeeksAgo));
    setEndDate(toLocalDateString(today));
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load employees
      console.log("Loading employees...");
      const employeesData = await employeeService.getAll();
      setEmployees(employeesData);
      console.log("Employees loaded:", employeesData.length);

      // Load all balances
      console.log("Loading balances...");
      const balancesData = await payrollService.getAllBalances();
      setBalances(balancesData);
      console.log("Balances loaded:", balancesData.length);

      // Load transaction history
      console.log("Loading transaction history...");
      const transactionsData = await payrollService.getTransactionHistory();
      console.log("Transactions loaded:", transactionsData.length);
      setTransactions(transactionsData);

    } catch (error) {
      console.error("Error loading payroll data:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      toast({
        title: "Error",
        description: "Failed to load payroll data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const calculatePayroll = async () => {
    if (!startDate || !endDate) {
      toast({
        title: "Missing dates",
        description: "Please select start and end dates",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);

      const summaries = await payrollService.calculatePayrollForRange(startDate, endDate);
      setCurrentSummaries(summaries);

      // Enhancement B: detect already-paid overlaps per employee
      const warnings: Record<string, string> = {};
      summaries.forEach(summary => {
        const overlapping = transactions.filter(t =>
          t.employee_id === summary.employee.id &&
          t.transaction_type === 'payment' &&
          t.date_range_start <= endDate &&
          t.date_range_end >= startDate
        );
        if (overlapping.length > 0) {
          const dates = overlapping.map(t =>
            formatDateRange(t.date_range_start, t.date_range_end)
          ).join(", ");
          warnings[summary.employee.id] = `Already paid for: ${dates}`;
        }
      });
      setAlreadyPaidWarnings(warnings);

      // Initialize payment amounts with calculated amounts
      const initialAmounts: Record<string, string> = {};
      const initialNotes: Record<string, string> = {};
      summaries.forEach(summary => {
        initialAmounts[summary.employee.id] = summary.calculatedAmount.toFixed(2);
        initialNotes[summary.employee.id] = "";
      });
      setPaymentAmounts(initialAmounts);
      setPaymentNotes(initialNotes);

      toast({
        title: "Payroll calculated",
        description: `Calculated for ${summaries.length} employees`,
      });

    } catch (error) {
      console.error("Error calculating payroll:", error);
      toast({
        title: "Error",
        description: "Failed to calculate payroll",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const processPayment = async (employeeId: string) => {
    const summary = currentSummaries.find(s => s.employee.id === employeeId);
    if (!summary) return;
    // Enhancement D: show confirm dialog instead of processing immediately
    setConfirmingPayment(summary);
  };

  const confirmAndPay = async (summary: PayrollSummary) => {
    const paidAmount = parseFloat(paymentAmounts[summary.employee.id] || "0");
    if (isNaN(paidAmount) || paidAmount < 0) {
      toast({ title: "Invalid amount", description: "Please enter a valid payment amount", variant: "destructive" });
      return;
    }
    try {
      await payrollService.processPayment(
        summary.employee.id, startDate, endDate,
        summary.totalHours, summary.calculatedAmount, paidAmount,
        paymentNotes[summary.employee.id] || undefined
      );
      toast({ title: "Payment processed", description: `${summary.employee.name} paid $${paidAmount.toFixed(2)}` });
      setConfirmingPayment(null);
      await loadData();
      await calculatePayroll();
    } catch (error) {
      toast({ title: "Error", description: "Failed to process payment", variant: "destructive" });
    }
  };

  const processAllPayments = async () => {
    if (currentSummaries.length === 0) return;
    setConfirmingAll(true);
  };

  const confirmAndPayAll = async () => {
    try {
      setLoading(true);
      setConfirmingAll(false);
      for (const summary of currentSummaries) {
        const paidAmount = parseFloat(paymentAmounts[summary.employee.id] || "0");
        if (paidAmount > 0) {
          await payrollService.processPayment(
            summary.employee.id, startDate, endDate,
            summary.totalHours, summary.calculatedAmount, paidAmount,
            paymentNotes[summary.employee.id] || undefined
          );
        }
      }
      toast({ title: "All payments processed", description: `Processed ${currentSummaries.length} payments` });
      await loadData();
      await calculatePayroll();
    } catch (error) {
      toast({ title: "Error", description: "Failed to process all payments", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const generatePayrollReport = () => {
    if (currentSummaries.length === 0) {
      toast({
        title: "No data",
        description: "Calculate payroll first",
        variant: "destructive"
      });
      return;
    }

    const doc = new jsPDF();

    // Header
    doc.setFillColor(139, 69, 19);
    doc.rect(0, 0, 210, 40, "F");
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("SATMAR MONTREAL MATZOS", 105, 15, { align: "center" });
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text("PAYROLL REPORT", 105, 25, { align: "center" });
    doc.text(`${formatDateRange(startDate, endDate)}`, 105, 32, { align: "center" });

    // Summary
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("SUMMARY", 20, 50);

    const totalHours = currentSummaries.reduce((sum, s) => sum + s.totalHours, 0);
    const totalCalculated = currentSummaries.reduce((sum, s) => sum + s.calculatedAmount, 0);
    const totalPaying = currentSummaries.reduce((sum, s) => sum + parseFloat(paymentAmounts[s.employee.id] || "0"), 0);
    const totalBalanceChange = totalCalculated - totalPaying;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Employees: ${currentSummaries.length}`, 20, 58);
    doc.text(`Total Hours: ${totalHours.toFixed(2)}`, 20, 65);
    doc.text(`Total Calculated: $${totalCalculated.toFixed(2)}`, 20, 72);
    doc.text(`Total Paying: $${totalPaying.toFixed(2)}`, 20, 79);
    doc.text(`Balance Change: $${totalBalanceChange.toFixed(2)}`, 20, 86);

    // Employee details table
    const tableData = currentSummaries.map(summary => {
      const paidAmount = parseFloat(paymentAmounts[summary.employee.id] || "0");
      const balanceChange = summary.calculatedAmount - paidAmount;
      
      return [
        summary.employee.name,
        summary.totalHours.toFixed(2),
        `$${summary.calculatedAmount.toFixed(2)}`,
        `$${summary.currentBalance.toFixed(2)}`,
        `$${paidAmount.toFixed(2)}`,
        `$${(summary.currentBalance + balanceChange).toFixed(2)}`
      ];
    });

    autoTable(doc, {
      startY: 95,
      head: [["Employee", "Hours", "Calculated", "Old Balance", "Paying", "New Balance"]],
      body: tableData,
      theme: "grid",
      headStyles: { fillColor: [139, 69, 19], textColor: 255 },
      styles: { fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 25, halign: "right" },
        2: { cellWidth: 30, halign: "right" },
        3: { cellWidth: 30, halign: "right" },
        4: { cellWidth: 30, halign: "right" },
        5: { cellWidth: 30, halign: "right" }
      }
    });

    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on ${formatDateTime(new Date())}`, 105, 285, { align: "center" });

    doc.save(`payroll_report_${startDate}_to_${endDate}.pdf`);

    toast({
      title: "Report downloaded",
      description: "Payroll report saved successfully",
    });
  };

  const generateDailyBreakdownReport = () => {
    if (currentSummaries.length === 0) {
      toast({
        title: "No data",
        description: "Calculate payroll first",
        variant: "destructive"
      });
      return;
    }

    // Organize data by date
    const dailyData: Record<string, {
      employees: Set<string>;
      hours: number;
      wages: number;
    }> = {};

    // Process time entries
    currentSummaries.forEach(summary => {
      summary.timeEntries.forEach(entry => {
        const date = entry.clock_in.split("T")[0];
        if (!dailyData[date]) {
          dailyData[date] = { employees: new Set(), hours: 0, wages: 0 };
        }
        dailyData[date].employees.add(summary.employee.name);
        
        // Calculate hours for this entry
        const clockIn = new Date(entry.clock_in);
        const clockOut = entry.clock_out ? new Date(entry.clock_out) : new Date();
        const hours = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60);
        const wage = hours * summary.employee.hourly_rate;
        
        dailyData[date].hours += hours;
        dailyData[date].wages += wage;
      });

      // Process adjustments
      summary.adjustments.forEach(adj => {
        if (adj.adjustment_type === "manual_hours") {
          const date = adj.date.split("T")[0];
          if (!dailyData[date]) {
            dailyData[date] = { employees: new Set(), hours: 0, wages: 0 };
          }
          dailyData[date].employees.add(summary.employee.name);
          dailyData[date].hours += adj.hours || 0;
          dailyData[date].wages += adj.amount || 0;
        } else if (adj.adjustment_type === "bonus" || adj.adjustment_type === "deduction") {
          const date = adj.date.split("T")[0];
          if (!dailyData[date]) {
            dailyData[date] = { employees: new Set(), hours: 0, wages: 0 };
          }
          dailyData[date].employees.add(summary.employee.name);
          const amount = adj.amount || 0;
          dailyData[date].wages += adj.adjustment_type === "bonus" ? amount : -amount;
        }
      });
    });

    // Sort dates
    const sortedDates = Object.keys(dailyData).sort();

    const doc = new jsPDF();

    // Header
    doc.setFillColor(139, 69, 19);
    doc.rect(0, 0, 210, 40, "F");
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("SATMAR MONTREAL MATZOS", 105, 15, { align: "center" });
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text("DAILY BREAKDOWN REPORT", 105, 25, { align: "center" });
    doc.text(`${formatDateRange(startDate, endDate)}`, 105, 32, { align: "center" });

    let yPosition = 50;

    // Daily breakdown
    sortedDates.forEach((date, index) => {
      const day = dailyData[date];
      const employeeNames = Array.from(day.employees).sort();

      // Check if we need a new page
      if (yPosition > 240) {
        doc.addPage();
        yPosition = 20;
      }

      // Date header
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(formatDate(date), 20, yPosition);
      yPosition += 7;

      // Summary stats
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Employees: ${employeeNames.length}`, 30, yPosition);
      yPosition += 6;
      doc.text(`Hours: ${day.hours.toFixed(2)}`, 30, yPosition);
      yPosition += 6;
      doc.text(`Wages: $${day.wages.toFixed(2)}`, 30, yPosition);
      yPosition += 6;

      // Employee names
      doc.setFontSize(9);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(60, 60, 60);
      const namesText = employeeNames.join(", ");
      const splitNames = doc.splitTextToSize(namesText, 170);
      doc.text(splitNames, 30, yPosition);
      yPosition += splitNames.length * 5 + 5;

      // Separator line
      doc.setDrawColor(200, 200, 200);
      doc.line(20, yPosition, 190, yPosition);
      yPosition += 8;
    });

    // Summary at the end
    if (yPosition > 240) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("PERIOD SUMMARY", 20, yPosition);
    yPosition += 8;

    const totalDays = sortedDates.length;
    const totalHours = Object.values(dailyData).reduce((sum, d) => sum + d.hours, 0);
    const totalWages = Object.values(dailyData).reduce((sum, d) => sum + d.wages, 0);
    const uniqueEmployees = new Set<string>();
    Object.values(dailyData).forEach(d => d.employees.forEach(e => uniqueEmployees.add(e)));

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Total Days: ${totalDays}`, 30, yPosition);
    yPosition += 6;
    doc.text(`Unique Employees: ${uniqueEmployees.size}`, 30, yPosition);
    yPosition += 6;
    doc.text(`Total Hours: ${totalHours.toFixed(2)}`, 30, yPosition);
    yPosition += 6;
    doc.text(`Total Wages: $${totalWages.toFixed(2)}`, 30, yPosition);

    // Footer
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on ${formatDateTime(new Date())}`, 105, 285, { align: "center" });

    doc.save(`daily_breakdown_${startDate}_to_${endDate}.pdf`);

    toast({
      title: "Report downloaded",
      description: "Daily breakdown report saved successfully",
    });
  };

  const generateTransactionReport = () => {
    const filteredTransactions = transactions.filter(t => {
      if (historyEmployee !== "all" && t.employee_id !== historyEmployee) return false;
      if (historyStartDate && t.transaction_date < historyStartDate) return false;
      if (historyEndDate && t.transaction_date > historyEndDate + "T23:59:59") return false;
      return true;
    });

    if (filteredTransactions.length === 0) {
      toast({
        title: "No data",
        description: "No transactions match the filters",
        variant: "destructive"
      });
      return;
    }

    const doc = new jsPDF();

    // Header
    doc.setFillColor(139, 69, 19);
    doc.rect(0, 0, 210, 40, "F");
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("SATMAR MONTREAL MATZOS", 105, 15, { align: "center" });
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text("TRANSACTION HISTORY REPORT", 105, 25, { align: "center" });

    // Transaction table
    const tableData = filteredTransactions.map(t => {
      const employee = employees.find(e => e.id === t.employee_id);
      const balanceChange = t.balance_after - t.balance_before;
      return [
        formatDateShort(t.transaction_date),
        employee?.name || "Unknown",
        formatDateRange(t.date_range_start, t.date_range_end),
        t.hours_worked.toFixed(2),
        `$${t.amount_earned.toFixed(2)}`,
        `$${t.amount_paid.toFixed(2)}`,
        `$${balanceChange.toFixed(2)}`
      ];
    });

    autoTable(doc, {
      startY: 50,
      head: [["Date", "Employee", "Period", "Hours", "Earned", "Paid", "Balance "]],
      body: tableData,
      theme: "grid",
      headStyles: { fillColor: [139, 69, 19], textColor: 255 },
      styles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 40 },
        2: { cellWidth: 40 },
        3: { cellWidth: 20, halign: "right" },
        4: { cellWidth: 25, halign: "right" },
        5: { cellWidth: 25, halign: "right" },
        6: { cellWidth: 20, halign: "right" }
      }
    });

    const totalPaid = filteredTransactions.reduce((sum, t) => sum + t.amount_paid, 0);
    const totalCalculated = filteredTransactions.reduce((sum, t) => sum + t.amount_earned, 0);
    
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(`Total Earned: $${totalCalculated.toFixed(2)}`, 20, finalY);
    doc.text(`Total Paid: $${totalPaid.toFixed(2)}`, 20, finalY + 7);

    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on ${formatDateTime(new Date())}`, 105, 285, { align: "center" });

    doc.save(`transaction_history_${new Date().toISOString().split("T")[0]}.pdf`);

    toast({
      title: "Report downloaded",
      description: "Transaction history report saved successfully",
    });
  };

  const handleEditTransaction = (transaction: PayrollTransaction) => {
    setEditingTransaction(transaction);
    setEditPaidAmount(transaction.amount_paid.toFixed(2));
    setEditNotes(transaction.notes || "");
    setEditDate(transaction.transaction_date.split("T")[0]);
  };

  const handleSaveTransactionEdit = async () => {
    if (!editingTransaction) return;

    const paidAmount = parseFloat(editPaidAmount);
    if (isNaN(paidAmount) || paidAmount < 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid payment amount",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);

      await payrollService.updatePaymentTransaction(editingTransaction.id, {
        amount_paid: paidAmount,
        notes: editNotes,
        transaction_date: editDate + "T" + new Date().toISOString().split("T")[1]
      });

      toast({
        title: "Transaction updated",
        description: "Payment transaction updated successfully",
      });

      setEditingTransaction(null);
      await loadData();

    } catch (error) {
      console.error("Error updating transaction:", error);
      toast({
        title: "Error",
        description: "Failed to update transaction",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    const confirmed = confirm(
      "Delete this payment transaction?\n\nThis will:\n- Restore the previous balance\n- Mark time entries and adjustments as unpaid\n- Remove the transaction from history\n\nThis action cannot be undone."
    );

    if (!confirmed) return;

    try {
      setLoading(true);

      await payrollService.deletePaymentTransaction(transactionId);

      toast({
        title: "Transaction deleted",
        description: "Payment transaction deleted and reverted",
      });

      await loadData();
      if (startDate && endDate) {
        await calculatePayroll();
      }

    } catch (error) {
      console.error("Error deleting transaction:", error);
      toast({
        title: "Error",
        description: "Failed to delete transaction",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // NOTE: Auto-recalculate on date change removed  it fired on every keystroke
  // causing partial-input API calls. Use the Calculate Payroll button instead.

  // Calculate summary statistics
  const totalOutstanding = balances.reduce((sum, b) => sum + b.balance, 0);
  const totalTransactionsPaid = transactions.reduce((sum, t) => sum + t.amount_paid, 0);
  const totalTransactionsCalculated = transactions.reduce((sum, t) => sum + t.amount_earned, 0);

  return (
    <>
      <SEO
        title="Payroll Management | Bakery Employee Management"
        description="Process payroll with flexible date ranges and balance tracking"
      />
      
      <div className="p-4 lg:p-8 w-full max-w-full space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Payroll Management</h1>
            <p className="text-muted-foreground mt-1">
              Select any date range to process payroll with automatic balance tracking
            </p>
          </div>
          <Button 
            onClick={loadData}
            variant="outline"
          >
            <Calendar className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* Edit Transaction Dialog */}
        <Dialog open={!!editingTransaction} onOpenChange={(open) => !open && setEditingTransaction(null)}>
          <DialogContent className="max-w-md w-[95vw] max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden bg-background">
            <DialogHeader className="p-6 pb-4 shrink-0 border-b">
              <DialogTitle>Edit Transaction</DialogTitle>
              <DialogDescription>
                Update payment details for this transaction
              </DialogDescription>
            </DialogHeader>

            {editingTransaction && (
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg border">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium mb-1">Employee</p>
                    <p className="text-sm font-medium">
                      {employees.find(e => e.id === editingTransaction.employee_id)?.name || 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium mb-1">Period</p>
                    <p className="text-xs font-medium">
                      {formatDateRange(editingTransaction.date_range_start, editingTransaction.date_range_end)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium mb-1">Amount Earned</p>
                    <p className="text-sm font-medium text-emerald-600">
                      ${(editingTransaction.amount_earned || 0).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium mb-1">Hours Worked</p>
                    <p className="text-sm font-medium">
                      {(editingTransaction.hours_worked || 0).toFixed(2)} hrs
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="edit-amount">Amount Paid</Label>
                  <Input
                    id="edit-amount"
                    type="number"
                    step="0.01"
                    value={editPaidAmount}
                    onChange={(e) => setEditPaidAmount(e.target.value)}
                    className="text-lg font-medium"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="edit-date">Transaction Date</Label>
                  <Input
                    id="edit-date"
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="edit-notes">Notes</Label>
                  <Textarea
                    id="edit-notes"
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="Add a note about this payment..."
                    className="min-h-[80px] resize-none"
                  />
                </div>

                <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-lg text-sm space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Balance Before</span>
                    <span className="font-medium text-blue-600">
                      ${(editingTransaction.balance_before || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-blue-200">
                    <span className="text-muted-foreground font-medium">Balance After (Est.)</span>
                    <span className="font-bold text-lg text-emerald-600">
                      ${((editingTransaction.balance_before + editingTransaction.amount_earned) - (parseFloat(editPaidAmount) || 0)).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="p-4 border-t bg-muted/10 shrink-0 flex gap-2 sm:gap-0 justify-end">
              <Button variant="outline" onClick={() => setEditingTransaction(null)} className="mr-2">
                Cancel
              </Button>
              <Button onClick={handleSaveTransactionEdit} disabled={!editingTransaction} className="bg-green-600 hover:bg-green-700">
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {loading && !currentSummaries.length ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-lg">Loading payroll data...</div>
          </div>
        ) : (
          <>
            {/* Summary Statistics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Outstanding Balance</CardTitle>
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${totalOutstanding > 0 ? "text-red-600" : totalOutstanding < 0 ? "text-green-600" : ""}`}>
                    ${Math.abs(totalOutstanding).toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {totalOutstanding > 0 ? "Owed to employees" : totalOutstanding < 0 ? "Overpaid to employees" : "All balanced"}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Paid (All Time)</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    ${totalTransactionsPaid.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Across {transactions.length} transactions
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Calculated (All Time)</CardTitle>
                  <Receipt className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${totalTransactionsCalculated.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Total earnings tracked
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Employees</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {employees.filter(e => e.is_active !== false).length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Total: {employees.length}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="process" className="w-full">
              <TabsList className="grid w-full grid-cols-3 max-w-2xl mb-6">
                <TabsTrigger value="process">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Process Payroll
                </TabsTrigger>
                <TabsTrigger value="balances">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Balances
                </TabsTrigger>
                <TabsTrigger value="history">
                  <Receipt className="h-4 w-4 mr-2" />
                  History
                </TabsTrigger>
              </TabsList>

              <TabsContent value="process" className="space-y-4">
                {/* Date Range Selection */}
                <Card className="border-2 border-blue-200 bg-blue-50/30">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <CalendarRange className="h-5 w-5 text-blue-600" />
                      <CardTitle>Select Payroll Period</CardTitle>
                    </div>
                    <CardDescription>
                      Choose any date range to calculate payroll for those specific days
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <Label htmlFor="start-date">Start Date</Label>
                        <Input
                          id="start-date"
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="end-date">End Date</Label>
                        <Input
                          id="end-date"
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          min={startDate}
                        />
                      </div>
                    </div>

                    {/* Day count info strip + validation */}
                    {startDate && endDate && (
                      (() => {
                        const s = new Date(startDate + "T12:00:00");
                        const e = new Date(endDate   + "T12:00:00");
                        const days = Math.round((e.getTime() - s.getTime()) / 86400000) + 1;
                        const invalid = days < 1;
                        return (
                          <div className={`mt-3 p-3 rounded-lg border text-sm flex items-center gap-2 ${
                            invalid
                              ? "bg-red-50 border-red-300 text-red-700"
                              : "bg-blue-50 border-blue-200 text-blue-800"
                          }`}>
                            <CalendarRange className="w-4 h-4 shrink-0" />
                            {invalid ? (
                              <span className="font-semibold"> End date must be on or after start date</span>
                            ) : (
                              <>
                                <span className="font-semibold">{days} day{days !== 1 ? "s" : ""} selected</span>
                                <span className="text-blue-600">. {formatDateRange(startDate, endDate)}</span>
                              </>
                            )}
                          </div>
                        );
                      })()
                    )}

                    <div className="flex flex-wrap gap-2 mt-4">
                      <Button
                        onClick={calculatePayroll}
                        disabled={
                          !startDate || !endDate ||
                          new Date(endDate + "T12:00:00") < new Date(startDate + "T12:00:00")
                        }
                      >
                        <CalendarRange className="w-4 h-4 mr-2" />
                        Calculate Payroll
                      </Button>
                      <Button variant="outline" onClick={() => {
                        const today = new Date();
                        const twoWeeksAgo = new Date(today);
                        twoWeeksAgo.setDate(today.getDate() - 14);
                        setStartDate(toLocalDateString(twoWeeksAgo));
                        setEndDate(toLocalDateString(today));
                      }}>Last 2 Weeks</Button>
                      <Button variant="outline" onClick={() => {
                        const today = new Date();
                        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
                        setStartDate(toLocalDateString(firstDay));
                        setEndDate(toLocalDateString(today));
                      }}>This Month</Button>
                      <Button variant="outline" onClick={() => {
                        const today = new Date();
                        const lastMonday = new Date(today);
                        lastMonday.setDate(today.getDate() - today.getDay() - 6);
                        const lastSunday = new Date(lastMonday);
                        lastSunday.setDate(lastMonday.getDate() + 6);
                        setStartDate(toLocalDateString(lastMonday));
                        setEndDate(toLocalDateString(lastSunday));
                      }}>Last Week</Button>
                      <Button variant="outline" onClick={() => {
                        const today = new Date();
                        const firstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                        const lastDay = new Date(today.getFullYear(), today.getMonth(), 0);
                        setStartDate(toLocalDateString(firstDay));
                        setEndDate(toLocalDateString(lastDay));
                      }}>Last Month</Button>
                    </div>
                  </CardContent>
                </Card>

                {currentSummaries.length > 0 && (
                  <>
                    {/* Summary Card */}
                    <Card className="bg-muted/30">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="w-5 h-5" />
                          Payroll Summary
                          <span className="ml-auto text-sm font-normal text-muted-foreground">
                            {formatDateRange(startDate, endDate)}
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="grid gap-4 md:grid-cols-4">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Employees</p>
                          <p className="text-2xl font-bold">{currentSummaries.length}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Total Hours</p>
                          <p className="text-2xl font-bold">
                            {currentSummaries.reduce((sum, s) => sum + s.totalHours, 0).toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Total Calculated</p>
                          <p className="text-2xl font-bold">
                            ${currentSummaries.reduce((sum, s) => sum + s.calculatedAmount, 0).toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Total Paying</p>
                          <p className="text-2xl font-bold text-green-600">
                            ${currentSummaries.reduce((sum, s) => sum + parseFloat(paymentAmounts[s.employee.id] || "0"), 0).toFixed(2)}
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Payment Processing */}
                    <Card>
                      <CardHeader>
                        <div className="flex justify-between items-center">
                          <div>
                            <CardTitle>Process Payments</CardTitle>
                            <CardDescription>
                              Edit amounts as needed, then process individual or all payments
                            </CardDescription>
                          </div>
                          <div className="flex gap-2">
                            <Button onClick={generateDailyBreakdownReport} variant="outline">
                              <FileText className="w-4 h-4 mr-2" />
                              Daily Breakdown
                            </Button>
                            <Button onClick={generatePayrollReport} variant="outline">
                              <Download className="w-4 h-4 mr-2" />
                              Summary Report
                            </Button>
                            <Button 
                              onClick={processAllPayments}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Process All Payments
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto rounded-md border">
                          <Table className="min-w-[1000px]">
                            <TableHeader>
                              <TableRow>
                                <TableHead className="min-w-[160px]">Employee</TableHead>
                                <TableHead className="text-right">Hours</TableHead>
                                <TableHead className="text-right">Earned This Period</TableHead>
                                <TableHead className="text-right">Prev Balance</TableHead>
                                <TableHead className="text-right">Total Due</TableHead>
                                <TableHead className="min-w-[140px]">Amount Paying</TableHead>
                                <TableHead className="text-right">New Balance</TableHead>
                                <TableHead className="min-w-[180px]">Notes</TableHead>
                                <TableHead className="text-right min-w-[120px]">Action</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {currentSummaries.map((summary) => {
                                const paidAmount = parseFloat(paymentAmounts[summary.employee.id] || "0");
                                const newBalance = summary.currentBalance + summary.calculatedAmount - paidAmount;
                                const totalDue = summary.currentBalance + summary.calculatedAmount;
                                const isExpanded = expandedEmployees.has(summary.employee.id);
                                const warning = alreadyPaidWarnings[summary.employee.id];

                                // Breakdown calculations
                                const regularHours = summary.timeEntries.reduce((s, e) => s + (e.hours_worked || 0), 0);
                                const regularEarnings = summary.timeEntries.reduce((s, e) => s + (e.earnings || 0), 0);
                                const manualHoursAdj = summary.adjustments.filter(a => a.adjustment_type === "manual_hours");
                                const tripAdj = summary.adjustments.filter(a => a.adjustment_type === "pickup_trip");
                                const bonusAdj = summary.adjustments.filter(a => a.adjustment_type === "bonus");
                                const deductAdj = summary.adjustments.filter(a => a.adjustment_type === "deduction");
                                const manualHoursTotal = manualHoursAdj.reduce((s, a) => s + (a.amount || 0), 0);
                                const tripsTotal = tripAdj.reduce((s, a) => s + (a.amount || 0), 0);
                                const bonusTotal = bonusAdj.reduce((s, a) => s + (a.amount || 0), 0);
                                const deductTotal = deductAdj.reduce((s, a) => s + (a.amount || 0), 0);

                                return (
                                  <React.Fragment key={summary.employee.id}>
                                    <TableRow className={warning ? "bg-amber-50/50" : ""}>
                                      <TableCell>
                                        <div className="flex flex-col gap-1">
                                          <div className="flex items-center gap-2">
                                            <button
                                              onClick={() => toggleExpanded(summary.employee.id)}
                                              className="text-left font-medium hover:text-blue-600 flex items-center gap-1"
                                            >
                                              <span>{isExpanded ? "" : ""}</span>
                                              {summary.employee.name}
                                            </button>
                                          </div>
                                          {/* Enhancement C: balance badge */}
                                          {summary.currentBalance > 0 ? (
                                            <Badge className="w-fit text-xs bg-amber-100 text-amber-800 border border-amber-300">
                                              Owes ${summary.currentBalance.toFixed(2)}
                                            </Badge>
                                          ) : summary.currentBalance < 0 ? (
                                            <Badge className="w-fit text-xs bg-green-100 text-green-800 border border-green-300">
                                              Credit ${Math.abs(summary.currentBalance).toFixed(2)}
                                            </Badge>
                                          ) : (
                                            <Badge className="w-fit text-xs" variant="secondary">Paid up</Badge>
                                          )}
                                          {/* Enhancement B: already paid warning */}
                                          {warning && (
                                            <span className="text-xs text-amber-700 flex items-center gap-1">
                                              <AlertCircle className="w-3 h-3" /> {warning}
                                            </span>
                                          )}
                                        </div>
                                      </TableCell>
                                      <TableCell className="text-right">{summary.totalHours.toFixed(2)}</TableCell>
                                      <TableCell className="text-right font-semibold">${summary.calculatedAmount.toFixed(2)}</TableCell>
                                      <TableCell className={`text-right font-medium ${summary.currentBalance > 0 ? "text-amber-600" : summary.currentBalance < 0 ? "text-green-600" : ""}`}>
                                        ${summary.currentBalance.toFixed(2)}
                                      </TableCell>
                                      <TableCell className="text-right font-bold text-blue-700">${totalDue.toFixed(2)}</TableCell>
                                      <TableCell>
                                        <Input
                                          type="number" step="0.01"
                                          value={paymentAmounts[summary.employee.id] || ""}
                                          onChange={(e) => setPaymentAmounts(prev => ({ ...prev, [summary.employee.id]: e.target.value }))}
                                          className="w-full text-right"
                                        />
                                      </TableCell>
                                      <TableCell className={`text-right font-bold ${newBalance > 0 ? "text-red-600" : newBalance < 0 ? "text-green-600" : "text-green-600"}`}>
                                        ${newBalance.toFixed(2)}
                                      </TableCell>
                                      <TableCell>
                                        <Input
                                          type="text" placeholder="Optional"
                                          value={paymentNotes[summary.employee.id] || ""}
                                          onChange={(e) => setPaymentNotes(prev => ({ ...prev, [summary.employee.id]: e.target.value }))}
                                          className="w-full"
                                        />
                                      </TableCell>
                                      <TableCell className="text-right">
                                        <Button size="sm" onClick={() => processPayment(summary.employee.id)} className="bg-green-600 hover:bg-green-700 whitespace-nowrap">
                                          <Save className="w-4 h-4 mr-1" /> Pay
                                        </Button>
                                      </TableCell>
                                    </TableRow>

                                    {/* Enhancement A: breakdown row */}
                                    {isExpanded && (
                                      <TableRow className="bg-slate-50/80">
                                        <TableCell colSpan={9} className="p-0">
                                          <div className="p-4 border-t border-b border-slate-200">
                                            <p className="text-xs font-semibold text-slate-500 uppercase mb-3">Earnings Breakdown  {summary.employee.name}</p>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                              {regularHours > 0 && (
                                                <div className="flex justify-between px-3 py-2 bg-white rounded border">
                                                  <span className="text-slate-600"> Regular Hours ({regularHours.toFixed(2)} hrs - ${summary.employee.hourly_rate}/hr)</span>
                                                  <span className="font-semibold">${regularEarnings.toFixed(2)}</span>
                                                </div>
                                              )}
                                              {manualHoursAdj.length > 0 && (
                                                <div className="flex justify-between px-3 py-2 bg-white rounded border">
                                                  <span className="text-slate-600"> Manual Hours ({manualHoursAdj.reduce((s,a) => s+(a.hours||0),0).toFixed(2)} hrs)</span>
                                                  <span className="font-semibold">${manualHoursTotal.toFixed(2)}</span>
                                                </div>
                                              )}
                                              {tripAdj.length > 0 && (
                                                <div className="flex justify-between px-3 py-2 bg-white rounded border">
                                                  <span className="text-slate-600">- Pickup Trips ({tripAdj.length} trip{tripAdj.length !== 1 ? "s" : ""})</span>
                                                  <span className="font-semibold">${tripsTotal.toFixed(2)}</span>
                                                </div>
                                              )}
                                              {bonusAdj.length > 0 && (
                                                <div className="flex justify-between px-3 py-2 bg-white rounded border">
                                                  <span className="text-slate-600"> Bonuses ({bonusAdj.length})</span>
                                                  <span className="font-semibold text-green-600">+${bonusTotal.toFixed(2)}</span>
                                                </div>
                                              )}
                                              {deductAdj.length > 0 && (
                                                <div className="flex justify-between px-3 py-2 bg-white rounded border">
                                                  <span className="text-slate-600"> Deductions ({deductAdj.length})</span>
                                                  <span className="font-semibold text-red-600">-${deductTotal.toFixed(2)}</span>
                                                </div>
                                              )}
                                            </div>
                                            <div className="mt-3 pt-3 border-t border-slate-200 flex flex-col gap-1 text-sm">
                                              <div className="flex justify-between font-medium">
                                                <span>Total Earned This Period</span>
                                                <span>${summary.calculatedAmount.toFixed(2)}</span>
                                              </div>
                                              {summary.currentBalance !== 0 && (
                                                <div className="flex justify-between font-medium text-amber-700">
                                                  <span>Previous Balance Carried Over</span>
                                                  <span>+${summary.currentBalance.toFixed(2)}</span>
                                                </div>
                                              )}
                                              <div className="flex justify-between font-bold text-blue-700 text-base pt-1 border-t">
                                                <span>Total Due Now</span>
                                                <span>${totalDue.toFixed(2)}</span>
                                              </div>
                                            </div>
                                          </div>
                                        </TableCell>
                                      </TableRow>
                                    )}
                                  </React.Fragment>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </TabsContent>

              <TabsContent value="balances" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Employee Balance Status
                    </CardTitle>
                    <CardDescription>
                      Current outstanding balances for all employees (positive = owed to employee, negative = overpaid)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Employee</TableHead>
                            <TableHead className="text-right">Current Balance</TableHead>
                            <TableHead className="text-right">Last Updated</TableHead>
                            <TableHead className="text-right">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {balances
                            .sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance))
                            .map((balance) => {
                              const employee = employees.find(e => e.id === balance.employee_id);
                              return (
                                <TableRow key={balance.id}>
                                  <TableCell className="font-medium">
                                    {employee?.name || "Unknown"}
                                  </TableCell>
                                  <TableCell className={`text-right text-lg font-bold ${
                                    balance.balance > 0 ? "text-red-600" : 
                                    balance.balance < 0 ? "text-green-600" : ""
                                  }`}>
                                    ${Math.abs(balance.balance).toFixed(2)}
                                  </TableCell>
                                  <TableCell className="text-right text-muted-foreground">
                                    {formatDateShort(balance.last_updated)}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {balance.balance > 0 ? (
                                      <Badge variant="destructive">Owed</Badge>
                                    ) : balance.balance < 0 ? (
                                      <Badge className="bg-green-600">Overpaid</Badge>
                                    ) : (
                                      <Badge variant="secondary">Balanced</Badge>
                                    )}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="history" className="space-y-4">
                {/* Filters */}
                <Card className="border-2 border-purple-200 bg-purple-50/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Receipt className="h-5 w-5 text-purple-600" />
                      Transaction History Filters
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="history-employee">Employee</Label>
                        <select
                          id="history-employee"
                          value={historyEmployee}
                          onChange={(e) => setHistoryEmployee(e.target.value)}
                          className="w-full rounded-md border border-input bg-background px-3 py-2"
                        >
                          <option value="all">All Employees</option>
                          {employees.map((emp) => (
                            <option key={emp.id} value={emp.id}>
                              {emp.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="history-start">From Date</Label>
                        <Input
                          id="history-start"
                          type="date"
                          value={historyStartDate}
                          onChange={(e) => setHistoryStartDate(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="history-end">To Date</Label>
                        <Input
                          id="history-end"
                          type="date"
                          value={historyEndDate}
                          onChange={(e) => setHistoryEndDate(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setHistoryEmployee("all");
                          setHistoryStartDate("");
                          setHistoryEndDate("");
                        }}
                      >
                        Reset Filters
                      </Button>
                      <Button onClick={generateTransactionReport} variant="outline">
                        <FileText className="w-4 h-4 mr-2" />
                        Report PDF
                      </Button>
                      <Button onClick={downloadBulkPayslips} className="bg-purple-600 hover:bg-purple-700">
                        <Download className="w-4 h-4 mr-2" />
                        Download Payslips (ZIP)
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Transaction History */}
                <Card>
                  <CardHeader>
                    <CardTitle>Transaction History</CardTitle>
                    <CardDescription>
                      All payroll transactions processed through the system
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto rounded-md border">
                      <Table className="min-w-[1000px]">
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Employee</TableHead>
                            <TableHead>Period</TableHead>
                            <TableHead className="text-right">Hours</TableHead>
                            <TableHead className="text-right">Earned</TableHead>
                            <TableHead className="text-right">Paid</TableHead>
                            <TableHead className="text-right">Balance Change</TableHead>
                            <TableHead>Notes</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {transactions
                            .filter(t => {
                              if (historyEmployee !== "all" && t.employee_id !== historyEmployee) return false;
                              if (historyStartDate && t.transaction_date < historyStartDate) return false;
                              if (historyEndDate && t.transaction_date > historyEndDate + "T23:59:59") return false;
                              return true;
                            })
                            .map((transaction) => {
                              const employee = employees.find(e => e.id === transaction.employee_id);
                              const balanceChange = transaction.balance_after - transaction.balance_before;
                              return (
                                <TableRow key={transaction.id}>
                                  <TableCell className="font-medium">
                                    {formatDateShort(transaction.transaction_date)}
                                  </TableCell>
                                  <TableCell>{employee?.name || "Unknown"}</TableCell>
                                  <TableCell className="text-sm text-muted-foreground">
                                    {formatDateRange(transaction.date_range_start, transaction.date_range_end)}
                                  </TableCell>
                                  <TableCell className="text-right">{transaction.hours_worked.toFixed(2)}</TableCell>
                                  <TableCell className="text-right">${transaction.amount_earned.toFixed(2)}</TableCell>
                                  <TableCell className="text-right font-semibold text-green-600">
                                    ${transaction.amount_paid.toFixed(2)}
                                  </TableCell>
                                  <TableCell className={`text-right font-bold ${
                                    balanceChange > 0 ? "text-red-600" : 
                                    balanceChange < 0 ? "text-green-600" : ""
                                  }`}>
                                    ${balanceChange.toFixed(2)}
                                  </TableCell>
                                  <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                                    {transaction.notes || "-"}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex gap-1 justify-end items-center">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-8 px-2 text-blue-600 border-blue-200 hover:bg-blue-50"
                                        title="Download Payslip PDF"
                                        onClick={() => downloadSinglePayslip(transaction)}
                                      >
                                        <FileText className="h-4 w-4 mr-1" />
                                        Slip
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-8 px-2"
                                        onClick={() => handleEditTransaction(transaction)}
                                      >
                                        Edit
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                        onClick={() => handleDeleteTransaction(transaction.id)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
      {/* Enhancement D: Confirm Single Payment Dialog */}
      <Dialog open={!!confirmingPayment} onOpenChange={(o) => !o && setConfirmingPayment(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Payment</DialogTitle>
            <DialogDescription>Review before processing</DialogDescription>
          </DialogHeader>
          {confirmingPayment && (() => {
            const paidAmount = parseFloat(paymentAmounts[confirmingPayment.employee.id] || "0");
            const newBal = confirmingPayment.currentBalance + confirmingPayment.calculatedAmount - paidAmount;
            const totalDue = confirmingPayment.currentBalance + confirmingPayment.calculatedAmount;
            const regHours = confirmingPayment.timeEntries.reduce((s,e) => s+(e.hours_worked||0),0);
            const regEarn = confirmingPayment.timeEntries.reduce((s,e) => s+(e.earnings||0),0);
            const trips = confirmingPayment.adjustments.filter(a => a.adjustment_type==="pickup_trip");
            const bonuses = confirmingPayment.adjustments.filter(a => a.adjustment_type==="bonus");
            const deducts = confirmingPayment.adjustments.filter(a => a.adjustment_type==="deduction");
            const manHrs = confirmingPayment.adjustments.filter(a => a.adjustment_type==="manual_hours");
            return (
              <div className="space-y-4">
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="font-bold text-lg">{confirmingPayment.employee.name}</p>
                  <p className="text-sm text-muted-foreground">{formatDateRange(startDate, endDate)}</p>
                </div>
                <div className="space-y-2 text-sm">
                  {regHours > 0 && <div className="flex justify-between"><span> Regular Hours ({regHours.toFixed(2)} hrs)</span><span>${regEarn.toFixed(2)}</span></div>}
                  {manHrs.length > 0 && <div className="flex justify-between"><span> Manual Hours</span><span>${manHrs.reduce((s,a)=>s+(a.amount||0),0).toFixed(2)}</span></div>}
                  {trips.length > 0 && <div className="flex justify-between"><span>- Trips ({trips.length})</span><span>${trips.reduce((s,a)=>s+(a.amount||0),0).toFixed(2)}</span></div>}
                  {bonuses.length > 0 && <div className="flex justify-between text-green-700"><span> Bonuses</span><span>+${bonuses.reduce((s,a)=>s+(a.amount||0),0).toFixed(2)}</span></div>}
                  {deducts.length > 0 && <div className="flex justify-between text-red-700"><span> Deductions</span><span>-${deducts.reduce((s,a)=>s+(a.amount||0),0).toFixed(2)}</span></div>}
                  <div className="border-t pt-2 flex justify-between font-semibold"><span>Earned This Period</span><span>${confirmingPayment.calculatedAmount.toFixed(2)}</span></div>
                  {confirmingPayment.currentBalance !== 0 && <div className="flex justify-between text-amber-700"><span>Previous Balance</span><span>+${confirmingPayment.currentBalance.toFixed(2)}</span></div>}
                  <div className="flex justify-between font-bold text-blue-700"><span>Total Due</span><span>${totalDue.toFixed(2)}</span></div>
                  <div className="border-t pt-2 flex justify-between font-bold text-green-700 text-base"><span>Paying Now</span><span>${paidAmount.toFixed(2)}</span></div>
                  <div className="flex justify-between text-sm text-muted-foreground"><span>New Balance After</span><span>${newBal.toFixed(2)}</span></div>
                </div>
              </div>
            );
          })()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmingPayment(null)}>Cancel</Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={() => confirmingPayment && confirmAndPay(confirmingPayment)}>
               Confirm & Pay
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enhancement D: Confirm All Payments Dialog */}
      <Dialog open={confirmingAll} onOpenChange={(o) => !o && setConfirmingAll(false)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Confirm All Payments</DialogTitle>
            <DialogDescription>{formatDateRange(startDate, endDate)}  {currentSummaries.length} employees</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-64 overflow-y-auto text-sm">
            {currentSummaries.map(s => {
              const amt = parseFloat(paymentAmounts[s.employee.id] || "0");
              return (
                <div key={s.employee.id} className="flex justify-between px-3 py-2 bg-slate-50 rounded border">
                  <span className="font-medium">{s.employee.name}</span>
                  <span className="font-bold text-green-700">${amt.toFixed(2)}</span>
                </div>
              );
            })}
            <div className="flex justify-between px-3 py-2 bg-blue-50 rounded border font-bold text-blue-700">
              <span>Total Paying</span>
              <span>${currentSummaries.reduce((s, x) => s + parseFloat(paymentAmounts[x.employee.id] || "0"), 0).toFixed(2)}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmingAll(false)}>Cancel</Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={confirmAndPayAll}>
               Confirm & Pay All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

