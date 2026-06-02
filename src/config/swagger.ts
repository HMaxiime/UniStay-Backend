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
      description: "REST API for UniStay+ authentication, users, housing, jobs, learning, and uploads.",
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
      { name: "Listings" },
      { name: "Bookings" },
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
            fullName: { type: "string", example: "Test Student" },
            email: { type: "string", format: "email", example: "student@example.com" },
            password: { type: "string", format: "password", example: "Student@123" },
            phone: { type: "string", example: "+250780000000" },
            location: { type: "string", example: "Kigali" },
            role: { type: "string", enum: ["STUDENT", "HOST", "EMPLOYER", "INSTRUCTOR"], example: "STUDENT" },
          },
        },
        LoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email", example: "student@unistay.com" },
            password: { type: "string", format: "password", example: "Student@123" },
          },
        },
        UpdateProfileInput: {
          type: "object",
          properties: {
            fullName: { type: "string", example: "Updated Student" },
            phone: { type: "string", example: "+250780000000" },
            location: { type: "string", example: "Kigali" },
          },
        },
        ChangePasswordInput: {
          type: "object",
          required: ["oldPassword", "newPassword"],
          properties: {
            oldPassword: { type: "string", format: "password", example: "Student@123" },
            newPassword: { type: "string", format: "password", example: "NewStudent@123" },
          },
        },
        ForgotPasswordInput: {
          type: "object",
          required: ["email"],
          properties: {
            email: { type: "string", format: "email", example: "student@unistay.com" },
          },
        },
        ResetPasswordInput: {
          type: "object",
          required: ["token", "newPassword"],
          properties: {
            token: { type: "string", example: "paste-reset-token-here" },
            newPassword: { type: "string", format: "password", example: "NewStudent@123" },
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
          required: ["title"],
          properties: {
            title: { type: "string", example: "Introduction to Web Development" },
            description: { type: "string", example: "Learn the foundations of modern web development." },
            thumbnail: { type: "string", format: "uri", example: "https://example.com/course-thumbnail.jpg" },
            category: { type: "string", example: "Technology" },
            skillIds: {
              type: "array",
              items: { type: "string" },
              example: ["11111111-1111-4111-8111-111111111111"],
            },
          },
        },
        CourseUpdateInput: {
          type: "object",
          properties: {
            title: { type: "string", example: "Updated Web Development Course" },
            description: { type: "string", example: "Updated course description." },
            thumbnail: { type: "string", format: "uri", example: "https://example.com/course-thumbnail.jpg" },
            category: { type: "string", example: "Technology" },
            skillIds: {
              type: "array",
              items: { type: "string", format: "uuid" },
              example: ["11111111-1111-4111-8111-111111111111"],
            },
          },
        },
        SkillInput: {
          type: "object",
          required: ["name", "category", "level"],
          properties: {
            name: { type: "string", example: "TypeScript" },
            category: { type: "string", example: "Technology" },
            level: { type: "string", enum: ["BEGINNER", "INTERMEDIATE", "ADVANCED"], example: "BEGINNER" },
          },
        },
        MaterialInput: {
          type: "object",
          required: ["title", "type"],
          properties: {
            title: { type: "string", example: "TypeScript Basics" },
            description: { type: "string", example: "An introductory lesson." },
            type: { type: "string", enum: ["VIDEO", "PDF", "ARTICLE", "QUIZ"], example: "VIDEO" },
            duration: { type: "integer", example: 30 },
          },
        },
        MaterialUpdateInput: {
          type: "object",
          properties: {
            title: { type: "string", example: "Updated TypeScript Basics" },
            description: { type: "string", example: "Updated lesson description." },
            type: { type: "string", enum: ["VIDEO", "PDF", "ARTICLE", "QUIZ"], example: "VIDEO" },
            duration: { type: "integer", example: 45 },
          },
        },
        AssignmentInput: {
          type: "object",
          required: ["title", "courseId"],
          properties: {
            title: { type: "string", example: "Web Development Fundamentals Quiz" },
            courseId: { type: "string", format: "uuid", example: "11111111-1111-4111-8111-111111111111" },
            isStandalone: { type: "boolean", example: false },
            passingScore: { type: "integer", example: 70 },
            timeLimit: { type: "integer", example: 30 },
          },
        },
        AssignmentUpdateInput: {
          type: "object",
          properties: {
            title: { type: "string", example: "Updated Fundamentals Quiz" },
            courseId: { type: "string", format: "uuid", example: "11111111-1111-4111-8111-111111111111" },
            isStandalone: { type: "boolean", example: false },
            passingScore: { type: "integer", example: 80 },
            timeLimit: { type: "integer", example: 45 },
          },
        },
        QuestionInput: {
          type: "object",
          required: ["assignmentId", "text"],
          properties: {
            assignmentId: { type: "string", format: "uuid", example: "22222222-2222-4222-8222-222222222222" },
            text: { type: "string", example: "Which language runs directly in a web browser?" },
          },
        },
        QuestionUpdateInput: {
          type: "object",
          properties: {
            text: { type: "string", example: "Which programming language runs directly in a web browser?" },
          },
        },
        OptionInput: {
          type: "object",
          required: ["questionId", "text"],
          properties: {
            questionId: { type: "string", format: "uuid", example: "33333333-3333-4333-8333-333333333333" },
            text: { type: "string", example: "JavaScript" },
            isCorrect: { type: "boolean", example: true },
          },
        },
        OptionUpdateInput: {
          type: "object",
          properties: {
            text: { type: "string", example: "TypeScript compiled to JavaScript" },
            isCorrect: { type: "boolean", example: false },
          },
        },
        JobInput: {
          type: "object",
          required: ["title", "location", "salary", "scheduleType"],
          properties: {
            title: { type: "string", example: "Junior Backend Developer" },
            location: { type: "string", example: "Kigali" },
            salary: { type: "number", example: 500000 },
            scheduleType: { type: "string", enum: ["FULL_TIME", "PART_TIME", "INTERNSHIP"], example: "INTERNSHIP" },
          },
        },
        ApplicationStatusInput: {
          type: "object",
          required: ["status"],
          properties: {
            status: { type: "string", enum: ["PENDING", "ACCEPTED", "REJECTED"], example: "ACCEPTED" },
            message: { type: "string", example: "We would like to invite you for an interview." },
          },
        },
        ListingInput: {
          type: "object",
          required: ["title", "location", "price"],
          properties: {
            title: { type: "string", example: "Furnished studio near campus" },
            description: { type: "string", example: "Quiet furnished studio with Wi-Fi and water included." },
            location: { type: "string", example: "Kigali, Kacyiru" },
            price: { type: "number", example: 180000 },
            bedrooms: { type: "integer", example: 1 },
            amenities: { type: "array", items: { type: "string" }, example: ["Wi-Fi", "Water", "Parking"] },
            availability: { type: "boolean", example: true },
          },
        },
        ListingUpdateInput: {
          type: "object",
          properties: {
            title: { type: "string", example: "Updated furnished studio near campus" },
            description: { type: "string", example: "Updated listing description." },
            location: { type: "string", example: "Kigali, Kacyiru" },
            price: { type: "number", example: 200000 },
            bedrooms: { type: "integer", example: 1 },
            amenities: { type: "array", items: { type: "string" }, example: ["Wi-Fi", "Water", "Parking"] },
            availability: { type: "boolean", example: true },
          },
        },
        BookingInput: {
          type: "object",
          required: ["housingId", "checkIn", "checkOut"],
          properties: {
            housingId: { type: "string", format: "uuid", example: "44444444-4444-4444-8444-444444444444" },
            checkIn: { type: "string", format: "date-time", example: "2026-06-01T12:00:00.000Z" },
            checkOut: { type: "string", format: "date-time", example: "2026-06-30T12:00:00.000Z" },
          },
        },
        BookingUpdateInput: {
          type: "object",
          properties: {
            checkIn: { type: "string", format: "date-time", example: "2026-06-02T12:00:00.000Z" },
            userId: { type: "string", format: "uuid", example: "77777777-7777-4777-8777-777777777777" },
            totalAmount: { type: "number", example: 180000 },
            housingId: { type: "string", format: "uuid", example: "44444444-4444-4444-8444-444444444444" },
            status: { type: "string", enum: ["PENDING", "CONFIRMED", "CANCELLED", "REJECTED", "COMPLETED"], example: "PENDING" },
          },
        },
        BookingStatusInput: {
          type: "object",
          required: ["status"],
          properties: {
            status: { type: "string", enum: ["PENDING", "CONFIRMED", "CANCELLED"], example: "CONFIRMED" },
          },
        },
        ListingVerificationInput: {
          type: "object",
          required: ["status"],
          properties: {
            status: { type: "string", enum: ["VERIFIED", "REJECTED"], example: "VERIFIED" },
          },
        },
        EnrollmentInput: {
          type: "object",
          required: ["courseId"],
          properties: {
            courseId: { type: "string", format: "uuid", example: "11111111-1111-4111-8111-111111111111" },
          },
        },
        StartAssignmentInput: {
          type: "object",
          required: ["assignmentId"],
          properties: {
            assignmentId: { type: "string", format: "uuid", example: "22222222-2222-4222-8222-222222222222" },
          },
        },
        SubmitAssignmentInput: {
          type: "object",
          required: ["assignmentResultId", "answers"],
          properties: {
            assignmentResultId: { type: "string", format: "uuid", example: "55555555-5555-4555-8555-555555555555" },
            answers: {
              type: "array",
              items: {
                type: "object",
                required: ["questionId", "selectedOptionId"],
                properties: {
                  questionId: { type: "string", format: "uuid", example: "33333333-3333-4333-8333-333333333333" },
                  selectedOptionId: { type: "string", format: "uuid", example: "66666666-6666-4666-8666-666666666666" },
                },
              },
            },
          },
        },
        PaymentProofInput: {
          type: "object",
          required: ["paymentProof"],
          properties: {
            paymentProof: {
              type: "string",
              format: "uri",
              example: "https://example.com/payment-proof.jpg",
            },
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
