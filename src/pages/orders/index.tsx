import { SEO } from "@/components/SEO";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Search, FileText, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabaseService } from "@/services/supabaseService";
import type { Order, Customer } from "@/types";
import { format } from "date-fns";

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [ordersData, customersData] = await Promise.all([
      supabaseService.getOrders(),
      supabaseService.getCustomers()
    ]);
    setOrders(ordersData);
    setCustomers(customersData);
    setLoading(false);
  };

  const getCustomerName = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    return customer?.name || "Unknown Customer";
  };

  const filteredOrders = orders.filter((order) => {
    const query = searchQuery.toLowerCase();
    const customerName = getCustomerName(order.customerId).toLowerCase();
    return (
      order.orderNumber.toLowerCase().includes(query) ||
      customerName.includes(query) ||
      order.status.toLowerCase().includes(query)
    );
  });

  const sortedOrders = [...filteredOrders].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === "pending").length,
    confirmed: orders.filter(o => o.status === "confirmed").length,
    delivered: orders.filter(o => o.status === "delivered").length,
    totalRevenue: orders.reduce((sum, o) => sum + o.total, 0),
    paid: orders.filter(o => o.paymentStatus === "paid").length,
  };

  return (
    <>
      <SEO title="Orders - Satmar Montreal Matzos" />
      
      <div className="container mx-auto px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
              <p className="text-gray-600">Manage customer orders and deliveries</p>
            </div>
          </div>
          <Link href="/orders/new">
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              New Order
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">{stats.pending}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Confirmed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{stats.confirmed}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">${stats.totalRevenue.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search orders by order number, customer, or status..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sortedOrders.length === 0 ? (
                <p className="text-center py-8 text-gray-500">No orders found</p>
              ) : (
                sortedOrders.map((order) => (
                  <Link key={order.id} href={`/orders/${order.id}`}>
                    <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-semibold text-lg">{order.orderNumber}</div>
                          <div className="text-sm text-gray-600">{getCustomerName(order.customerId)}</div>
                          <div className="text-sm text-gray-500">
                            {format(new Date(order.createdAt), "MMM d, yyyy 'at' h:mm a")}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-xl text-green-600">${order.total.toFixed(2)}</div>
                          <div className="flex gap-2 mt-2">
                            <Badge variant={order.status === "delivered" ? "default" : "outline"}>
                              {order.status}
                            </Badge>
                            <Badge variant={order.paymentStatus === "paid" ? "default" : "secondary"}>
                              {order.paymentStatus}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      {order.deliveryDate && (
                        <div className="text-sm text-gray-600 mt-2">
                          Delivery: {format(new Date(order.deliveryDate), "MMM d, yyyy")}
                        </div>
                      )}
                    </div>
                  </Link>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}