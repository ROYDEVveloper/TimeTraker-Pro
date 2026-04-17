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
    return null; // Handled by AuthProvider
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Redirect to="/dashboard" />;
  }

  return <Component />;
}
