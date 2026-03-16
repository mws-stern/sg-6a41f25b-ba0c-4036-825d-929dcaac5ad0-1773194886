import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Fingerprint,
  Wifi,
  WifiOff,
  Settings,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw
} from "lucide-react";
import {
  getDevice,
  createOrUpdateDevice,
  testDeviceConnection,
  syncEmployeesToDevice,
  getEmployeeFingerprints,
  getPunchLogs,
  type FingerprintDevice
} from "@/services/fingerprintService";
import { formatTime, formatDateTime } from "@/lib/dateUtils";

export default function FingerprintSetup() {
  const { toast } = useToast();
  const [device, setDevice] = useState<FingerprintDevice | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Device form state
  const [deviceName, setDeviceName] = useState("");
  const [ipAddress, setIpAddress] = useState("");
  const [port, setPort] = useState("80");
  const [deviceModel, setDeviceModel] = useState("ZKTeco K40");
  const [apiKey, setApiKey] = useState("");

  // Stats state
  const [enrolledCount, setEnrolledCount] = useState(0);
  const [recentPunches, setRecentPunches] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const deviceData = await getDevice();
      const fingerprints = await getEmployeeFingerprints();
      const punches = await getPunchLogs(10);

      if (deviceData) {
        setDevice(deviceData);
        setDeviceName(deviceData.device_name || "");
        setIpAddress(deviceData.device_ip || "");
        setPort(deviceData.device_port?.toString() || "80");
        setDeviceModel(deviceData.device_model || "ZKTeco K40");
        setApiKey(deviceData.api_key || "");
      }

      setEnrolledCount(fingerprints.length);
      setRecentPunches(punches);
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Error",
        description: "Failed to load fingerprint system data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    if (!ipAddress) {
      toast({
        title: "Error",
        description: "Please enter IP address",
        variant: "destructive"
      });
      return;
    }

    try {
      setTesting(true);
      const result = await testDeviceConnection(ipAddress, parseInt(port));

      if (result.success) {
        toast({
          title: "Connection Successful",
          description: `Connected to ${result.deviceInfo?.model || "device"}`
        });
      } else {
        toast({
          title: "Connection Failed",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to test connection",
        variant: "destructive"
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSaveDevice = async () => {
    if (!ipAddress || !deviceName) {
      toast({
        title: "Error",
        description: "Please fill in required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      const savedDevice = await createOrUpdateDevice({
        device_name: deviceName,
        device_ip: ipAddress,
        device_port: parseInt(port),
        device_model: deviceModel,
        api_key: apiKey || undefined,
        is_active: true
      });

      setDevice(savedDevice);
      toast({
        title: "Success",
        description: "Device configuration saved successfully"
      });
    } catch (error) {
      console.error("Error saving device:", error);
      toast({
        title: "Error",
        description: "Failed to save device configuration",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    if (!device) {
      toast({
        title: "Error",
        description: "Please configure device first",
        variant: "destructive"
      });
      return;
    }

    try {
      setSyncing(true);
      const result = await syncEmployeesToDevice();
      
      toast({
        title: "Sync Complete",
        description: result.message
      });

      await loadData();
    } catch (error) {
      console.error("Error syncing:", error);
      toast({
        title: "Error",
        description: "Failed to sync with device",
        variant: "destructive"
      });
    } finally {
      setSyncing(false);
    }
  };

  if (loading && !device) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <SEO 
        title="Fingerprint Time Clock Setup - Bakery Employees"
        description="Configure and manage your fingerprint time clock system"
      />

      <div className="container mx-auto p-6 max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Fingerprint className="w-8 h-8" />
              Fingerprint Time Clock
            </h1>
            <p className="text-muted-foreground mt-1">
              Configure your biometric attendance system
            </p>
          </div>
          {device && (
            <Badge
              variant={device.is_online ? "default" : "secondary"}
              className="text-sm px-3 py-1"
            >
              {device.is_online ? (
                <><Wifi className="w-4 h-4 mr-1" /> Online</>
              ) : (
                <><WifiOff className="w-4 h-4 mr-1" /> Offline</>
              )}
            </Badge>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="w-4 h-4" />
                Enrolled Employees
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{enrolledCount}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Recent Punches
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{recentPunches.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Device Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold">
                {device ? "Configured" : "Not Set Up"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="device" className="space-y-4">
          <TabsList>
            <TabsTrigger value="device">Device Setup</TabsTrigger>
            <TabsTrigger value="logs">Punch Logs</TabsTrigger>
            <TabsTrigger value="guide">Setup Guide</TabsTrigger>
          </TabsList>

          <TabsContent value="device" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Device Configuration</CardTitle>
                <CardDescription>
                  Configure your fingerprint reader connection settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="deviceName">Device Name *</Label>
                    <Input
                      id="deviceName"
                      placeholder="e.g., Main Entrance"
                      value={deviceName}
                      onChange={(e) => setDeviceName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="deviceModel">Device Model</Label>
                    <Input
                      id="deviceModel"
                      placeholder="e.g., ZKTeco K40"
                      value={deviceModel}
                      onChange={(e) => setDeviceModel(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ipAddress">IP Address *</Label>
                    <Input
                      id="ipAddress"
                      placeholder="192.168.1.100"
                      value={ipAddress}
                      onChange={(e) => setIpAddress(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="port">Port</Label>
                    <Input
                      id="port"
                      type="number"
                      placeholder="80"
                      value={port}
                      onChange={(e) => setPort(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="apiKey">API Key (Optional)</Label>
                    <Input
                      id="apiKey"
                      type="password"
                      placeholder="Device API key if required"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleTestConnection}
                    disabled={testing || !ipAddress}
                    variant="outline"
                  >
                    {testing ? (
                      <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Testing...</>
                    ) : (
                      <><Wifi className="w-4 h-4 mr-2" /> Test Connection</>
                    )}
                  </Button>

                  <Button onClick={handleSaveDevice} disabled={loading}>
                    <Settings className="w-4 h-4 mr-2" />
                    Save Configuration
                  </Button>

                  {device && (
                    <Button
                      onClick={handleSync}
                      disabled={syncing}
                      variant="secondary"
                    >
                      {syncing ? (
                        <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Syncing...</>
                      ) : (
                        <><RefreshCw className="w-4 h-4 mr-2" /> Sync to Device</>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Punch Logs</CardTitle>
                <CardDescription>
                  View the last 10 fingerprint punch attempts
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentPunches.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No punch logs yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {recentPunches.map((punch) => (
                      <div
                        key={punch.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          {punch.success ? (
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600" />
                          )}
                          <div>
                            <p className="font-medium">
                              {punch.employees?.name || "Unknown"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {punch.employees?.employee_number}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge
                            variant={
                              punch.punch_type === "clock_in"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {punch.punch_type === "clock_in" ? "IN" : "OUT"}
                          </Badge>
                          <p className="text-sm text-muted-foreground mt-1">
                            {formatDateTime(punch.punch_time)}
                          </p>
                          {!punch.success && punch.failure_reason && (
                            <p className="text-xs text-red-600 mt-1">
                              {punch.failure_reason}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="guide" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Setup Guide</CardTitle>
                <CardDescription>
                  Follow these steps to set up your fingerprint time clock system
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert>
                  <Fingerprint className="w-4 h-4" />
                  <AlertDescription>
                    <strong>Recommended Device:</strong> ZKTeco K40 Fingerprint Time Clock
                    <br />
                    Available on Amazon for ~$180-220
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                      1
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Purchase Device</h3>
                      <p className="text-sm text-muted-foreground">
                        Search "ZKTeco K40 fingerprint time clock" on Amazon. Make sure it has WiFi/Ethernet connectivity.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                      2
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Connect to Network</h3>
                      <p className="text-sm text-muted-foreground">
                        Connect the device to your bakery's WiFi or network. Find the device's IP address from its admin panel.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                      3
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Configure in System</h3>
                      <p className="text-sm text-muted-foreground">
                        Enter the device's IP address and port in the "Device Setup" tab above. Test the connection.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                      4
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Enroll Employees</h3>
                      <p className="text-sm text-muted-foreground">
                        Go to the "Employee Enrollment" page and have each employee scan their fingerprint 3 times for best accuracy.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                      5
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Start Using</h3>
                      <p className="text-sm text-muted-foreground">
                        Employees can now clock in/out by scanning their fingerprint. The system automatically creates time entries.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}