import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { usePunch } from "@workspace/api-client-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Delete,
  CheckCircle2,
  XCircle,
  Clock,
  Sun,
  Moon,
  LogIn,
  Timer,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type PunchResult = {
  type: "check_in" | "check_out";
  message: string;
  employeeName: string;
  department: string;
  success: boolean;
  workedHours?: number;
  extraHours?: number;
  checkInTime?: string | null;
  checkOutTime?: string | null;
} | null;

function formatHours(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

export default function Terminal() {
  const [digits, setDigits] = useState("");
  const [time, setTime] = useState(new Date());
  const [result, setResult] = useState<PunchResult>(null);
  const punchMutation = usePunch();
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (result) {
      const timeout = setTimeout(() => {
        setResult(null);
        setDigits("");
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [result]);

  const handleSubmit = useCallback(async () => {
    if (!digits || punchMutation.isPending) return;
    try {
      const res = await punchMutation.mutateAsync({ data: { documentNumber: digits } });
      setResult({
        type: res.type,
        message: res.message,
        employeeName: res.employee.name,
        department: res.employee.department,
        success: true,
        workedHours: res.todaySummary.workedHours,
        extraHours: res.todaySummary.extraHours,
        checkInTime: res.todaySummary.checkInTime,
        checkOutTime: res.todaySummary.checkOutTime,
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
      if (e.key >= "0" && e.key <= "9") handleDigit(e.key);
      else if (e.key === "Backspace") handleClear();
      else if (e.key === "Enter") handleSubmit();
      else if (e.key === "Escape") setDigits("");
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [result, handleDigit, handleClear, handleSubmit]);

  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "back"];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-3 sm:p-4">
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 flex items-center gap-2">
        {!user && (
          <Link href="/login">
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground text-xs">
              <LogIn className="w-3.5 h-3.5" />
              Administración
            </Button>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground"
          onClick={toggleTheme}
          title={theme === "dark" ? "Modo claro" : "Modo oscuro"}
        >
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>
      </div>

      <div className="w-full max-w-sm sm:max-w-md mt-12 sm:mt-0">
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Clock className="w-5 h-5 text-primary" />
            <span className="text-lg font-bold font-mono text-primary tracking-tight">TimeTrackPro</span>
          </div>
          <div className="text-5xl sm:text-6xl font-mono font-bold tabular-nums tracking-tight">
            {format(time, "HH:mm:ss")}
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground mt-1.5 capitalize px-2">
            {format(time, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xl">
          {result ? (
            <div className="p-8 text-center">
              {result.success ? (
                <>
                  <CheckCircle2
                    className={`w-14 h-14 mx-auto mb-3 ${
                      result.type === "check_in" ? "text-chart-2" : "text-chart-3"
                    }`}
                  />
                  <p className="text-xl font-bold">{result.employeeName}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{result.department}</p>
                  <div
                    className={`mt-4 px-4 py-2 rounded-lg text-sm font-semibold ${
                      result.type === "check_in"
                        ? "bg-chart-2/10 text-chart-2"
                        : "bg-chart-3/10 text-chart-3"
                    }`}
                  >
                    {result.message}
                  </div>
                  {(result.workedHours !== undefined && result.workedHours > 0) && (
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="bg-secondary rounded-xl px-3 py-3 text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Timer className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Trabajado</span>
                        </div>
                        <span className="font-mono font-bold text-sm">{formatHours(result.workedHours)}</span>
                      </div>
                      <div className={`rounded-xl px-3 py-3 text-center ${result.extraHours && result.extraHours > 0 ? "bg-chart-2/10" : "bg-secondary"}`}>
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Extras</span>
                        </div>
                        <span className={`font-mono font-bold text-sm ${result.extraHours && result.extraHours > 0 ? "text-chart-2" : ""}`}>
                          {formatHours(result.extraHours ?? 0)}
                        </span>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <XCircle className="w-14 h-14 mx-auto mb-4 text-destructive" />
                  <p className="text-lg font-semibold">No Encontrado</p>
                  <div className="mt-4 px-4 py-2 rounded-lg text-sm bg-destructive/10 text-destructive">
                    {result.message}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="p-6">
              <p className="text-xs text-muted-foreground text-center mb-3 font-medium uppercase tracking-wider">
                Número de documento
              </p>
              <div className="bg-secondary rounded-xl px-4 py-3 mb-5 min-h-[52px] flex items-center">
                <span className="font-mono text-2xl tracking-widest text-foreground flex-1">
                  {digits.replace(/(.{4})/g, "$1 ").trim() || ""}
                </span>
                <span className="text-muted-foreground text-sm ml-2">
                  {digits.length > 0 ? `${digits.length} díg.` : "—"}
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
                        className="w-full aspect-square flex items-center justify-center rounded-xl bg-secondary text-muted-foreground hover:bg-secondary/80 active:scale-95 transition-all"
                      >
                        <Delete className="w-6 h-6 sm:w-5 sm:h-5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleDigit(key)}
                        className="w-full aspect-square flex items-center justify-center rounded-xl bg-secondary text-foreground hover:bg-secondary/70 active:scale-95 transition-all text-2xl sm:text-xl font-semibold font-mono"
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
                className="w-full mt-4 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-base hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {punchMutation.isPending ? "Registrando..." : "Registrar Asistencia"}
              </button>
            </div>
          )}
        </div>

        <p className="text-xs text-center text-muted-foreground mt-4">
          Teclado físico: números para ingresar · Enter para registrar · Esc para limpiar
        </p>
      </div>
    </div>
  );
}
