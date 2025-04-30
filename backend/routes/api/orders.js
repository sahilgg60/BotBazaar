import express from "express"
import { createOrder, getUserOrders, getOrderById, cancelOrder } from "../../controllers/orderController.js"
import { authenticate } from "../../middleware/auth.js"

const router = express.Router()

// @route   POST api/orders
// @desc    Create a new order
// @access  Private
router.post("/", authenticate, createOrder)

// @route   GET api/orders
// @desc    Get user orders
// @access  Private
router.get("/", authenticate, getUserOrders)

// @route   GET api/orders/:orderId
// @desc    Get order by ID
// @access  Private
router.get("/:orderId", authenticate, getOrderById)

// @route   PUT api/orders/:orderId/cancel
// @desc    Cancel order
// @access  Private
router.put("/:orderId/cancel", authenticate, cancelOrder)

export default router
