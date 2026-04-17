import { useState } from "react";
import { useListEmployees, useCreateEmployee, useUpdateEmployee, useDeleteEmployee } from "@workspace/api-client-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Pencil, Trash2, Loader2, UserCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

type EmployeeForm = {
  name: string;
  nationalId: string;
  email: string;
  department: string;
  position: string;
  status: "active" | "inactive";
};

const emptyForm: EmployeeForm = {
  name: "",
  nationalId: "",
  email: "",
  department: "",
  position: "",
  status: "active",
};

export default function EmployeesList() {
  const { user } = useAuth();
  const { data: employees, isLoading } = useListEmployees();
  const createEmployee = useCreateEmployee();
  const updateEmployee = useUpdateEmployee();
  const deleteEmployee = useDeleteEmployee();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<EmployeeForm>(emptyForm);
  const [isDeleteConfirm, setIsDeleteConfirm] = useState<number | null>(null);

  const filtered = employees?.filter((e) =>
    [e.name, e.department, e.position, e.nationalId].some((f) =>
      f?.toLowerCase().includes(search.toLowerCase())
    )
  );

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setIsDialogOpen(true);
  };

  const openEdit = (emp: NonNullable<typeof employees>[number]) => {
    setEditingId(emp.id);
    setForm({
      name: emp.name,
      nationalId: emp.nationalId,
      email: emp.email ?? "",
      department: emp.department,
      position: emp.position,
      status: emp.status as "active" | "inactive",
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingId) {
        await updateEmployee.mutateAsync({ id: editingId, data: form });
        toast({ title: "Employee updated" });
      } else {
        await createEmployee.mutateAsync({ data: form });
        toast({ title: "Employee created" });
      }
      setIsDialogOpen(false);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteEmployee.mutateAsync({ id });
      toast({ title: "Employee deleted" });
      setIsDeleteConfirm(null);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const isSaving = createEmployee.isPending || updateEmployee.isPending;
  const isAdmin = user?.role === "admin";

  return (
    <DashboardLayout>
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Employees</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{employees?.length ?? 0} total employees</p>
          </div>
          {isAdmin && (
            <Button onClick={openCreate} size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              Add Employee
            </Button>
          )}
        </div>

        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search employees..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="p-8 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/40">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Employee</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Department</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Position</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden xl:table-cell">National ID</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  {isAdmin && <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered?.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                      No employees found
                    </td>
                  </tr>
                ) : (
                  filtered?.map((emp) => (
                    <tr key={emp.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <UserCircle className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{emp.name}</p>
                            <p className="text-xs text-muted-foreground">{emp.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{emp.department}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{emp.position}</td>
                      <td className="px-4 py-3 font-mono text-xs hidden xl:table-cell">{emp.nationalId}</td>
                      <td className="px-4 py-3">
                        <Badge variant={emp.status === "active" ? "default" : "secondary"} className="text-xs">
                          {emp.status}
                        </Badge>
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(emp)}>
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setIsDeleteConfirm(emp.id)}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Employee" : "Add Employee"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Jane Smith" />
              </div>
              <div className="space-y-2">
                <Label>National ID</Label>
                <Input value={form.nationalId} onChange={(e) => setForm({ ...form, nationalId: e.target.value })} placeholder="12345678" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="jane@company.com" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Department</Label>
                <Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="Engineering" />
              </div>
              <div className="space-y-2">
                <Label>Position</Label>
                <Input value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} placeholder="Developer" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as "active" | "inactive" })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingId ? "Save Changes" : "Add Employee"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteConfirm !== null} onOpenChange={() => setIsDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Employee</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">This will permanently delete the employee and all their attendance records.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => isDeleteConfirm && handleDelete(isDeleteConfirm)} disabled={deleteEmployee.isPending}>
              {deleteEmployee.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
