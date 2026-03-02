import { SEO } from "@/components/SEO";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { ArrowLeft, FileText, Mail, Printer, DollarSign, CreditCard, Receipt, Edit, Save, X, CheckCircle, Trash2, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { getOrder, updateOrder, createInvoiceFromOrder, addPayment, getPaymentsByOrder, updatePaymentConfirmation, getProducts, getCustomer } from "@/lib/store";
import { emailService } from "@/services/emailService";
import type { Order, Payment, Product, Customer } from "@/types";

export default function OrderDetailsPage() {
  const router = useRouter();
  const { id } = router.query;
  const { toast } = useToast();
  const [order, setOrder] = useState<Order | undefined>(undefined);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [mounted, setMounted] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editedOrder, setEditedOrder] = useState<Order | undefined>(undefined);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  
  const [paymentData, setPaymentData] = useState({
    amount: "",
    paymentMethod: "cash" as Payment["paymentMethod"],
    paymentDate: new Date().toISOString().split("T")[0],
    notes: "",
    creditCardNumber: "",
    creditCardExpiry: "",
    creditCardCVV: "",
    checkNumber: "",
    eTransferReference: "",
    voucherCode: "",
    confirmed: false,
  });

  useEffect(() => {
    setMounted(true);
    setProducts(getProducts());
    if (id && typeof id === "string") {
      const foundOrder = getOrder(id);
      setOrder(foundOrder);
      setEditedOrder(foundOrder);
      if (foundOrder) {
        setPayments(getPaymentsByOrder(foundOrder.id));
        const foundCustomer = getCustomer(foundOrder.customerId);
        setCustomer(foundCustomer || null);
      }
    }
  }, [id]);

  const handleStatusChange = (newStatus: Order["status"]) => {
    if (!order) return;
    const updatedOrder = { ...order, status: newStatus };
    updateOrder(updatedOrder);
    setOrder(updatedOrder);
    setEditedOrder(updatedOrder);
    toast({
      title: "Status Updated",
      description: `Order status changed to ${newStatus}`,
    });
  };

  const handleEditOrder = () => {
    setEditMode(true);
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setEditedOrder(order);
  };

  const handleSaveEdit = () => {
    if (!editedOrder) return;
    
    // Recalculate totals
    const subtotal = editedOrder.items.reduce((sum, item) => {
      const itemTotal = item.quantity * item.pricePerLb;
      const discountAmount = item.discount 
        ? (item.discountType === "percent" ? itemTotal * (item.discount / 100) : item.discount)
        : 0;
      return sum + (itemTotal - discountAmount);
    }, 0);
    
    const discount = editedOrder.discount || 0;
    const discountAmount = editedOrder.discountType === "percent" 
      ? subtotal * (discount / 100) 
      : discount;
    
    const afterDiscount = subtotal - discountAmount;
    const tax = afterDiscount * 0; // Tax rate from settings if needed
    const total = afterDiscount + tax;
    
    const updatedOrder = {
      ...editedOrder,
      subtotal,
      tax,
      total,
      amountDue: total - (editedOrder.amountPaid || 0),
    };
    
    updateOrder(updatedOrder);
    setOrder(updatedOrder);
    setEditedOrder(updatedOrder);
    setEditMode(false);
    
    toast({
      title: "Order Updated",
      description: "Order has been successfully updated",
    });
  };

  const handleItemChange = (index: number, field: keyof Order["items"][0], value: any) => {
    if (!editedOrder) return;
    const newItems = [...editedOrder.items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Recalculate item total
    if (field === "quantity" || field === "pricePerLb") {
      newItems[index].totalPrice = newItems[index].quantity * newItems[index].pricePerLb;
      
      // Apply discount if exists
      if (newItems[index].discount) {
        const discountAmount = newItems[index].discountType === "percent"
          ? newItems[index].totalPrice * (newItems[index].discount! / 100)
          : newItems[index].discount!;
        newItems[index].finalPrice = newItems[index].totalPrice - discountAmount;
      } else {
        newItems[index].finalPrice = newItems[index].totalPrice;
      }
    }
    
    setEditedOrder({ ...editedOrder, items: newItems });
  };

  const handleRemoveItem = (index: number) => {
    if (!editedOrder) return;
    const newItems = editedOrder.items.filter((_, i) => i !== index);
    setEditedOrder({ ...editedOrder, items: newItems });
  };

  const handleAddItem = () => {
    if (!editedOrder || products.length === 0) return;
    const firstProduct = products[0];
    const newItem = {
      productId: firstProduct.id,
      productName: firstProduct.name,
      productNameHebrew: firstProduct.nameHebrew,
      quantity: 1,
      pricePerLb: firstProduct.pricePerLb,
      totalPrice: firstProduct.pricePerLb,
      finalPrice: firstProduct.pricePerLb,
    };
    setEditedOrder({ ...editedOrder, items: [...editedOrder.items, newItem] });
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

  const handleRecordPayment = () => {
    if (!order) return;
    
    const amount = parseFloat(paymentData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid payment amount",
        variant: "destructive",
      });
      return;
    }

    if (amount > order.amountDue) {
      toast({
        title: "Amount Too High",
        description: `Payment amount cannot exceed the amount due ($${order.amountDue.toFixed(2)})`,
        variant: "destructive",
      });
      return;
    }

    // Validate credit card fields if payment method is credit card
    if (paymentData.paymentMethod === "credit_card") {
      if (!paymentData.creditCardNumber || paymentData.creditCardNumber.length < 15) {
        toast({
          title: "Invalid Card Number",
          description: "Please enter a valid credit card number",
          variant: "destructive",
        });
        return;
      }
      if (!paymentData.creditCardExpiry || !/^\d{2}\/\d{2}$/.test(paymentData.creditCardExpiry)) {
        toast({
          title: "Invalid Expiration",
          description: "Please enter expiration in MM/YY format",
          variant: "destructive",
        });
        return;
      }
      if (!paymentData.creditCardCVV || paymentData.creditCardCVV.length < 3) {
        toast({
          title: "Invalid CVV",
          description: "Please enter a valid CVV code",
          variant: "destructive",
        });
        return;
      }
    }

    const payment = addPayment({
      orderId: order.id,
      amount,
      paymentMethod: paymentData.paymentMethod,
      paymentDate: paymentData.paymentDate,
      notes: paymentData.notes,
      creditCardNumber: paymentData.paymentMethod === "credit_card" ? paymentData.creditCardNumber : undefined,
      creditCardExpiry: paymentData.paymentMethod === "credit_card" ? paymentData.creditCardExpiry : undefined,
      creditCardCVV: paymentData.paymentMethod === "credit_card" ? paymentData.creditCardCVV : undefined,
      checkNumber: paymentData.paymentMethod === "check" ? paymentData.checkNumber : undefined,
      eTransferReference: paymentData.paymentMethod === "e_transfer" ? paymentData.eTransferReference : undefined,
      voucherCode: paymentData.paymentMethod === "voucher" ? paymentData.voucherCode : undefined,
      confirmed: paymentData.confirmed,
    });

    const updatedOrder = getOrder(order.id);
    if (updatedOrder) {
      setOrder(updatedOrder);
      setEditedOrder(updatedOrder);
      setPayments(getPaymentsByOrder(updatedOrder.id));
    }

    toast({
      title: "Payment Recorded",
      description: `Payment of $${amount.toFixed(2)} has been recorded${paymentData.confirmed ? " and confirmed" : ""}`,
    });

    setPaymentDialogOpen(false);
    setPaymentData({
      amount: "",
      paymentMethod: "cash",
      paymentDate: new Date().toISOString().split("T")[0],
      notes: "",
      creditCardNumber: "",
      creditCardExpiry: "",
      creditCardCVV: "",
      checkNumber: "",
      eTransferReference: "",
      voucherCode: "",
      confirmed: false,
    });
  };

  const handlePaymentConfirmation = (paymentId: string, confirmed: boolean) => {
    updatePaymentConfirmation(paymentId, confirmed);
    setPayments(getPaymentsByOrder(order!.id));
    toast({
      title: confirmed ? "Payment Confirmed" : "Confirmation Removed",
      description: confirmed 
        ? "Payment has been marked as charged with timestamp" 
        : "Payment confirmation has been removed",
    });
  };

  const getPaymentMethodLabel = (method: Payment["paymentMethod"]) => {
    const labels = {
      credit_card: "Credit Card",
      cash: "Cash",
      e_transfer: "E-Transfer",
      check: "Check",
      voucher: "Voucher",
    };
    return labels[method];
  };

  const getPaymentStatusBadge = (status: Order["paymentStatus"]) => {
    const variants = {
      unpaid: "destructive",
      partial: "default",
      paid: "default",
    } as const;

    const labels = {
      unpaid: "Unpaid",
      partial: "Partial Payment",
      paid: "Paid in Full",
    };

    return (
      <Badge variant={variants[status]} className={status === "paid" ? "bg-green-600" : ""}>
        {labels[status]}
      </Badge>
    );
  };

  const handleSendEmail = async () => {
    if (!order || !customer) return;
    
    setIsSendingEmail(true);
    try {
      const result = await emailService.sendOrderConfirmation(order, customer);
      
      if (result.success) {
        toast({
          title: "Email Sent",
          description: result.message,
        });
      } else {
        toast({
          title: "Email Failed",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send email. Check console for details.",
        variant: "destructive",
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  if (!mounted) return null;
  if (!order) return <div>Order not found</div>;

  const displayOrder = editMode ? editedOrder! : order;

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
                Placed on {new Date(order.createdAt).toLocaleDateString()} at {order.orderTime}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {!editMode ? (
              <>
                <Button variant="outline" onClick={handleEditOrder} className="gap-2">
                  <Edit className="w-4 h-4" />
                  Edit Order
                </Button>
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
              </>
            ) : (
              <>
                <Button variant="outline" onClick={handleCancelEdit} className="gap-2">
                  <X className="w-4 h-4" />
                  Cancel
                </Button>
                <Button onClick={handleSaveEdit} className="gap-2 bg-green-600 hover:bg-green-700">
                  <Save className="w-4 h-4" />
                  Save Changes
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-amber-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Order Items</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-lg">
                      {displayOrder.items.length} Items
                    </Badge>
                    {editMode && (
                      <Button onClick={handleAddItem} size="sm" variant="outline">
                        Add Item
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {displayOrder.items.map((item, index) => (
                    <div key={index} className="p-4 bg-amber-50 rounded-lg border border-amber-100">
                      {editMode ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Select
                              value={item.productId}
                              onValueChange={(val) => {
                                const product = products.find(p => p.id === val);
                                if (product) {
                                  handleItemChange(index, "productId", val);
                                  handleItemChange(index, "productName", product.name);
                                  handleItemChange(index, "productNameHebrew", product.nameHebrew);
                                  handleItemChange(index, "pricePerLb", product.pricePerLb);
                                }
                              }}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {products.map((p) => (
                                  <SelectItem key={p.id} value={p.id}>
                                    {p.name} - ${p.pricePerLb.toFixed(2)}/lb
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button 
                              variant="destructive" 
                              size="sm" 
                              onClick={() => handleRemoveItem(index)}
                              className="ml-2"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs">Quantity (lbs)</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={item.quantity}
                                onChange={(e) => handleItemChange(index, "quantity", parseFloat(e.target.value) || 0)}
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Price/lb</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={item.pricePerLb}
                                onChange={(e) => handleItemChange(index, "pricePerLb", parseFloat(e.target.value) || 0)}
                              />
                            </div>
                          </div>
                          <div className="text-right font-bold">
                            Total: ${(item.finalPrice || item.totalPrice).toFixed(2)}
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-semibold text-gray-900">{item.productName}</p>
                            {item.productNameHebrew && (
                              <p className="text-sm text-gray-600 font-heebo" dir="rtl">{item.productNameHebrew}</p>
                            )}
                            <p className="text-sm text-gray-600">
                              {item.quantity} lbs @ ${item.pricePerLb.toFixed(2)}/lb
                            </p>
                            {item.discount && (
                              <p className="text-sm text-green-600">
                                Discount: {item.discountType === "percent" ? `${item.discount}%` : `$${item.discount.toFixed(2)}`}
                              </p>
                            )}
                          </div>
                          <p className="font-bold text-gray-900">
                            ${(item.finalPrice || item.totalPrice).toFixed(2)}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-6 space-y-2 border-t border-amber-200 pt-4">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>${displayOrder.subtotal.toFixed(2)}</span>
                  </div>
                  {displayOrder.discount && (
                    <div className="flex justify-between text-green-600">
                      <span>Order Discount</span>
                      <span>-${displayOrder.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-600">
                    <span>Tax</span>
                    <span>${displayOrder.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t border-dashed border-amber-200">
                    <span>Total</span>
                    <span>${displayOrder.total.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {payments.length > 0 && (
              <Card className="border-green-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="w-5 h-5" />
                    Payment History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {payments.map((payment) => (
                      <div key={payment.id} className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
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
                          <div className="text-right">
                            <p className="text-sm text-gray-500 mb-2">
                              {new Date(payment.paymentDate).toLocaleDateString()}
                            </p>
                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={payment.confirmed}
                                onCheckedChange={(checked) => handlePaymentConfirmation(payment.id, checked as boolean)}
                              />
                              <Label className="text-xs">Charged</Label>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {order.notes && (
              <Card className="border-amber-200">
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  {editMode ? (
                    <Textarea
                      value={editedOrder?.notes || ""}
                      onChange={(e) => setEditedOrder({ ...editedOrder!, notes: e.target.value })}
                      rows={4}
                    />
                  ) : (
                    <p className="text-gray-700">{order.notes}</p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card className="border-amber-200">
              <CardHeader>
                <CardTitle>Order Status</CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  value={order.status}
                  onValueChange={(val: any) => handleStatusChange(val)}
                  disabled={editMode}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
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

            <Card className="border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Payment Status
                  {getPaymentStatusBadge(order.paymentStatus)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Amount</span>
                    <span className="font-semibold">${order.total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Amount Paid</span>
                    <span className="font-semibold text-green-600">${order.amountPaid.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg border-t pt-2">
                    <span className="font-bold">Amount Due</span>
                    <span className="font-bold text-red-600">${order.amountDue.toFixed(2)}</span>
                  </div>
                </div>

                {order.amountDue > 0 && !editMode && (
                  <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full gap-2 bg-green-600 hover:bg-green-700">
                        <DollarSign className="w-4 h-4" />
                        Record Payment
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Record Payment</DialogTitle>
                        <DialogDescription>
                          Enter payment details for order {order.orderNumber}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="amount">Payment Amount</Label>
                          <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={paymentData.amount}
                            onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                          />
                          <p className="text-sm text-gray-500">
                            Amount due: ${order.amountDue.toFixed(2)}
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="paymentMethod">Payment Method</Label>
                          <Select
                            value={paymentData.paymentMethod}
                            onValueChange={(val: any) => setPaymentData({ ...paymentData, paymentMethod: val })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="cash">Cash</SelectItem>
                              <SelectItem value="credit_card">Credit Card</SelectItem>
                              <SelectItem value="check">Check</SelectItem>
                              <SelectItem value="e_transfer">E-Transfer</SelectItem>
                              <SelectItem value="voucher">Voucher</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {paymentData.paymentMethod === "credit_card" && (
                          <>
                            <div className="space-y-2">
                              <Label htmlFor="creditCard">Credit Card Number</Label>
                              <Input
                                id="creditCard"
                                placeholder="1234 5678 9012 3456"
                                value={paymentData.creditCardNumber}
                                onChange={(e) => setPaymentData({ ...paymentData, creditCardNumber: e.target.value })}
                                maxLength={19}
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-2">
                                <Label htmlFor="expiry">Expiration (MM/YY)</Label>
                                <Input
                                  id="expiry"
                                  placeholder="12/25"
                                  value={paymentData.creditCardExpiry}
                                  onChange={(e) => {
                                    let value = e.target.value.replace(/\D/g, "");
                                    if (value.length >= 2) {
                                      value = value.slice(0, 2) + "/" + value.slice(2, 4);
                                    }
                                    setPaymentData({ ...paymentData, creditCardExpiry: value });
                                  }}
                                  maxLength={5}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="cvv">CVV</Label>
                                <Input
                                  id="cvv"
                                  placeholder="123"
                                  value={paymentData.creditCardCVV}
                                  onChange={(e) => setPaymentData({ ...paymentData, creditCardCVV: e.target.value.replace(/\D/g, "") })}
                                  maxLength={4}
                                />
                              </div>
                            </div>
                          </>
                        )}

                        {paymentData.paymentMethod === "check" && (
                          <div className="space-y-2">
                            <Label htmlFor="checkNumber">Check Number</Label>
                            <Input
                              id="checkNumber"
                              placeholder="Check #"
                              value={paymentData.checkNumber}
                              onChange={(e) => setPaymentData({ ...paymentData, checkNumber: e.target.value })}
                            />
                          </div>
                        )}

                        {paymentData.paymentMethod === "e_transfer" && (
                          <div className="space-y-2">
                            <Label htmlFor="eTransfer">E-Transfer Reference</Label>
                            <Input
                              id="eTransfer"
                              placeholder="Reference/Confirmation #"
                              value={paymentData.eTransferReference}
                              onChange={(e) => setPaymentData({ ...paymentData, eTransferReference: e.target.value })}
                            />
                          </div>
                        )}

                        {paymentData.paymentMethod === "voucher" && (
                          <div className="space-y-2">
                            <Label htmlFor="voucher">Voucher Code</Label>
                            <Input
                              id="voucher"
                              placeholder="Voucher Code"
                              value={paymentData.voucherCode}
                              onChange={(e) => setPaymentData({ ...paymentData, voucherCode: e.target.value })}
                            />
                          </div>
                        )}

                        <div className="space-y-2">
                          <Label htmlFor="paymentDate">Payment Date</Label>
                          <Input
                            id="paymentDate"
                            type="date"
                            value={paymentData.paymentDate}
                            onChange={(e) => setPaymentData({ ...paymentData, paymentDate: e.target.value })}
                          />
                        </div>

                        <div className="flex items-center space-x-2 p-3 bg-green-50 rounded-lg border border-green-200">
                          <Checkbox
                            id="confirmed"
                            checked={paymentData.confirmed}
                            onCheckedChange={(checked) => setPaymentData({ ...paymentData, confirmed: checked as boolean })}
                          />
                          <Label htmlFor="confirmed" className="cursor-pointer">
                            Mark as charged (records timestamp)
                          </Label>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="notes">Notes (Optional)</Label>
                          <Textarea
                            id="notes"
                            placeholder="Additional notes..."
                            value={paymentData.notes}
                            onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                            rows={3}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleRecordPayment} className="bg-green-600 hover:bg-green-700">
                          Record Payment
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
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