import { SEO } from "@/components/SEO";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { getProducts, saveProducts } from "@/lib/store";
import type { Product } from "@/types";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [mounted, setMounted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
    setProducts(getProducts());
  }, []);

  const handleSave = () => {
    saveProducts(products);
    toast({
      title: "Products Updated",
      description: "Product pricing and details have been saved successfully.",
    });
  };

  const updateProduct = (id: string, field: keyof Product, value: any) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  if (!mounted) {
    return null;
  }

  return (
    <>
      <SEO title="Product Management - Satmar Montreal Matzos" />
      
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
        <div className="container mx-auto px-6 py-8">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Product Management</h1>
                <p className="text-gray-600">Configure pricing and product details</p>
              </div>
            </div>
            <Button onClick={handleSave} className="gap-2">
              <Save className="w-4 h-4" />
              Save Changes
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {products.map((product) => (
              <Card key={product.id} className="border-amber-200">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{product.name}</span>
                    <span className="text-xl font-hebrew">{product.nameHebrew}</span>
                  </CardTitle>
                  <CardDescription>{product.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor={`price-${product.id}`}>Price per Pound ($)</Label>
                    <Input
                      id={`price-${product.id}`}
                      type="number"
                      step="0.01"
                      min="0"
                      value={product.pricePerLb}
                      onChange={(e) =>
                        updateProduct(product.id, "pricePerLb", parseFloat(e.target.value) || 0)
                      }
                      className="text-xl font-semibold"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor={`desc-${product.id}`}>Description</Label>
                    <Textarea
                      id={`desc-${product.id}`}
                      value={product.description || ""}
                      onChange={(e) =>
                        updateProduct(product.id, "description", e.target.value)
                      }
                      rows={2}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`stock-${product.id}`}
                      checked={product.inStock}
                      onChange={(e) =>
                        updateProduct(product.id, "inStock", e.target.checked)
                      }
                      className="w-4 h-4"
                    />
                    <Label htmlFor={`stock-${product.id}`}>In Stock</Label>
                  </div>

                  <div>
                    <Label htmlFor={`min-${product.id}`}>Minimum Order (lbs)</Label>
                    <Input
                      id={`min-${product.id}`}
                      type="number"
                      step="0.5"
                      min="0"
                      value={product.minOrder || ""}
                      onChange={(e) =>
                        updateProduct(product.id, "minOrder", parseFloat(e.target.value) || undefined)
                      }
                      placeholder="Optional"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}