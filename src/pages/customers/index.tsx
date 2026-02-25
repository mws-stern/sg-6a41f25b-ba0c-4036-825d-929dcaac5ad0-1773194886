import { SEO } from "@/components/SEO";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Mail, Phone, MapPin, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getCustomers } from "@/lib/store";
import type { Customer } from "@/types";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setCustomers(getCustomers());
  }, []);

  if (!mounted) {
    return null;
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
            <Button className="gap-2 bg-gradient-to-r from-purple-600 to-purple-700">
              <Plus className="w-4 h-4" />
              New Customer
            </Button>
          </Link>
        </div>

        {customers.length === 0 ? (
          <Card className="border-amber-200">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Mail className="w-16 h-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No customers yet</h3>
              <p className="text-gray-600 mb-6">Add your first customer to get started</p>
              <Link href="/customers/new">
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add First Customer
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {customers.map((customer) => (
              <Card key={customer.id} className="border-amber-200 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{customer.name}</span>
                    <Link href={`/customers/${customer.id}`}>
                      <Button variant="ghost" size="icon">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="w-4 h-4" />
                    <span className="text-sm">{customer.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span className="text-sm">{customer.phone}</span>
                  </div>
                  <div className="flex items-start gap-2 text-gray-600">
                    <MapPin className="w-4 h-4 mt-1" />
                    <span className="text-sm">
                      {customer.address}<br />
                      {customer.city}, {customer.state} {customer.zip}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}