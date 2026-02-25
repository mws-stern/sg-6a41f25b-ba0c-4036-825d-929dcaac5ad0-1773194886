import { SEO } from "@/components/SEO";
import Link from "next/link";
import Image from "next/image";
import { Package, FileText, DollarSign, Users, ShoppingCart, Settings, Warehouse } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const stats = [
    { title: "Total Orders", value: "0", icon: ShoppingCart, color: "text-blue-600" },
    { title: "Revenue", value: "$0.00", icon: DollarSign, color: "text-green-600" },
    { title: "Customers", value: "0", icon: Users, color: "text-purple-600" },
    { title: "Products", value: "6", icon: Package, color: "text-orange-600" },
  ];

  const recentOrders = [];

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
          {stats.map((stat) => (
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
            <CardDescription>Available products and pricing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                <h3 className="font-semibold text-gray-900 mb-1" style={{ fontFamily: "'Frank Ruhl Libre', serif" }}>
                  Rashi Matzoh
                </h3>
                <p className="text-sm text-gray-600 mb-2" style={{ fontFamily: "'Heebo', sans-serif" }} dir="rtl">
                  רש"י
                </p>
                <p className="text-2xl font-bold text-amber-700">$0.00/lb</p>
                <p className="text-xs text-gray-600 mt-1">Not configured</p>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                <h3 className="font-semibold text-gray-900 mb-1" style={{ fontFamily: "'Frank Ruhl Libre', serif" }}>
                  Regular Matzoh
                </h3>
                <p className="text-sm text-gray-600 mb-2" style={{ fontFamily: "'Heebo', sans-serif" }} dir="rtl">
                  רעגולער מצה
                </p>
                <p className="text-2xl font-bold text-orange-700">$0.00/lb</p>
                <p className="text-xs text-gray-600 mt-1">Not configured</p>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <h3 className="font-semibold text-gray-900 mb-1" style={{ fontFamily: "'Frank Ruhl Libre', serif" }}>
                  Spelt Matzoh
                </h3>
                <p className="text-sm text-gray-600 mb-2" style={{ fontFamily: "'Heebo', sans-serif" }} dir="rtl">
                  ספעלט מצה
                </p>
                <p className="text-2xl font-bold text-yellow-700">$0.00/lb</p>
                <p className="text-xs text-gray-600 mt-1">Not configured</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <h3 className="font-semibold text-gray-900 mb-1" style={{ fontFamily: "'Frank Ruhl Libre', serif" }}>
                  Whole Wheat Matzoh
                </h3>
                <p className="text-sm text-gray-600 mb-2" style={{ fontFamily: "'Heebo', sans-serif" }} dir="rtl">
                  האל וויט מצה
                </p>
                <p className="text-2xl font-bold text-green-700">$0.00/lb</p>
                <p className="text-xs text-gray-600 mt-1">Not configured</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-gray-900 mb-1" style={{ fontFamily: "'Frank Ruhl Libre', serif" }}>
                  Matzoh Flour
                </h3>
                <p className="text-sm text-gray-600 mb-2" style={{ fontFamily: "'Heebo', sans-serif" }} dir="rtl">
                  מצה מעהל
                </p>
                <p className="text-2xl font-bold text-blue-700">$0.00/lb</p>
                <p className="text-xs text-gray-600 mt-1">Not configured</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <h3 className="font-semibold text-gray-900 mb-1" style={{ fontFamily: "'Frank Ruhl Libre', serif" }}>
                  Shvurim Matzoh
                </h3>
                <p className="text-sm text-gray-600 mb-2" style={{ fontFamily: "'Heebo', sans-serif" }} dir="rtl">
                  שברים מצה
                </p>
                <p className="text-2xl font-bold text-purple-700">$0.00/lb</p>
                <p className="text-xs text-gray-600 mt-1">Not configured</p>
              </div>
            </div>
            <div className="mt-6 text-center">
              <Link href="/products">
                <Button variant="outline" className="gap-2">
                  <Settings className="w-4 h-4" />
                  Configure Pricing
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}