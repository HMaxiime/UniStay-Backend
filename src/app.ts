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
import housingRoutes from "./routes/housing.routes.js";
import bookingRoutes from "./routes/booking.routes.js";
import assignmentsRoutes from "./routes/assignments.routes.js";
import questionsRoutes from "./routes/questions.routes.js";
import optionsRoutes from "./routes/options.routes.js";
import enrollmentsRoutes from "./routes/enrollments.routes.js";
import assignmentResultsRoutes from "./routes/assignment-results.routes.js";
import studentAnswersRoutes from "./routes/student-answers.routes.js";
import uploadsRoutes from "./routes/uploads.routes.js";

const app = express();

const PORT = process.env["PORT"] || 3000;

const configuredOrigins = (
  process.env["CORS_ORIGINS"] ||
  process.env["FRONTEND_URL"] ||
  "http://localhost:5000"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = Array.from(
  new Set([
    ...configuredOrigins,
    `http://localhost:${PORT}`,
    `http://127.0.0.1:${PORT}`,
  ]),
);

const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    callback(new Error(`CORS blocked origin: ${origin}`));
  },
  credentials: true,
};

// CORS must be registered before any routes so that preflight (OPTIONS)
// requests and the Access-Control-Allow-Origin header are handled correctly.
app.use(cors(corsOptions));

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
app.use("/api/listings", housingRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/assignments", assignmentsRoutes);
app.use("/api/questions", questionsRoutes);
app.use("/api/options", optionsRoutes);
app.use("/api/enrollments", enrollmentsRoutes);
app.use("/api/assignment-results", assignmentResultsRoutes);
app.use("/api/student-answers", studentAnswersRoutes);
app.use("/api/uploads", uploadsRoutes);

app.get("/", (_req, res) => {
  res.json({ message: "UniStay+ API is running" });
});

export default app;
