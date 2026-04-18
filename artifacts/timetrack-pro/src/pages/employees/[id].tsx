import { useGetEmployee, useGetEmployeeAttendance } from "@workspace/api-client-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link, useParams } from "wouter";
import { ArrowLeft, UserCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function EmployeeDetail() {
  const params = useParams<{ id: string }>();
  const id = parseInt(params.id ?? "0");

  const { data: employee, isLoading: empLoading } = useGetEmployee(id);
  const { data: logs, isLoading: logsLoading } = useGetEmployeeAttendance(id);

  if (empLoading) {
    return (
      <DashboardLayout>
        <div className="p-6 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (!employee) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <p className="text-muted-foreground">Empleado no encontrado.</p>
          <Link href="/employees">
            <Button variant="outline" className="mt-4">Volver a Empleados</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/employees">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-semibold">{employee.name}</h1>
            <p className="text-sm text-muted-foreground">Detalle del Empleado</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card border border-border rounded-xl p-5 flex flex-col items-center text-center gap-3">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <UserCircle className="w-10 h-10 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-lg">{employee.name}</p>
              <p className="text-sm text-muted-foreground">{employee.position}</p>
              <p className="text-sm text-muted-foreground">{employee.department}</p>
            </div>
            <Badge variant={employee.status === "active" ? "default" : "secondary"}>
              {employee.status === "active" ? "Activo" : "Inactivo"}
            </Badge>
          </div>

          <div className="md:col-span-2 bg-card border border-border rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold">Información de Contacto e Identificación</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">ID Nacional</p>
                <p className="font-mono">{employee.nationalId}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Correo electrónico</p>
                <p>{employee.email ?? "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Departamento</p>
                <p>{employee.department}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Cargo</p>
                <p>{employee.position}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-sm font-semibold">Asistencia Reciente</h2>
          </div>
          {logsLoading ? (
            <div className="p-8 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/40">
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Fecha</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Hora</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Tipo</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden md:table-cell">Notas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(!logs || logs.length === 0) ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-muted-foreground">Sin registros de asistencia</td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="px-5 py-3 capitalize">{format(new Date(log.timestamp), "d MMM yyyy", { locale: es })}</td>
                      <td className="px-5 py-3 font-mono">{format(new Date(log.timestamp), "HH:mm:ss")}</td>
                      <td className="px-5 py-3">
                        <Badge variant={log.type === "check_in" ? "default" : "secondary"} className="text-xs">
                          {log.type === "check_in" ? "Entrada" : "Salida"}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground hidden md:table-cell">{log.notes ?? "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
