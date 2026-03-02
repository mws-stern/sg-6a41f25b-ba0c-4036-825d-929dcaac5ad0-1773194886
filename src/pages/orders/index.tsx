import { SEO } from "@/components/SEO";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Eye, FileText, Trash2, CheckCircle, Clock, Package, Truck, XCircle, CheckSquare, Square, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabaseService } from "@/services/supabaseService";
import type { Order } from "@/types";

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [mounted, setMounted] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
    loadOrders();
  }, []);

  const loadOrders = async () => {
    const data = await supabaseService.getOrders();
    setOrders(data);
  };

  const filteredOrders = orders.filter(order => {
    if (statusFilter === "all") return true;
    return order.status === statusFilter;
  });

  const toggleSelectAll = () => {
    if (selectedOrders.length === filteredOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(filteredOrders.map(o => o.id));
    }
  };

  const toggleSelectOrder = (orderId: string) => {
    if (selectedOrders.includes(orderId)) {
      setSelectedOrders(selectedOrders.filter(id => id !== orderId));
    } else {
      setSelectedOrders([...selectedOrders, orderId]);
    }
  };

  const handleBulkStatusUpdate = async (newStatus: Order["status"]) => {
    const ordersToUpdate = orders.filter(o => selectedOrders.includes(o.id));
    
    await Promise.all(ordersToUpdate.map(order => {
      return supabaseService.updateOrder({ ...order, status: newStatus });
    }));

    await loadOrders();
    setSelectedOrders([]);
    toast({
      title: "Bulk Update Complete",
      description: `${ordersToUpdate.length} orders updated to ${newStatus}`,
    });
  };

  const handleBulkInvoiceGeneration = async () => {
    const ordersToProcess = orders.filter(o => selectedOrders.includes(o.id));
    
    // Fetch existing invoices to avoid duplicates? 
    // For now, just generate. Service logic can be improved later to check.
    
    await Promise.all(ordersToProcess.map(order => {
      return supabaseService.createInvoiceFromOrder(order);
    }));

    await loadOrders();
    setSelectedOrders([]);
    toast({
      title: "Invoices Generated",
      description: `${ordersToProcess.length} invoices created successfully`,
    });
  };

  const getStatusIcon = (status: Order["status"]) => {
    switch (status) {
      case "pending": return <Clock className="w-4 h-4" />;
      case "confirmed": return <CheckCircle className="w-4 h-4" />;
      case "preparing": return <Package className="w-4 h-4" />;
      case "ready": return <Truck className="w-4 h-4" />;
      case "delivered": return <CheckCircle className="w-4 h-4" />;
      case "cancelled": return <XCircle className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "confirmed": return "bg-blue-100 text-blue-800";
      case "preparing": return "bg-purple-100 text-purple-800";
      case "ready": return "bg-green-100 text-green-800";
      case "delivered": return "bg-gray-100 text-gray-800";
      case "cancelled": return "bg-red-100 text-red-800";
    }
  };

  if (!mounted) {
    return null;
  }

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
            <Button className="gap-2 bg-gradient-to-r from-blue-600 to-blue-700">
              <Plus className="w-4 h-4" />
              New Order
            </Button>
          </Link>
        </div>

        {/* Filters and Bulk Actions */}
        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Orders</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="preparing">Preparing</SelectItem>
                <SelectItem value="ready">Ready</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            {selectedOrders.length > 0 && (
              <Badge variant="secondary">{selectedOrders.length} selected</Badge>
            )}
          </div>

          {selectedOrders.length > 0 && (
            <div className="flex items-center gap-2">
              <Select onValueChange={handleBulkStatusUpdate}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Update Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="confirmed">Mark Confirmed</SelectItem>
                  <SelectItem value="preparing">Mark Preparing</SelectItem>
                  <SelectItem value="ready">Mark Ready</SelectItem>
                  <SelectItem value="delivered">Mark Delivered</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleBulkInvoiceGeneration} variant="outline" className="gap-2">
                <FileText className="w-4 h-4" />
                Generate Invoices
              </Button>
            </div>
          )}
        </div>

        {filteredOrders.length === 0 ? (
          <Card className="border-amber-200">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Package className="w-16 h-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {statusFilter === "all" ? "No orders yet" : `No ${statusFilter} orders`}
              </h3>
              <p className="text-gray-600 mb-6">
                {statusFilter === "all" ? "Create your first order to get started" : "Try a different filter"}
              </p>
              {statusFilter === "all" && (
                <Link href="/orders/new">
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Create First Order
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Select All Checkbox */}
            <div className="mb-2 flex items-center gap-2 px-2">
              <Checkbox
                checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                onCheckedChange={toggleSelectAll}
              />
              <span className="text-sm text-gray-600">Select All</span>
            </div>

            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <Card key={order.id} className="border-amber-200 hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <Checkbox
                        checked={selectedOrders.includes(order.id)}
                        onCheckedChange={() => toggleSelectOrder(order.id)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {order.orderNumber}
                          </h3>
                          <Badge className={getStatusColor(order.status)}>
                            <span className="flex items-center gap-1">
                              {getStatusIcon(order.status)}
                              {order.status}
                            </span>
                          </Badge>
                        </div>
                        <p className="text-gray-600 mb-1">{order.customerName}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString()} • {order.items.length} items
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-2xl font-bold text-gray-900">
                            ${order.total.toFixed(2)}
                          </p>
                          <p className="text-sm text-gray-600">
                            {order.items.reduce((sum, item) => sum + item.quantity, 0)} lbs total
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Link href={`/orders/${order.id}`}>
                            <Button variant="outline" size="icon">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Link href={`/invoices/${order.id}`}>
                            <Button variant="outline" size="icon">
                              <FileText className="w-4 h-4" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}