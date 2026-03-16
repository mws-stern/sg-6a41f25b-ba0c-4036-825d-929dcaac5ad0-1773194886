import { SEO } from "@/components/SEO";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { employeeService } from "@/services/employeeService";
import { adjustmentService } from "@/services/adjustmentService";
import { Clock, DollarSign, Trash2, Car, Plus, Minus, Edit } from "lucide-react";
import type { Employee, ManualAdjustment } from "@/types";
import { formatTime12h, formatDateString } from "@/lib/utils";
import { formatDate, formatDateTime, formatDateShort } from "@/lib/dateUtils";

type AdjustmentDialogType = "manual_hours" | "pickup_trip" | "manual_earnings";

export default function AdjustmentsPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [adjustments, setAdjustments] = useState<ManualAdjustment[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingAdjustment, setEditingAdjustment] = useState<ManualAdjustment | null>(null);
  const [dialogType, setDialogType] = useState<AdjustmentDialogType>("manual_hours");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [clockInTime, setClockInTime] = useState("");
  const [clockOutTime, setClockOutTime] = useState("");
  const [earningsAmount, setEarningsAmount] = useState("");
  const [isDeduction, setIsDeduction] = useState(false);
  const [reason, setReason] = useState("");
  const [date, setDate] = useState(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        loadData();
      }
    };
    
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  const loadData = async () => {
    try {
      const [employeesData, adjustmentsData] = await Promise.all([
        employeeService.getAll(),
        adjustmentService.getAll()
      ]);
      setEmployees(employeesData);
      setAdjustments(adjustmentsData);
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive"
      });
    }
  };

  const openDialog = (type: AdjustmentDialogType) => {
    setDialogType(type);
    setIsDialogOpen(true);
    setSelectedEmployeeId("");
    setClockInTime("");
    setClockOutTime("");
    setEarningsAmount("");
    setIsDeduction(false);
    setReason("");
    const _nd = new Date(); setDate(`${_nd.getFullYear()}-${String(_nd.getMonth()+1).padStart(2,'0')}-${String(_nd.getDate()).padStart(2,'0')}`);
  };

  const openEditDialog = (adjustment: ManualAdjustment) => {
    setEditingAdjustment(adjustment);
    setSelectedEmployeeId(adjustment.employee_id);
    setDate(adjustment.date);
    setReason(adjustment.reason || "");
    
    if (adjustment.adjustment_type === "manual_hours") {
      setClockInTime(adjustment.clock_in || "");
      setClockOutTime(adjustment.clock_out || "");
    } else if (adjustment.adjustment_type === "bonus" || adjustment.adjustment_type === "deduction") {
      setEarningsAmount(adjustment.amount.toString());
      setIsDeduction(adjustment.adjustment_type === "deduction");
    }
    
    setIsEditDialogOpen(true);
  };

  const handleEdit = async () => {
    if (!editingAdjustment) return;

    setLoading(true);
    try {
      if (editingAdjustment.adjustment_type === "manual_hours") {
        if (!clockInTime || !clockOutTime) {
          toast({
            title: "Error",
            description: "Please enter both clock-in and clock-out times",
            variant: "destructive"
          });
          setLoading(false);
          return;
        }

        if (clockOutTime <= clockInTime) {
          toast({
            title: "Error",
            description: "Clock-out time must be after clock-in time",
            variant: "destructive"
          });
          setLoading(false);
          return;
        }

        // Ensure times are in HH:MM:SS format
        const formatTimeForDB = (time: string) => {
          // Remove any existing seconds first
          const parts = time.split(':');
          // If it's HH:MM or HH:MM:SS, normalize to HH:MM
          const normalizedTime = `${parts[0]}:${parts[1]}`;
          // Then add :00 for seconds
          return `${normalizedTime}:00`;
        };

        await adjustmentService.updateManualHours(
          editingAdjustment.id,
          formatTimeForDB(clockInTime),
          formatTimeForDB(clockOutTime),
          reason,
          date
        );
        
        toast({
          title: "Success",
          description: "Manual hours updated successfully"
        });
      } else if (editingAdjustment.adjustment_type === "bonus" || editingAdjustment.adjustment_type === "deduction") {
        const amount = parseFloat(earningsAmount);
        if (isNaN(amount) || amount <= 0) {
          toast({
            title: "Error",
            description: "Please enter a valid amount greater than 0",
            variant: "destructive"
          });
          setLoading(false);
          return;
        }

        await adjustmentService.updateAdjustment(
          editingAdjustment.id,
          {
            amount,
            adjustment_type: isDeduction ? "deduction" : "bonus",
            reason,
            date
          }
        );
        
        toast({
          title: "Success",
          description: `${isDeduction ? "Deduction" : "Bonus"} updated successfully`
        });
      } else if (editingAdjustment.adjustment_type === "pickup_trip") {
        await adjustmentService.updateAdjustment(
          editingAdjustment.id,
          {
            reason,
            date
          }
        );
        
        toast({
          title: "Success",
          description: "Pickup trip updated successfully"
        });
      }

      setIsEditDialogOpen(false);
      setEditingAdjustment(null);
      loadData();
    } catch (error) {
      console.error("Error updating adjustment:", error);
      toast({
        title: "Error",
        description: "Failed to update adjustment",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedEmployeeId) {
      toast({
        title: "Error",
        description: "Please select an employee",
        variant: "destructive"
      });
      return;
    }

    if (dialogType === "manual_earnings" && !reason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for manual earnings",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      if (dialogType === "manual_hours") {
        if (!clockInTime || !clockOutTime) {
          toast({
            title: "Error",
            description: "Please enter both clock-in and clock-out times",
            variant: "destructive"
          });
          setLoading(false);
          return;
        }

        // Validate times using simple string comparison
        if (clockOutTime <= clockInTime) {
          toast({
            title: "Error",
            description: "Clock-out time must be after clock-in time",
            variant: "destructive"
          });
          setLoading(false);
          return;
        }

        // Calculate hours for display
        const [inHour, inMin] = clockInTime.split(":").map(Number);
        const [outHour, outMin] = clockOutTime.split(":").map(Number);
        const hours = ((outHour * 60 + outMin) - (inHour * 60 + inMin)) / 60;
        
        // Pass time values directly (HH:MM format)
        await adjustmentService.addManualHours(
          selectedEmployeeId,
          clockInTime, // Pass as "HH:MM"
          clockOutTime, // Pass as "HH:MM"
          reason,
          date
        );
        
        toast({
          title: "Success",
          description: `Added ${hours.toFixed(2)} hours of manual time`
        });
      } else if (dialogType === "pickup_trip") {
        await adjustmentService.addPickupTrip(
          selectedEmployeeId,
          reason,
          date
        );
        toast({
          title: "Success",
          description: "Pickup trip added successfully ($10)"
        });
      } else if (dialogType === "manual_earnings") {
        const amount = parseFloat(earningsAmount);
        if (isNaN(amount) || amount <= 0) {
          toast({
            title: "Error",
            description: "Please enter a valid amount greater than 0",
            variant: "destructive"
          });
          setLoading(false);
          return;
        }

        await adjustmentService.addManualEarnings(
          selectedEmployeeId,
          amount,
          reason,
          date,
          isDeduction
        );
        
        toast({
          title: "Success",
          description: `${isDeduction ? "Deduction" : "Bonus"} of $${amount.toFixed(2)} added successfully`
        });
      }

      setIsDialogOpen(false);
      loadData();
    } catch (error) {
      console.error("Error adding adjustment:", error);
      toast({
        title: "Error",
        description: "Failed to add adjustment",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this adjustment?")) return;

    try {
      await adjustmentService.delete(id);
      toast({
        title: "Success",
        description: "Adjustment deleted successfully"
      });
      loadData();
    } catch (error) {
      console.error("Error deleting adjustment:", error);
      toast({
        title: "Error",
        description: "Failed to delete adjustment",
        variant: "destructive"
      });
    }
  };

  const manualHoursAdjustments = adjustments.filter(a => a.adjustment_type === "manual_hours");
  const pickupTripAdjustments = adjustments.filter(a => a.adjustment_type === "pickup_trip");
  const bonusAdjustments = adjustments.filter(a => a.adjustment_type === "bonus");
  const deductionAdjustments = adjustments.filter(a => a.adjustment_type === "deduction");

  const totalManualHours = manualHoursAdjustments.reduce((sum, a) => sum + (a.hours || 0), 0);
  const totalPickupTrips = pickupTripAdjustments.length;
  const totalPickupAmount = pickupTripAdjustments.reduce((sum, a) => sum + a.amount, 0);
  const totalBonuses = bonusAdjustments.reduce((sum, a) => sum + a.amount, 0);
  const totalDeductions = deductionAdjustments.reduce((sum, a) => sum + a.amount, 0);

  return (
    <>
      <SEO
        title="Adjustments - Bakery Management"
        description="Add manual hours, pickup trips, and earnings adjustments"
      />
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-amber-900">Adjustments</h1>
            <p className="text-amber-700 mt-1">Add manual hours, pickup trips, or custom earnings</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-amber-200 bg-white shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-amber-700">Manual Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-900">{totalManualHours.toFixed(2)}</div>
              <p className="text-xs text-amber-600">{manualHoursAdjustments.length} entries</p>
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-white shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-amber-700">Pickup Trips</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-900">${totalPickupAmount.toFixed(2)}</div>
              <p className="text-xs text-amber-600">{totalPickupTrips} trips</p>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-700">Bonuses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900">${totalBonuses.toFixed(2)}</div>
              <p className="text-xs text-green-600">{bonusAdjustments.length} bonuses</p>
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-red-50 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-red-700">Deductions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-900">${totalDeductions.toFixed(2)}</div>
              <p className="text-xs text-red-600">{deductionAdjustments.length} deductions</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => openDialog("manual_hours")}
            className="bg-amber-600 hover:bg-amber-700 shadow-md"
          >
            <Clock className="mr-2 h-4 w-4" />
            Add Manual Hours
          </Button>
          <Button
            onClick={() => openDialog("pickup_trip")}
            className="bg-orange-600 hover:bg-orange-700 shadow-md"
          >
            <Car className="mr-2 h-4 w-4" />
            Add Pickup Trip ($10)
          </Button>
          <Button
            onClick={() => openDialog("manual_earnings")}
            className="bg-emerald-600 hover:bg-emerald-700 shadow-md"
          >
            <DollarSign className="mr-2 h-4 w-4" />
            Add Manual Earnings
          </Button>
        </div>

        <Card className="border-amber-200 shadow-lg">
          <CardHeader>
            <CardTitle className="text-amber-900">All Adjustments</CardTitle>
            <CardDescription>View and manage all manual adjustments</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all">
              <TabsList>
                <TabsTrigger value="all">All ({adjustments.length})</TabsTrigger>
                <TabsTrigger value="hours">Hours ({manualHoursAdjustments.length})</TabsTrigger>
                <TabsTrigger value="trips">Trips ({pickupTripAdjustments.length})</TabsTrigger>
                <TabsTrigger value="earnings">Earnings ({bonusAdjustments.length + deductionAdjustments.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-4">
                {adjustments.length === 0 ? (
                  <div className="text-center py-8 text-amber-700">
                    No adjustments yet. Add manual hours, pickup trips, or earnings to get started.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Employee</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Details</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {adjustments.map((adjustment) => (
                          <TableRow key={adjustment.id}>
                            <TableCell>{formatDateShort(adjustment.date)}</TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{adjustment.employees?.name}</div>
                                <div className="text-sm text-gray-500">{adjustment.employees?.phone}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={
                                adjustment.adjustment_type === "manual_hours" ? "default" :
                                adjustment.adjustment_type === "pickup_trip" ? "secondary" :
                                adjustment.adjustment_type === "bonus" ? "outline" : "destructive"
                              }>
                                {adjustment.adjustment_type === "manual_hours" && <><Clock className="mr-1 h-3 w-3" /> Manual Hours</>}
                                {adjustment.adjustment_type === "pickup_trip" && <><Car className="mr-1 h-3 w-3" /> Pickup</>}
                                {adjustment.adjustment_type === "bonus" && <><Plus className="mr-1 h-3 w-3" /> Bonus</>}
                                {adjustment.adjustment_type === "deduction" && <><Minus className="mr-1 h-3 w-3" /> Deduction</>}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {adjustment.adjustment_type === "manual_hours" && adjustment.clock_in && adjustment.clock_out && (
                                <div className="text-sm">
                                  <div>{formatTime12h(adjustment.clock_in)} - {formatTime12h(adjustment.clock_out)}</div>
                                  <div className="text-xs text-gray-500">{(adjustment.hours || 0).toFixed(2)} hrs</div>
                                </div>
                              )}
                              {adjustment.adjustment_type === "manual_hours" && (!adjustment.clock_in || !adjustment.clock_out) && (
                                <div className="text-sm">{(adjustment.hours || 0).toFixed(2)} hrs</div>
                              )}
                              {adjustment.adjustment_type === "pickup_trip" && <span className="text-sm">1 trip</span>}
                              {(adjustment.adjustment_type === "bonus" || adjustment.adjustment_type === "deduction") && (
                                <span className="text-sm font-medium">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {adjustment.adjustment_type === "manual_hours" ? "-" : (
                                <span className={
                                  adjustment.adjustment_type === "deduction" ? "text-red-600 font-semibold" :
                                  adjustment.adjustment_type === "bonus" ? "text-green-600 font-semibold" :
                                  "font-semibold"
                                }>
                                  {adjustment.adjustment_type === "deduction" && "-"}${adjustment.amount.toFixed(2)}
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="max-w-xs truncate">{adjustment.reason}</TableCell>
                            <TableCell>
                              {adjustment.paid ? (
                                <Badge className="bg-green-100 text-green-800 border border-green-300 text-xs"> Paid</Badge>
                              ) : (
                                <Badge className="bg-amber-100 text-amber-800 border border-amber-300 text-xs">Unpaid</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openEditDialog(adjustment)}
                                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(adjustment.id)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="hours" className="mt-4">
                {manualHoursAdjustments.length === 0 ? (
                  <div className="text-center py-8 text-amber-700">
                    No manual hours entries yet.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Employee</TableHead>
                        <TableHead>Clock In/Out</TableHead>
                        <TableHead>Hours</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {manualHoursAdjustments.map((adjustment) => (
                        <TableRow key={adjustment.id}>
                          <TableCell>{formatDateShort(adjustment.date)}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{adjustment.employees?.name}</div>
                              <div className="text-sm text-gray-500">{adjustment.employees?.phone}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {adjustment.clock_in && adjustment.clock_out ? (
                              <div className="text-sm">
                                <div>{formatTime12h(adjustment.clock_in)}</div>
                                <div>{formatTime12h(adjustment.clock_out)}</div>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-500">-</span>
                            )}
                          </TableCell>
                          <TableCell className="font-semibold">{(adjustment.hours || 0).toFixed(2)}</TableCell>
                          <TableCell className="max-w-xs truncate">{adjustment.reason}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditDialog(adjustment)}
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(adjustment.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>

              <TabsContent value="trips" className="mt-4">
                {pickupTripAdjustments.length === 0 ? (
                  <div className="text-center py-8 text-amber-700">
                    No pickup trips recorded yet.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Employee</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pickupTripAdjustments.map((adjustment) => (
                        <TableRow key={adjustment.id}>
                          <TableCell>{formatDateShort(adjustment.date)}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{adjustment.employees?.name}</div>
                              <div className="text-sm text-gray-500">{adjustment.employees?.phone}</div>
                            </div>
                          </TableCell>
                          <TableCell className="font-semibold text-green-600">${adjustment.amount.toFixed(2)}</TableCell>
                          <TableCell className="max-w-xs truncate">{adjustment.reason}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditDialog(adjustment)}
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(adjustment.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>

              <TabsContent value="earnings" className="mt-4">
                {bonusAdjustments.length === 0 && deductionAdjustments.length === 0 ? (
                  <div className="text-center py-8 text-amber-700">
                    No manual earnings adjustments yet.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Employee</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[...bonusAdjustments, ...deductionAdjustments].map((adjustment) => (
                        <TableRow key={adjustment.id}>
                          <TableCell>{formatDateShort(adjustment.date)}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{adjustment.employees?.name}</div>
                              <div className="text-sm text-gray-500">{adjustment.employees?.phone}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={adjustment.adjustment_type === "bonus" ? "outline" : "destructive"}>
                              {adjustment.adjustment_type === "bonus" ? (
                                <><Plus className="mr-1 h-3 w-3" /> Bonus</>
                              ) : (
                                <><Minus className="mr-1 h-3 w-3" /> Deduction</>
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell className={adjustment.adjustment_type === "deduction" ? "text-red-600 font-semibold" : "text-green-600 font-semibold"}>
                            {adjustment.adjustment_type === "deduction" && "-"}${adjustment.amount.toFixed(2)}
                          </TableCell>
                          <TableCell className="max-w-xs truncate">{adjustment.reason}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditDialog(adjustment)}
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(adjustment.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {dialogType === "manual_hours" && "Add Manual Hours"}
              {dialogType === "pickup_trip" && "Add Pickup Trip"}
              {dialogType === "manual_earnings" && "Add Manual Earnings"}
            </DialogTitle>
            <DialogDescription>
              {dialogType === "manual_hours" && "Enter clock-in and clock-out times for manual time entry"}
              {dialogType === "pickup_trip" && "Record a $10 pickup trip for bringing an employee to work"}
              {dialogType === "manual_earnings" && "Add a bonus or deduction to an employee's earnings"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="employee">Employee *</Label>
              <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name} - {employee.phone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {dialogType === "manual_hours" && (
              <>
                <div>
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="clockIn">Clock In *</Label>
                    <Input
                      id="clockIn"
                      type="time"
                      value={clockInTime}
                      onChange={(e) => setClockInTime(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="clockOut">Clock Out *</Label>
                    <Input
                      id="clockOut"
                      type="time"
                      value={clockOutTime}
                      onChange={(e) => setClockOutTime(e.target.value)}
                    />
                  </div>
                </div>
                {clockInTime && clockOutTime && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="text-sm font-medium text-amber-900">
                      Total Hours: {((new Date(`${date}T${clockOutTime}`).getTime() - new Date(`${date}T${clockInTime}`).getTime()) / (1000 * 60 * 60)).toFixed(2)}
                    </div>
                  </div>
                )}
              </>
            )}

            {dialogType === "pickup_trip" && (
              <>
                <div>
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <span className="font-semibold text-green-900">$10.00 per trip</span>
                  </div>
                  <p className="text-sm text-green-700 mt-1">Fixed amount for pickup service</p>
                </div>
              </>
            )}

            {dialogType === "manual_earnings" && (
              <>
                <div>
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="earningsType">Type *</Label>
                  <Select value={isDeduction ? "deduction" : "bonus"} onValueChange={(val) => setIsDeduction(val === "deduction")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bonus">
                        <div className="flex items-center gap-2">
                          <Plus className="h-4 w-4 text-green-600" />
                          <span>Bonus (Add to earnings)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="deduction">
                        <div className="flex items-center gap-2">
                          <Minus className="h-4 w-4 text-red-600" />
                          <span>Deduction (Subtract from earnings)</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="amount">Amount ($) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    value={earningsAmount}
                    onChange={(e) => setEarningsAmount(e.target.value)}
                  />
                </div>
              </>
            )}

            <div>
              <Label htmlFor="reason">
                Reason {dialogType === "manual_hours" && "*"}
                {dialogType !== "manual_hours" && " (Optional)"}
              </Label>
              <Textarea
                id="reason"
                placeholder={
                  dialogType === "manual_hours" ? "e.g., Worked from home, Emergency shift, Forgot to clock in" :
                  dialogType === "pickup_trip" ? "e.g., Picked up from downtown, Morning pickup" :
                  "e.g., Performance bonus, Sales commission, Cash advance"
                }
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={loading}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {loading ? "Adding..." : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingAdjustment?.adjustment_type === "manual_hours" && "Edit Manual Hours"}
              {editingAdjustment?.adjustment_type === "pickup_trip" && "Edit Pickup Trip"}
              {(editingAdjustment?.adjustment_type === "bonus" || editingAdjustment?.adjustment_type === "deduction") && "Edit Manual Earnings"}
            </DialogTitle>
            <DialogDescription>
              Update the adjustment details
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Employee</Label>
              <Input value={employees.find(e => e.id === selectedEmployeeId)?.name || ""} disabled className="bg-gray-50" />
            </div>

            {editingAdjustment?.adjustment_type === "manual_hours" && (
              <>
                <div>
                  <Label htmlFor="edit-date">Date *</Label>
                  <Input
                    id="edit-date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-clockIn">Clock In *</Label>
                    <Input
                      id="edit-clockIn"
                      type="time"
                      value={clockInTime}
                      onChange={(e) => setClockInTime(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-clockOut">Clock Out *</Label>
                    <Input
                      id="edit-clockOut"
                      type="time"
                      value={clockOutTime}
                      onChange={(e) => setClockOutTime(e.target.value)}
                    />
                  </div>
                </div>
                {clockInTime && clockOutTime && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="text-sm font-medium text-amber-900">
                      Total Hours: {((new Date(`${date}T${clockOutTime}`).getTime() - new Date(`${date}T${clockInTime}`).getTime()) / (1000 * 60 * 60)).toFixed(2)}
                    </div>
                  </div>
                )}
              </>
            )}

            {editingAdjustment?.adjustment_type === "pickup_trip" && (
              <>
                <div>
                  <Label htmlFor="edit-date">Date *</Label>
                  <Input
                    id="edit-date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <span className="font-semibold text-green-900">$10.00 per trip</span>
                  </div>
                  <p className="text-sm text-green-700 mt-1">Fixed amount for pickup service</p>
                </div>
              </>
            )}

            {(editingAdjustment?.adjustment_type === "bonus" || editingAdjustment?.adjustment_type === "deduction") && (
              <>
                <div>
                  <Label htmlFor="edit-date">Date *</Label>
                  <Input
                    id="edit-date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-earningsType">Type *</Label>
                  <Select value={isDeduction ? "deduction" : "bonus"} onValueChange={(val) => setIsDeduction(val === "deduction")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bonus">
                        <div className="flex items-center gap-2">
                          <Plus className="h-4 w-4 text-green-600" />
                          <span>Bonus (Add to earnings)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="deduction">
                        <div className="flex items-center gap-2">
                          <Minus className="h-4 w-4 text-red-600" />
                          <span>Deduction (Subtract from earnings)</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-amount">Amount ($) *</Label>
                  <Input
                    id="edit-amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    value={earningsAmount}
                    onChange={(e) => setEarningsAmount(e.target.value)}
                  />
                </div>
              </>
            )}

            <div>
              <Label htmlFor="edit-reason">
                Reason {(editingAdjustment?.adjustment_type === "bonus" || editingAdjustment?.adjustment_type === "deduction") && "*"}
                {editingAdjustment?.adjustment_type !== "bonus" && editingAdjustment?.adjustment_type !== "deduction" && " (Optional)"}
              </Label>
              <Textarea
                id="edit-reason"
                placeholder="Enter reason for adjustment"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleEdit} 
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? "Updating..." : "Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
