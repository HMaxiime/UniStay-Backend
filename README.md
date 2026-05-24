# UniStay+ Backend API

UniStay+ is a backend API for student housing, bookings, jobs, job applications, learning materials, assignments, and user management.

## Tech Stack

- Node.js
- Express
- TypeScript
- Prisma
- PostgreSQL
- JWT authentication
- Cloudinary uploads
- Swagger API docs

## Getting Started

Install dependencies:

```bash
npm install
```

Generate Prisma client:

```bash
npx prisma generate
```

Run in development:

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

Default local server:

```text
http://localhost:3000
```

Swagger documentation:

```text
http://localhost:3000/api-docs
```

Raw OpenAPI JSON:

```text
http://localhost:3000/api-docs.json
```

## Authentication

Protected routes require a JWT bearer token:

```http
Authorization: Bearer <token>
```

Roles used by the API:

| Role | Purpose |
| --- | --- |
| `STUDENT` | Book housing, apply for jobs, enroll in courses, submit assignments |
| `HOST` | Manage housing listings and related bookings |
| `EMPLOYER` | Manage jobs |
| `ADMIN` | Administrative access |

## Environment Variables

Create a `.env` file using `.env.example` as a guide.

Common variables:

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret used to sign JWTs |
| `PORT` | Server port, defaults to `3000` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |

## API Endpoints

Base URL:

```text
/api
```

### Auth

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | Public | Register a user |
| `POST` | `/api/auth/login` | Public | Login and receive a token |
| `GET` | `/api/auth/me` | Authenticated | Get current user profile |

### Users

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/api/users` | Admin | List users |
| `GET` | `/api/users/:id` | Admin | Get user by ID |
| `PATCH` | `/api/users/:id/role` | Admin | Update user role |
| `PATCH` | `/api/users/:id/active` | Admin | Activate or deactivate user |
| `DELETE` | `/api/users/:id` | Admin | Delete user |

### Housing Listings

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/api/listings` | Public | List verified listings |
| `GET` | `/api/listings/:id` | Public | Get listing by ID |
| `GET` | `/api/listings/me/listings` | Host/Admin | Get authenticated host listings |
| `POST` | `/api/listings` | Host/Admin | Create listing with optional images |
| `PUT` | `/api/listings/:id` | Owner/Admin | Update listing |
| `DELETE` | `/api/listings/:id` | Owner/Admin | Delete listing |
| `PATCH` | `/api/listings/:id/verify` | Admin | Verify or reject listing |
| `POST` | `/api/listings/:id/images` | Owner/Admin | Upload listing images |
| `DELETE` | `/api/listings/:id/images` | Owner/Admin | Delete one listing image by `imageUrl` query |

Listing filters:

| Query | Description |
| --- | --- |
| `location` | Filter by location |
| `min_price` | Minimum price |
| `max_price` | Maximum price |
| `bedrooms` | Bedroom count |
| `availability` | `true` or `false` |
| `page` | Page number |
| `limit` | Results per page |

### Bookings

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/api/bookings` | Admin | List all bookings |
| `POST` | `/api/bookings` | Student | Create booking |
| `GET` | `/api/bookings/my` | Student | List current student's bookings |
| `GET` | `/api/bookings/listing/:housingId` | Host/Admin | List bookings for a listing |
| `GET` | `/api/bookings/:id` | Student/Host/Admin | Get booking by ID |
| `PATCH` | `/api/bookings/:id/payment-proof` | Student owner | Submit payment proof URL |
| `PATCH` | `/api/bookings/:id/cancel` | Student/Admin | Cancel booking |
| `PATCH` | `/api/bookings/:id/confirm` | Host/Admin | Confirm booking |
| `PATCH` | `/api/bookings/:id/reject` | Host/Admin | Reject booking |
| `PATCH` | `/api/bookings/:id/complete` | Host/Admin | Complete booking |

Create booking body:

```json
{
  "housingId": "listing-id",
  "checkIn": "2026-06-01T00:00:00.000Z",
  "checkOut": "2026-06-05T00:00:00.000Z"
}
```

Booking rules:

- Listing must be verified and available.
- Students cannot book their own listing.
- `checkOut` must be after `checkIn`.
- Overlapping pending or confirmed bookings are blocked.
- `totalAmount` is calculated from listing price and number of nights.
- Payment proof is required before confirmation.

### Jobs

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/api/jobs` | Public | List jobs |
| `GET` | `/api/jobs/:id` | Public | Get job by ID |
| `POST` | `/api/jobs` | Employer/Admin | Create job |
| `PUT` | `/api/jobs/:id` | Owner/Admin | Update job |
| `DELETE` | `/api/jobs/:id` | Owner/Admin | Delete job |

