import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../apis/workshopClient";

export default function ScanTicket() {
  const { eventType, eventId, ticketId } = useParams();
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("Checking ticket...");

  useEffect(() => {
    async function checkIn() {
      try {
        const res = await api.post(`/tickets/checkin/${eventType}/${eventId}/${ticketId}`);
        setMessage(res.data.message);
        setStatus(res.data.success ? "success" : "error");
      } catch {
        setMessage("Something went wrong.");
        setStatus("error");
      }
    }
    checkIn();
  }, [eventType, eventId, ticketId]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white p-6 text-center">
      <div className="bg-white/10 backdrop-blur-lg p-8 rounded-3xl shadow-xl w-full max-w-md border border-white/20">
        {status === "loading" && (
          <>
            <div className="animate-spin h-10 w-10 border-b-2 border-white mx-auto mb-4"></div>
            <p>{message}</p>
          </>
        )}

        {status === "success" && (
          <>
            <h2 className="text-3xl font-bold text-green-400">🎟 Ticket Valid</h2>
            <p className="mt-2 text-lg text-white/80">{message}</p>
          </>
        )}

        {status === "error" && (
          <>
            <h2 className="text-3xl font-bold text-red-500">❌ Ticket Error</h2>
            <p className="mt-2 text-lg text-white/80">{message}</p>
          </>
        )}
      </div>
    </div>
  );
}
