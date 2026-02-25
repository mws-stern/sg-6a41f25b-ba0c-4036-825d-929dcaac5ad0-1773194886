import { SEO } from "@/components/SEO";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { ArrowLeft, Plus, Trash2, Send, Save } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { getProducts, getCustomers, addOrder, getSettings } from "@/lib/store";
import type { Product, Customer, OrderItem } from "@/types";

export default function NewOrderPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [items, setItems] = useState<OrderItem[]>([]);
  const [notes, setNotes] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [orderDiscount, setOrderDiscount] = useState("");
  const [orderDiscountType, setOrderDiscountType] = useState<"percent" | "fixed">("percent");

  useEffect(() => {
    setMounted(true);
    setProducts(getProducts());
    setCustomers(getCustomers());
  }, []);

  const addItem = () => {
    if (products.length === 0) return;
    setItems([...items, {
      productId: products[0].id,
      productName: products[0].name,
      productNameHebrew: products[0].nameHebrew,
      quantity: 0,
      pricePerLb: products[0].pricePerLb,
      totalPrice: 0,
    }]);
  };

  const updateItem = (index: number, field: keyof OrderItem, value: any) => {
    const newItems = [...items];
    if (field === "productId") {
      const product = products.find(p => p.id === value);
      if (product) {
        newItems[index] = {
          ...newItems[index],
          productId: product.id,
          productName: product.name,
          productNameHebrew: product.nameHebrew,
          pricePerLb: product.pricePerLb,
          totalPrice: product.pricePerLb * newItems[index].quantity,
        };
      }
    } else if (field === "quantity") {
      const qty = parseFloat(value) || 0;
      newItems[index].quantity = qty;
      const basePrice = newItems[index].pricePerLb * qty;
      
      if (newItems[index].discount && newItems[index].discountType) {
        if (newItems[index].discountType === "percent") {
          newItems[index].finalPrice = basePrice * (1 - (newItems[index].discount! / 100));
        } else {
          newItems[index].finalPrice = basePrice - newItems[index].discount!;
        }
      } else {
        newItems[index].totalPrice = basePrice;
      }
    } else if (field === "discount") {
      const discountValue = parseFloat(value) || 0;
      newItems[index].discount = discountValue > 0 ? discountValue : undefined;
      const basePrice = newItems[index].pricePerLb * newItems[index].quantity;
      
      if (discountValue > 0) {
        if (newItems[index].discountType === "percent") {
          newItems[index].finalPrice = basePrice * (1 - (discountValue / 100));
        } else {
          newItems[index].finalPrice = basePrice - discountValue;
        }
      } else {
        newItems[index].finalPrice = undefined;
        newItems[index].totalPrice = basePrice;
      }
    } else if (field === "discountType") {
      newItems[index].discountType = value;
      const basePrice = newItems[index].pricePerLb * newItems[index].quantity;
      
      if (newItems[index].discount) {
        if (value === "percent") {
          newItems[index].finalPrice = basePrice * (1 - (newItems[index].discount! / 100));
        } else {
          newItems[index].finalPrice = basePrice - newItems[index].discount!;
        }
      }
    } else {
      (newItems[index] as any)[field] = value;
    }
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => {
      return sum + (item.finalPrice ?? item.totalPrice);
    }, 0);
  };

  const calculateDiscount = () => {
    if (!orderDiscount || parseFloat(orderDiscount) <= 0) return 0;
    const subtotal = calculateSubtotal();
    if (orderDiscountType === "percent") {
      return subtotal * (parseFloat(orderDiscount) / 100);
    }
    return parseFloat(orderDiscount);
  };

  const calculateTax = () => {
    const settings = getSettings();
    const afterDiscount = calculateSubtotal() - calculateDiscount();
    return afterDiscount * (settings.taxRate / 100);
  };

  const calculateTotal = () => {
    return calculateSubtotal() - calculateDiscount() + calculateTax();
  };

  const getProductStock = (productId: string) => {
    const product = products.find(p => p.id === productId);
    return product?.currentInventory || 0;
  };

  const handleSubmit = (status: "draft" | "pending") => {
    if (!selectedCustomerId) {
      toast({
        title: "Error",
        description: "Please select a customer",
        variant: "destructive",
      });
      return;
    }

    if (items.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one item",
        variant: "destructive",
      });
      return;
    }

    const customer = customers.find(c => c.id === selectedCustomerId);
    if (!customer) return;

    const discount = parseFloat(orderDiscount) || undefined;

    const order = addOrder({
      customerId: customer.id,
      customerName: customer.name,
      customerEmail: customer.email,
      items,
      subtotal: calculateSubtotal(),
      tax: calculateTax(),
      total: calculateTotal(),
      discount,
      discountType: discount ? orderDiscountType : undefined,
      status,
      notes,
      deliveryDate: deliveryDate || undefined,
    });

    toast({
      title: status === "draft" ? "Draft Saved" : "Order Created",
      description: `Order ${order.orderNumber} has been ${status === "draft" ? "saved as draft" : "created successfully"}`,
    });

    router.push(`/orders/${order.id}`);
  };

  if (!mounted) {
    return null;
  }

  return (
    <>
      <SEO title="New Order - Satmar Montreal Matzos" />
      
      <div className="container mx-auto px-6 py-8">
        <div className="mb-6 flex items-center gap-4">
          <Link href="/orders">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: "'Frank Ruhl Libre', serif" }}>
              New Order
            </h1>
            <p className="text-gray-600" style={{ fontFamily: "'Heebo', sans-serif" }}>Create a new customer order</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-amber-200">
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Select Customer</Label>
                  <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name} - {customer.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {customers.length === 0 && (
                  <div className="text-center py-4">
                    <p className="text-gray-600 mb-3">No customers found</p>
                    <Link href="/customers/new">
                      <Button variant="outline" size="sm">Add First Customer</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-amber-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Order Items</CardTitle>
                  <Button onClick={addItem} size="sm" className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {items.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No items added yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {items.map((item, index) => {
                      const stock = getProductStock(item.productId);
                      const product = products.find(p => p.id === item.productId);
                      const basePrice = item.pricePerLb * item.quantity;
                      const finalPrice = item.finalPrice ?? item.totalPrice;
                      
                      return (
                        <div key={index} className="p-4 bg-amber-50 rounded-lg border border-amber-200 space-y-4">
                          <div className="flex gap-4 items-start">
                            <div className="flex-1 grid grid-cols-3 gap-4">
                              <div>
                                <Label>Product</Label>
                                <Select
                                  value={item.productId}
                                  onValueChange={(value) => updateItem(index, "productId", value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {products.map((product) => (
                                      <SelectItem key={product.id} value={product.id}>
                                        <div className="flex items-center justify-between w-full gap-4">
                                          <span>{product.name}</span>
                                          <span className="text-sm text-muted-foreground" dir="rtl" style={{ fontFamily: "'Heebo', sans-serif" }}>
                                            {product.nameHebrew}
                                          </span>
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Stock: {stock.toFixed(1)} lbs
                                </p>
                              </div>
                              <div>
                                <Label>Quantity (lbs)</Label>
                                <Input
                                  type="number"
                                  step="0.5"
                                  min="0"
                                  placeholder="0"
                                  value={item.quantity || ""}
                                  onChange={(e) => updateItem(index, "quantity", e.target.value)}
                                />
                              </div>
                              <div>
                                <Label>Price</Label>
                                <Input
                                  value={`$${basePrice.toFixed(2)}`}
                                  disabled
                                  className="bg-white"
                                />
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeItem(index)}
                              className="mt-6"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>

                          <div className="border-t border-amber-300 pt-4">
                            <Label className="mb-2 block">Item Discount (Optional)</Label>
                            <div className="grid grid-cols-3 gap-4">
                              <RadioGroup
                                value={item.discountType || "percent"}
                                onValueChange={(value) => updateItem(index, "discountType", value)}
                                className="flex gap-4"
                              >
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="percent" id={`percent-${index}`} />
                                  <Label htmlFor={`percent-${index}`}>Percent %</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="fixed" id={`fixed-${index}`} />
                                  <Label htmlFor={`fixed-${index}`}>Fixed $</Label>
                                </div>
                              </RadioGroup>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder={item.discountType === "percent" ? "0%" : "$0.00"}
                                value={item.discount || ""}
                                onChange={(e) => updateItem(index, "discount", e.target.value)}
                              />
                              <div>
                                <Input
                                  value={`Final: $${finalPrice.toFixed(2)}`}
                                  disabled
                                  className="bg-white font-semibold"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-amber-200">
              <CardHeader>
                <CardTitle>Additional Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="delivery-date">Delivery Date (Optional)</Label>
                  <Input
                    id="delivery-date"
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Order Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Special instructions, delivery notes, etc."
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="border-amber-200 sticky top-6">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal:</span>
                    <span>${calculateSubtotal().toFixed(2)}</span>
                  </div>
                  
                  <div className="border-t border-amber-200 pt-2">
                    <Label className="mb-2 block">Order Discount (Optional)</Label>
                    <RadioGroup
                      value={orderDiscountType}
                      onValueChange={(value: "percent" | "fixed") => setOrderDiscountType(value)}
                      className="flex gap-4 mb-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="percent" id="order-percent" />
                        <Label htmlFor="order-percent">Percent %</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="fixed" id="order-fixed" />
                        <Label htmlFor="order-fixed">Fixed $</Label>
                      </div>
                    </RadioGroup>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder={orderDiscountType === "percent" ? "0%" : "$0.00"}
                      value={orderDiscount}
                      onChange={(e) => setOrderDiscount(e.target.value)}
                    />
                  </div>
                  
                  {calculateDiscount() > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount:</span>
                      <span>-${calculateDiscount().toFixed(2)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-gray-600">
                    <span>Tax:</span>
                    <span>${calculateTax().toFixed(2)}</span>
                  </div>
                  <div className="border-t border-amber-200 pt-2">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span>${calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Button
                    onClick={() => handleSubmit("pending")}
                    className="w-full gap-2 bg-gradient-to-r from-blue-600 to-blue-700"
                    disabled={!selectedCustomerId || items.length === 0}
                  >
                    <Send className="w-4 h-4" />
                    Create Order
                  </Button>
                  <Button
                    onClick={() => handleSubmit("draft")}
                    variant="outline"
                    className="w-full gap-2"
                    disabled={!selectedCustomerId || items.length === 0}
                  >
                    <Save className="w-4 h-4" />
                    Save as Draft
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}