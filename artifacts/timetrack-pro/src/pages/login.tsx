import { useState } from "react";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Clock } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const loginMutation = useLogin();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const result = await loginMutation.mutateAsync({ data: { email, password } });
      login(result.token);
      setLocation("/dashboard");
    } catch {
      setError("Correo o contraseña incorrectos. Por favor intente de nuevo.");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Clock className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold font-mono tracking-tight">
              TimeTrack<span className="text-primary">Pro</span>
            </span>
          </div>
          <p className="text-muted-foreground text-sm">Inicia sesión en tu cuenta</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-8 shadow-md">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@timetrackpro.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="h-10"
              />
            </div>

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full h-10" disabled={loginMutation.isPending}>
              {loginMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                "Iniciar sesión"
              )}
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-border">
            <p className="text-xs text-muted-foreground text-center mb-3">Credenciales de demostración</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-secondary rounded-lg px-3 py-2">
                <p className="font-medium text-foreground">Administrador</p>
                <p className="text-muted-foreground">admin@timetrackpro.com</p>
                <p className="text-muted-foreground">admin123</p>
              </div>
              <div className="bg-secondary rounded-lg px-3 py-2">
                <p className="font-medium text-foreground">Gerente</p>
                <p className="text-muted-foreground">manager@timetrackpro.com</p>
                <p className="text-muted-foreground">manager123</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
