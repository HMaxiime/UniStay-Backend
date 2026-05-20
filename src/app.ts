import express from 'express'
import dotenv from 'dotenv'
import authRoutes from './modules/auth/routes.js'

dotenv.config()

const app = express()

app.use(express.json())
app.use('/api/auth', authRoutes)

app.get('/', (req, res) => {
  res.json({ message: 'UniStay+ API is running' })
})

export default app