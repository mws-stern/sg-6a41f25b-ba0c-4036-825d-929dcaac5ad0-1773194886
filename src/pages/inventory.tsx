import { SEO } from "@/components/SEO";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Package, AlertTriangle, TrendingDown, Zap } from "lucide-react";
import { getProducts, addInventoryEntry, getInventory, type InventoryEntry } from "@/lib/store";
import { bulkUpdateInventory as batchBulkUpdateInventory } from "@/lib/batch";
import { useToast } from "@/hooks/use-toast";
import type { Product } from "@/types";

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [inventory, setInventory] = useState<InventoryEntry[]>([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkUpdates, setBulkUpdates] = useState<Record<string, string>>({});
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setProducts(getProducts());
    setInventory(getInventory().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  };

  const handleAddInventory = () => {
    if (!selectedProduct || !amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Input",
        description: "Please select a product and enter a valid amount",
        variant: "destructive"
      });
      return;
    }

    const product = products.find(p => p.id === selectedProduct);
    if (!product) return;

    addInventoryEntry({
      productId: selectedProduct,
      productName: product.name,
      amount: parseFloat(amount),
      date: new Date().toISOString(),
      notes: notes || undefined,
    });

    loadData();
    setSelectedProduct("");
    setAmount("");
    setNotes("");
    
    toast({
      title: "Inventory Added",
      description: `Added ${amount} lbs of ${product.name}`,
    });
  };

  const handleBulkUpdate = () => {
    const updates = Object.entries(bulkUpdates)
      .filter(([_, value]) => value && parseFloat(value) > 0)
      .map(([id, value]) => ({ id, amount: parseFloat(value) }));

    if (updates.length === 0) {
      toast({
        title: "No Updates",
        description: "Enter amounts for products to update",
        variant: "destructive"
      });
      return;
    }

    const result = batchBulkUpdateInventory(updates);
    loadData();
    setBulkUpdates({});
    setBulkMode(false);
    
    toast({
      title: "Bulk Update Complete",
      description: `Updated ${result.success} product inventories`,
    });
  };

  const lowStockProducts = products.filter(p => (p.currentInventory || 0) < 50);

  return (
    <>
      <SEO
        title="Inventory Management - Satmar Montreal Matzos"
        description="Track and manage matzoh inventory efficiently"
      />
      <div className="min-h-screen">
        <div className="container py-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: "'Frank Ruhl Libre', serif" }}>
                Inventory Management
              </h1>
              <p className="text-xl text-right" style={{ fontFamily: "'Rubik', sans-serif" }} dir="rtl">
                ניהול מלאי
              </p>
            </div>
            <Button 
              onClick={() => setBulkMode(!bulkMode)} 
              variant={bulkMode ? "default" : "outline"}
              className="gap-2"
            >
              <Zap className="w-4 h-4" />
              {bulkMode ? "Exit Bulk Mode" : "Bulk Update"}
            </Button>
          </div>

          {lowStockProducts.length > 0 && (
            <Card className="mb-6 border-orange-300 bg-orange-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-800">
                  <AlertTriangle className="w-5 h-5" />
                  Low Stock Alert
                </CardTitle>
                <CardDescription className="text-orange-700">
                  {lowStockProducts.length} product{lowStockProducts.length > 1 ? 's' : ''} need restocking
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                  {lowStockProducts.map(product => (
                    <div key={product.id} className="flex items-center justify-between p-3 bg-white rounded border border-orange-200">
                      <div>
                        <p className="font-semibold text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-600" dir="rtl">{product.nameHebrew}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-orange-600">{product.currentInventory?.toFixed(1) || 0}</p>
                        <p className="text-xs text-gray-500">lbs left</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-6 mb-8">
            {bulkMode ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Bulk Inventory Update
                  </CardTitle>
                  <CardDescription>Update multiple products at once</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {products.map(product => (
                      <div key={product.id} className="flex items-center gap-4 p-4 border rounded-lg">
                        <div className="flex-1">
                          <p className="font-semibold">{product.name}</p>
                          <p className="text-sm text-gray-600" dir="rtl">{product.nameHebrew}</p>
                          <p className="text-sm text-gray-500">Current: {product.currentInventory?.toFixed(1) || 0} lbs</p>
                        </div>
                        <div className="w-40">
                          <Input
                            type="number"
                            placeholder="Add amount"
                            value={bulkUpdates[product.id] || ""}
                            onChange={(e) => setBulkUpdates({ ...bulkUpdates, [product.id]: e.target.value })}
                            min="0"
                            step="0.1"
                          />
                        </div>
                      </div>
                    ))}
                    <Button onClick={handleBulkUpdate} className="w-full" size="lg">
                      <Plus className="w-4 h-4 mr-2" />
                      Apply Bulk Update
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Add Inventory
                  </CardTitle>
                  <CardDescription>Record new inventory received</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Product</Label>
                      <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              <div className="flex items-center justify-between w-full gap-4">
                                <span>{product.name}</span>
                                <span className="text-sm text-muted-foreground" dir="rtl">
                                  {product.nameHebrew}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Amount (lbs)</Label>
                      <Input
                        type="number"
                        placeholder="Enter amount"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        min="0"
                        step="0.1"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label>Notes (Optional)</Label>
                      <Textarea
                        placeholder="Add any notes about this inventory entry"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={2}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <Button onClick={handleAddInventory} className="w-full" size="lg">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Inventory
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Current Stock Levels
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {products.map((product) => {
                    const isLow = (product.currentInventory || 0) < 50;
                    return (
                      <Card key={product.id} className={isLow ? "border-orange-300 bg-orange-50" : ""}>
                        <CardContent className="pt-6">
                          <div className="text-center space-y-2">
                            <h3 className="font-semibold">{product.name}</h3>
                            <p className="text-sm text-muted-foreground" dir="rtl">
                              {product.nameHebrew}
                            </p>
                            <div className={`text-3xl font-bold ${isLow ? 'text-orange-600' : 'text-amber-600'}`}>
                              {product.currentInventory?.toFixed(1) || 0}
                              {isLow && <TrendingDown className="inline w-6 h-6 ml-2" />}
                            </div>
                            <p className="text-sm text-muted-foreground">lbs in stock</p>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Inventory History</CardTitle>
                <CardDescription>Recent inventory additions</CardDescription>
              </CardHeader>
              <CardContent>
                {inventory.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No inventory entries yet. Add your first entry above.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Product</TableHead>
                          <TableHead className="text-right">Amount (lbs)</TableHead>
                          <TableHead>Notes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {inventory.slice(0, 20).map((entry) => (
                          <TableRow key={entry.id}>
                            <TableCell>
                              {new Date(entry.date).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <div>
                                <div>{entry.productName}</div>
                                <div className="text-sm text-muted-foreground" dir="rtl">
                                  {products.find(p => p.id === entry.productId)?.nameHebrew}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-semibold text-green-600">
                              +{entry.amount.toFixed(1)}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {entry.notes || "-"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}