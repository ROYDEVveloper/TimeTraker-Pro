import { useAuth } from "@/contexts/AuthContext";
import { Redirect, RouteComponentProps } from "wouter";
import React from "react";

interface ProtectedRouteProps {
  component: React.ComponentType<RouteComponentProps>;
  allowedRoles?: string[];
  path?: string;
}

export function ProtectedRoute({ component: Component, allowedRoles, path }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect based on role
    if (user.role === "super_admin") {
      return <Redirect to="/companies" />;
    }
    return <Redirect to="/dashboard" />;
  }

  return <Component />;
}
