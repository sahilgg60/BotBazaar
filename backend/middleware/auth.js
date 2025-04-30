import jwt from "jsonwebtoken"
import models from "../models/index.js"

// Authenticate user
export const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header("Authorization")?.replace("Bearer ", "")

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token, authorization denied",
      })
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your_jwt_secret")

    // Find user
    const user = await models.User.findByPk(decoded.id)

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      })
    }

    // If user is a vendor, check if approved
    if (user.role === "vendor") {
      const vendor = await models.Vendor.findOne({
        where: { user_id: user.user_id },
      })

      if (vendor) {
        if (!vendor.is_approved) {
          return res.status(403).json({
            success: false,
            message: "Your vendor account is pending approval",
          })
        }
        req.user = {
          id: user.user_id,
          role: user.role,
          vendor_id: vendor.vendor_id,
        }
      }
    } else if (user.role === "admin") {
      // If user is an admin, get admin details
      const admin = await models.Admin.findOne({
        where: { user_id: user.user_id },
      })

      if (admin) {
        req.user = {
          id: user.user_id,
          role: user.role,
          admin_id: admin.admin_id,
        }
      }
    } else {
      // Regular customer
      req.user = {
        id: user.user_id,
        role: user.role,
      }
    }

    next()
  } catch (error) {
    console.error("Authentication error:", error)
    return res.status(401).json({
      success: false,
      message: "Token is not valid",
    })
  }
}

// Authorize vendor
export const authorizeVendor = (req, res, next) => {
  if (req.user && (req.user.role === "vendor" || req.user.role === "admin")) {
    next()
  } else {
    return res.status(403).json({
      success: false,
      message: "Access denied. Vendor authorization required.",
    })
  }
}

// Authorize admin
export const authorizeAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next()
  } else {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admin authorization required.",
    })
  }
}

// Authorize customer
export const authorizeCustomer = (req, res, next) => {
  if (req.user && req.user.role === "customer") {
    next()
  } else {
    next() // Allow all authenticated users to access customer routes
  }
}
