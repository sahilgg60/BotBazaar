import express from "express"
import {
  registerVendor,
  getVendorProfile,
  updateVendorProfile,
  getVendorDashboard,
  updateOrderStatus,
} from "../../controllers/vendorController.js"
import { authenticate, authorizeVendor } from "../../middleware/auth.js"

const router = express.Router()

// @route   POST api/vendors/register
// @desc    Register a new vendor
// @access  Public
router.post("/register", registerVendor)

// @route   GET api/vendors/profile
// @desc    Get vendor profile
// @access  Private (Vendor only)
router.get("/profile", authenticate, authorizeVendor, getVendorProfile)

// @route   GET api/vendors/:id
// @desc    Get vendor by ID
// @access  Public
router.get("/:id", getVendorProfile)

// @route   PUT api/vendors/profile
// @desc    Update vendor profile
// @access  Private (Vendor only)
router.put("/profile", authenticate, authorizeVendor, updateVendorProfile)

// @route   GET api/vendors/dashboard
// @desc    Get vendor dashboard data
// @access  Private (Vendor only)
router.get("/dashboard", authenticate, authorizeVendor, getVendorDashboard)

// @route   PUT api/vendors/orders/:orderItemId
// @desc    Update order status
// @access  Private (Vendor only)
router.put("/orders/:orderItemId", authenticate, authorizeVendor, updateOrderStatus)

export default router
