import { SEO } from "@/components/SEO";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, TrendingUp, DollarSign, ShoppingCart, Users, Calendar, Download, FileText, Filter } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getOrders, getCustomers, getProducts } from "@/lib/store";
import type { Order, Product } from "@/types";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Papa from "papaparse";

export default function ReportsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customerCount, setCustomerCount] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [period, setPeriod] = useState("all");
  const [reportType, setReportType] = useState("summary");

  useEffect(() => {
    setMounted(true);
    setOrders(getOrders());
    setProducts(getProducts());
    setCustomerCount(getCustomers().length);
  }, []);

  const calculateStats = () => {
    let filteredOrders = orders;
    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    if (period === "today") {
      filteredOrders = orders.filter(o => new Date(o.createdAt) >= startOfDay);
    } else if (period === "week") {
      filteredOrders = orders.filter(o => new Date(o.createdAt) >= startOfWeek);
    } else if (period === "month") {
      filteredOrders = orders.filter(o => new Date(o.createdAt) >= startOfMonth);
    }

    const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.total, 0);
    const totalOrders = filteredOrders.length;
    const totalWeight = filteredOrders.reduce((sum, o) => 
      sum + o.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
    );

    const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {};
    
    filteredOrders.forEach(order => {
      order.items.forEach(item => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = {
            name: item.productName,
            quantity: 0,
            revenue: 0
          };
        }
        productSales[item.productId].quantity += item.quantity;
        productSales[item.productId].revenue += item.totalPrice;
      });
    });

    const topProducts = Object.values(productSales).sort((a, b) => b.revenue - a.revenue);

    return {
      totalRevenue,
      totalOrders,
      totalWeight,
      topProducts,
      filteredOrders
    };
  };

  const stats = calculateStats();

  const exportToCSV = () => {
    const csvData = stats.filteredOrders.map(order => ({
      "Order Number": order.orderNumber,
      "Customer": order.customerName,
      "Date": new Date(order.createdAt).toLocaleDateString(),
      "Status": order.status,
      "Items": order.items.map(item => `${item.productName} (${item.quantity} lbs)`).join("; "),
      "Subtotal": order.subtotal.toFixed(2),
      "Tax": order.tax.toFixed(2),
      "Total": order.total.toFixed(2)
    }));

    const productData = stats.topProducts.map(product => ({
      "Product": product.name,
      "Quantity Sold (lbs)": product.quantity.toFixed(1),
      "Revenue": product.revenue.toFixed(2),
      "Percentage": ((product.revenue / (stats.totalRevenue || 1)) * 100).toFixed(1) + "%"
    }));

    const summaryData = [{
      "Metric": "Total Revenue",
      "Value": `$${stats.totalRevenue.toFixed(2)}`
    }, {
      "Metric": "Total Orders",
      "Value": stats.totalOrders
    }, {
      "Metric": "Total Weight Sold",
      "Value": `${stats.totalWeight.toFixed(1)} lbs`
    }, {
      "Metric": "Active Customers",
      "Value": customerCount
    }];

    const csv1 = Papa.unparse(summaryData);
    const csv2 = Papa.unparse(productData);
    const csv3 = Papa.unparse(csvData);

    const combinedCSV = `SUMMARY REPORT\n${csv1}\n\n\nPRODUCT SALES\n${csv2}\n\n\nORDER DETAILS\n${csv3}`;

    const blob = new Blob([combinedCSV], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `satmar-matzos-report-${period}-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text("Satmar Montreal Matzos", 105, 20, { align: "center" });
    doc.setFontSize(14);
    doc.text("Financial Report", 105, 28, { align: "center" });
    doc.setFontSize(10);
    doc.text(`Period: ${period.charAt(0).toUpperCase() + period.slice(1)}`, 105, 35, { align: "center" });
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 105, 41, { align: "center" });

    doc.setFontSize(12);
    doc.text("Summary", 14, 52);
    
    autoTable(doc, {
      startY: 56,
      head: [["Metric", "Value"]],
      body: [
        ["Total Revenue", `$${stats.totalRevenue.toFixed(2)}`],
        ["Total Orders", stats.totalOrders.toString()],
        ["Total Weight Sold", `${stats.totalWeight.toFixed(1)} lbs`],
        ["Active Customers", customerCount.toString()]
      ],
      theme: "striped",
      headStyles: { fillColor: [251, 191, 36] }
    });

    const finalY1 = (doc as any).lastAutoTable.finalY || 90;
    
    doc.text("Sales by Product", 14, finalY1 + 10);
    
    autoTable(doc, {
      startY: finalY1 + 14,
      head: [["Product", "Quantity (lbs)", "Revenue", "% of Total"]],
      body: stats.topProducts.map(p => [
        p.name,
        p.quantity.toFixed(1),
        `$${p.revenue.toFixed(2)}`,
        `${((p.revenue / (stats.totalRevenue || 1)) * 100).toFixed(1)}%`
      ]),
      theme: "striped",
      headStyles: { fillColor: [251, 191, 36] }
    });

    const finalY2 = (doc as any).lastAutoTable.finalY || 140;

    if (finalY2 > 240) {
      doc.addPage();
      doc.text("Order Details", 14, 20);
      autoTable(doc, {
        startY: 24,
        head: [["Order #", "Customer", "Date", "Status", "Total"]],
        body: stats.filteredOrders.map(o => [
          o.orderNumber,
          o.customerName,
          new Date(o.createdAt).toLocaleDateString(),
          o.status,
          `$${o.total.toFixed(2)}`
        ]),
        theme: "striped",
        headStyles: { fillColor: [251, 191, 36] }
      });
    } else {
      doc.text("Order Details", 14, finalY2 + 10);
      autoTable(doc, {
        startY: finalY2 + 14,
        head: [["Order #", "Customer", "Date", "Status", "Total"]],
        body: stats.filteredOrders.map(o => [
          o.orderNumber,
          o.customerName,
          new Date(o.createdAt).toLocaleDateString(),
          o.status,
          `$${o.total.toFixed(2)}`
        ]),
        theme: "striped",
        headStyles: { fillColor: [251, 191, 36] }
      });
    }

    doc.save(`satmar-matzos-report-${period}-${new Date().toISOString().split("T")[0]}.pdf`);
  };

  if (!mounted) return null;

  return (
    <>
      <SEO title="Reports & Analytics - Satmar Montreal Matzos" />
      
      <div className="container mx-auto px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
              <p className="text-gray-600">Financial overview and sales performance</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={exportToCSV} variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
            <Button onClick={exportToPDF} className="gap-2 bg-amber-600 hover:bg-amber-700">
              <FileText className="w-4 h-4" />
              Export PDF
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-amber-200 hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
              <DollarSign className="w-4 h-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
              <p className="text-xs text-gray-500 mt-1">
                {period === 'all' ? 'Lifetime revenue' : 'For selected period'}
              </p>
            </CardContent>
          </Card>
          <Card className="border-amber-200 hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Orders</CardTitle>
              <ShoppingCart className="w-4 h-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrders}</div>
              <p className="text-xs text-gray-500 mt-1">Total orders processed</p>
            </CardContent>
          </Card>
          <Card className="border-amber-200 hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Volume Sold</CardTitle>
              <TrendingUp className="w-4 h-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalWeight.toFixed(1)} lbs</div>
              <p className="text-xs text-gray-500 mt-1">Total weight of matzos</p>
            </CardContent>
          </Card>
          <Card className="border-amber-200 hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Active Customers</CardTitle>
              <Users className="w-4 h-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{customerCount}</div>
              <p className="text-xs text-gray-500 mt-1">Total registered customers</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sales by Product */}
          <Card className="border-amber-200">
            <CardHeader>
              <CardTitle>Sales by Product</CardTitle>
              <CardDescription>Revenue breakdown by matzah type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.topProducts.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No sales data available</p>
                ) : (
                  stats.topProducts.map((product, index) => (
                    <div key={index} className="flex items-center justify-between border-b border-gray-100 last:border-0 pb-2 last:pb-0">
                      <div>
                        <p className="font-medium text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-500">{product.quantity.toFixed(1)} lbs sold</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">${product.revenue.toFixed(2)}</p>
                        <p className="text-sm text-gray-500">
                          {((product.revenue / (stats.totalRevenue || 1)) * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="border-amber-200">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest financial transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.filteredOrders.slice(0, 5).map((order) => (
                  <div key={order.id} className="flex items-center justify-between hover:bg-gray-50 p-2 rounded transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        order.status === 'confirmed' || order.status === 'delivered' 
                          ? 'bg-green-100 text-green-600' 
                          : 'bg-yellow-100 text-yellow-600'
                      }`}>
                        <DollarSign className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Order #{order.orderNumber}</p>
                        <p className="text-xs text-gray-500">{order.customerName}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">+${order.total.toFixed(2)}</p>
                      <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
                {stats.filteredOrders.length === 0 && (
                  <p className="text-center text-gray-500 py-8">No recent activity</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}