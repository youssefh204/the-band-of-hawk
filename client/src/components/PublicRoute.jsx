// src/components/PublicRoute.jsx
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { checkAuth } from "../utils/chuckAuth"; // same as ProtectedRoute

export default function PublicRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState(null);

  useEffect(() => {
    const verify = async () => {
      const user = await checkAuth();
      if (user) {
        setIsLoggedIn(true);
        setRole(user.role);
      }
      setLoading(false);
    };
    verify();
  }, []);

  if (loading) {
    return (
      <div className="text-center mt-20 text-white">
        Checking authentication...
      </div>
    );
  }

  // ✅ Redirect logged-in users based on role
  if (isLoggedIn) {
    if (role === "Admin") return <Navigate to="/admin" replace />;
    if (role === "Vendor") return <Navigate to="/vendor-dashboard" replace />;
    return <Navigate to="/Home" replace />;
  }

  // ✅ Otherwise, allow access to login/register/etc.
  return children;
}
