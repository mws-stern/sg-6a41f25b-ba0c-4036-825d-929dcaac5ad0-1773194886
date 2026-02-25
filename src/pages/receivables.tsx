import { SEO } from "@/components/SEO";
import { useState, useEffect } from "react";
import Link from "next/link";
import { DollarSign, TrendingUp, TrendingDown, CreditCard, Clock, CheckCircle, Receipt } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getReceivablesSummary } from "@/lib/store";
import type { ReceivablesSummary } from "@/types";

export default function ReceivablesPage() {
  const [summary, setSummary] = useState<ReceivablesSummary | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setSummary(getReceivablesSummary());
  }, []);

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

  return (
    <>
      <SEO title="Receivables & Payments - Satmar Montreal Matzos" />
      
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Receivables & Payments</h1>
          <p className="text-gray-600">Track payments and outstanding balances</p>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Recent Payments
              </CardTitle>
            </CardHeader>
            <CardContent>
              {summary.recentPayments.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No payments recorded yet</p>
              ) : (
                <div className="space-y-3">
                  {summary.recentPayments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-3">
                        {getPaymentMethodIcon(payment.paymentMethod)}
                        <div>
                          <p className="font-semibold text-gray-900">${payment.amount.toFixed(2)}</p>
                          <p className="text-sm text-gray-600">
                            {getPaymentMethodLabel(payment.paymentMethod)}
                            {payment.creditCardLast4 && ` •••• ${payment.creditCardLast4}`}
                            {payment.checkNumber && ` #${payment.checkNumber}`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">{new Date(payment.paymentDate).toLocaleDateString()}</p>
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
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Unpaid Invoices
              </CardTitle>
            </CardHeader>
            <CardContent>
              {summary.unpaidInvoices.length === 0 ? (
                <p className="text-gray-500 text-center py-8">All invoices are paid! 🎉</p>
              ) : (
                <div className="space-y-3">
                  {summary.unpaidInvoices.map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between p-4 bg-amber-50 rounded-lg border border-amber-200">
                      <div>
                        <p className="font-semibold text-gray-900">{invoice.invoiceNumber}</p>
                        <p className="text-sm text-gray-600">{invoice.customerName}</p>
                        <Badge variant={invoice.paymentStatus === "partial" ? "default" : "destructive"} className="mt-1">
                          {invoice.paymentStatus === "unpaid" ? "Unpaid" : `Partial: $${invoice.amountPaid.toFixed(2)} / $${invoice.total.toFixed(2)}`}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-amber-700">${invoice.amountDue.toFixed(2)}</p>
                        <p className="text-xs text-gray-500">Due: {new Date(invoice.dueDate).toLocaleDateString()}</p>
                        <Link href={`/invoices/${invoice.id}`}>
                          <Button variant="link" size="sm" className="h-auto p-0 text-xs mt-1">
                            View Invoice
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
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