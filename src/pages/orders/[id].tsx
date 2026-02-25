import { SEO } from "@/components/SEO";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { ArrowLeft, FileText, Mail, Printer, Edit, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { getOrder, updateOrder, createInvoiceFromOrder } from "@/lib/store";
import type { Order } from "@/types";

export default function OrderDetailsPage() {
  const router = useRouter();
  const { id } = router.query;
  const { toast } = useToast();
  const [order, setOrder] = useState<Order | undefined>(undefined);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (id && typeof id === "string") {
      const foundOrder = getOrder(id);
      setOrder(foundOrder);
    }
  }, [id]);

  const handleStatusChange = (newStatus: Order["status"]) => {
    if (!order) return;
    const updatedOrder = { ...order, status: newStatus };
    updateOrder(updatedOrder);
    setOrder(updatedOrder);
    toast({
      title: "Status Updated",
      description: `Order status changed to ${newStatus}`,
    });
  };

  const handleCreateInvoice = () => {
    if (!order) return;
    const invoice = createInvoiceFromOrder(order);
    toast({
      title: "Invoice Created",
      description: `Invoice ${invoice.invoiceNumber} generated successfully`,
    });
    router.push(`/invoices/${invoice.id}`);
  };

  const handleEmailOrder = () => {
    if (!order) return;
    const subject = `Order Confirmation - ${order.orderNumber}`;
    const body = `Dear ${order.customerName},\n\nThank you for your order. Here are the details:\n\nOrder Number: ${order.orderNumber}\nTotal: $${order.total.toFixed(2)}\n\nBest regards,\nSatmar Montreal Matzos`;
    window.open(`mailto:${order.customerEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  if (!mounted) return null;
  if (!order) return <div>Order not found</div>;

  return (
    <>
      <SEO title={`Order ${order.orderNumber} - Satmar Montreal Matzos`} />
      
      <div className="container mx-auto px-6 py-8">
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/orders">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{order.orderNumber}</h1>
              <p className="text-gray-600">
                Placed on {new Date(order.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleEmailOrder} className="gap-2">
              <Mail className="w-4 h-4" />
              Email
            </Button>
            <Button variant="outline" onClick={() => window.print()} className="gap-2">
              <Printer className="w-4 h-4" />
              Print
            </Button>
            <Button onClick={handleCreateInvoice} className="gap-2 bg-gradient-to-r from-blue-600 to-blue-700">
              <FileText className="w-4 h-4" />
              Generate Invoice
            </Button>
            <Link href="/">
              <Button variant="outline" className="gap-2">
                Return to Home
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-amber-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Order Items</CardTitle>
                  <Badge variant="outline" className="text-lg">
                    {order.items.length} Items
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-4 bg-amber-50 rounded-lg border border-amber-100">
                      <div>
                        <p className="font-semibold text-gray-900">{item.productName}</p>
                        <p className="text-sm text-gray-600">
                          {item.quantity} lbs @ ${item.pricePerLb.toFixed(2)}/lb
                        </p>
                      </div>
                      <p className="font-bold text-gray-900">
                        ${item.totalPrice.toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-6 space-y-2 border-t border-amber-200 pt-4">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>${order.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Tax</span>
                    <span>${order.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t border-dashed border-amber-200">
                    <span>Total</span>
                    <span>${order.total.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {order.notes && (
              <Card className="border-amber-200">
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{order.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card className="border-amber-200">
              <CardHeader>
                <CardTitle>Status</CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  value={order.status}
                  onValueChange={(val: any) => handleStatusChange(val)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="preparing">Preparing</SelectItem>
                    <SelectItem value="ready">Ready for Pickup</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card className="border-amber-200">
              <CardHeader>
                <CardTitle>Customer Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium">{order.customerName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{order.customerEmail}</p>
                </div>
                {order.deliveryDate && (
                  <div>
                    <p className="text-sm text-gray-500">Requested Delivery</p>
                    <p className="font-medium">{new Date(order.deliveryDate).toLocaleDateString()}</p>
                  </div>
                )}
                <Link href={`/customers/${order.customerId}`}>
                  <Button variant="link" className="px-0 text-blue-600">
                    View Customer Profile
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}