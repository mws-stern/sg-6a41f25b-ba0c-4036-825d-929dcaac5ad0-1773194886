import { useEffect, useState } from "react";
import { SEO } from "@/components/SEO";
import useStore from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Package,
  Users,
  ShoppingCart,
  TrendingUp,
  AlertCircle,
  DollarSign,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";

// Lazy load heavy components
const AlertsPanel = dynamic(() => import("@/components/AlertsPanel").then(mod => mod.AlertsPanel), {
  ssr: false,
  loading: () => <div className="h-48 bg-muted animate-pulse rounded-lg" />
});

export default function Dashboard() {
  const {
    products,
    customers,
    orders,
    isLoading,
    isInitialized,
    initialize,
    getTotalRevenue,
    getPendingOrders,
    getCompletedOrders,
    getTopCustomers,
    getLowStockProducts,
    getRecentOrders,
  } = useStore();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    initialize();
  }, [initialize]);

  // Use memoized getters
  const totalRevenue = mounted ? getTotalRevenue() : 0;
  const pendingOrders = getPendingOrders();
  const lowStockProducts = getLowStockProducts();
  const topCustomers = getTopCustomers(5);
  const recentOrders = getRecentOrders(5);

  if (isLoading && !isInitialized) {
    return (
      <div className="p-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-20 bg-muted rounded-t-lg" />
              <CardContent className="h-24 bg-muted/50" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO 
        title="Dashboard - Satmar Montreal Matzos"
        description="Sales and inventory management dashboard"
      />
      <div className="p-8 space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <Link href="/orders/new">
            <Button size="lg" className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700">
              <ShoppingCart className="mr-2 h-5 w-5" />
              New Order
            </Button>
          </Link>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Revenue
              </CardTitle>
              <DollarSign className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                ${totalRevenue.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {orders.length} total orders
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Products
              </CardTitle>
              <Package className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{products.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {lowStockProducts.length} low stock items
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Customers
              </CardTitle>
              <Users className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{customers.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Active customer base
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Orders
              </CardTitle>
              <ShoppingCart className="h-5 w-5 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-600">
                {pendingOrders.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Awaiting processing
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Alerts Panel - Lazy Loaded */}
        <AlertsPanel />

        {/* Recent Activity */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Recent Orders */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-amber-600" />
                Recent Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {mounted && recentOrders.length > 0 ? (
                  recentOrders.map((order) => {
                    const customer = customers.find((c) => c.id === order.customerId);
                    const orderTotal = order.discount 
                      ? order.subtotal - order.discount 
                      : order.subtotal;
                    
                    return (
                      <Link
                        key={order.id}
                        href={`/orders/${order.id}`}
                        className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <div>
                          <p className="font-medium">
                            Order #{order.orderNumber}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {customer?.name || "Unknown Customer"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">${orderTotal.toFixed(2)}</p>
                          <Badge
                            variant={
                              order.status === "delivered"
                                ? "default"
                                : order.status === "pending"
                                ? "secondary"
                                : "destructive"
                            }
                          >
                            {order.status}
                          </Badge>
                        </div>
                      </Link>
                    );
                  })
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No orders yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Top Customers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-600" />
                Top Customers
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topCustomers.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No customer data yet
                </p>
              ) : (
                <div className="space-y-4">
                  {topCustomers.map((customer, index) => (
                    <Link
                      key={customer.id}
                      href={`/customers/${customer.id}`}
                      className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{customer.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {customer.phone}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">
                          ${customer.totalSpent.toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Total spent
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Low Stock Alert */}
        {lowStockProducts.length > 0 && (
          <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                <AlertCircle className="h-5 w-5" />
                Low Stock Alert
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {lowStockProducts.map((product) => (
                  <Link
                    key={product.id}
                    href="/products"
                    className="flex items-center justify-between p-3 rounded-lg border border-amber-200 bg-white dark:bg-background hover:bg-amber-100 dark:hover:bg-amber-950/30 transition-colors"
                  >
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {product.category}
                      </p>
                    </div>
                    <Badge variant="destructive">
                      {product.currentInventory || 0} left
                    </Badge>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}