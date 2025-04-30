import { Sequelize } from "sequelize"
import dotenv from "dotenv"
import User from "./user.js"
import Product from "./product.js"
import ProductCategory from "./productCategory.js"
import Vendor from "./vendor.js"
import Review from "./review.js"
import Order from "./order.js"
import OrderItem from "./orderItem.js"
import Payment from "./payment.js"
import Cart from "./cart.js"
import CartItem from "./cartItem.js"
import Notification from "./notification.js"
import Discount from "./discount.js"
import Admin from "./admin.js"
import Report from "./report.js"

// Load environment variables
dotenv.config()

const sequelize = new Sequelize(
  process.env.DB_NAME || "botbazaar",
  process.env.DB_USER || "root",
  process.env.DB_PASSWORD || "",
  {
    host: process.env.DB_HOST || "localhost",
    dialect: "mysql",
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  },
)

// Initialize models
const models = {
  User: User(sequelize),
  Product: Product(sequelize),
  ProductCategory: ProductCategory(sequelize),
  Vendor: Vendor(sequelize),
  Review: Review(sequelize),
  Order: Order(sequelize),
  OrderItem: OrderItem(sequelize),
  Payment: Payment(sequelize),
  Cart: Cart(sequelize),
  CartItem: CartItem(sequelize),
  Notification: Notification(sequelize),
  Discount: Discount(sequelize),
  Admin: Admin(sequelize),
  Report: Report(sequelize),
}

// Define associations
Object.keys(models).forEach((modelName) => {
  if (models[modelName].associate) {
    models[modelName].associate(models)
  }
})

export { sequelize }
export default models
