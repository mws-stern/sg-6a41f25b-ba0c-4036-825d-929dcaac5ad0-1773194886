import { SEO } from "@/components/SEO";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Search, Phone, Mail, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabaseService } from "@/services/supabaseService";
import type { Customer } from "@/types";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setLoading(true);
    const data = await supabaseService.getCustomers();
    setCustomers(data);
    setLoading(false);
  };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading customers...</p>
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