### Job Applications

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/api/applications/my` | Student | List current student's applications |
| `POST` | `/api/applications/jobs/:jobId` | Student | Apply for a job |
| `GET` | `/api/applications/jobs/:jobId` | Employer/Admin | List applications for a job |
| `PATCH` | `/api/applications/:applicationId/status` | Employer/Admin | Update application status |

Application statuses:

```text
PENDING, ACCEPTED, REJECTED
```

### Courses

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/api/courses` | Public | List courses |
| `GET` | `/api/courses/:id` | Public | Get course by ID |
| `POST` | `/api/courses` | Authenticated | Create course |
| `PUT` | `/api/courses/:id` | Authenticated | Update course |
| `DELETE` | `/api/courses/:id` | Authenticated | Delete course |
| `PUT` | `/api/courses/:id/publish` | Authenticated | Publish course |

### Materials

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/api/materials` | Public | List materials |
| `GET` | `/api/materials/:id` | Public | Get material by ID |
| `POST` | `/api/materials` | Public | Create material |
| `PUT` | `/api/materials/:id` | Public | Update material |
| `DELETE` | `/api/materials/:id` | Public | Delete material |
| `POST` | `/api/material-skills` | Authenticated | Attach skill to material |
| `DELETE` | `/api/material-skills/:id` | Authenticated | Remove material-skill link |

### Skills

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/api/skills` | Public | List skills |
| `GET` | `/api/skills/:id` | Public | Get skill by ID |
| `POST` | `/api/skills` | Public | Create skill |
| `PUT` | `/api/skills/:id` | Public | Update skill |
| `DELETE` | `/api/skills/:id` | Public | Delete skill |

### Assignments

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/api/assignments` | Public | List assignments |
| `GET` | `/api/assignments/:id` | Public | Get assignment by ID |
| `POST` | `/api/assignments` | Authenticated | Create assignment |
| `PUT` | `/api/assignments/:id` | Authenticated | Update assignment |
| `DELETE` | `/api/assignments/:id` | Authenticated | Delete assignment |

### Questions and Options

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `POST` | `/api/questions` | Public | Create question |
| `GET` | `/api/questions/:id` | Public | Get question by ID |
| `PUT` | `/api/questions/:id` | Public | Update question |
| `DELETE` | `/api/questions/:id` | Public | Delete question |
| `POST` | `/api/options` | Public | Create answer option |
| `PUT` | `/api/options/:id` | Public | Update answer option |
| `DELETE` | `/api/options/:id` | Public | Delete answer option |

### Learning Progress

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `POST` | `/api/enrollments` | Student | Enroll in a course |
| `POST` | `/api/assignment-results/start` | Student | Start an assignment |
| `POST` | `/api/student-answers` | Student | Submit assignment answers |

### Uploads

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/api/uploads` | Public | List uploaded files |
| `GET` | `/api/uploads/:id` | Public | Get upload by ID |
| `POST` | `/api/uploads` | Public | Upload a file |
| `DELETE` | `/api/uploads/:id` | Public | Delete upload |

Upload body uses `multipart/form-data` with a `file` field.

## Health Check

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/` | Returns API running message |

