import { SEO } from "@/components/SEO";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { ArrowLeft, Plus, Trash2, Send } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
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
      quantity: 1,
      pricePerLb: products[0].pricePerLb,
      totalPrice: products[0].pricePerLb,
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
          pricePerLb: product.pricePerLb,
          totalPrice: product.pricePerLb * newItems[index].quantity,
        };
      }
    } else if (field === "quantity") {
      newItems[index].quantity = parseFloat(value) || 0;
      newItems[index].totalPrice = newItems[index].pricePerLb * newItems[index].quantity;
    } else {
      (newItems[index] as any)[field] = value;
    }
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + item.totalPrice, 0);
  };

  const calculateTax = () => {
    const settings = getSettings();
    return calculateSubtotal() * (settings.taxRate / 100);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const handleSubmit = () => {
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

    const order = addOrder({
      customerId: customer.id,
      customerName: customer.name,
      customerEmail: customer.email,
      items,
      subtotal: calculateSubtotal(),
      tax: calculateTax(),
      total: calculateTotal(),
      status: "pending",
      notes,
      deliveryDate: deliveryDate || undefined,
    });

    toast({
      title: "Order Created",
      description: `Order ${order.orderNumber} has been created successfully`,
    });

    router.push(`/orders/${order.id}`);
  };

  if (!mounted) {
    return null;
  }

  return (
    <>
      <SEO title="New Order - Satmar Montreal Matzos" />
      
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
        <div className="container mx-auto px-6 py-8">
          <div className="mb-6 flex items-center gap-4">
            <Link href="/orders">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">New Order</h1>
              <p className="text-gray-600">Create a new customer order</p>
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
                      {items.map((item, index) => (
                        <div key={index} className="flex gap-4 items-start p-4 bg-amber-50 rounded-lg">
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
                                      {product.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Quantity (lbs)</Label>
                              <Input
                                type="number"
                                step="0.5"
                                min="0"
                                value={item.quantity}
                                onChange={(e) => updateItem(index, "quantity", e.target.value)}
                              />
                            </div>
                            <div>
                              <Label>Total</Label>
                              <Input
                                value={`$${item.totalPrice.toFixed(2)}`}
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
                      ))}
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
                  <Button
                    onClick={handleSubmit}
                    className="w-full gap-2 bg-gradient-to-r from-blue-600 to-blue-700"
                    disabled={!selectedCustomerId || items.length === 0}
                  >
                    <Send className="w-4 h-4" />
                    Create Order
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}