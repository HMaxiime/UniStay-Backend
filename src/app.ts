import express from 'express'
import dotenv from 'dotenv'
import authRoutes from './modules/auth/routes.js'
import housingsRoutes from "./modules/housing/routes.js"
import bookingRoutes from "./modules/bookings/routes.js"
dotenv.config()

const app = express()

app.use(express.json())
app.use('/api/auth', authRoutes)


app.use("/api/listins", housingsRoutes )
app.use("/api/bookings", bookingRoutes)
app.get('/', (req, res) => {
  res.json({ message: 'UniStay+ API is running' })
})

export default app