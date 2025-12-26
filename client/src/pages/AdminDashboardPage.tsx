// This page redirects to the working AdminDashboard
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function AdminDashboardPage() {
  const [, navigate] = useLocation();
  
  useEffect(() => {
    navigate("/admin/dashboard");
  }, [navigate]);
  
  return null;
}
