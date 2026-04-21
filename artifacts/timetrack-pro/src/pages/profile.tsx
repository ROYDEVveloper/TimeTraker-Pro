import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { User, Mail, Shield, Building2 } from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Administrador",
  admin: "Administrador de empresa",
  employee: "Empleado",
};

function Field({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | number | null | undefined }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-border last:border-0">
      <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium truncate">{value ?? "—"}</p>
      </div>
    </div>
  );
}

export default function Profile() {
  const { user } = useAuth();

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 max-w-2xl">
        <div className="mb-6">
          <h1 className="text-xl font-semibold">Mi Perfil</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Información de tu cuenta</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <Field icon={User} label="Nombre" value={user?.name} />
          <Field icon={Mail} label="Correo electrónico" value={user?.email} />
          <Field icon={Shield} label="Rol" value={ROLE_LABELS[user?.role ?? ""] ?? user?.role} />
          <Field icon={Building2} label="Empresa" value={user?.companyId ? `#${user.companyId}` : "Plataforma"} />
        </div>
      </div>
    </DashboardLayout>
  );
}
