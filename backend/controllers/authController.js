import models from "../models/index.js"
import jwt from "jsonwebtoken"

// Register a new user
export const register = async (req, res) => {
  try {
    const { first_name, last_name, email, password, phone_number, address, role = "customer" } = req.body

    // Check if email already exists
    const existingUser = await models.User.findOne({
      where: { email },
    })

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already in use",
      })
    }

    // Create new user
    const newUser = await models.User.create({
      first_name,
      last_name,
      email,
      password,
      phone_number,
      address,
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // Create cart for the user
    await models.Cart.create({
      user_id: newUser.user_id,
      created_at: new Date(),
      total_price: 0.0,
    })

    // Generate JWT token
    const token = jwt.sign({ id: newUser.user_id, role: newUser.role }, process.env.JWT_SECRET || "your_jwt_secret", {
      expiresIn: "1d",
    })

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user: {
          user_id: newUser.user_id,
          first_name: newUser.first_name,
          last_name: newUser.last_name,
          email: newUser.email,
          role: newUser.role,
        },
        token,
      },
    })
  } catch (error) {
    console.error("Error registering user:", error)
    return res.status(500).json({
      success: false,
      message: "Failed to register user",
      error: error.message,
    })
  }
}

// Login user
export const login = async (req, res) => {
  try {
    const { email, password } = req.body

    // Check if user exists
    const user = await models.User.findOne({
      where: { email },
    })

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      })
    }

    // Check password
    const isMatch = await user.comparePassword(password)

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      })
    }

    // If user is a vendor, check if approved
    if (user.role === "vendor") {
      const vendor = await models.Vendor.findOne({
        where: { user_id: user.user_id },
      })

      if (vendor && !vendor.is_approved) {
        return res.status(403).json({
          success: false,
          message: "Your vendor account is pending approval",
        })
      }
    }

    // Generate JWT token
    const token = jwt.sign({ id: user.user_id, role: user.role }, process.env.JWT_SECRET || "your_jwt_secret", {
      expiresIn: "1d",
    })

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          user_id: user.user_id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          role: user.role,
        },
        token,
      },
    })
  } catch (error) {
    console.error("Error logging in:", error)
    return res.status(500).json({
      success: false,
      message: "Failed to login",
      error: error.message,
    })
  }
}

// Get current user
export const getCurrentUser = async (req, res) => {
  try {
    const user = await models.User.findByPk(req.user.id, {
      attributes: { exclude: ["password"] },
    })

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    const additionalData = {}

    // If user is a vendor, get vendor details
    if (user.role === "vendor") {
      const vendor = await models.Vendor.findOne({
        where: { user_id: user.user_id },
      })
      if (vendor) {
        additionalData.vendor = vendor
      }
    }

    // If user is an admin, get admin details
    if (user.role === "admin") {
      const admin = await models.Admin.findOne({
        where: { user_id: user.user_id },
      })
      if (admin) {
        additionalData.admin = admin
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        user,
        ...additionalData,
      },
    })
  } catch (error) {
    console.error("Error getting current user:", error)
    return res.status(500).json({
      success: false,
      message: "Failed to get user data",
      error: error.message,
    })
  }
}

// Update user profile
export const updateProfile = async (req, res) => {
  try {
    const { first_name, last_name, phone_number, address } = req.body

    const user = await models.User.findByPk(req.user.id)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    await user.update({
      first_name: first_name || user.first_name,
      last_name: last_name || user.last_name,
      phone_number: phone_number || user.phone_number,
      address: address || user.address,
      updatedAt: new Date(),
    })

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: {
        user: {
          user_id: user.user_id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          phone_number: user.phone_number,
          address: user.address,
          role: user.role,
        },
      },
    })
  } catch (error) {
    console.error("Error updating profile:", error)
    return res.status(500).json({
      success: false,
      message: "Failed to update profile",
      error: error.message,
    })
  }
}
