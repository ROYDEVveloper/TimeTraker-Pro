import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import NotFound from "@/pages/not-found";

import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Terminal from "@/pages/terminal";
import EmployeesList from "@/pages/employees/index";
import EmployeeDetail from "@/pages/employees/[id]";
import Reports from "@/pages/reports";
import UsersSettings from "@/pages/settings/users";
import WorkScheduleSettings from "@/pages/settings/workSchedule";
import Companies from "@/pages/companies";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      refetchOnWindowFocus: true,
    },
  },
});

function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={Terminal} />
      <Route path="/login" component={Login} />

      <Route path="/dashboard">
        <ProtectedRoute component={Dashboard} allowedRoles={["super_admin", "admin"]} />
      </Route>
      <Route path="/companies">
        <ProtectedRoute component={Companies} allowedRoles={["super_admin"]} />
      </Route>
      <Route path="/employees">
        <ProtectedRoute component={EmployeesList} allowedRoles={["admin"]} />
      </Route>
      <Route path="/employees/:id">
        <ProtectedRoute component={EmployeeDetail} allowedRoles={["admin"]} />
      </Route>
      <Route path="/reports">
        <ProtectedRoute component={Reports} allowedRoles={["admin"]} />
      </Route>
      <Route path="/settings/users">
        <ProtectedRoute component={UsersSettings} allowedRoles={["admin"]} />
      </Route>
      <Route path="/settings/jornada">
        <ProtectedRoute component={WorkScheduleSettings} allowedRoles={["admin"]} />
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <AuthProvider>
              <AppRouter />
            </AuthProvider>
          </WouterRouter>
          <Toaster />
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
