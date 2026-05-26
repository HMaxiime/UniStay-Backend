# UniStay+ Backend API

UniStay+ is an Express + TypeScript backend for student housing, bookings, jobs, applications, learning courses, exams, certificates, users, and uploads.

## Tech Stack

- Node.js and Express
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT authentication
- Cloudinary uploads
- Swagger API docs

## Setup

Install dependencies:

```bash
npm install
```

Create `.env` from `.env.example`, then set at least:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/unistay_db"
JWT_SECRET="your-secret"
PORT=3000
```

Generate Prisma Client:

```bash
npx prisma generate
```

Sync database schema:

```bash
npx prisma db push
```

Seed default users:

```bash
npx prisma db seed
```

Run development server:

```bash
npm run dev
```

Build:

```bash
npm run build
```

Start compiled app:

```bash
npm start
```

## URLs

```text
API: http://localhost:3000
Swagger: http://localhost:3000/api-docs
OpenAPI JSON: http://localhost:3000/api-docs.json
```

Swagger route docs live in:

```text
src/Docs/swagger.docs.ts
```

Routes should stay focused on routing only.

## Authentication

Protected routes require:

```http
Authorization: Bearer <token>
```

Roles:

| Role | Purpose |
| --- | --- |
| `STUDENT` | Book housing, apply for jobs, enroll, take exams |
| `HOST` | Manage housing listings and listing bookings |
| `EMPLOYER` | Manage jobs and job applications |
| `ADMIN` | Administrative access |

Default seed accounts:

```text
admin@unistay.com / Admin@123
employer@unistay.com / Employer@123
host@unistay.com / Host@123
student@unistay.com / Student@123
```

## Main Endpoints

### Auth

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Register user |
| `POST` | `/api/auth/login` | Login and receive JWT |
| `GET` | `/api/auth/me` | Current authenticated user |

### Users

| Method | Endpoint | Access |
| --- | --- | --- |
| `GET` | `/api/users` | Admin |
| `GET` | `/api/users/:id` | Admin |
| `PATCH` | `/api/users/:id/role` | Admin |
| `PATCH` | `/api/users/:id/active` | Admin |
| `DELETE` | `/api/users/:id` | Admin |

### Housing

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/listings` | List listings |
| `GET` | `/api/listings/:id` | Get listing |
| `GET` | `/api/listings/me/listings` | Host listings |
| `POST` | `/api/listings` | Create listing |
| `PUT` | `/api/listings/:id` | Update listing |
| `DELETE` | `/api/listings/:id` | Delete listing |
| `PATCH` | `/api/listings/:id/verify` | Verify/reject listing |
| `POST` | `/api/listings/:id/images` | Upload images |
| `DELETE` | `/api/listings/:id/images?imageUrl=...` | Delete image |

### Bookings

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/bookings` | Admin booking list |
| `POST` | `/api/bookings` | Student creates booking |
| `GET` | `/api/bookings/my` | Student bookings |
| `GET` | `/api/bookings/listing/:housingId` | Listing bookings |
| `GET` | `/api/bookings/:id` | Booking details |
| `PATCH` | `/api/bookings/:id/payment-proof` | Upload proof URL |
| `PATCH` | `/api/bookings/:id/cancel` | Cancel booking |
| `PATCH` | `/api/bookings/:id/confirm` | Confirm booking |
| `PATCH` | `/api/bookings/:id/reject` | Reject booking |
| `PATCH` | `/api/bookings/:id/complete` | Complete booking |

### Jobs

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/jobs` | List jobs |
| `GET` | `/api/jobs/:id` | Get job |
| `POST` | `/api/jobs` | Create job |
| `PUT` | `/api/jobs/:id` | Update job |
| `DELETE` | `/api/jobs/:id` | Delete job |

