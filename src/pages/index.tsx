import { SEO } from "@/components/SEO";
import Link from "next/link";
import Image from "next/image";
import { Package, FileText, DollarSign, Users, ShoppingCart, Settings, Warehouse } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { getProducts, getOrders, getCustomers } from "@/lib/store";
import type { Product } from "@/types";

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState({
    totalOrders: 0,
    revenue: 0,
    customers: 0,
    products: 0,
  });

  useEffect(() => {
    const loadedProducts = getProducts();
    const orders = getOrders();
    const customers = getCustomers();
    
    const revenue = orders.reduce((sum, order) => sum + order.total, 0);
    
    setProducts(loadedProducts);
    setStats({
      totalOrders: orders.length,
      revenue,
      customers: customers.length,
      products: loadedProducts.length,
    });
  }, []);

  const statsDisplay = [
    { title: "Total Orders", value: stats.totalOrders.toString(), icon: ShoppingCart, color: "text-blue-600" },
    { title: "Revenue", value: `$${stats.revenue.toFixed(2)}`, icon: DollarSign, color: "text-green-600" },
    { title: "Customers", value: stats.customers.toString(), icon: Users, color: "text-purple-600" },
    { title: "Products", value: stats.products.toString(), icon: Package, color: "text-orange-600" },
  ];

  const recentOrders = [];

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
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
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
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsDisplay.map((stat) => (
            <Card key={stat.title} className="border-amber-200 hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="border-amber-200 shadow-md">
            <CardHeader>
              <CardTitle className="text-xl" style={{ fontFamily: "'Frank Ruhl Libre', serif" }}>
                Quick Actions
              </CardTitle>
              <CardDescription>Manage your bakery operations</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <Link href="/orders/new">
                <Button className="w-full h-24 flex flex-col gap-2 bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
                  <ShoppingCart className="w-6 h-6" />
                  New Order
                </Button>
              </Link>
              <Link href="/inventory">
                <Button className="w-full h-24 flex flex-col gap-2 bg-gradient-to-br from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800">
                  <Warehouse className="w-6 h-6" />
                  Add Inventory
                </Button>
              </Link>
              <Link href="/customers/new">
                <Button className="w-full h-24 flex flex-col gap-2 bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800">
                  <Users className="w-6 h-6" />
                  Add Customer
                </Button>
              </Link>
              <Link href="/reports">
                <Button className="w-full h-24 flex flex-col gap-2 bg-gradient-to-br from-green-600 to-green-700 hover:from-green-700 hover:to-green-800">
                  <FileText className="w-6 h-6" />
                  View Reports
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-amber-200 shadow-md">
            <CardHeader>
              <CardTitle className="text-xl" style={{ fontFamily: "'Frank Ruhl Libre', serif" }}>
                Recent Orders
              </CardTitle>
              <CardDescription>Latest customer orders</CardDescription>
            </CardHeader>
            <CardContent>
              {recentOrders.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No orders yet</p>
                  <Link href="/orders/new">
                    <Button className="mt-4" size="sm">Create First Order</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Orders will be displayed here */}
                </div>
              )}
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
                return (
                  <div key={product.id} className={`p-4 ${colors.bg} rounded-lg border ${colors.border}`}>
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
                      <Warehouse className="w-4 h-4 text-gray-500" />
                      <p className="text-sm text-gray-700">
                        <span className="font-semibold">{product.currentInventory || 0} lbs</span> in stock
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