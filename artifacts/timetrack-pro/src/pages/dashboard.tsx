import { useGetDashboardSummary, useGetAttendanceTrends, useGetTodayActivity } from "@workspace/api-client-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Users, UserCheck, UserX, LogIn, LogOut, Activity } from "lucide-react";
import { format } from "date-fns";

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number | string; color: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{label}</p>
          <p className="text-3xl font-bold mt-1 font-mono">{value}</p>
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data: summary, isLoading: summaryLoading } = useGetDashboardSummary();
  const { data: trends } = useGetAttendanceTrends();
  const { data: todayActivity, isLoading: activityLoading } = useGetTodayActivity();

  const chartData = trends?.map((t) => ({
    date: format(new Date(t.date), "EEE"),
    "Check-ins": t.checkIns,
    "Check-outs": t.checkOuts,
  }));

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{format(new Date(), "EEEE, MMMM d, yyyy")}</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {summaryLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-5 animate-pulse h-24" />
            ))
          ) : (
            <>
              <StatCard icon={Users} label="Total Employees" value={summary?.totalEmployees ?? 0} color="bg-primary/10 text-primary" />
              <StatCard icon={Activity} label="Active Today" value={summary?.activeToday ?? 0} color="bg-chart-2/10 text-chart-2" />
              <StatCard icon={UserCheck} label="Currently In" value={summary?.checkedInNow ?? 0} color="bg-chart-2/10 text-chart-2" />
              <StatCard icon={LogIn} label="Check-ins Today" value={summary?.checkInsToday ?? 0} color="bg-primary/10 text-primary" />
              <StatCard icon={LogOut} label="Check-outs Today" value={summary?.checkOutsToday ?? 0} color="bg-chart-3/10 text-chart-3" />
              <StatCard icon={UserX} label="Absent Today" value={summary?.absentToday ?? 0} color="bg-destructive/10 text-destructive" />
            </>
          )}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          <div className="xl:col-span-3 bg-card border border-border rounded-xl p-5">
            <h2 className="text-sm font-semibold mb-4">Attendance — Last 7 Days</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} barSize={10}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                    color: "hsl(var(--foreground))",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Bar dataKey="Check-ins" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Check-outs" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="xl:col-span-2 bg-card border border-border rounded-xl p-5">
            <h2 className="text-sm font-semibold mb-4">Today's Activity</h2>
            {activityLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-12 bg-secondary rounded-lg animate-pulse" />
                ))}
              </div>
            ) : todayActivity && todayActivity.length > 0 ? (
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {todayActivity.map((log) => (
                  <div key={log.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-secondary/50">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${log.type === "check_in" ? "bg-chart-2" : "bg-chart-3"}`} />
                      <div>
                        <p className="text-sm font-medium leading-none">{log.employee?.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{log.employee?.department}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs font-medium ${log.type === "check_in" ? "text-chart-2" : "text-muted-foreground"}`}>
                        {log.type === "check_in" ? "In" : "Out"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(log.timestamp), "HH:mm")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-[220px]">
                <p className="text-sm text-muted-foreground">No activity recorded today</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
