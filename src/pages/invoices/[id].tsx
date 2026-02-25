import { SEO } from "@/components/SEO";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { ArrowLeft, Printer, Mail, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getInvoice, getSettings } from "@/lib/store";
import type { Settings } from "@/lib/store";
import type { Invoice } from "@/types";

export default function InvoicePage() {
  const router = useRouter();
  const { id } = router.query;
  const [invoice, setInvoice] = useState<Invoice | undefined>(undefined);
  const [settings, setSettings] = useState<Settings | undefined>(undefined);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (id && typeof id === "string") {
      setInvoice(getInvoice(id));
      setSettings(getSettings());
    }
  }, [id]);

  if (!mounted) return null;
  if (!invoice || !settings) return <div>Invoice not found</div>;

  return (
    <>
      <SEO title={`Invoice ${invoice.invoiceNumber}`} />
      
      <div className="min-h-screen bg-gray-50 print:bg-white">
        {/* Toolbar - Hidden when printing */}
        <div className="bg-white border-b border-gray-200 shadow-sm print:hidden">
          <div className="container mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href={`/orders/${invoice.orderId}`}>
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <h1 className="text-xl font-bold text-gray-900">Invoice Preview</h1>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => window.print()} className="gap-2">
                <Printer className="w-4 h-4" />
                Print
              </Button>
            </div>
          </div>
        </div>

        {/* Invoice Paper */}
        <div className="container mx-auto px-4 py-8 print:p-0 print:m-0">
          <div className="max-w-4xl mx-auto bg-white shadow-lg p-12 rounded-lg print:shadow-none print:rounded-none">
            {/* Header */}
            <div className="flex justify-between items-start mb-12 border-b border-gray-200 pb-8">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">{settings.companyName}</h1>
                <h2 className="text-2xl font-hebrew text-gray-800 mb-4">{settings.companyNameHebrew}</h2>
                <div className="text-gray-600 space-y-1">
                  <p>{settings.address}</p>
                  <p>{settings.phone}</p>
                  <p>{settings.email}</p>
                </div>
              </div>
              <div className="text-right">
                <h3 className="text-3xl font-bold text-gray-900 mb-2">INVOICE</h3>
                <h4 className="text-2xl font-hebrew text-gray-800 mb-4">חשבונית</h4>
                <div className="text-gray-600 space-y-1">
                  <p><span className="font-semibold">Invoice #:</span> {invoice.invoiceNumber}</p>
                  <p><span className="font-semibold">Date:</span> {new Date(invoice.createdAt).toLocaleDateString()}</p>
                  <p><span className="font-semibold">Due Date:</span> {new Date(invoice.dueDate).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            {/* Bill To */}
            <div className="mb-12">
              <h3 className="text-lg font-bold text-gray-900 mb-4 uppercase tracking-wider border-b border-gray-200 pb-2">Bill To / לכבוד</h3>
              <div className="text-gray-800">
                <p className="text-xl font-semibold mb-2">{invoice.customerName}</p>
                <p>{invoice.customerEmail}</p>
              </div>
            </div>

            {/* Items Table */}
            <div className="mb-12">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-900">
                    <th className="text-left py-3 font-bold text-gray-900">Description / תיאור</th>
                    <th className="text-center py-3 font-bold text-gray-900">Qty (lbs)</th>
                    <th className="text-right py-3 font-bold text-gray-900">Price</th>
                    <th className="text-right py-3 font-bold text-gray-900">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {invoice.items.map((item, index) => (
                    <tr key={index}>
                      <td className="py-4 text-gray-800 font-medium">{item.productName}</td>
                      <td className="py-4 text-center text-gray-600">{item.quantity}</td>
                      <td className="py-4 text-right text-gray-600">${item.pricePerLb.toFixed(2)}</td>
                      <td className="py-4 text-right text-gray-900 font-semibold">${item.totalPrice.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-64 space-y-3">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal:</span>
                  <span>${invoice.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax:</span>
                  <span>${invoice.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xl font-bold text-gray-900 pt-3 border-t-2 border-gray-900">
                  <span>Total:</span>
                  <span>${invoice.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-16 pt-8 border-t border-gray-200 text-center text-gray-500 text-sm">
              <p>Thank you for your business!</p>
              <p className="font-hebrew text-lg mt-2">!תודה על הקנייה</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}