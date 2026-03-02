import { SEO } from "@/components/SEO";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Printer, Mail, Download } from "lucide-react";
import { supabaseService } from "@/services/supabaseService";
import type { Invoice, Settings } from "@/types";
import { useToast } from "@/hooks/use-toast";

export default function InvoicePage() {
  const router = useRouter();
  const { id } = router.query;
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  useEffect(() => {
    if (id && typeof id === "string") {
      const loadData = async () => {
        const [inv, sett] = await Promise.all([
          supabaseService.getInvoice(id),
          supabaseService.getSettings()
        ]);
        setInvoice(inv);
        setSettings(sett);
        setLoading(false);
      };
      loadData();
    }
  }, [id]);

  if (loading) {
    return <div className="p-8 text-center">Loading invoice...</div>;
  }

  if (!invoice || !settings) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Invoice Not Found</h1>
        <Button onClick={() => router.push("/orders")}>Back to Orders</Button>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = async () => {
    if (!invoice || !settings) return;

    setIsGeneratingPDF(true);
    
    try {
      // Dynamic import to reduce initial bundle size
      const jsPDF = (await import("jspdf")).default;
      const html2canvas = (await import("html2canvas")).default;

      // Get the invoice content element
      const invoiceElement = document.getElementById("invoice-content");
      if (!invoiceElement) {
        throw new Error("Invoice content not found");
      }

      // Generate canvas from HTML
      const canvas = await html2canvas(invoiceElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      // Calculate PDF dimensions
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Create PDF
      const pdf = new jsPDF({
        orientation: imgHeight > imgWidth ? "portrait" : "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgData = canvas.toDataURL("image/png");
      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);

      // Save PDF
      pdf.save(`Invoice_${invoice.invoiceNumber}.pdf`);

      toast({
        title: "PDF Generated",
        description: `Invoice ${invoice.invoiceNumber} has been exported successfully`,
      });
    } catch (error) {
      console.error("PDF generation error:", error);
      toast({
        title: "Export Failed",
        description: "There was an error generating the PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <>
      <SEO title={`Invoice ${invoice.invoiceNumber}`} />
      
      <div className="min-h-screen print:bg-white">
        {/* Action Bar - Hidden when printing */}
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
              <Button 
                variant="outline" 
                onClick={handlePrint} 
                className="gap-2"
              >
                <Printer className="w-4 h-4" />
                Print
              </Button>
              <Button 
                variant="outline" 
                onClick={handleExportPDF}
                disabled={isGeneratingPDF}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                {isGeneratingPDF ? "Generating..." : "Export PDF"}
              </Button>
              <Link href="/">
                <Button variant="outline" className="gap-2">
                  Return to Home
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Invoice Content - Optimized for printing */}
        <div className="container mx-auto px-4 py-8 print:p-0 print:m-0">
          <div 
            id="invoice-content"
            className="max-w-4xl mx-auto bg-white shadow-lg p-12 rounded-lg print:shadow-none print:rounded-none print:max-w-full"
          >
            {/* Header with Logo and Company Info */}
            <div className="flex justify-between items-start mb-12 border-b border-gray-200 pb-8">
              <div>
                <img 
                  src="/logo.png" 
                  alt="Satmar Montreal Matzos" 
                  className="h-24 w-auto mb-4"
                />
                <h1 className="text-4xl font-bold text-gray-900 mb-2">{settings.companyName}</h1>
                <h2 
                  className="text-2xl font-semibold text-gray-800 mb-4 font-heebo" 
                  dir="rtl"
                  style={{ fontFamily: "'Heebo', sans-serif" }}
                >
                  {settings.companyNameHebrew}
                </h2>
                <div className="text-gray-600 space-y-1">
                  <p>{settings.address}</p>
                  <p>{settings.phone}</p>
                  <p>{settings.email}</p>
                </div>
              </div>
              <div className="text-right">
                <h3 className="text-3xl font-bold text-gray-900 mb-2">INVOICE</h3>
                <div className="text-gray-600 space-y-1">
                  <p><span className="font-semibold">Invoice #:</span> {invoice.invoiceNumber}</p>
                  <p><span className="font-semibold">Date:</span> {new Date(invoice.createdAt).toLocaleDateString()}</p>
                  <p><span className="font-semibold">Due Date:</span> {new Date(invoice.dueDate).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            {/* Bill To Section */}
            <div className="mb-12">
              <h3 className="text-lg font-bold text-gray-900 mb-4 uppercase tracking-wider border-b border-gray-200 pb-2">
                Bill To / <span className="font-heebo" dir="rtl" style={{ fontFamily: "'Heebo', sans-serif" }}>לכבוד</span>
              </h3>
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
                    <th className="text-left py-3 font-bold text-gray-900">Description</th>
                    <th className="text-center py-3 font-bold text-gray-900">Qty (lbs)</th>
                    <th className="text-right py-3 font-bold text-gray-900">Price</th>
                    <th className="text-right py-3 font-bold text-gray-900">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {invoice.items.map((item, index) => (
                    <tr key={index}>
                      <td className="py-4 text-gray-800">
                        <div className="font-medium">{item.productName}</div>
                        <div 
                          className="text-sm font-heebo" 
                          dir="rtl"
                          style={{ fontFamily: "'Heebo', sans-serif" }}
                        >
                          {item.productNameHebrew}
                        </div>
                      </td>
                      <td className="py-4 text-center text-gray-600">{item.quantity}</td>
                      <td className="py-4 text-right text-gray-600">${item.pricePerLb.toFixed(2)}</td>
                      <td className="py-4 text-right text-gray-900 font-semibold">${item.totalPrice.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals Section */}
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

            {/* Payment Status (only show if partially paid or unpaid) */}
            {invoice.paymentStatus !== "paid" && (
              <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-gray-900">Payment Status</p>
                    <p className="text-sm text-gray-600">
                      {invoice.paymentStatus === "unpaid" ? "Unpaid" : `Partial Payment: $${invoice.amountPaid.toFixed(2)} paid`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Amount Due:</p>
                    <p className="text-2xl font-bold text-amber-700">${invoice.amountDue.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="mt-16 pt-8 border-t border-gray-200 text-center text-gray-500 text-sm">
              <p>Thank you for your business!</p>
              <p className="mt-2">Payment is due by {new Date(invoice.dueDate).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Print-specific styles */}
      <style jsx global>{`
        @media print {
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          
          @page {
            margin: 0.5in;
            size: A4;
          }

          /* Hide everything except invoice content */
          body > *:not(#__next) {
            display: none !important;
          }

          /* Ensure proper page breaks */
          #invoice-content {
            page-break-inside: avoid;
          }

          /* Ensure images print properly */
          img {
            max-width: 100%;
            page-break-inside: avoid;
          }

          /* Better table printing */
          table {
            page-break-inside: avoid;
          }

          /* Ensure colors print */
          * {
            print-color-adjust: exact !important;
            -webkit-print-color-adjust: exact !important;
          }
        }
      `}</style>
    </>
  );
}