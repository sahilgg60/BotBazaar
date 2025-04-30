import models from "../models/index.js"
import { Op } from "sequelize"
import { sequelize } from "../models/index.js"

// Get all pending vendor approvals
export const getPendingVendorApprovals = async (req, res) => {
  try {
    const vendors = await models.Vendor.findAll({
      where: { is_approved: false },
      include: [
        {
          model: models.User,
          attributes: ["user_id", "first_name", "last_name", "email", "phone_number", "role"],
        },
      ],
    })

    return res.status(200).json({
      success: true,
      data: vendors,
    })
  } catch (error) {
    console.error("Error fetching pending vendor approvals:", error)
    return res.status(500).json({
      success: false,
      message: "Failed to fetch pending vendor approvals",
      error: error.message,
    })
  }
}

// Approve or reject vendor
export const updateVendorApproval = async (req, res) => {
  try {
    const { vendorId } = req.params
    const { approved } = req.body

    const vendor = await models.Vendor.findByPk(vendorId, {
      include: [
        {
          model: models.User,
          attributes: ["user_id", "first_name", "last_name", "email"],
        },
      ],
    })

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      })
    }

    await vendor.update({
      is_approved: approved,
    })

    // Create notification for vendor
    await models.Notification.create({
      user_id: vendor.user_id,
      message: approved
        ? "Congratulations! Your vendor account has been approved."
        : "Your vendor application has been rejected.",
      created_date: new Date(),
      is_read: false,
    })

    return res.status(200).json({
      success: true,
      message: approved ? "Vendor approved successfully" : "Vendor rejected successfully",
      data: vendor,
    })
  } catch (error) {
    console.error("Error updating vendor approval:", error)
    return res.status(500).json({
      success: false,
      message: "Failed to update vendor approval",
      error: error.message,
    })
  }
}

// Get admin dashboard data
export const getAdminDashboard = async (req, res) => {
  try {
    // Get total users count
    const totalUsers = await models.User.count()

    // Get total vendors count
    const totalVendors = await models.Vendor.count()

    // Get total products count
    const totalProducts = await models.Product.count()

    // Get total orders count
    const totalOrders = await models.Order.count()

    // Get total sales
    const totalSales = await models.Order.sum("total_amount", {
      where: { order_status: "completed" },
    })

    // Get recent orders
    const recentOrders = await models.Order.findAll({
      include: [
        {
          model: models.User,
          attributes: ["user_id", "first_name", "last_name", "email"],
        },
      ],
      order: [["order_date", "DESC"]],
      limit: 10,
    })

    // Get pending vendor approvals count
    const pendingVendorApprovalsCount = await models.Vendor.count({
      where: { is_approved: false },
    })

    // Get top selling products
    const topSellingProducts = await models.OrderItem.findAll({
      attributes: ["product_id", [sequelize.fn("SUM", sequelize.col("total_quantity")), "total_sold"]],
      include: [
        {
          model: models.Product,
          include: [
            {
              model: models.Vendor,
              attributes: ["vendor_id", "store_name"],
            },
          ],
        },
      ],
      group: ["product_id"],
      order: [[sequelize.literal("total_sold"), "DESC"]],
      limit: 5,
    })

    return res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalVendors,
        totalProducts,
        totalOrders,
        totalSales: totalSales || 0,
        recentOrders,
        pendingVendorApprovalsCount,
        topSellingProducts,
      },
    })
  } catch (error) {
    console.error("Error fetching admin dashboard:", error)
    return res.status(500).json({
      success: false,
      message: "Failed to fetch admin dashboard",
      error: error.message,
    })
  }
}

// Generate sales report
export const generateSalesReport = async (req, res) => {
  try {
    const { startDate, endDate, vendorId } = req.query

    const whereClause = {}

    if (startDate && endDate) {
      whereClause.order_date = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      }
    } else if (startDate) {
      whereClause.order_date = {
        [Op.gte]: new Date(startDate),
      }
    } else if (endDate) {
      whereClause.order_date = {
        [Op.lte]: new Date(endDate),
      }
    }

    whereClause.order_status = "completed"

    const includeClause = [
      {
        model: models.OrderItem,
        include: [
          {
            model: models.Product,
            include: [
              {
                model: models.Vendor,
                attributes: ["vendor_id", "store_name"],
              },
            ],
          },
        ],
      },
      {
        model: models.User,
        attributes: ["user_id", "first_name", "last_name", "email"],
      },
    ]

    // If vendorId is provided, filter by vendor
    if (vendorId) {
      includeClause[0].include[0].include[0].where = { vendor_id: vendorId }
    }

    const orders = await models.Order.findAll({
      where: whereClause,
      include: includeClause,
      order: [["order_date", "DESC"]],
    })

    // Calculate total sales
    let totalSales = 0
    orders.forEach((order) => {
      totalSales += Number.parseFloat(order.total_amount)
    })

    // Create report
    const report = await models.Report.create({
      admin_id: req.user.admin_id,
      report_type: "sales",
      report_details: JSON.stringify({
        startDate,
        endDate,
        vendorId,
        totalSales,
        ordersCount: orders.length,
      }),
      created_date: new Date(),
    })

    return res.status(200).json({
      success: true,
      data: {
        report,
        totalSales,
        ordersCount: orders.length,
        orders,
      },
    })
  } catch (error) {
    console.error("Error generating sales report:", error)
    return res.status(500).json({
      success: false,
      message: "Failed to generate sales report",
      error: error.message,
    })
  }
}
