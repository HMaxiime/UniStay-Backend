import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import type { Express } from "express";
import { Role } from "@prisma/client";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "UniStay+ Backend API",
      version: "1.0.0",
      description: "REST API for UniStay+ authentication, users, hostels, rooms, jobs, learning, refunds, and uploads.",
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Development server",
      },
      {
        url: "https://cdn-unistay.onrender.com",
        description: "Production server",
      }
    ],
    tags: [
      { name: "Auth" },
      { name: "Users" },
      { name: "Skills" },
      { name: "Courses" },
      { name: "Materials" },
      { name: "Assignments" },
      { name: "Questions" },
      { name: "Options" },
      { name: "Learning" },
      { name: "Jobs" },
      { name: "Job Applications" },
      { name: "Hostels" },
      { name: "Rooms" },
      { name: "Hostel Bookings" },
      { name: "Refunds" },
      { name: "Stripe" },
      { name: "Uploads" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        ErrorResponse: {
          type: "object",
          properties: {
            message: { type: "string" },
            error: { type: "string" },
          },
        },
        RegisterInput: {
          type: "object",
          required: ["fullName", "email", "password", "role"],
          properties: {
            fullName: { type: "string", example: "Kevin Mugisha" },
            email: { type: "string", format: "email", example: "kevin@example.com" },
            password: { type: "string", format: "password", example: "password123" },
            phone: { type: "string", example: "+250780000000" },
            location: { type: "string", example: "Kigali" },
            role: { type: "string", enum: Object.values(Role), example: "STUDENT" },
          },
        },
        LoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email", example: "kevin@example.com" },
            password: { type: "string", format: "password", example: "password123" },
          },
        },
        RoleUpdateInput: {
          type: "object",
          required: ["role"],
          properties: {
            role: { type: "string", enum: Object.values(Role), example: "ADMIN" },
          },
        },
        CourseInput: {
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            thumbnail: { type: "string" },
            category: { type: "string" },
            skillIds: {
              type: "array",
              items: { type: "string" },
            },
          },
        },
        SkillInput: {
          type: "object",
          properties: {
            name: { type: "string" },
            description: { type: "string" },
            category: { type: "string" },
            level: { type: "string", enum: ["BEGINNER", "INTERMEDIATE", "ADVANCED"] },
          },
        },
        MaterialInput: {
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            type: { type: "string", enum: ["VIDEO", "PDF", "ARTICLE", "QUIZ"] },
            duration: { type: "number" },
          },
        },
        AssignmentInput: {
          type: "object",
          properties: {
            title: { type: "string" },
            courseId: { type: "string" },
            passingScore: { type: "number" },
            timeLimit: { type: "number" },
          },
        },
        QuestionInput: {
          type: "object",
          properties: {
            assignmentId: { type: "string" },
            text: { type: "string" },
          },
        },
        OptionInput: {
          type: "object",
          properties: {
            questionId: { type: "string" },
            text: { type: "string" },
            isCorrect: { type: "boolean" },
          },
        },
        JobInput: {
          type: "object",
          required: ["title", "location", "salary", "scheduleType"],
          properties: {
            title: { type: "string" },
            location: { type: "string" },
            salary: { type: "number" },
            scheduleType: { type: "string", enum: ["FULL_TIME", "PART_TIME", "INTERNSHIP"] },
          },
        },
        ApplicationStatusInput: {
          type: "object",
          required: ["status"],
          properties: {
            status: { type: "string", enum: ["PENDING", "ACCEPTED", "REJECTED"] },
          },
        },
        HostelInput: {
          type: "object",
          required: ["name", "location"],
          properties: {
            name: { type: "string" },
            location: { type: "string" },
            description: { type: "string" },
            images: {
              type: "array",
              items: { type: "string" },
            },
          },
        },
        RoomInput: {
          type: "object",
          required: ["hostelId", "name", "category", "capacity", "price"],
          properties: {
            hostelId: { type: "string" },
            name: { type: "string" },
            category: { type: "string", enum: ["VIP", "STANDARD", "BUDGET"] },
            capacity: { type: "number" },
            price: { type: "number" },
            description: { type: "string" },
            amenities: { type: "array", items: { type: "string" } },
          },
        },
        BookingInput: {
          type: "object",
          required: ["roomId", "checkIn", "checkOut"],
          properties: {
            roomId: { type: "string" },
            checkIn: { type: "string", format: "date-time" },
            checkOut: { type: "string", format: "date-time" },
          },
        },
        RefundRequestInput: {
          type: "object",
          required: ["bookingId"],
          properties: {
            bookingId: { type: "string" },
            reason: { type: "string" },
          },
        },
        StatusInput: {
          type: "object",
          required: ["status"],
          properties: {
            status: { type: "string" },
          },
        },
      },
    },
  },
  apis: ["./src/Docs/*.ts"],
};

const swaggerSpec = swaggerJsdoc(options);

export function setupSwagger(app: Express) {
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      // Point the favicon to the bundled asset already served under /api-docs/
      // so the browser doesn't 404 on GET /favicon-32x32.png at the root.
      customfavIcon: "/api-docs/favicon-32x32.png",
      customSiteTitle: "UniStay+ API Docs",
    }),
  );
  app.get("/api-docs.json", (_req, res) => {
    res.json(swaggerSpec);
  });

  console.log("Swagger docs available at http://localhost:3000/api-docs");
}
