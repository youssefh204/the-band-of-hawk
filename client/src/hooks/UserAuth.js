import { useEffect, useState } from "react";
import axios from "axios";

export default function useAuth() {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  useEffect(() => {
    async function verify() {
      try {
        const res = await axios.get("/auth/check");
        setUser(res.data.user);
        localStorage.setItem("user", JSON.stringify(res.data.user));
      } catch {
        setUser(null);
        localStorage.removeItem("user");
      }
    }

    verify();
  }, []);

  return { user, setUser };
}