### Applications

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/applications/my` | Student applications |
| `POST` | `/api/applications/jobs/:jobId` | Apply to job |
| `GET` | `/api/applications/jobs/:jobId` | Job applications |
| `PATCH` | `/api/applications/:applicationId/status` | Update status |

## Learning Flow

Skills are assigned to courses. Materials belong to courses. Exams/assignments belong to courses, not materials.

When a student passes a course exam:

- all course skills are marked complete for the student,
- a course certificate is created automatically,
- all course skills are copied into the `CertificateSkill` table and attached to that certificate automatically.

Students can take the exam directly without completing all course materials first.

### Skills

| Method | Endpoint |
| --- | --- |
| `GET` | `/api/skills` |
| `GET` | `/api/skills/:id` |
| `POST` | `/api/skills` |
| `PUT` | `/api/skills/:id` |
| `DELETE` | `/api/skills/:id` |

Create skill:

```json
{
  "name": "JavaScript",
  "category": "Programming",
  "level": "BEGINNER"
}
```

### Courses

| Method | Endpoint |
| --- | --- |
| `GET` | `/api/courses` |
| `GET` | `/api/courses/:id` |
| `POST` | `/api/courses` |
| `PUT` | `/api/courses/:id` |
| `DELETE` | `/api/courses/:id` |
| `PUT` | `/api/courses/:id/publish` |

Create or update course with skills:

```json
{
  "title": "Web Development Basics",
  "description": "Learn frontend and backend foundations.",
  "thumbnail": "https://example.com/web-dev.jpg",
  "category": "Programming",
  "skillIds": ["SKILL_ID_1", "SKILL_ID_2"]
}
```

To remove all skills from a course:

```json
{
  "skillIds": []
}
```

### Materials

| Method | Endpoint |
| --- | --- |
| `GET` | `/api/materials` |
| `GET` | `/api/materials/:id` |
| `POST` | `/api/materials/course/:courseId` |
| `PUT` | `/api/materials/:id` |
| `DELETE` | `/api/materials/:id` |

Create material:

```json
{
  "title": "JavaScript Introduction",
  "description": "Basic JavaScript concepts.",
  "type": "VIDEO",
  "duration": 45
}
```

### Assignments And Exams

Assignments are course exams. You can upload any number of questions. When a student starts an exam, the backend randomly selects up to 10 questions for that attempt.

`isStandalone` marks an exam that can be taken directly by a student who already has the knowledge. The current backend allows students to start authenticated exams directly, and this field is kept so stricter course-path rules can be added later.

| Method | Endpoint |
| --- | --- |
| `GET` | `/api/assignments` |
| `GET` | `/api/assignments/:id` |
| `POST` | `/api/assignments` |
| `PUT` | `/api/assignments/:id` |
| `DELETE` | `/api/assignments/:id` |

Create assignment:

```json
{
  "title": "Web Development Final Exam",
  "courseId": "COURSE_ID",
  "isStandalone": true,
  "timeLimit": 30,
  "passingScore": 70
}
```

Add question:

```json
{
  "assignmentId": "ASSIGNMENT_ID",
  "text": "Which keyword declares a constant in JavaScript?"
}
```

Add options:

```json
{
  "questionId": "QUESTION_ID",
  "text": "const",
  "isCorrect": true
}
```

```json
{
  "questionId": "QUESTION_ID",
  "text": "var",
  "isCorrect": false
}
```

### Student Exam Flow

1. Login as a student.
2. Authorize Swagger with `Bearer <token>`.
3. Start the exam.
4. Answer only the random questions returned by the start response.
5. If the score passes, the certificate is returned automatically.

Start exam:

```http
POST /api/assignment-results/start
```

```json
{
  "assignmentId": "ASSIGNMENT_ID"
}
```

Submit answers:

```http
POST /api/student-answers
```

```json
{
  "assignmentResultId": "ASSIGNMENT_RESULT_ID",
  "answers": [
    {
      "questionId": "QUESTION_ID_FROM_START_RESPONSE",
      "selectedOptionId": "OPTION_ID_SELECTED_BY_STUDENT"
    }
  ]
}
```

Passing response includes:

```json
{
  "passed": true,
  "certificate": {
    "id": "CERTIFICATE_ID",
    "courseId": "COURSE_ID",
    "skills": [
      {
        "skill": {
          "id": "SKILL_ID",
          "name": "JavaScript"
        }
      }
    ]
  }
}
```

The `certificate.skills` array comes from rows in `CertificateSkill`. Those rows are filled automatically from the course's selected skills when the student passes.

### Enrollment

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/enrollments` | Enroll authenticated student in a course |

```json
{
  "courseId": "COURSE_ID"
}
```

## Uploads

| Method | Endpoint |
| --- | --- |
| `GET` | `/api/uploads` |
| `GET` | `/api/uploads/:id` |
| `POST` | `/api/uploads` |
| `DELETE` | `/api/uploads/:id` |

Uploads use `multipart/form-data` with:

```text
file: binary
materialId: string
```

## Health Check

```http
GET /
```

Returns:

```json
{
  "message": "UniStay+ API is running"
}
```
