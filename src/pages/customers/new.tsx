import { SEO } from "@/components/SEO";
import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { ArrowLeft, Save, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { supabaseService } from "@/services/supabaseService";
import type { Customer } from "@/types";

export async function getServerSideProps() {
  try {
    const { data, error } = await supabase
      .from("customers")
      .select("id, name, email, phone, mobile");

    if (error) throw error;

    return {
      props: {
        existingCustomers: data || [],
      },
    };
  } catch (error) {
    return {
      props: {
        existingCustomers: [],
      },
    };
  }
}

export default function NewCustomerPage({ existingCustomers }: { existingCustomers: { id: string; name: string; email: string | null; phone: string | null; mobile: string | null }[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    nameHebrew: "",
    email: "",
    phone: "",
    mobile: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    notes: "",
  });

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Check for duplicates as user types
    if (field === "name" || field === "email" || field === "phone") {
      checkForDuplicates(field, value);
    }
  };

  const checkForDuplicates = (field: "name" | "email" | "phone", value: string) => {
    if (!value || value.length < 3) {
      setDuplicateWarning(null);
      return;
    }

    const normalized = value.toLowerCase().trim();
    
    const duplicate = existingCustomers.find(c => {
      if (field === "name") {
        return c.name.toLowerCase().trim() === normalized;
      }
      if (field === "email" && c.email) {
        return c.email.toLowerCase().trim() === normalized;
      }
      if (field === "phone") {
        const cleanValue = value.replace(/\D/g, "");
        const cleanPhone = (c.phone || "").replace(/\D/g, "");
        const cleanMobile = (c.mobile || "").replace(/\D/g, "");
        return cleanPhone === cleanValue || cleanMobile === cleanValue;
      }
      return false;
    });

    if (duplicate) {
      setDuplicateWarning(`A customer with this ${field} already exists: "${duplicate.name}"`);
    } else {
      setDuplicateWarning(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Customer name is required",
        variant: "destructive",
      });
      return;
    }

    // Final duplicate check before submission
    const nameDuplicate = existingCustomers.find(c => 
      c.name.toLowerCase().trim() === formData.name.toLowerCase().trim()
    );
    const emailDuplicate = formData.email && existingCustomers.find(c => 
      c.email && c.email.toLowerCase().trim() === formData.email.toLowerCase().trim()
    );
    const cleanPhone = formData.phone.replace(/\D/g, "");
    const phoneDuplicate = cleanPhone && existingCustomers.find(c => 
      (c.phone && c.phone.replace(/\D/g, "") === cleanPhone) || 
      (c.mobile && c.mobile.replace(/\D/g, "") === cleanPhone)
    );

    if (nameDuplicate) {
      toast({
        title: "Duplicate Customer",
        description: `A customer named "${nameDuplicate.name}" already exists`,
        variant: "destructive",
      });
      return;
    }

    if (emailDuplicate) {
      toast({
        title: "Duplicate Email",
        description: `This email is already used by "${emailDuplicate.name}"`,
        variant: "destructive",
      });
      return;
    }

    if (phoneDuplicate) {
      toast({
        title: "Duplicate Phone",
        description: `This phone number is already used by "${phoneDuplicate.name}"`,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const newCustomer = await supabaseService.addCustomer(formData);
    setLoading(false);

    if (newCustomer) {
      toast({
        title: "Customer Added",
        description: `${newCustomer.name} has been added successfully`,
      });
      router.push("/customers");
    } else {
      toast({
        title: "Error",
        description: "Failed to add customer",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <SEO title="Add New Customer - Satmar Montreal Matzos" />
      
      <div className="container mx-auto px-6 py-8">
        <div className="mb-6 flex items-center gap-4">
          <Link href="/customers">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Add New Customer</h1>
            <p className="text-gray-600">Create a new customer record</p>
          </div>
        </div>

        {duplicateWarning && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Potential Duplicate</AlertTitle>
            <AlertDescription>{duplicateWarning}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
              <CardDescription>Enter the customer details below</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="nameHebrew">Hebrew Name</Label>
                  <Input
                    id="nameHebrew"
                    value={formData.nameHebrew}
                    onChange={(e) => handleChange("nameHebrew", e.target.value)}
                    dir="rtl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mobile">Mobile</Label>
                  <Input
                    id="mobile"
                    type="tel"
                    value={formData.mobile}
                    onChange={(e) => handleChange("mobile", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleChange("city", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">State/Province</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => handleChange("state", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zip">ZIP/Postal Code</Label>
                  <Input
                    id="zip"
                    value={formData.zip}
                    onChange={(e) => handleChange("zip", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleChange("notes", e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <div className="mt-6 flex justify-end gap-4">
            <Link href="/customers">
              <Button type="button" variant="outline">Cancel</Button>
            </Link>
            <Button type="submit" disabled={loading || !!duplicateWarning}>
              <Save className="w-4 h-4 mr-2" />
              {loading ? "Saving..." : "Save Customer"}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}