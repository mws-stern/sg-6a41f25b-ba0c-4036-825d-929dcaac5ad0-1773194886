import { SEO } from "@/components/SEO";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Building, Mail, Phone, MapPin, Globe } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { getSettings, saveSettings } from "@/lib/store";
import type { Settings } from "@/lib/store";

export default function SettingsPage() {
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [settings, setSettingsState] = useState<Settings>({
    companyName: "",
    companyNameHebrew: "",
    email: "",
    phone: "",
    address: "",
    taxRate: 0,
    currency: "USD",
  });

  useEffect(() => {
    setMounted(true);
    setSettingsState(getSettings());
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setSettingsState((prev) => ({
      ...prev,
      [id]: id === "taxRate" ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSave = () => {
    saveSettings(settings);
    toast({
      title: "Settings Saved",
      description: "Company information and preferences updated successfully.",
    });
  };

  if (!mounted) return null;

  return (
    <>
      <SEO title="Settings - Satmar Montreal Matzos" />
      
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
                <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
                <p className="text-gray-600">Configure company details and system preferences</p>
              </div>
            </div>
            <Button onClick={handleSave} className="gap-2">
              <Save className="w-4 h-4" />
              Save Changes
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-amber-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  Company Information
                </CardTitle>
                <CardDescription>Details displayed on invoices and emails</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name (English)</Label>
                  <Input
                    id="companyName"
                    value={settings.companyName}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyNameHebrew">Company Name (Hebrew)</Label>
                  <Input
                    id="companyNameHebrew"
                    value={settings.companyNameHebrew}
                    onChange={handleChange}
                    className="text-right font-hebrew"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address" className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" /> Address
                  </Label>
                  <Input
                    id="address"
                    value={settings.address}
                    onChange={handleChange}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-amber-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Contact & Localization
                </CardTitle>
                <CardDescription>Contact info and financial settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="w-4 h-4" /> Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={settings.email}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="w-4 h-4" /> Phone
                  </Label>
                  <Input
                    id="phone"
                    value={settings.phone}
                    onChange={handleChange}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="taxRate">Tax Rate (%)</Label>
                    <Input
                      id="taxRate"
                      type="number"
                      step="0.1"
                      min="0"
                      value={settings.taxRate}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Input
                      id="currency"
                      value={settings.currency}
                      onChange={handleChange}
                      disabled
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}