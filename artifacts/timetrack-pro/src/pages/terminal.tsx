import { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { usePunch } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Delete,
  CheckCircle2,
  XCircle,
  Clock,
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  Terminal as TerminalIcon,
  LogOut,
  Sun,
  Moon,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type PunchResult = {
  type: "check_in" | "check_out";
  message: string;
  employeeName: string;
  department: string;
  success: boolean;
} | null;

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador",
  manager: "Gerente",
  employee: "Empleado",
};

export default function Terminal() {
  const [digits, setDigits] = useState("");
  const [time, setTime] = useState(new Date());
  const [result, setResult] = useState<PunchResult>(null);
  const punchMutation = usePunch();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [location] = useLocation();

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (result) {
      const timeout = setTimeout(() => {
        setResult(null);
        setDigits("");
      }, 3500);
      return () => clearTimeout(timeout);
    }
  }, [result]);

  const handleSubmit = useCallback(async () => {
    if (!digits || punchMutation.isPending) return;
    try {
      const res = await punchMutation.mutateAsync({ data: { nationalId: digits } });
      setResult({
        type: res.type,
        message: res.message,
        employeeName: res.employee.name,
        department: res.employee.department,
        success: true,
      });
    } catch {
      setResult({
        type: "check_in",
        message: "Empleado no encontrado. Por favor intente de nuevo.",
        employeeName: "",
        department: "",
        success: false,
      });
    }
  }, [digits, punchMutation]);

  const handleDigit = useCallback((digit: string) => {
    if (digits.length < 12) setDigits((prev) => prev + digit);
  }, [digits]);

  const handleClear = useCallback(() => {
    setDigits((prev) => prev.slice(0, -1));
  }, []);

  useEffect(() => {
    if (result) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= "0" && e.key <= "9") {
        handleDigit(e.key);
      } else if (e.key === "Backspace") {
        handleClear();
      } else if (e.key === "Enter") {
        handleSubmit();
      } else if (e.key === "Escape") {
        setDigits("");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [result, handleDigit, handleClear, handleSubmit]);

  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "back"];

  const navigation = [
    { name: "Panel", href: "/dashboard", icon: LayoutDashboard, roles: ["admin", "manager", "employee"] },
    { name: "Terminal", href: "/terminal", icon: TerminalIcon, roles: ["admin", "manager", "employee"] },
    { name: "Empleados", href: "/employees", icon: Users, roles: ["admin", "manager"] },
    { name: "Reportes", href: "/reports", icon: FileText, roles: ["admin", "manager"] },
    { name: "Usuarios", href: "/settings/users", icon: Settings, roles: ["admin"] },
    { name: "Jornada Laboral", href: "/settings/jornada", icon: Calendar, roles: ["admin"] },
  ];

  const filteredNav = navigation.filter((item) => user && item.roles.includes(user.role));

  return (
    <div className="flex h-screen bg-background text-foreground">
      {user && (
        <div className="w-64 border-r border-border bg-card flex flex-col">
          <div className="h-16 flex items-center px-6 border-b border-border">
            <h1 className="text-lg font-bold font-mono tracking-tight text-primary">
              TimeTrack<span className="text-foreground">Pro</span>
            </h1>
          </div>

          <nav className="flex-1 py-4 px-3 space-y-1">
            {filteredNav.map((item) => {
              const Icon = item.icon;
              const isActive = location.startsWith(item.href) && (item.href !== "/" || location === "/");
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-border space-y-3">
            <div className="flex items-center justify-between px-2">
              <div className="flex flex-col">
                <span className="text-sm font-medium leading-none truncate w-28">{user?.name}</span>
                <span className="text-xs text-muted-foreground truncate w-28 mt-1">{user?.email}</span>
              </div>
              <span className="text-[10px] uppercase tracking-wider font-bold bg-secondary px-2 py-1 rounded-full text-muted-foreground">
                {ROLE_LABELS[user?.role ?? ""] ?? user?.role}
              </span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" className="h-9 w-9 flex-shrink-0" onClick={toggleTheme}>
                {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
              <Button
                variant="outline"
                className="flex-1 justify-start text-muted-foreground hover:text-foreground text-sm"
                onClick={logout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar sesión
              </Button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            {!user && (
              <div className="flex items-center justify-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-primary" />
                <span className="text-lg font-bold font-mono text-primary">TimeTrackPro</span>
              </div>
            )}
            <div className="text-5xl font-mono font-bold tabular-nums tracking-tight text-foreground">
              {format(time, "HH:mm:ss")}
            </div>
            <div className="text-sm text-muted-foreground mt-1 capitalize">
              {format(time, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xl">
            {result ? (
              <div className="p-8 text-center transition-all">
                {result.success ? (
                  <CheckCircle2
                    className={`w-14 h-14 mx-auto mb-4 ${
                      result.type === "check_in" ? "text-chart-2" : "text-chart-3"
                    }`}
                  />
                ) : (
                  <XCircle className="w-14 h-14 mx-auto mb-4 text-destructive" />
                )}
                <p className="text-lg font-semibold">
                  {result.success ? result.employeeName : "No Encontrado"}
                </p>
                {result.success && (
                  <p className="text-sm text-muted-foreground mt-1">{result.department}</p>
                )}
                <div
                  className={`mt-4 px-4 py-2 rounded-lg text-sm font-medium ${
                    result.success
                      ? result.type === "check_in"
                        ? "bg-chart-2/10 text-chart-2"
                        : "bg-secondary text-muted-foreground"
                      : "bg-destructive/10 text-destructive"
                  }`}
                >
                  {result.message}
                </div>
              </div>
            ) : (
              <div className="p-6">
                <div className="bg-secondary rounded-xl px-4 py-3 mb-5 min-h-[52px] flex items-center">
                  <span className="font-mono text-2xl tracking-widest text-foreground flex-1">
                    {digits.replace(/(.{4})/g, "$1 ").trim() || ""}
                  </span>
                  <span className="text-muted-foreground text-sm ml-2">
                    {digits.length > 0 ? `${digits.length} dígitos` : "Ingrese ID"}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {keys.map((key, i) => (
                    <div key={i}>
                      {key === "" ? (
                        <div />
                      ) : key === "back" ? (
                        <button
                          onClick={handleClear}
                          className="w-full aspect-square flex items-center justify-center rounded-xl bg-secondary text-muted-foreground hover:bg-secondary/80 active:scale-95 transition-all text-sm font-medium"
                        >
                          <Delete className="w-5 h-5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleDigit(key)}
                          className="w-full aspect-square flex items-center justify-center rounded-xl bg-secondary text-foreground hover:bg-secondary/70 active:scale-95 transition-all text-xl font-semibold font-mono"
                        >
                          {key}
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={digits.length === 0 || punchMutation.isPending}
                  className="w-full mt-4 h-13 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-base hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {punchMutation.isPending ? "Registrando..." : "Registrar Asistencia"}
                </button>
              </div>
            )}
          </div>

          <p className="text-xs text-center text-muted-foreground mt-4">
            Ingrese su ID nacional o use el teclado físico (Enter para confirmar, Esc para limpiar)
          </p>
        </div>
      </main>
    </div>
  );
}
