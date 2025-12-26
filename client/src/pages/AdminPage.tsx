// Redirects to AdminDashboard
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function AdminPage() {
  const [, navigate] = useLocation();
  
  useEffect(() => {
    navigate("/admin/dashboard");
  }, [navigate]);
  
  return null;
}
