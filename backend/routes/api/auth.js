import express from "express"
import { register, login, getCurrentUser, updateProfile } from "../../controllers/authController.js"
import { authenticate } from "../../middleware/auth.js"

const router = express.Router()

// @route   POST api/auth/register
// @desc    Register a new user
// @access  Public
router.post("/register", register)

// @route   POST api/auth/login
// @desc    Login user
// @access  Public
router.post("/login", login)

// @route   GET api/auth/me
// @desc    Get current user
// @access  Private
router.get("/me", authenticate, getCurrentUser)

// @route   PUT api/auth/profile
// @desc    Update user profile
// @access  Private
router.put("/profile", authenticate, updateProfile)

export default router
