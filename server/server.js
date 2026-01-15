import express from "express";
import cors from "cors";
import 'dotenv/config';
import cookieParser from "cookie-parser";
import connectDB from "./config/mongodb.js";
import authRouter from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import workshopRoutes from "./routes/workshoproutes.js";
import bazaarRoutes from './routes/bazaarRoutes.js';
import courtRoutes from "./routes/CourtRoutes.js";
import tripRoutes from "./routes/tripRoutes.js";
import vendorRoutes from "./routes/vendorRoutes.js";
import applicationRoutes from "./routes/applicationRoutes.js";
import conferenceRoutes from "./routes/conferenceRoutes.js";
import gymSessions from "./routes/gymRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";
import registrationRoutes from './routes/registrationRoutes.js';
import favoritesRoutes from './routes/favoritesRoutes.js';
import exportRoutes from "./routes/exportRoutes.js";
import ratingRoutes from "./routes/ratingRoutes.js";
import salesReportRoutes from "./routes/salesReportRoutes.js";
import testMail from "./routes/testMail.js";
import vendorUploadsRoutes from "./routes/vendorUploads.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import certificateRoutes from './routes/certificateRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import ReminderJob from "./models/ReminderJob.js";
import path from "path";
import { fileURLToPath } from "url";
import { Server } from "socket.io";
import http from "http";
import ticketRoutes from "./routes/ticketRoutes.js";
import loyaltyRoutes from './routes/loyalty.js';
import documentRoutes from "./routes/documentRoutes.js";
import courtReservationRoutes from "./routes/courtReservationRoutes.js";
import pollRoutes from "./routes/pollRoutes.js";
import clubRoutes from "./routes/clubRoutes.js";
import clubEventroutes from "./routes/clubEventRoutes.js";



 // allow routers to emit



// REMINDER: Make sure to install node-cron if you haven't already: npm install node-cron

// Import the webhook controller
import { handleStripeWebhook } from "./controllers/webhookController.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 4000;

connectDB();

// 🆕 STRIPE WEBHOOK ROUTE - MUST COME BEFORE express.json()
// This needs raw body for signature verification
app.post('/webhooks/stripe', express.raw({type: 'application/json'}), handleStripeWebhook);
// Regular middleware for all other routes
app.use(express.json({ limit: '50mb' })); // Increased for certificate generation
app.use(cookieParser());
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5000"],
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Request logger middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.get("/", (req, res) => res.send("The Band remembers! THE BAND WILL BE BACK SOON"));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    credentials: true
  }
});
export { io };


app.set("io", io);
app.use("/uploads", express.static(path.join(__dirname, "uploads"), {
  setHeaders: (res, path) => {
    if (path.endsWith(".png")) res.setHeader("Content-Type", "image/png");
    if (path.endsWith(".jpg") || path.endsWith(".jpeg")) res.setHeader("Content-Type", "image/jpeg");
    if (path.endsWith(".pdf")) res.setHeader("Content-Type", "application/pdf");
  }
}));


// Route registration
app.use("/api/auth", authRouter);
app.use("/api/users", userRoutes);
app.use("/api/workshops", workshopRoutes);
app.use("/api/bazaars", bazaarRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/trips", tripRoutes);
app.use("/api/vendor", vendorRoutes);
app.use("/api/vendor", vendorUploadsRoutes);
app.use("/api/court-reservations", courtReservationRoutes);


// Loyalty route (placed after CORS/body parsers so preflight gets handled)
app.use('/api/vendor/loyalty', loyaltyRoutes);
app.use("/api/application", applicationRoutes);
app.use("/api/conferences", conferenceRoutes);
app.use('/api/gym', gymSessions);
app.use("/api/comments", commentRoutes);
app.use("/api/ratings", ratingRoutes);
app.use("/api/clubs", clubRoutes);
app.use("/api/club-events",clubEventroutes)
app.use("/api/courts", courtRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/users', favoritesRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/sales-report', salesReportRoutes);
app.use("/api", testMail);
app.use("/api/tickets", ticketRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/polls", pollRoutes);
app.use("/api/certificates", certificateRoutes);
app.use('/api/notifications', notificationRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('🚨 Global error handler:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

async function processReminderJobs(io) {
  const now = new Date();

  try {
    const dueJobs = await ReminderJob.find({
      sent: false,
      remindAt: { $lte: now },
    }).limit(100);

    if (!dueJobs.length) return;

    for (const job of dueJobs) {
      // 1) Create visible notification
      const notif = await Notification.create({
        message: job.message,
        link: job.link,
        userId: job.userId,
        eventId: job.eventId,
        eventType: job.eventType,
        kind: job.kind, // "1d" or "1h"
      });

      // 2) Emit via Socket.IO
      // you probably already have something like `io.emit("new-notification", ...)`
      io.emit("new-notification", notif);

      // 3) Mark job as sent
      job.sent = true;
      await job.save();
    }
  } catch (err) {
    console.error("🔥 Error processing reminder jobs:", err);
  }
}
setInterval(() => {
  processReminderJobs(io);
}, 60 * 1000);
server.listen(port, () => {
  console.log(`🚀 Server + Socket.IO running at: http://localhost:${port}`);
  console.log(`🧪 Check health: http://localhost:${port}/api/health`);
});
