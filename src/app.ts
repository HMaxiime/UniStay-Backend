import "dotenv/config";
import express, { type ErrorRequestHandler } from "express";
import cors, { type CorsOptions } from "cors";
import authRoutes from "./routes/auth.routes.js";
import skillsRoutes from "./routes/skills.routes.js";
import courseRoutes from "./routes/course.routes.js";
import materialsRoute from "./routes/materials.routes.js";
import usersRoutes from "./routes/users.routes.js";
import jobsRoutes from "./routes/jobs.routes.js";
import applicationsRoutes from "./routes/applications.routes.js";
import hostelRoutes from "./routes/hostels.routes.js";
import roomRoutes from "./routes/rooms.routes.js";
import hostelBookingRoutes from "./routes/hostel-bookings.routes.js";
import refundRoutes from "./routes/refunds.routes.js";
import adminSettingsRoutes from "./routes/admin-settings.routes.js";
import assignmentsRoutes from "./routes/assignments.routes.js";
import questionsRoutes from "./routes/questions.routes.js";
import optionsRoutes from "./routes/options.routes.js";
import enrollmentsRoutes from "./routes/enrollments.routes.js";
import assignmentResultsRoutes from "./routes/assignment-results.routes.js";
import studentAnswersRoutes from "./routes/student-answers.routes.js";
import uploadsRoutes from "./routes/uploads.routes.js";
import avatarRoutes from "./routes/avatar.routes.js";
import stripeRoutes from "./routes/stripe.routes.js";
import housingRoutes from "./routes/housing.routes.js";

const app = express();

const configuredOrigins = (process.env["CORS_ORIGINS"] || process.env["FRONTEND_URL"] || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (configuredOrigins.includes("*") || configuredOrigins.includes(origin)) {
      return callback(null, true);
    }
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }
    callback(new Error(`CORS blocked origin: ${origin}`));
  },
  credentials: true,
};

// CORS must be registered before any routes so that preflight (OPTIONS)
// requests and the Access-Control-Allow-Origin header are handled correctly.
app.use(cors(corsOptions));

app.use("/api/stripe/webhook", express.raw({ type: "application/json" }));
app.use(express.json());

const jsonErrorHandler: ErrorRequestHandler = (error, _req, res, next) => {
  if (error instanceof SyntaxError && "body" in error) {
    return res.status(400).json({ error: "Invalid JSON body" });
  }

  next(error);
};

app.use(jsonErrorHandler);

app.use("/api/auth", authRoutes);
app.use("/api/skills", skillsRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/materials", materialsRoute);
app.use("/api/users", usersRoutes);
app.use("/api/jobs", jobsRoutes);
app.use("/api/applications", applicationsRoutes);
app.use("/api/hostels", hostelRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/hostel-bookings", hostelBookingRoutes);
app.use("/api/refunds", refundRoutes);
app.use("/api/admin-settings", adminSettingsRoutes);
app.use("/api/assignments", assignmentsRoutes);
app.use("/api/questions", questionsRoutes);
app.use("/api/options", optionsRoutes);
app.use("/api/enrollments", enrollmentsRoutes);
app.use("/api/assignment-results", assignmentResultsRoutes);
app.use("/api/student-answers", studentAnswersRoutes);
app.use("/api/uploads", uploadsRoutes);
app.use("/api/avatar", avatarRoutes);
app.use("/api/stripe", stripeRoutes);
app.use("/api/listings", housingRoutes);

app.get("/", (_req, res) => {
  res.json({ message: "UniStay+ API is running" });
});

export default app;