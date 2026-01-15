import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import apis from "../apis/axios";

export default function VerifyEmail() {
  const [message, setMessage] = useState("Verifying email...");
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token"); // 👈 Extract token from URL

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setMessage("Verification token is missing.");
        return;
      }

      try {
        const res = await apis.get(`/verify-email?token=${token}`);
        setMessage(res.data.message);
      } catch (err) {
        setMessage(err.response?.data?.message || "Verification failed.");
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-purple-700 via-pink-600 to-indigo-500 animate-gradient-x">
      <div className="w-full max-w-md p-10 space-y-6 bg-black/60 backdrop-blur-md rounded-3xl shadow-2xl border border-white/20">
        <h2 className="text-4xl font-extrabold text-center text-white drop-shadow-lg">
          Verify Email
        </h2>
        <p className="text-white text-center mt-4">{message}</p>
      </div>
    </div>
  );
}
