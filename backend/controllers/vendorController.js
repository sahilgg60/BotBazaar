import models from "../models/index.js"
import jwt from "jsonwebtoken"
import { Op } from "sequelize"

// Register a new vendor
export const registerVendor = async (req, res) => {
  try {
    const { first_name, last_name, email, password, phone_number, address, store_name, store_logo, license_image } =
      req.body

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

    // Create user with vendor role
    const newUser = await models.User.create({
      first_name,
      last_name,
      email,
      password,
      phone_number,
      address,
      role: "vendor",
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // Create vendor profile
    const newVendor = await models.Vendor.create({
      user_id: newUser.user_id,
      store_name,
      store_logo,
      rating: 0.0,
      date_registered: new Date(),
      license_image,
      address,
      is_approved: false,
    })

    // Create cart for the user
    await models.Cart.create({
      user_id: newUser.user_id,
      created_at: new Date(),
      total_price: 0.0,
    })

    // Create notification for admin
    await models.Notification.create({
      user_id: 1, // Assuming admin has user_id 1
      message: `New vendor registration: ${store_name}. Approval required.`,
      created_date: new Date(),
      is_read: false,
    })

    // Generate JWT token
    const token = jwt.sign({ id: newUser.user_id, role: newUser.role }, process.env.JWT_SECRET || "your_jwt_secret", {
      expiresIn: "1d",
    })

    return res.status(201).json({
      success: true,
      message: "Vendor registered successfully. Awaiting admin approval.",
      data: {
        user: {
          user_id: newUser.user_id,
          first_name: newUser.first_name,
          last_name: newUser.last_name,
          email: newUser.email,
          role: newUser.role,
        },
        vendor: newVendor,
        token,
      },
    })
  } catch (error) {
    console.error("Error registering vendor:", error)
    return res.status(500).json({
      success: false,
      message: "Failed to register vendor",
      error: error.message,
    })
  }
}

// Get vendor profile
export const getVendorProfile = async (req, res) => {
  try {
    const vendorId = req.params.id || (req.user && req.user.vendor_id)

    if (!vendorId) {
      return res.status(400).json({
        success: false,
        message: "Vendor ID is required",
      })
    }

    const vendor = await models.Vendor.findByPk(vendorId, {
      include: [
        {
          model: models.User,
          attributes: ["user_id", "first_name", "last_name", "email", "phone_number", "role"],
        },
      ],
    })

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      })
    }

    return res.status(200).json({
      success: true,
      data: vendor,
    })
  } catch (error) {
    console.error("Error fetching vendor profile:", error)
    return res.status(500).json({
      success: false,
      message: "Failed to fetch vendor profile",
      error: error.message,
    })
  }
}

// Update vendor profile
export const updateVendorProfile = async (req, res) => {
  try {
    const { store_name, store_logo, address, license_image } = req.body

    // Get vendor from authenticated user
    const vendor = await models.Vendor.findOne({
      where: { user_id: req.user.id },
    })

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor profile not found",
      })
    }

    await vendor.update({
      store_name: store_name || vendor.store_name,
      store_logo: store_logo || vendor.store_logo,
      address: address || vendor.address,
      license_image: license_image || vendor.license_image,
    })

    return res.status(200).json({
      success: true,
      message: "Vendor profile updated successfully",
      data: vendor,
    })
  } catch (error) {
    console.error("Error updating vendor profile:", error)
    return res.status(500).json({
      success: false,
      message: "Failed to update vendor profile",
      error: error.message,
    })
  }
}

// Get vendor dashboard data
export const getVendorDashboard = async (req, res) => {
  try {
    // Get vendor from authenticated user
    const vendor = await models.Vendor.findOne({
      where: { user_id: req.user.id },
    })

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor profile not found",
      })
    }

    // Get total products
    const totalProducts = await models.Product.count({
      where: { vendor_id: vendor.vendor_id },
    })

    // Get products with low stock
    const lowStockProducts = await models.Product.findAll({
      where: {
        vendor_id: vendor.vendor_id,
        stock_quantity: { [Op.lt]: 10 },
      },
      limit: 5,
    })

    // Get recent orders
    const recentOrders = await models.OrderItem.findAll({
      include: [
        {
          model: models.Product,
          where: { vendor_id: vendor.vendor_id },
          required: true,
        },
        {
          model: models.Order,
          include: [
            {
              model: models.User,
              attributes: ["user_id", "first_name", "last_name", "email"],
            },
          ],
        },
      ],
      order: [["order_items_id", "DESC"]],
      limit: 10,
    })

    // Get total sales
    const totalSales = await models.OrderItem.sum("total_amount", {
      include: [
        {
          model: models.Product,
          where: { vendor_id: vendor.vendor_id },
          required: true,
        },
        {
          model: models.Order,
          where: { order_status: "completed" },
          required: true,
        },
      ],
    })

    // Get pending orders count
    const pendingOrdersCount = await models.OrderItem.count({
      include: [
        {
          model: models.Product,
          where: { vendor_id: vendor.vendor_id },
          required: true,
        },
      ],
      where: { order_status: "pending" },
    })

    return res.status(200).json({
      success: true,
      data: {
        totalProducts,
        lowStockProducts,
        recentOrders,
        totalSales: totalSales || 0,
        pendingOrdersCount,
      },
    })
  } catch (error) {
    console.error("Error fetching vendor dashboard:", error)
    return res.status(500).json({
      success: false,
      message: "Failed to fetch vendor dashboard",
      error: error.message,
    })
  }
}

// Approve or reject order
export const updateOrderStatus = async (req, res) => {
  try {
    const { orderItemId } = req.params
    const { status } = req.body

    if (!["approved", "rejected", "shipped", "delivered", "completed"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      })
    }

    // Get vendor from authenticated user
    const vendor = await models.Vendor.findOne({
      where: { user_id: req.user.id },
    })

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor profile not found",
      })
    }

    // Find the order item
    const orderItem = await models.OrderItem.findByPk(orderItemId, {
      include: [
        {
          model: models.Product,
          required: true,
        },
        {
          model: models.Order,
          include: [
            {
              model: models.User,
              attributes: ["user_id", "first_name", "last_name", "email"],
            },
          ],
        },
      ],
    })

    if (!orderItem) {
      return res.status(404).json({
        success: false,
        message: "Order item not found",
      })
    }

    // Check if the product belongs to the vendor
    if (orderItem.Product.vendor_id !== vendor.vendor_id) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this order",
      })
    }

    // Update order item status
    await orderItem.update({
      order_status: status,
    })

    // Create notification for customer
    await models.Notification.create({
      user_id: orderItem.Order.user_id,
      message: `Your order for ${orderItem.Product.product_name} has been ${status}.`,
      created_date: new Date(),
      is_read: false,
    })

    return res.status(200).json({
      success: true,
      message: `Order ${status} successfully`,
      data: orderItem,
    })
  } catch (error) {
    console.error("Error updating order status:", error)
    return res.status(500).json({
      success: false,
      message: "Failed to update order status",
      error: error.message,
    })
  }
}
