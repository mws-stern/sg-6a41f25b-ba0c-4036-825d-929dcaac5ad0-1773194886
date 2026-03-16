import { useState, useEffect } from "react";
import { employeeService, type Employee } from "@/services/employeeService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  UserPlus, 
  Pencil, 
  Trash2, 
  Archive, 
  ArchiveRestore, 
  Phone, 
  DollarSign,
  AlertTriangle,
  RotateCcw
} from "lucide-react";
import { SEO } from "@/components/SEO";
import { formatDate, formatTime, formatDateTime, formatDateShort } from "@/lib/dateUtils";

export default function EmployeesPage() {
  const [activeEmployees, setActiveEmployees] = useState<Employee[]>([]);
  const [inactiveEmployees, setInactiveEmployees] = useState<Employee[]>([]);
  const [deletedEmployees, setDeletedEmployees] = useState<Employee[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPermanentDeleteDialogOpen, setIsPermanentDeleteDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    hourly_rate: "",
    employee_number: "",
    position: ""
  });
  const { toast } = useToast();

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      const [active, inactive, deleted] = await Promise.all([
        employeeService.getActive(),
        employeeService.getInactive(),
        employeeService.getDeleted(),
      ]);
      setActiveEmployees(active);
      setInactiveEmployees(inactive);
      setDeletedEmployees(deleted);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load employees",
        variant: "destructive",
      });
    }
  };

  const handleAdd = async () => {
    try {
      await employeeService.create({
        name: formData.name,
        phone: formData.phone,
        hourly_rate: parseFloat(formData.hourly_rate),
        employee_number: formData.employee_number || `EMP-${Date.now().toString().slice(-4)}`,
        position: formData.position || "Staff",
        is_active: true,
      });
      toast({ title: "Success", description: "Employee added successfully" });
      setIsAddDialogOpen(false);
      setFormData({ name: "", phone: "", hourly_rate: "", employee_number: "", position: "" });
      loadEmployees();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add employee",
        variant: "destructive",
      });
    }
  };

  const handleEdit = async () => {
    if (!selectedEmployee) return;
    try {
      await employeeService.update(selectedEmployee.id, {
        name: formData.name,
        phone: formData.phone,
        hourly_rate: parseFloat(formData.hourly_rate),
        employee_number: formData.employee_number,
        position: formData.position,
      });
      toast({ title: "Success", description: "Employee updated successfully" });
      setIsEditDialogOpen(false);
      setSelectedEmployee(null);
      loadEmployees();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update employee",
        variant: "destructive",
      });
    }
  };

  const handleSoftDelete = async () => {
    if (!selectedEmployee) return;
    try {
      await employeeService.softDelete(selectedEmployee.id);
      toast({
        title: "Success",
        description: "Employee moved to deleted. You can restore it anytime.",
      });
      setIsDeleteDialogOpen(false);
      setSelectedEmployee(null);
      loadEmployees();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete employee",
        variant: "destructive",
      });
    }
  };

  const handleRestore = async (employee: Employee) => {
    try {
      await employeeService.restore(employee.id);
      toast({
        title: "Success",
        description: "Employee restored successfully",
      });
      loadEmployees();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to restore employee",
        variant: "destructive",
      });
    }
  };

  const handlePermanentDelete = async () => {
    if (!selectedEmployee) return;
    try {
      await employeeService.permanentDelete(selectedEmployee.id);
      toast({
        title: "Success",
        description: "Employee permanently deleted from database",
      });
      setIsPermanentDeleteDialogOpen(false);
      setSelectedEmployee(null);
      loadEmployees();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to permanently delete employee",
        variant: "destructive",
      });
    }
  };

  const handleActivate = async (employee: Employee) => {
    try {
      await employeeService.activate(employee.id);
      toast({ title: "Success", description: "Employee activated" });
      loadEmployees();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to activate employee",
        variant: "destructive",
      });
    }
  };

  const handleDeactivate = async (employee: Employee) => {
    try {
      await employeeService.deactivate(employee.id);
      toast({ title: "Success", description: "Employee deactivated" });
      loadEmployees();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to deactivate employee",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (employee: Employee) => {
    setSelectedEmployee(employee);
    setFormData({
      name: employee.name,
      phone: employee.phone || "",
      hourly_rate: employee.hourly_rate.toString(),
      employee_number: employee.employee_number || "",
      position: employee.position || ""
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsDeleteDialogOpen(true);
  };

  const openPermanentDeleteDialog = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsPermanentDeleteDialogOpen(true);
  };

  return (
    <>
      <SEO
        title="Employees - Bakery Staff Management"
        description="Manage bakery employees, track contact info and hourly rates"
      />
      <div className="p-4 lg:p-8 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Employees</h1>
            <p className="text-muted-foreground mt-1">
              Manage your team members and their information
            </p>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Employee
          </Button>
        </div>

        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="active">
              Active ({activeEmployees.length})
            </TabsTrigger>
            <TabsTrigger value="inactive">
              Inactive ({inactiveEmployees.length})
            </TabsTrigger>
            <TabsTrigger value="deleted">
              Deleted ({deletedEmployees.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            {activeEmployees.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  No active employees found
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {activeEmployees.map((employee) => (
                  <Card key={employee.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{employee.name}</span>
                        <span className="text-sm font-normal text-green-600">
                          Active
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2 text-sm">
                        {employee.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span>{employee.phone}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span>${employee.hourly_rate.toFixed(2)}/hour</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(employee)}
                        >
                          <Pencil className="mr-1 h-3 w-3" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-orange-600 hover:text-orange-700"
                          onClick={() => handleDeactivate(employee)}
                        >
                          <Archive className="mr-1 h-3 w-3" />
                          Deactivate
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => openDeleteDialog(employee)}
                        >
                          <Trash2 className="mr-1 h-3 w-3" />
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="inactive" className="space-y-4">
            {inactiveEmployees.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  No inactive employees found
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {inactiveEmployees.map((employee) => (
                  <Card key={employee.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{employee.name}</span>
                        <span className="text-sm font-normal text-orange-600">
                          Inactive
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2 text-sm">
                        {employee.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span>{employee.phone}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span>${employee.hourly_rate.toFixed(2)}/hour</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(employee)}
                        >
                          <Pencil className="mr-1 h-3 w-3" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-green-600 hover:text-green-700"
                          onClick={() => handleActivate(employee)}
                        >
                          <ArchiveRestore className="mr-1 h-3 w-3" />
                          Reactivate
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => openDeleteDialog(employee)}
                        >
                          <Trash2 className="mr-1 h-3 w-3" />
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="deleted" className="space-y-4">
            {deletedEmployees.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  No deleted employees found
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-medium text-amber-900">Deleted Employees</h3>
                    <p className="text-sm text-amber-700 mt-1">
                      These employees are soft-deleted. All their data (time entries, adjustments) is preserved and hidden from reports. You can restore them anytime or permanently delete them.
                    </p>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {deletedEmployees.map((employee) => (
                    <Card key={employee.id} className="border-red-200 bg-red-50/50">
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>{employee.name}</span>
                          <span className="text-sm font-normal text-red-600">
                            Deleted
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2 text-sm">
                          {employee.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <span>{employee.phone}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <span>${employee.hourly_rate.toFixed(2)}/hour</span>
                          </div>
                          {employee.deleted_at && (
                            <div className="text-xs text-muted-foreground">
                              Deleted: {formatDate(employee.deleted_at)}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-green-600 hover:text-green-700"
                            onClick={() => handleRestore(employee)}
                          >
                            <RotateCcw className="mr-1 h-3 w-3" />
                            Restore
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => openPermanentDeleteDialog(employee)}
                          >
                            <Trash2 className="mr-1 h-3 w-3" />
                            Permanent Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Add Employee Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Employee</DialogTitle>
              <DialogDescription>
                Enter the employee's information below
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="employee_number">Employee ID</Label>
                  <Input
                    id="employee_number"
                    value={formData.employee_number}
                    placeholder="Auto-generated if empty"
                    onChange={(e) =>
                      setFormData({ ...formData, employee_number: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="position">Position</Label>
                  <Input
                    id="position"
                    value={formData.position}
                    placeholder="e.g. Baker"
                    onChange={(e) =>
                      setFormData({ ...formData, position: e.target.value })
                    }
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="hourly_rate">Hourly Rate</Label>
                <Input
                  id="hourly_rate"
                  type="number"
                  step="0.01"
                  value={formData.hourly_rate}
                  onChange={(e) =>
                    setFormData({ ...formData, hourly_rate: e.target.value })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleAdd}>Add Employee</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Employee Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Employee</DialogTitle>
              <DialogDescription>
                Update the employee's information
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-employee_number">Employee ID</Label>
                  <Input
                    id="edit-employee_number"
                    value={formData.employee_number}
                    onChange={(e) =>
                      setFormData({ ...formData, employee_number: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="edit-position">Position</Label>
                  <Input
                    id="edit-position"
                    value={formData.position}
                    onChange={(e) =>
                      setFormData({ ...formData, position: e.target.value })
                    }
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-phone">Phone Number</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit-hourly_rate">Hourly Rate</Label>
                <Input
                  id="edit-hourly_rate"
                  type="number"
                  step="0.01"
                  value={formData.hourly_rate}
                  onChange={(e) =>
                    setFormData({ ...formData, hourly_rate: e.target.value })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleEdit}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Soft Delete Confirmation Dialog */}
        <AlertDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Employee?</AlertDialogTitle>
              <AlertDialogDescription>
                This will move <strong>{selectedEmployee?.name}</strong> to the Deleted tab. 
                All their data will be preserved and hidden from reports. You can restore them anytime.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleSoftDelete}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Permanent Delete Confirmation Dialog */}
        <AlertDialog
          open={isPermanentDeleteDialogOpen}
          onOpenChange={setIsPermanentDeleteDialogOpen}
        >
          <AlertDialogContent className="border-red-200">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Permanent Delete - Cannot Be Undone!
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-3">
                <p className="font-semibold text-red-900">
                  ⚠️ This action is IRREVERSIBLE and will permanently delete:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li><strong>{selectedEmployee?.name}</strong>'s employee record</li>
                  <li>ALL time entries (clock-ins and clock-outs)</li>
                  <li>ALL manual adjustments (hours, bonuses, deductions)</li>
                  <li>ALL payroll history</li>
                </ul>
                <p className="text-red-600 font-medium">
                  There is NO way to recover this data after deletion.
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handlePermanentDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                Yes, Permanently Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
}