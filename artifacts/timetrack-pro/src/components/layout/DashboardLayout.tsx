import React from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, LayoutDashboard, Users, FileText, Settings, Terminal as TerminalIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["admin", "manager"] },
    { name: "Employees", href: "/employees", icon: Users, roles: ["admin", "manager"] },
    { name: "Reports", href: "/reports", icon: FileText, roles: ["admin", "manager"] },
    { name: "Terminal", href: "/terminal", icon: TerminalIcon, roles: ["admin", "manager", "employee"] },
    { name: "Users", href: "/settings/users", icon: Settings, roles: ["admin"] },
  ];

  const filteredNav = navigation.filter((item) => user && item.roles.includes(user.role));

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar */}
      <div className="w-64 border-r border-border bg-card flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <h1 className="text-lg font-bold font-mono tracking-tight text-primary">TimeTrack<span className="text-foreground">Pro</span></h1>
        </div>
        
        <nav className="flex-1 py-4 px-3 space-y-1">
          {filteredNav.map((item) => {
            const Icon = item.icon;
            const isActive = location.startsWith(item.href) && (item.href !== "/" || location === "/");
            return (
              <Link key={item.name} href={item.href} className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}>
                <Icon className="w-4 h-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center justify-between mb-4 px-2">
            <div className="flex flex-col">
              <span className="text-sm font-medium leading-none truncate w-32">{user?.name}</span>
              <span className="text-xs text-muted-foreground truncate w-32 mt-1">{user?.email}</span>
            </div>
            <span className="text-[10px] uppercase tracking-wider font-bold bg-secondary px-2 py-1 rounded-full text-muted-foreground">{user?.role}</span>
          </div>
          <Button variant="outline" className="w-full justify-start text-muted-foreground hover:text-foreground" onClick={logout}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign out
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
