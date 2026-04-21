import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { GraduationCap, Sigma, Zap } from "lucide-react";

const COULOMB_K = 8.9875517873681764e9;

function safeEval(expr: string, x: number): number {
  const sanitized = expr
    .replace(/\^/g, "**")
    .replace(/\bsin\b/g, "Math.sin")
    .replace(/\bcos\b/g, "Math.cos")
    .replace(/\btan\b/g, "Math.tan")
    .replace(/\bln\b/g, "Math.log")
    .replace(/\blog\b/g, "Math.log10")
    .replace(/\bsqrt\b/g, "Math.sqrt")
    .replace(/\babs\b/g, "Math.abs")
    .replace(/\bexp\b/g, "Math.exp")
    .replace(/\bpi\b/gi, "Math.PI")
    .replace(/\be\b/g, "Math.E");

  if (!/^[\sx0-9+\-*/().,a-zA-Z_]+$/.test(sanitized)) {
    throw new Error("Expresión no válida");
  }

  // eslint-disable-next-line no-new-func
  const fn = new Function("x", `return (${sanitized});`);
  const result = fn(x);
  if (typeof result !== "number" || !isFinite(result)) throw new Error("Indeterminado");
  return result;
}

function LimitCalculator() {
  const [expr, setExpr] = useState("x^2");
  const [target, setTarget] = useState("2");
  const [error, setError] = useState<string | null>(null);

  const result = useMemo(() => {
    setError(null);
    if (!expr.trim() || !target.trim()) return null;
    const a = Number(target);
    if (!isFinite(a)) {
      setError("x → debe ser un número");
      return null;
    }
    try {
      const offsets = [-0.1, -0.01, -0.001, -0.0001, 0.0001, 0.001, 0.01, 0.1];
      const steps = offsets.map((d) => {
        const x = a + d;
        const y = safeEval(expr, x);
        return { x, y };
      });
      const left = steps[3].y;
      const right = steps[4].y;
      const limit = (left + right) / 2;
      return { steps, left, right, limit };
    } catch (e: any) {
      setError(e?.message ?? "Error de cálculo");
      return null;
    }
  }, [expr, target]);

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Sigma className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">Calculadora de Límites</h3>
      </div>
      <p className="text-xs text-muted-foreground">
        Calcula numéricamente lim<sub>x→a</sub> f(x). Soporta x^n, sin, cos, tan, ln, log, sqrt, exp, pi, e.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2 space-y-1.5">
          <Label className="text-xs">f(x) =</Label>
          <Input value={expr} onChange={(e) => setExpr(e.target.value)} placeholder="ej: x^2 + sin(x)" className="font-mono" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">x →</Label>
          <Input value={target} onChange={(e) => setTarget(e.target.value)} placeholder="ej: 2" className="font-mono" />
        </div>
      </div>

      {error && (
        <div className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-2">
          <div className="bg-primary/10 border border-primary/30 rounded-lg p-3">
            <p className="text-xs text-muted-foreground">Resultado aproximado</p>
            <p className="text-2xl font-mono font-bold text-primary">≈ {result.limit.toFixed(6)}</p>
          </div>
          <div className="text-xs">
            <p className="text-muted-foreground mb-1">Aproximación paso a paso:</p>
            <table className="w-full font-mono text-[11px]">
              <thead className="text-muted-foreground">
                <tr><th className="text-left py-0.5">x</th><th className="text-left py-0.5">f(x)</th></tr>
              </thead>
              <tbody>
                {result.steps.map((s, i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="py-0.5">{s.x.toFixed(4)}</td>
                    <td className="py-0.5">{s.y.toFixed(6)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function CoulombCalculator() {
  const [q1, setQ1] = useState("1e-6");
  const [q2, setQ2] = useState("2e-6");
  const [r, setR] = useState("0.5");

  const result = useMemo(() => {
    const a = Number(q1);
    const b = Number(q2);
    const d = Number(r);
    if (!isFinite(a) || !isFinite(b) || !isFinite(d) || d === 0) return null;
    return (COULOMB_K * Math.abs(a * b)) / (d * d);
  }, [q1, q2, r]);

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Zap className="w-5 h-5 text-chart-3" />
        <h3 className="font-semibold">Cargas Eléctricas (Ley de Coulomb)</h3>
      </div>
      <p className="text-xs text-muted-foreground font-mono">F = k · |q₁ · q₂| / r²</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">q₁ (C)</Label>
          <Input value={q1} onChange={(e) => setQ1(e.target.value)} className="font-mono" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">q₂ (C)</Label>
          <Input value={q2} onChange={(e) => setQ2(e.target.value)} className="font-mono" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">r (m)</Label>
          <Input value={r} onChange={(e) => setR(e.target.value)} className="font-mono" />
        </div>
      </div>

      {result !== null ? (
        <div className="bg-chart-3/10 border border-chart-3/30 rounded-lg p-3">
          <p className="text-xs text-muted-foreground">Fuerza eléctrica</p>
          <p className="text-2xl font-mono font-bold text-chart-3">F ≈ {result.toExponential(4)} N</p>
        </div>
      ) : (
        <div className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
          Verifica los valores ingresados (r no puede ser 0).
        </div>
      )}

      <p className="text-[11px] text-muted-foreground">k = 8.9875 × 10⁹ N·m²/C²</p>
    </div>
  );
}

export function AcademicTools() {
  return (
    <div className="space-y-3 pt-2">
      <div className="flex items-center gap-2">
        <GraduationCap className="w-5 h-5 text-primary" />
        <h2 className="text-base font-semibold">Herramientas Académicas</h2>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LimitCalculator />
        <CoulombCalculator />
      </div>
    </div>
  );
}
