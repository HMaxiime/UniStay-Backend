import "dotenv/config";
import express from "express";
import authRoutes from "./routes/auth.routes.js";
import skillsRoutes from "./routes/skills.routes.js";
<<<<<<< HEAD
import courseRoutes from "./routes/course.routes.js";
import materialsRoute from "./routes/materials.routes.js"
=======
import courseRoutes from "./routes/courec.routes.js";
import housingRoutes from "./routes/housing.routes.js";
import bookingRoutes from "./routes/booking.routes.js";
>>>>>>> c0ef9862ae32fef1867024a36edc2800c77d6c99

const app = express();

app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/skills", skillsRoutes);
app.use("/api/courses", courseRoutes);
<<<<<<< HEAD
app.use("/api/materials", materialsRoute);
=======
app.use("/api/listings", housingRoutes);
app.use("/api/bookings", bookingRoutes);
>>>>>>> c0ef9862ae32fef1867024a36edc2800c77d6c99

app.get("/", (_req, res) => {
  res.json({ message: "UniStay+ API is running" });
});

export default app;
