import express from "express"
import {
  getPendingVendorApprovals,
  updateVendorApproval,
  getAdminDashboard,
  generateSalesReport,
} from "../../controllers/adminController.js"
import { authenticate, authorizeAdmin } from "../../middleware/auth.js"

const router = express.Router()

// @route   GET api/admin/vendors/pending
// @desc    Get pending vendor approvals
// @access  Private (Admin only)
router.get("/vendors/pending", authenticate, authorizeAdmin, getPendingVendorApprovals)

// @route   PUT api/admin/vendors/:vendorId
// @desc    Approve or reject vendor
// @access  Private (Admin only)
router.put("/vendors/:vendorId", authenticate, authorizeAdmin, updateVendorApproval)

// @route   GET api/admin/dashboard
// @desc    Get admin dashboard data
// @access  Private (Admin only)
router.get("/dashboard", authenticate, authorizeAdmin, getAdminDashboard)

// @route   GET api/admin/reports/sales
// @desc    Generate sales report
// @access  Private (Admin only)
router.get("/reports/sales", authenticate, authorizeAdmin, generateSalesReport)

export default router
