import { SEO } from "@/components/SEO";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Edit2, 
  Trash2, 
  Calendar, 
  User, 
  Package, 
  DollarSign,
  Mail,
  FileText
} from "lucide-react";
import Link from "next/link";
import { Order, Customer, Product } from "@/types";
import { supabaseService } from "@/services/supabaseService";
import { emailService } from "@/services/emailService";
import { toast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function OrderDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [order, setOrder] = useState<Order | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [sendingInvoice, setSendingInvoice] = useState(false);
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [emailPreviewHtml, setEmailPreviewHtml] = useState("");
  const [emailPreviewType, setEmailPreviewType] = useState<"confirmation" | "invoice">("confirmation");

  useEffect(() => {
    if (id) {
      loadOrderDetails();
    }
  }, [id]);

  const loadOrderDetails = async () => {
    try {
      setLoading(true);
      const orderData = await supabaseService.getOrder(id as string);
      
      if (orderData) {
        setOrder(orderData);
        
        const customerData = await supabaseService.getCustomer(orderData.customerId);
        setCustomer(customerData);

        const productsData = await supabaseService.getProducts();
        setProducts(productsData);
      }
    } catch (error) {
      console.error("Error loading order:", error);
      toast({
        title: "Error",
        description: "Failed to load order details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!order) return;

    try {
      await supabaseService.deleteOrder(order.id);
      toast({
        title: "Success",
        description: "Order deleted successfully",
      });
      router.push("/orders");
    } catch (error) {
      console.error("Error deleting order:", error);
      toast({
        title: "Error",
        description: "Failed to delete order",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!order) return;

    try {
      const updatedOrder = { ...order, status: newStatus as any };
      await supabaseService.updateOrder(updatedOrder);
      setOrder(updatedOrder);
      toast({
        title: "Success",
        description: "Order status updated successfully",
      });
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    }
  };

  const handleSendConfirmation = async () => {
    if (!customer?.email) {
      toast({
        title: "Error",
        description: "Customer email is required",
        variant: "destructive",
      });
      return;
    }

    // Generate and show preview
    const html = emailService.generateConfirmationHtml(order, customer);
    setEmailPreviewHtml(html);
    setEmailPreviewType("confirmation");
    setShowEmailPreview(true);
  };

  const handleSendInvoice = async () => {
    if (!customer?.email) {
      toast({
        title: "Error",
        description: "Customer email is required",
        variant: "destructive",
      });
      return;
    }

    // Generate and show preview
    const html = emailService.generateInvoiceHtml(order, customer);
    setEmailPreviewHtml(html);
    setEmailPreviewType("invoice");
    setShowEmailPreview(true);
  };

  const confirmAndSendEmail = async () => {
    setShowEmailPreview(false);
    
    if (emailPreviewType === "confirmation") {
      setSendingEmail(true);
      try {
        const result = await emailService.sendOrderConfirmation(order, customer!);
        if (result.success) {
          toast({
            title: "Success",
            description: "Order confirmation email sent successfully",
          });
        } else {
          throw new Error('Failed to send email');
        }
      } catch (error) {
        console.error("Error sending email:", error);
        toast({
          title: "Error",
          description: "Failed to send confirmation email",
          variant: "destructive",
        });
      } finally {
        setSendingEmail(false);
      }
    } else {
      setSendingInvoice(true);
      try {
        const result = await emailService.sendInvoice(order, customer!);
        if (result.success) {
          toast({
            title: "Success",
            description: "Invoice email sent successfully with PDF attachment",
          });
        } else {
          throw new Error('Failed to send email');
        }
      } catch (error) {
        console.error("Error sending invoice:", error);
        toast({
          title: "Error",
          description: "Failed to send invoice email",
          variant: "destructive",
        });
      } finally {
        setSendingInvoice(false);
      }
    }
  };

  const getProductName = (productId: string) => {
    const product = products.find(p => p.id === productId);
    return product?.name || "Unknown Product";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500";
      case "confirmed":
        return "bg-blue-500";
      case "completed":
        return "bg-green-500";
      case "cancelled":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <p>Loading...</p>
      </div>
    );
  }

  if (!order || !customer) {
    return (
      <div className="container mx-auto p-6">
        <p>Order not found</p>
      </div>
    );
  }

  return (
    <>
      <SEO
        title={`Order #${order.id.slice(0, 8)} - Satmar Montreal Matzos`}
        description={`View details for order #${order.id.slice(0, 8)}`}
      />
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/orders">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Order #{order.orderNumber || order.id.slice(0, 8)}</h1>
              <p className="text-muted-foreground">
                Created on {new Date(order.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleSendConfirmation}
              disabled={sendingEmail || !customer.email}
            >
              <Mail className="w-4 h-4 mr-2" />
              {sendingEmail ? "Sending..." : "Send Confirmation"}
            </Button>
            <Button 
              variant="outline" 
              onClick={handleSendInvoice}
              disabled={sendingInvoice || !customer.email}
            >
              <FileText className="w-4 h-4 mr-2" />
              {sendingInvoice ? "Sending..." : "Send Invoice"}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the order.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Order Items</CardTitle>
                <Badge className={getStatusColor(order.status)}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.items && order.items.length > 0 ? (
                    order.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center border-b pb-4 last:border-0">
                        <div>
                          <p className="font-semibold">{item.productName || getProductName(item.productId)}</p>
                          <p className="text-sm text-muted-foreground">
                            Quantity: {item.quantity ?? 0} × ${(item.pricePerLb ?? 0).toFixed(2)}
                          </p>
                          {(item.discount ?? 0) > 0 && (
                            <p className="text-sm text-green-600">
                              Discount: {item.discount}{item.discountType === 'percent' ? '%' : '$'}
                            </p>
                          )}
                        </div>
                        <p className="font-bold">${(item.finalPrice ?? 0).toFixed(2)}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground">No items</p>
                  )}

                  {/* Order Summary */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Order Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Subtotal:</span>
                          <span>${(order.subtotal ?? 0).toFixed(2)}</span>
                        </div>
                        {order.discount > 0 && (
                          <div className="flex justify-between text-red-600">
                            <span>Discount:</span>
                            <span>-${(order.discount ?? 0).toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between pt-2 border-t font-semibold text-base">
                          <span>Total:</span>
                          <span className="text-orange-600">
                            ${(order.total ?? 0).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>

            {order.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Order Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{order.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-semibold">{customer.name}</p>
                    {customer.email && (
                      <p className="text-sm text-muted-foreground">{customer.email}</p>
                    )}
                    {customer.phone && (
                      <p className="text-sm text-muted-foreground">{customer.phone}</p>
                    )}
                  </div>
                </div>
                {customer.address && (
                  <div className="flex items-start gap-3">
                    <Package className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <p className="text-sm text-muted-foreground">{customer.address}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Order Status</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={order.status} onValueChange={handleStatusChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {order.deliveryDate && (
              <Card>
                <CardHeader>
                  <CardTitle>Delivery Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Delivery Date</p>
                      <p className="font-semibold">
                        {new Date(order.deliveryDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Payment Information */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Payment Status:</span>
                    <Badge variant={order.paymentStatus === "paid" ? "default" : order.paymentStatus === "partial" ? "secondary" : "destructive"}>
                      {order.paymentStatus}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Amount Paid:</span>
                    <span className="font-semibold">${(order.amountPaid ?? 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Balance Due:</span>
                    <span className={`font-semibold ${((order.total ?? 0) - (order.amountPaid ?? 0)) > 0 ? "text-red-600" : "text-green-600"}`}>
                      ${((order.total ?? 0) - (order.amountPaid ?? 0)).toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Email Preview Dialog */}
        <Dialog open={showEmailPreview} onOpenChange={setShowEmailPreview}>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>
                {emailPreviewType === "confirmation" ? "Order Confirmation" : "Invoice"} Preview
              </DialogTitle>
              <DialogDescription>
                Review the email content before sending to {customer?.email}
              </DialogDescription>
            </DialogHeader>
            
            <div className="border rounded-lg overflow-hidden max-h-[60vh] overflow-y-auto">
              <iframe
                srcDoc={emailPreviewHtml}
                style={{ width: "100%", height: "600px", border: "none" }}
                title="Email Preview"
              />
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setShowEmailPreview(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmAndSendEmail}
                disabled={sendingEmail || sendingInvoice}
              >
                {sendingEmail || sendingInvoice ? "Sending..." : "Send Email"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}