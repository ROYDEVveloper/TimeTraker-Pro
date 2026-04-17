import { useState, useEffect } from "react";
import { usePunch } from "@workspace/api-client-react";
import { format } from "date-fns";
import { Delete, CheckCircle2, XCircle, Clock } from "lucide-react";

type PunchResult = {
  type: "check_in" | "check_out";
  message: string;
  employeeName: string;
  department: string;
  success: boolean;
} | null;

export default function Terminal() {
  const [digits, setDigits] = useState("");
  const [time, setTime] = useState(new Date());
  const [result, setResult] = useState<PunchResult>(null);
  const punchMutation = usePunch();

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

  const handleDigit = (digit: string) => {
    if (digits.length < 12) setDigits((prev) => prev + digit);
  };

  const handleClear = () => {
    if (digits.length > 0) setDigits((prev) => prev.slice(0, -1));
  };

  const handleSubmit = async () => {
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
        message: "Employee not found. Please try again.",
        employeeName: "",
        department: "",
        success: false,
      });
    }
  };

  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "back"];

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-primary" />
            <span className="text-lg font-bold font-mono text-primary">TimeTrackPro</span>
          </div>
          <div className="text-5xl font-mono font-bold tabular-nums tracking-tight text-foreground">
            {format(time, "HH:mm:ss")}
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            {format(time, "EEEE, MMMM d, yyyy")}
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xl">
          {result ? (
            <div className={`p-8 text-center transition-all ${result.success ? "" : ""}`}>
              {result.success ? (
                <CheckCircle2 className={`w-14 h-14 mx-auto mb-4 ${result.type === "check_in" ? "text-chart-2" : "text-chart-3"}`} />
              ) : (
                <XCircle className="w-14 h-14 mx-auto mb-4 text-destructive" />
              )}
              <p className="text-lg font-semibold">{result.success ? result.employeeName : "Not Found"}</p>
              {result.success && <p className="text-sm text-muted-foreground mt-1">{result.department}</p>}
              <div className={`mt-4 px-4 py-2 rounded-lg text-sm font-medium ${
                result.success
                  ? result.type === "check_in"
                    ? "bg-chart-2/10 text-chart-2"
                    : "bg-secondary text-muted-foreground"
                  : "bg-destructive/10 text-destructive"
              }`}>
                {result.message}
              </div>
            </div>
          ) : (
            <div className="p-6">
              <div className="bg-secondary rounded-xl px-4 py-3 mb-5 min-h-[52px] flex items-center">
                <span className="font-mono text-2xl tracking-widest text-foreground flex-1">
                  {digits.replace(/(.{4})/g, "$1 ").trim() || ""}
                </span>
                <span className="text-muted-foreground text-sm ml-2">{digits.length > 0 ? `${digits.length} digits` : "Enter ID"}</span>
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
                {punchMutation.isPending ? "Recording..." : "Record Attendance"}
              </button>
            </div>
          )}
        </div>

        <p className="text-xs text-center text-muted-foreground mt-4">
          Enter your national ID to record check-in or check-out
        </p>
      </div>
    </div>
  );
}
