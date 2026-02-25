import { SEO } from "@/components/SEO";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Package } from "lucide-react";
import { getProducts, addInventoryEntry, getInventory, type InventoryEntry } from "@/lib/store";
import type { Product } from "@/types";

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [inventory, setInventory] = useState<InventoryEntry[]>([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    setProducts(getProducts());
    setInventory(getInventory().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  }, []);

  const handleAddInventory = () => {
    if (!selectedProduct || !amount || parseFloat(amount) <= 0) {
      alert("Please select a product and enter a valid amount");
      return;
    }

    const product = products.find(p => p.id === selectedProduct);
    if (!product) return;

    const entry = addInventoryEntry({
      productId: selectedProduct,
      productName: product.name,
      amount: parseFloat(amount),
      date: new Date().toISOString(),
      notes: notes || undefined,
    });

    setInventory([entry, ...inventory]);
    setProducts(getProducts());
    setSelectedProduct("");
    setAmount("");
    setNotes("");
  };

  return (
    <>
      <SEO
        title="Inventory Management - Satmar Montreal Matzos"
        description="Track and manage matzoh inventory"
      />
      <div className="min-h-screen">
        <div className="container py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: "'Frank Ruhl Libre', serif" }}>
              Inventory Management
            </h1>
            <p className="text-xl text-right" style={{ fontFamily: "'Rubik', sans-serif" }} dir="rtl">
              ניהול מלאי
            </p>
          </div>

          <div className="grid gap-6 mb-8">
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

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Current Stock Levels
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {products.map((product) => (
                    <Card key={product.id}>
                      <CardContent className="pt-6">
                        <div className="text-center space-y-2">
                          <h3 className="font-semibold">{product.name}</h3>
                          <p className="text-sm text-muted-foreground" dir="rtl">
                            {product.nameHebrew}
                          </p>
                          <div className="text-3xl font-bold text-amber-600">
                            {product.currentInventory?.toFixed(1) || 0}
                          </div>
                          <p className="text-sm text-muted-foreground">lbs in stock</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
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
                        {inventory.map((entry) => (
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
                            <TableCell className="text-right font-semibold">
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