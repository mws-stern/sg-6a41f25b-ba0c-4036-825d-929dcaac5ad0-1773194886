import { SEO } from "@/components/SEO";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Search, Phone, Mail, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import type { Customer } from "@/types";

// THIS RUNS ON THE SERVER - Bypasses local browser network restrictions/firewalls
export async function getServerSideProps() {
  try {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      console.error("Supabase error in getServerSideProps:", error);
      return { props: { initialCustomers: [], serverError: error.message } };
    }

    const mappedCustomers = (data || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      nameHebrew: c.name_hebrew || null,
      email: c.email || null,
      phone: c.phone || null,
      mobile: c.mobile || null,
      address: c.address || null,
      city: c.city || null,
      state: c.state || null,
      zip: c.zip || null,
      notes: c.notes || null,
      createdAt: c.created_at,
    }));

    return {
      props: {
        initialCustomers: mappedCustomers,
        serverError: null,
      },
    };
  } catch (e) {
    console.error("Network error in getServerSideProps:", e);
    return {
      props: {
        initialCustomers: [],
        serverError: e instanceof Error ? e.message : String(e),
      },
    };
  }
}

export default function CustomersPage({ 
  initialCustomers, 
  serverError 
}: { 
  initialCustomers: Customer[], 
  serverError: string | null 
}) {
  const [customers] = useState<Customer[]>(initialCustomers || []);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCustomers = customers.filter((customer) => {
    const query = searchQuery.toLowerCase();
    return (
      customer.name.toLowerCase().includes(query) ||
      (customer.nameHebrew && customer.nameHebrew.includes(query)) ||
      (customer.email && customer.email.toLowerCase().includes(query)) ||
      (customer.phone && customer.phone.includes(query)) ||
      (customer.mobile && customer.mobile.includes(query))
    );
  });

  if (serverError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <div className="text-red-600 text-xl mb-4">⚠️ Server Error Loading Customers</div>
          <p className="text-gray-600 mb-4">{serverError}</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO title="Customers - Satmar Montreal Matzos" />
      
      <div className="container mx-auto px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
              <p className="text-gray-600">Manage your customer database</p>
            </div>
          </div>
          <Link href="/customers/new">
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Customer
            </Button>
          </Link>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search customers by name, phone, or email..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCustomers.map((customer) => (
            <Link key={customer.id} href={`/customers/${customer.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <CardTitle className="flex items-start justify-between">
                    <div>
                      <div className="text-lg font-bold">{customer.name}</div>
                      {customer.nameHebrew && (
                        <div className="text-sm text-gray-500 font-hebrew mt-1" dir="rtl">
                          {customer.nameHebrew}
                        </div>
                      )}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-gray-600">
                    {customer.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        <span className="truncate">{customer.email}</span>
                      </div>
                    )}
                    {customer.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        <span>{customer.phone}</span>
                      </div>
                    )}
                    {customer.mobile && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        <span>{customer.mobile}</span>
                      </div>
                    )}
                    {customer.address && (
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 mt-0.5" />
                        <span className="line-clamp-2">
                          {customer.address}
                          {customer.city && `, ${customer.city}`}
                          {customer.state && `, ${customer.state}`}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {filteredCustomers.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500">No customers found</p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}