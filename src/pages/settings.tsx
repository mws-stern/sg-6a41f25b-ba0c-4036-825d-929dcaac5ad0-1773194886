import { SEO } from "@/components/SEO";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Settings } from "lucide-react";
import { supabaseService } from "@/services/supabaseService";
import type { Settings as SettingsType } from "@/types";

export default function SettingsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SettingsType>({
    companyName: "",
    companyNameHebrew: "",
    email: "",
    phone: "",
    address: "",
    taxRate: 14.975,
    currency: "USD",
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    const data = await supabaseService.getSettings();
    setSettings(data);
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    await supabaseService.saveSettings(settings);
    setSaving(false);
    
    toast({
      title: "Settings saved",
      description: "Your settings have been updated successfully.",
    });
  };

  if (loading) {
    return (
      <>
        <SEO title="Settings - Bakery Sales" />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading settings...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO title="Settings - Bakery Sales" />
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Settings className="h-8 w-8 text-orange-500" />
          <h1 className="text-3xl font-bold">Settings</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  value={settings.companyName}
                  onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="companyNameHebrew">Company Name (Hebrew)</Label>
                <Input
                  id="companyNameHebrew"
                  value={settings.companyNameHebrew}
                  onChange={(e) => setSettings({ ...settings, companyNameHebrew: e.target.value })}
                  dir="rtl"
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={settings.email}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={settings.phone}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={settings.address}
                  onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="taxRate">Tax Rate (%)</Label>
                <Input
                  id="taxRate"
                  type="number"
                  step="0.001"
                  value={settings.taxRate}
                  onChange={(e) => setSettings({ ...settings, taxRate: parseFloat(e.target.value) })}
                />
              </div>

              <div>
                <Label htmlFor="currency">Currency</Label>
                <Input
                  id="currency"
                  value={settings.currency}
                  onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}