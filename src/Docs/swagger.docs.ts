/**
 * @swagger
 * /api/applications/my:
 *   get:
 *     summary: List authenticated student's job applications
 *     tags: [Job Applications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Student applications list
 */

/**
 * @swagger
 * /api/applications/jobs/{jobId}:
 *   post:
 *     summary: Apply for a job as a student
 *     tags: [Job Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Application submitted
 *       409:
 *         description: Student already applied
 */

/**
 * @swagger
 * /api/applications/{applicationId}/status:
 *   patch:
 *     summary: Update a job application status
 *     tags: [Job Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: applicationId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ApplicationStatusInput'
 *     responses:
 *       200:
 *         description: Application status updated
 */

/**
 * @swagger
 * /api/bookings:
 *   get:
 *     summary: List bookings
 *     description: Returns a paginated list of bookings. Query params: `status`, `page`, `limit`.
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, CONFIRMED, CANCELLED, REJECTED, COMPLETED]
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Bookings list
 *   post:
 *     summary: Create a booking
 *     description: Student only. Creates a pending booking for a housing item.
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BookingInput'
 *     responses:
 *       201:
 *         description: Booking created
 *       400:
 *         description: Bad request
 *       409:
 *         description: Booking conflict (overlapping dates)
 */

/**
 * @swagger
 * /api/bookings/{id}:
 *   get:
 *     summary: Get booking by ID
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booking found
 *       404:
 *         description: Booking not found
 *   put:
 *     summary: Update booking (student)
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BookingInput'
 *     responses:
 *       200:
 *         description: Booking updated
 *       400:
 *         description: Bad request
 *   delete:
 *     summary: Delete or cancel booking (student)
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booking cancelled/deleted
 */

/**
 * @swagger
 * /api/bookings/approve/{id}:
 *   put:
 *     summary: Approve or cancel a booking (host only)
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, CONFIRMED, CANCELLED]
 *     responses:
 *       200:
 *         description: Booking status updated
 */
