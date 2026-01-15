// src/components/VendorRoute.jsx
import { Navigate } from "react-router-dom";

export default function VendorRoute({ children }) {
  const user = JSON.parse(localStorage.getItem("user"));

  // Check if user exists
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user is a vendor
  if (user.role !== "vendor" && user.accountType !== "vendor") {
    return <Navigate to="/unauthorized" replace />;
  }

  // Check if vendor is approved
  if ((user.role === "vendor" || user.accountType === "vendor") && !user.isApproved) {
    return <Navigate to="/vendor-pending" replace />;
  }

  return children;
}