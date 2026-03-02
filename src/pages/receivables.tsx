import { SEO } from "@/components/SEO";
import { useState, useEffect } from "react";
import Link from "next/link";
import { DollarSign, TrendingUp, TrendingDown, CreditCard, Clock, CheckCircle, Receipt, Search, Filter, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getReceivablesSummary, getPayments, getInvoices } from "@/lib/store";
import { generateOverdueReminders } from "@/lib/automation";
import { useToast } from "@/hooks/use-toast";
import type { ReceivablesSummary, Payment, Invoice } from "@/types";

export default function ReceivablesPage() {
  const [summary, setSummary] = useState<ReceivablesSummary | null>(null);
  const [allPayments, setAllPayments] = useState<Payment[]>([]);
  const [allInvoices, setAllInvoices] = useState<Invoice[]>([]);
  const [mounted, setMounted] = useState(false);
  const { toast } = useToast();
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [confirmedFilter, setConfirmedFilter] = useState("all");

  useEffect(() => {
    setMounted(true);
    loadData();
  }, []);

  const loadData = () => {
    setSummary(getReceivablesSummary());
    setAllPayments(getPayments());
    setAllInvoices(getInvoices());
  };

  const handleGenerateReminders = () => {
    const reminders = generateOverdueReminders();
    toast({
      title: "Reminders Generated",
      description: `${reminders.length} overdue invoices need attention`,
    });
    console.log("Overdue reminders:", reminders);
  };

  if (!mounted || !summary) return null;

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case "credit_card": return <CreditCard className="w-4 h-4" />;
      case "cash": return <DollarSign className="w-4 h-4" />;
      case "check": return <Receipt className="w-4 h-4" />;
      case "e_transfer": return <TrendingUp className="w-4 h-4" />;
      case "voucher": return <Receipt className="w-4 h-4" />;
      default: return <DollarSign className="w-4 h-4" />;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      credit_card: "Credit Card",
      cash: "Cash",
      check: "Check",
      e_transfer: "E-Transfer",
      voucher: "Voucher"
    };
    return labels[method] || method;
  };

  // Filter payments
  const filteredPayments = allPayments.filter(payment => {
    const matchesSearch = searchTerm === "" || 
      payment.amount.toString().includes(searchTerm) ||
      (payment.creditCardLast4 && payment.creditCardLast4.includes(searchTerm)) ||
      (payment.checkNumber && payment.checkNumber.includes(searchTerm)) ||
      (payment.notes && payment.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesMethod = paymentMethodFilter === "all" || payment.paymentMethod === paymentMethodFilter;
    const matchesConfirmed = confirmedFilter === "all" || 
      (confirmedFilter === "confirmed" && payment.confirmed) ||
      (confirmedFilter === "unconfirmed" && !payment.confirmed);
    
    return matchesSearch && matchesMethod && matchesConfirmed;
  });

  // Filter invoices
  const filteredInvoices = allInvoices.filter(invoice => {
    const matchesSearch = searchTerm === "" ||
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = paymentStatusFilter === "all" || invoice.paymentStatus === paymentStatusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const overdueInvoices = allInvoices.filter(inv => 
    !inv.paid && new Date(inv.dueDate) < new Date()
  );

  return (
    <>
      <SEO title="Receivables & Payments - Satmar Montreal Matzos" />
      
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Receivables & Payments</h1>
            <p className="text-gray-600">Track payments and outstanding balances</p>
          </div>
          <Button onClick={handleGenerateReminders} variant="outline" className="gap-2">
            <Clock className="w-4 h-4" />
            Check Overdue ({overdueInvoices.length})
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-blue-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-blue-600" />
                <p className="text-2xl font-bold text-gray-900">${summary.totalRevenue.toFixed(2)}</p>
              </div>
              <p className="text-xs text-gray-500 mt-1">All time orders</p>
            </CardContent>
          </Card>

          <Card className="border-green-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Collected</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <p className="text-2xl font-bold text-green-700">${summary.totalCollected.toFixed(2)}</p>
              </div>
              <p className="text-xs text-gray-500 mt-1">{summary.percentageCollected.toFixed(1)}% of total</p>
            </CardContent>
          </Card>

          <Card className="border-amber-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-600" />
                <p className="text-2xl font-bold text-amber-700">${summary.totalPending.toFixed(2)}</p>
              </div>
              <p className="text-xs text-gray-500 mt-1">{(100 - summary.percentageCollected).toFixed(1)}% outstanding</p>
            </CardContent>
          </Card>

          <Card className="border-purple-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Collection Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                <p className="text-2xl font-bold text-purple-700">{summary.percentageCollected.toFixed(1)}%</p>
              </div>
              <p className="text-xs text-gray-500 mt-1">Payment efficiency</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Search & Filter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search payments, invoices..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Payment Method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                  <SelectItem value="e_transfer">E-Transfer</SelectItem>
                  <SelectItem value="voucher">Voucher</SelectItem>
                </SelectContent>
              </Select>

              <Select value={confirmedFilter} onValueChange={setConfirmedFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Confirmation Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payments</SelectItem>
                  <SelectItem value="confirmed">Confirmed/Charged</SelectItem>
                  <SelectItem value="unconfirmed">Pending Confirmation</SelectItem>
                </SelectContent>
              </Select>

              <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Invoice Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Invoices</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  All Payments
                </span>
                <Badge variant="outline">{filteredPayments.length} results</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredPayments.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No payments found</p>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {filteredPayments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-3">
                        {getPaymentMethodIcon(payment.paymentMethod)}
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-900">${payment.amount.toFixed(2)}</p>
                            {payment.confirmed && (
                              <Badge variant="default" className="bg-green-600">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Charged
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">
                            {getPaymentMethodLabel(payment.paymentMethod)}
                            {payment.creditCardLast4 && ` •••• ${payment.creditCardLast4}`}
                            {payment.creditCardExpiry && ` Exp: ${payment.creditCardExpiry}`}
                            {payment.checkNumber && ` #${payment.checkNumber}`}
                          </p>
                          {payment.notes && (
                            <p className="text-xs text-gray-500 mt-1">{payment.notes}</p>
                          )}
                          {payment.confirmedAt && (
                            <p className="text-xs text-green-600 mt-1">
                              Charged: {new Date(payment.confirmedAt).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">{new Date(payment.paymentDate).toLocaleDateString()}</p>
                        <Link href={`/orders/${payment.orderId}`}>
                          <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                            View Order
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Receipt className="w-5 h-5" />
                  All Invoices
                </span>
                <Badge variant="outline">{filteredInvoices.length} results</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredInvoices.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No invoices found</p>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {filteredInvoices.map((invoice) => {
                    const isOverdue = !invoice.paid && new Date(invoice.dueDate) < new Date();
                    return (
                      <div key={invoice.id} className={`flex items-center justify-between p-4 rounded-lg border transition-shadow hover:shadow-md ${isOverdue ? 'bg-red-50 border-red-300' : 'bg-gray-50 border-gray-200'}`}>
                        <div>
                          <p className="font-semibold text-gray-900">{invoice.invoiceNumber}</p>
                          <p className="text-sm text-gray-600">{invoice.customerName}</p>
                          <Badge 
                            variant={
                              invoice.paymentStatus === "paid" ? "default" :
                              invoice.paymentStatus === "partial" ? "default" : "destructive"
                            }
                            className={invoice.paymentStatus === "paid" ? "bg-green-600 mt-1" : "mt-1"}
                          >
                            {invoice.paymentStatus === "unpaid" ? "Unpaid" : 
                             invoice.paymentStatus === "partial" ? `Partial: $${invoice.amountPaid.toFixed(2)} / $${invoice.total.toFixed(2)}` :
                             "Paid in Full"}
                          </Badge>
                          {isOverdue && (
                            <Badge variant="destructive" className="mt-1 ml-2">
                              <Clock className="w-3 h-3 mr-1" />
                              OVERDUE
                            </Badge>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900">${invoice.total.toFixed(2)}</p>
                          {invoice.amountDue > 0 && (
                            <p className="text-sm font-semibold text-red-600">Due: ${invoice.amountDue.toFixed(2)}</p>
                          )}
                          <p className="text-xs text-gray-500">Due: {new Date(invoice.dueDate).toLocaleDateString()}</p>
                          <Link href={`/invoices/${invoice.id}`}>
                            <Button variant="link" size="sm" className="h-auto p-0 text-xs mt-1">
                              View Invoice
                            </Button>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Collection Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Payment Collection</span>
                  <span className="font-semibold">{summary.percentageCollected.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-500"
                    style={{ width: `${summary.percentageCollected}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Collected: ${summary.totalCollected.toFixed(2)}</span>
                  <span>Pending: ${summary.totalPending.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}