import express from "express"
import cors from "cors"
import { sequelize } from "./models/index.js"
import authRoutes from "./routes/api/auth.js"
import productRoutes from "./routes/api/products.js"
import vendorRoutes from "./routes/api/vendors.js"
import cartRoutes from "./routes/api/cart.js"
import orderRoutes from "./routes/api/orders.js"
import adminRoutes from "./routes/api/admin.js"

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/products", productRoutes)
app.use("/api/vendors", vendorRoutes)
app.use("/api/cart", cartRoutes)
app.use("/api/orders", orderRoutes)
app.use("/api/admin", adminRoutes)

// Test database connection
sequelize
  .authenticate()
  .then(() => {
    console.log("Database connection has been established successfully.")
  })
  .catch((err) => {
    console.error("Unable to connect to the database:", err)
  })

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

export default app
