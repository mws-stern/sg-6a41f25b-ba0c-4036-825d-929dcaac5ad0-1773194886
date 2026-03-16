import { useState, useEffect } from "react";
import Link from "next/link";
import { Layout } from "@/components/Layout";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Fingerprint,
  UserPlus,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Trash2,
  Search
} from "lucide-react";
import { getEmployees, type Employee } from "@/services/employeeService";
import {
  getEmployeeFingerprints,
  enrollFingerprint,
  deleteFingerprint,
  getDevice,
  type EmployeeFingerprint
} from "@/services/fingerprintService";
import { formatTime, formatDateTime } from "@/lib/dateUtils";

interface EnrollmentData {
  employee: Employee;
  fingerprint?: EmployeeFingerprint;
}

export default function FingerprintEnrollment() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [enrollmentData, setEnrollmentData] = useState<EnrollmentData[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [scanCount, setScanCount] = useState(0);
  const [deviceConfigured, setDeviceConfigured] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [employees, fingerprints, device] = await Promise.all([
        getEmployees(),
        getEmployeeFingerprints(),
        getDevice()
      ]);

      setDeviceConfigured(!!device);

      // Combine employees with their fingerprint data
      const combined = employees.map(emp => {
        const fingerprint = fingerprints.find(fp => fp.employee_id === emp.id);
        return { employee: emp, fingerprint };
      });

      setEnrollmentData(combined);
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Error",
        description: "Failed to load enrollment data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollFingerprint = async () => {
    if (!selectedEmployee) {
      toast({
        title: "Error",
        description: "Please select an employee",
        variant: "destructive"
      });
      return;
    }

    if (!deviceConfigured) {
      toast({
        title: "Device Not Configured",
        description: "Please configure your fingerprint device first",
        variant: "destructive"
      });
      return;
    }

    try {
      setEnrolling(true);
      setScanCount(0);

      // Simulate fingerprint scanning process
      for (let i = 1; i <= 3; i++) {
        setScanCount(i);
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        toast({
          title: `Scan ${i} of 3`,
          description: i < 3 ? "Please scan again" : "Processing...",
        });
      }

      // Generate a mock fingerprint template
      const template = `FP_TEMPLATE_${selectedEmployee}_${Date.now()}`;
      const deviceTemplateId = `${Date.now()}`;

      await enrollFingerprint(selectedEmployee, template, deviceTemplateId);

      toast({
        title: "Success",
        description: "Fingerprint enrolled successfully",
      });

      await loadData();
      setSelectedEmployee("");
      setScanCount(0);
    } catch (error) {
      console.error("Error enrolling fingerprint:", error);
      toast({
        title: "Error",
        description: "Failed to enroll fingerprint",
        variant: "destructive"
      });
    } finally {
      setEnrolling(false);
    }
  };

  const handleDeleteFingerprint = async (fingerprintId: string, employeeName: string) => {
    if (!confirm(`Remove fingerprint for ${employeeName}?`)) return;

    try {
      await deleteFingerprint(fingerprintId);
      toast({
        title: "Success",
        description: "Fingerprint removed successfully"
      });
      await loadData();
    } catch (error) {
      console.error("Error deleting fingerprint:", error);
      toast({
        title: "Error",
        description: "Failed to remove fingerprint",
        variant: "destructive"
      });
    }
  };

  const filteredData = enrollmentData.filter(data =>
    data.employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    data.employee.employee_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const enrolledCount = enrollmentData.filter(d => d.fingerprint?.is_active).length;
  const totalEmployees = enrollmentData.length;

  if (loading) {
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
        title="Employee Fingerprint Enrollment - Bakery Employees"
        description="Enroll employee fingerprints for biometric time tracking"
      />

      <div className="container mx-auto p-6 max-w-7xl space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <UserPlus className="w-8 h-8" />
            Employee Enrollment
          </h1>
          <p className="text-muted-foreground mt-1">
            Enroll employees for fingerprint-based time tracking
          </p>
        </div>

        {/* Device Status Alert */}
        {!deviceConfigured && (
          <Alert variant="destructive">
            <AlertDescription>
              Device not configured. Please configure your fingerprint device in{" "}
              <Link href="/fingerprint-setup" className="underline font-semibold">
                Device Setup
              </Link>
            </AlertDescription>
          </Alert>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{totalEmployees}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Enrolled</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">{enrolledCount}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-orange-600">
                {totalEmployees - enrolledCount}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Enrollment Panel */}
          <Card>
            <CardHeader>
              <CardTitle>Enroll New Fingerprint</CardTitle>
              <CardDescription>
                Select an employee and scan their fingerprint 3 times
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Employee</label>
                <Select
                  value={selectedEmployee}
                  onValueChange={setSelectedEmployee}
                  disabled={enrolling}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an employee..." />
                  </SelectTrigger>
                  <SelectContent>
                    {enrollmentData
                      .filter(d => !d.fingerprint?.is_active)
                      .map(data => (
                        <SelectItem key={data.employee.id} value={data.employee.id}>
                          {data.employee.name} ({data.employee.employee_number})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {enrolling && (
                <div className="p-6 border-2 border-dashed rounded-lg text-center space-y-4">
                  <Fingerprint className="w-16 h-16 mx-auto text-primary animate-pulse" />
                  <div>
                    <p className="font-semibold text-lg">
                      Scan {scanCount} of 3
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {scanCount < 3
                        ? "Please place your finger on the scanner"
                        : "Processing fingerprint template..."}
                    </p>
                  </div>
                  <div className="flex gap-2 justify-center">
                    {[1, 2, 3].map(i => (
                      <div
                        key={i}
                        className={`w-3 h-3 rounded-full ${
                          i <= scanCount ? "bg-primary" : "bg-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}

              <Button
                onClick={handleEnrollFingerprint}
                disabled={!selectedEmployee || enrolling || !deviceConfigured}
                className="w-full"
                size="lg"
              >
                {enrolling ? (
                  <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Scanning...</>
                ) : (
                  <><Fingerprint className="w-4 h-4 mr-2" /> Start Enrollment</>
                )}
              </Button>

              <Alert>
                <AlertDescription className="text-sm">
                  <strong>Instructions:</strong>
                  <ol className="list-decimal list-inside mt-2 space-y-1">
                    <li>Select the employee from the dropdown</li>
                    <li>Click "Start Enrollment"</li>
                    <li>Scan the same finger 3 times when prompted</li>
                    <li>Wait for confirmation</li>
                  </ol>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Employee List */}
          <Card>
            <CardHeader>
              <CardTitle>Enrollment Status</CardTitle>
              <CardDescription>
                View and manage enrolled employees
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {filteredData.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No employees found
                  </p>
                ) : (
                  filteredData.map(data => (
                    <div
                      key={data.employee.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {data.fingerprint?.is_active ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        )}
                        <div>
                          <p className="font-medium">{data.employee.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {data.employee.employee_number} • {data.employee.position}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {data.fingerprint?.is_active ? (
                          <>
                            <Badge variant="default">Enrolled</Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleDeleteFingerprint(
                                  data.fingerprint!.id,
                                  data.employee.name
                                )
                              }
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        ) : (
                          <Badge variant="secondary">Pending</Badge>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}