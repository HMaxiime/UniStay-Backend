import "dotenv/config";
import express from "express";
import authRoutes from "./routes/auth.routes.js";
import skillsRoutes from "./routes/skills.routes.js";
import courseRoutes from "./routes/course.routes.js";
import materialsRoute from "./routes/materials.routes.js";
import usersRoutes from "./routes/users.routes.js";
import jobsRoutes from "./routes/jobs.routes.js";
import housingRoutes from "./routes/housing.routes.js";
import bookingRoutes from "./routes/booking.routes.js";
import materialSkillsRoutes from "./routes/material-skills.routes.js";
import assignmentsRoutes from "./routes/assignments.routes.js";
import questionsRoutes from "./routes/questions.routes.js";
import optionsRoutes from "./routes/options.routes.js";
import enrollmentsRoutes from "./routes/enrollments.routes.js";
import assignmentResultsRoutes from "./routes/assignment-results.routes.js";
import studentAnswersRoutes from "./routes/student-answers.routes.js";
import uploadsRoutes from "./routes/uploads.routes.js";

const app = express();

app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/skills", skillsRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/materials", materialsRoute);
app.use("/api/users", usersRoutes);
app.use("/api/jobs", jobsRoutes);
app.use("/api/listings", housingRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/material-skills", materialSkillsRoutes);
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