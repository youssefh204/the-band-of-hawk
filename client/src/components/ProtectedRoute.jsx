import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { checkAuth } from "../utils/chuckAuth";

export default function ProtectedRoute({ children, requiredRole }) {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const verify = async () => {
      const user = await checkAuth();
      if (!user) {
        setAuthorized(false);
      } else if (
        requiredRole &&
        (
          (Array.isArray(requiredRole) && !requiredRole.includes(user.role)) ||
          (!Array.isArray(requiredRole) && user.role !== requiredRole)
        )
      ) {
        setAuthorized(false);
      } else {
        setAuthorized(true);
      }
      setLoading(false);
    };
    verify();
  }, [requiredRole]);

  if (loading)
    return (
      <div className="text-center mt-20 text-white">
        Checking authorization...
      </div>
    );

  if (!authorized) return <Navigate to="/unauthorized" />;

  return children;
}
