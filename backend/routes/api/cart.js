import express from "express"
import { getUserCart, addToCart, updateCartItem, removeFromCart, clearCart } from "../../controllers/cartController.js"
import { authenticate } from "../../middleware/auth.js"

const router = express.Router()

// @route   GET api/cart
// @desc    Get user cart
// @access  Private
router.get("/", authenticate, getUserCart)

// @route   POST api/cart
// @desc    Add item to cart
// @access  Private
router.post("/", authenticate, addToCart)

// @route   PUT api/cart/:cart_items_id
// @desc    Update cart item
// @access  Private
router.put("/:cart_items_id", authenticate, updateCartItem)

// @route   DELETE api/cart/:cart_items_id
// @desc    Remove item from cart
// @access  Private
router.delete("/:cart_items_id", authenticate, removeFromCart)

// @route   DELETE api/cart
// @desc    Clear cart
// @access  Private
router.delete("/", authenticate, clearCart)

export default router
