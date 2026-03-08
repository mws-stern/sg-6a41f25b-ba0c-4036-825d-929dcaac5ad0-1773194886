import { SEO } from "@/components/SEO";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Edit2, Check, X, Plus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabaseService } from "@/services/supabaseService";
import type { Product } from "@/types";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [mounted, setMounted] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  
  // Add product state
  const [isAdding, setIsAdding] = useState(false);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: "",
    nameHebrew: "",
    category: "regular",
    pricePerLb: 0,
    description: "",
    inStock: true,
    currentInventory: 0
  });

  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
    const loadProducts = async () => {
      let data = await supabaseService.getProducts();
      // Auto-seed if database is completely empty
      if (data.length === 0) {
        await supabaseService.seedInitialDataIfNeeded();
        data = await supabaseService.getProducts();
      }
      setProducts(data);
    };
    loadProducts();
  }, []);

  const handleSave = async () => {
    try {
      await Promise.all(products.map(p => supabaseService.updateProduct(p)));
      setIsDirty(false);
      setEditingId(null);
      toast({
        title: "Products Updated",
        description: "Product pricing and details have been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save products.",
        variant: "destructive"
      });
    }
  };

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.category) {
      toast({ 
        title: "Validation Error", 
        description: "Name and Category are required.", 
        variant: "destructive" 
      });
      return;
    }
    
    const addedProduct = await supabaseService.addProduct(newProduct as Omit<Product, "id">);
    if (addedProduct) {
      setProducts(prev => [...prev, addedProduct]);
      setIsAdding(false);
      setNewProduct({ name: "", nameHebrew: "", category: "regular", pricePerLb: 0, description: "", inStock: true, currentInventory: 0 });
      toast({ 
        title: "Product Added", 
        description: "The new product has been successfully added to the system and is now available for orders." 
      });
    } else {
      toast({ 
        title: "Error", 
        description: "Failed to add product to the database.", 
        variant: "destructive" 
      });
    }
  };

  const updateProduct = (id: string, field: keyof Product, value: any) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
    setIsDirty(true);
  };

  const toggleEdit = (id: string) => {
    if (editingId === id) {
      setEditingId(null);
    } else {
      setEditingId(id);
    }
  };

  const getProductColor = (category: string) => {
    const colors: Record<string, string> = {
      rashi: "bg-amber-50 border-amber-200",
      regular: "bg-orange-50 border-orange-200",
      spelt: "bg-yellow-50 border-yellow-200",
      wholewheat: "bg-green-50 border-green-200",
      flour: "bg-blue-50 border-blue-200",
      shvurim: "bg-purple-50 border-purple-200",
    };
    return colors[category] || "bg-gray-50 border-gray-200";
  };

  if (!mounted) {
    return null;
  }

  return (
    <>
      <SEO title="Product Management - Satmar Montreal Matzos" />
      
      <div className="container mx-auto px-6 py-8">
        <div className="mb-6 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-sm p-4 rounded-lg z-10 border-b shadow-sm">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: "'Frank Ruhl Libre', serif" }}>Product Management</h1>
              <p className="text-gray-600">Configure pricing and product details</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Dialog open={isAdding} onOpenChange={setIsAdding}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Plus className="w-4 h-4" /> Add Product
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Product</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>English Name *</Label>
                    <Input 
                      value={newProduct.name} 
                      onChange={e => setNewProduct(p => ({...p, name: e.target.value}))} 
                      placeholder="e.g. Spelt Matzoh"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Hebrew Name</Label>
                    <Input 
                      value={newProduct.nameHebrew} 
                      onChange={e => setNewProduct(p => ({...p, nameHebrew: e.target.value}))} 
                      dir="rtl" 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Category *</Label>
                      <Select 
                        value={newProduct.category} 
                        onValueChange={v => setNewProduct(p => ({...p, category: v as Product["category"]}))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="rashi">Rashi</SelectItem>
                          <SelectItem value="regular">Regular</SelectItem>
                          <SelectItem value="spelt">Spelt</SelectItem>
                          <SelectItem value="wholewheat">Whole Wheat</SelectItem>
                          <SelectItem value="flour">Flour</SelectItem>
                          <SelectItem value="shvurim">Shvurim</SelectItem>
                          <SelectItem value="custom">Custom/Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Price / Lb</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                        <Input 
                          type="number" 
                          step="0.01" 
                          className="pl-7"
                          value={newProduct.pricePerLb} 
                          onChange={e => setNewProduct(p => ({...p, pricePerLb: parseFloat(e.target.value) || 0}))} 
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button>
                  <Button onClick={handleAddProduct}>Save Product</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {isDirty && (
              <Button onClick={handleSave} className="gap-2 animate-pulse bg-green-600 hover:bg-green-700">
                <Save className="w-4 h-4" />
                Save All Changes
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {products.map((product) => {
            const isEditing = editingId === product.id;
            const colorClass = getProductColor(product.category);
            
            return (
              <Card key={product.id} className={`transition-all duration-200 ${isEditing ? 'ring-2 ring-blue-500 shadow-lg scale-[1.01]' : ''} ${colorClass}`}>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row gap-6 items-start">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <h3 className="text-xl font-bold text-gray-900">{product.name}</h3>
                          <Badge variant="outline" className="text-sm font-normal">
                            {product.category}
                          </Badge>
                        </div>
                        <h3 className="text-xl font-heebo text-gray-800" dir="rtl">{product.nameHebrew}</h3>
                      </div>
                      
                      {isEditing ? (
                        <Textarea
                          value={product.description || ""}
                          onChange={(e) => updateProduct(product.id, "description", e.target.value)}
                          rows={2}
                          className="mt-2"
                        />
                      ) : (
                        <p className="text-gray-600">{product.description}</p>
                      )}
                    </div>

                    <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-6">
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-500 uppercase tracking-wide">Price / Lb</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={product.pricePerLb || ""}
                            onChange={(e) => updateProduct(product.id, "pricePerLb", parseFloat(e.target.value) || 0)}
                            className="pl-7 font-semibold text-lg"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs text-gray-500 uppercase tracking-wide">Inventory</Label>
                        <div className="relative">
                          <Input
                            type="number"
                            step="1"
                            min="0"
                            value={product.currentInventory || 0}
                            onChange={(e) => updateProduct(product.id, "currentInventory", parseFloat(e.target.value) || 0)}
                            className={`font-semibold text-lg ${(product.currentInventory || 0) < 50 ? 'text-red-600 border-red-200 bg-red-50' : ''}`}
                          />
                          <span className="absolute right-3 top-2.5 text-gray-500 text-sm">lbs</span>
                        </div>
                      </div>

                      <div className="flex flex-col justify-center space-y-3">
                         <div className="flex items-center justify-between">
                           <Label htmlFor={`stock-${product.id}`} className="cursor-pointer">Active</Label>
                           <Switch
                             id={`stock-${product.id}`}
                             checked={product.inStock}
                             onCheckedChange={(checked) => updateProduct(product.id, "inStock", checked)}
                           />
                         </div>
                         <Button 
                           variant={isEditing ? "secondary" : "ghost"} 
                           size="sm" 
                           onClick={() => toggleEdit(product.id)}
                           className="w-full"
                         >
                           {isEditing ? (
                             <>
                               <Check className="w-3 h-3 mr-2" /> Done
                             </>
                           ) : (
                             <>
                               <Edit2 className="w-3 h-3 mr-2" /> Details
                             </>
                           )}
                         </Button>
                      </div>
                    </div>
                  </div>
                  
                  {isEditing && (
                    <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-2 gap-4 animate-in slide-in-from-top-2">
                       <div>
                         <Label>Hebrew Name</Label>
                         <Input 
                           value={product.nameHebrew} 
                           onChange={(e) => updateProduct(product.id, "nameHebrew", e.target.value)}
                           dir="rtl"
                         />
                       </div>
                       <div>
                         <Label>Minimum Order</Label>
                         <Input 
                           type="number" 
                           value={(product as any).minOrder || ""} 
                           onChange={(e) => updateProduct(product.id, "minOrder" as any, parseFloat(e.target.value))}
                           placeholder="Optional"
                         />
                       </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </>
  );
}