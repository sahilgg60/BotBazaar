import express from "express"
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductsByVendor,
} from "../../controllers/productController.js"
import { authenticate, authorizeVendor } from "../../middleware/auth.js"

const router = express.Router()

// @route   GET api/products
// @desc    Get all products
// @access  Public
router.get("/", getAllProducts)

// @route   GET api/products/:id
// @desc    Get product by ID
// @access  Public
router.get("/:id", getProductById)

// @route   POST api/products
// @desc    Create a new product
// @access  Private (Vendor only)
router.post("/", authenticate, authorizeVendor, createProduct)

// @route   PUT api/products/:id
// @desc    Update a product
// @access  Private (Vendor only)
router.put("/:id", authenticate, authorizeVendor, updateProduct)

// @route   DELETE api/products/:id
// @desc    Delete a product
// @access  Private (Vendor only)
router.delete("/:id", authenticate, authorizeVendor, deleteProduct)

// @route   GET api/products/vendor/:vendorId
// @desc    Get products by vendor
// @access  Public
router.get("/vendor/:vendorId", getProductsByVendor)

export default router
