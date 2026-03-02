import { SEO } from "@/components/SEO";
import Link from "next/link";
import Image from "next/image";
import { Package, FileText, DollarSign, Users, ShoppingCart, Settings, Warehouse, TrendingUp, Search, Phone, Check, Clock, Truck, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { getProducts, getOrders, getCustomers, cache, CACHE_KEYS } from "@/lib/store";
import { AlertsPanel } from "@/components/AlertsPanel";
import { KeyboardShortcutsHelp } from "@/components/KeyboardShortcutsHelp";
import { useGlobalShortcuts } from "@/hooks/useKeyboardShortcuts";
import type { Product, Customer, Order } from "@/types";

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState({
    totalOrders: 0,
    revenue: 0,
    customers: 0,
    products: 0,
    pendingOrders: 0,
    lowStockItems: 0,
  });

  // Enable keyboard shortcuts
  useGlobalShortcuts();

  useEffect(() => {
    // Try to get cached stats first
    const cachedStats = cache.get<any>(CACHE_KEYS.STATS);
    
    // Always load fresh data for search
    const loadedProducts = getProducts();
    const loadedOrders = getOrders();
    const loadedCustomers = getCustomers();
    setProducts(loadedProducts);
    setOrders(loadedOrders);
    setCustomers(loadedCustomers);

    if (cachedStats) {
      setStats(cachedStats);
    } else {
      const revenue = loadedOrders.reduce((sum, order) => sum + order.total, 0);
      const pendingOrders = loadedOrders.filter(o => o.status === "pending" || o.status === "confirmed").length;
      const lowStockItems = loadedProducts.filter(p => (p.currentInventory || 0) < 50).length;
      
      const newStats = {
        totalOrders: loadedOrders.length,
        revenue,
        customers: loadedCustomers.length,
        products: loadedProducts.length,
        pendingOrders,
        lowStockItems,
      };
      
      setStats(newStats);
      
      // Cache for 1 minute
      cache.set(CACHE_KEYS.STATS, newStats, 60 * 1000);
    }
  }, []);

  const getFilteredCustomers = () => {
    if (!searchQuery) return [];
    const query = searchQuery.toLowerCase();
    return customers.filter(c => 
      c.name.toLowerCase().includes(query) ||
      (c.nameHebrew && c.nameHebrew.includes(query)) ||
      (c.email && c.email.toLowerCase().includes(query)) ||
      (c.phone && c.phone.includes(query)) ||
      (c.mobile && c.mobile.includes(query))
    ).slice(0, 5);
  };

  const getCustomerStatus = (customerId: string) => {
    const customerOrders = orders
      .filter(o => o.customerId === customerId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    if (customerOrders.length === 0) return null;
    return customerOrders[0];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered": return "bg-green-100 text-green-800 border-green-200";
      case "ready": return "bg-blue-100 text-blue-800 border-blue-200";
      case "preparing": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "confirmed": return "bg-purple-100 text-purple-800 border-purple-200";
      case "pending": return "bg-orange-100 text-orange-800 border-orange-200";
      case "cancelled": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "bg-green-100 text-green-800";
      case "partial": return "bg-yellow-100 text-yellow-800";
      default: return "bg-red-100 text-red-800";
    }
  };

  const statsDisplay = [
    { 
      title: "Total Orders", 
      value: stats.totalOrders.toString(), 
      subtitle: `${stats.pendingOrders} pending`,
      icon: ShoppingCart, 
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    { 
      title: "Revenue", 
      value: `$${stats.revenue.toFixed(2)}`, 
      subtitle: "All time",
      icon: DollarSign, 
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    { 
      title: "Customers", 
      value: stats.customers.toString(), 
      subtitle: "Active accounts",
      icon: Users, 
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    { 
      title: "Low Stock", 
      value: stats.lowStockItems.toString(), 
      subtitle: "Items need restock",
      icon: Package, 
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  const getProductColor = (category: string) => {
    const colors: Record<string, { bg: string; border: string; text: string }> = {
      rashi: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700" },
      regular: { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700" },
      spelt: { bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-700" },
      wholewheat: { bg: "bg-green-50", border: "border-green-200", text: "text-green-700" },
      flour: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700" },
      shvurim: { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700" },
    };
    return colors[category] || colors.regular;
  };

  return (
    <>
      <SEO 
        title="סאטמאר מאנטרעאל מצות - Satmar Montreal Matzos"
        description="Complete accounting and order management system for Satmar Montreal Matzos bakery"
      />
      
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Image 
              src="/logo.png" 
              alt="Satmar Montreal Matzos Logo" 
              width={80} 
              height={80}
              className="object-contain"
              priority
            />
            <div>
              <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: "'Heebo', sans-serif" }} dir="rtl">
                סאטמאר מאנטרעאל מצות
              </h1>
              <p className="text-lg text-gray-600" style={{ fontFamily: "'Frank Ruhl Libre', serif" }}>
                Satmar Montreal Matzos
              </p>
            </div>
          </div>
          
          {/* Toolbar */}
          <div className="flex items-center gap-2">
            <AlertsPanel />
            <KeyboardShortcutsHelp />
          </div>
        </div>

        {/* Customer Status Lookup */}
        <Card className="border-amber-200 shadow-md mb-8 bg-gradient-to-r from-white to-amber-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5 text-amber-600" />
              Customer Status Lookup
            </CardTitle>
            <CardDescription>Search by name, phone, or email to check order status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative mb-6">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Type customer name, phone number, or email..."
                className="pl-9 text-lg h-12 border-amber-200 focus:border-amber-400 focus:ring-amber-200"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {searchQuery && (
              <div className="space-y-4">
                {getFilteredCustomers().length === 0 ? (
                  <div className="text-center py-8 text-gray-500 bg-white rounded-lg border border-gray-100">
                    <p>No customers found matching "{searchQuery}"</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {getFilteredCustomers().map(customer => {
                      const lastOrder = getCustomerStatus(customer.id);
                      return (
                        <div key={customer.id} className="bg-white p-4 rounded-lg border border-amber-100 shadow-sm flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-lg">{customer.name}</h3>
                              {customer.nameHebrew && (
                                <span className="text-gray-500 font-hebrew text-sm" dir="rtl">{customer.nameHebrew}</span>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600 mt-1">
                              {customer.phone && (
                                <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {customer.phone}</span>
                              )}
                              {customer.mobile && (
                                <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {customer.mobile}</span>
                              )}
                              {customer.email && (
                                <span>{customer.email}</span>
                              )}
                            </div>
                          </div>

                          <div className="flex-shrink-0 w-full md:w-auto">
                            {lastOrder ? (
                              <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-md border border-gray-100">
                                <div className="text-right">
                                  <div className="text-xs text-gray-500 mb-1">Last Order: {new Date(lastOrder.createdAt).toLocaleDateString()}</div>
                                  <div className="flex gap-2 justify-end">
                                    <Badge variant="outline" className={getStatusColor(lastOrder.status)}>
                                      {lastOrder.status.toUpperCase()}
                                    </Badge>
                                    <Badge variant="outline" className={getPaymentStatusColor(lastOrder.paymentStatus)}>
                                      {lastOrder.paymentStatus.toUpperCase()}
                                    </Badge>
                                  </div>
                                </div>
                                <Link href={`/orders/${lastOrder.id}`}>
                                  <Button size="sm" variant="outline">View Order</Button>
                                </Link>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-gray-400 bg-gray-50 px-4 py-2 rounded-md">
                                <AlertCircle className="w-4 h-4" />
                                <span>No orders found</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsDisplay.map((stat) => (
            <Card key={stat.title} className="border-amber-200 hover:shadow-lg transition-all hover:scale-105 duration-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <p className="text-xs text-gray-500">{stat.subtitle}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="border-amber-200 shadow-md">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2" style={{ fontFamily: "'Frank Ruhl Libre', serif" }}>
                <TrendingUp className="w-5 h-5" />
                Quick Actions
              </CardTitle>
              <CardDescription>Manage your bakery operations efficiently</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <Link href="/orders/new">
                <Button className="w-full h-24 flex flex-col gap-2 bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all">
                  <ShoppingCart className="w-6 h-6" />
                  <span>New Order</span>
                  <kbd className="text-[10px] opacity-75 bg-white/20 px-1.5 py-0.5 rounded">Ctrl+N</kbd>
                </Button>
              </Link>
              <Link href="/inventory">
                <Button className="w-full h-24 flex flex-col gap-2 bg-gradient-to-br from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 transition-all">
                  <Warehouse className="w-6 h-6" />
                  <span>Add Inventory</span>
                  <kbd className="text-[10px] opacity-75 bg-white/20 px-1.5 py-0.5 rounded">Ctrl+I</kbd>
                </Button>
              </Link>
              <Link href="/customers/new">
                <Button className="w-full h-24 flex flex-col gap-2 bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 transition-all">
                  <Users className="w-6 h-6" />
                  <span>Add Customer</span>
                  <kbd className="text-[10px] opacity-75 bg-white/20 px-1.5 py-0.5 rounded">Ctrl+C</kbd>
                </Button>
              </Link>
              <Link href="/reports">
                <Button className="w-full h-24 flex flex-col gap-2 bg-gradient-to-br from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 transition-all">
                  <FileText className="w-6 h-6" />
                  <span>View Reports</span>
                  <kbd className="text-[10px] opacity-75 bg-white/20 px-1.5 py-0.5 rounded">Ctrl+R</kbd>
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-amber-200 shadow-md">
            <CardHeader>
              <CardTitle className="text-xl" style={{ fontFamily: "'Frank Ruhl Libre', serif" }}>
                System Performance
              </CardTitle>
              <CardDescription>Efficiency metrics at a glance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Order Processing</span>
                <span className="text-sm font-semibold text-green-600">Fast</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: "95%" }}></div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Inventory Tracking</span>
                <span className="text-sm font-semibold text-blue-600">Active</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: "88%" }}></div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Payment Collection</span>
                <span className="text-sm font-semibold text-purple-600">Good</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-purple-500 h-2 rounded-full" style={{ width: "75%" }}></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Product Overview */}
        <Card className="border-amber-200 shadow-md">
          <CardHeader>
            <CardTitle className="text-xl" style={{ fontFamily: "'Frank Ruhl Libre', serif" }}>
              Matzah Products
            </CardTitle>
            <CardDescription>Available products, pricing, and inventory</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => {
                const colors = getProductColor(product.category);
                const isLowStock = (product.currentInventory || 0) < 50;
                return (
                  <div key={product.id} className={`p-4 ${colors.bg} rounded-lg border ${colors.border} transition-all hover:shadow-md`}>
                    <h3 className="font-semibold text-gray-900 mb-1" style={{ fontFamily: "'Frank Ruhl Libre', serif" }}>
                      {product.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2" style={{ fontFamily: "'Heebo', sans-serif" }} dir="rtl">
                      {product.nameHebrew}
                    </p>
                    <p className={`text-2xl font-bold ${colors.text}`}>
                      {product.pricePerLb > 0 ? `$${product.pricePerLb.toFixed(2)}/lb` : "Not configured"}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <Warehouse className={`w-4 h-4 ${isLowStock ? 'text-red-500' : 'text-gray-500'}`} />
                      <p className={`text-sm ${isLowStock ? 'text-red-600 font-semibold' : 'text-gray-700'}`}>
                        <span className="font-semibold">{product.currentInventory || 0} lbs</span> in stock
                        {isLowStock && " ⚠️"}
                      </p>
                    </div>
                    {product.pricePerLb === 0 && (
                      <p className="text-xs text-red-600 mt-1">⚠️ Price not set</p>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-6 text-center">
              <Link href="/products">
                <Button variant="outline" className="gap-2">
                  <Settings className="w-4 h-4" />
                  Configure Pricing & Inventory
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}