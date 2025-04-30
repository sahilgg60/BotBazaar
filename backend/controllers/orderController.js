import models from "../models/index.js"
import { sequelize } from "../models/index.js"

// Create a new order from cart
export const createOrder = async (req, res) => {
  try {
    const { payment_method } = req.body

    // Start transaction
    const transaction = await sequelize.transaction()

    try {
      // Find user's cart
      const cart = await models.Cart.findOne({
        where: { user_id: req.user.id },
        include: [
          {
            model: models.CartItem,
            include: [
              {
                model: models.Product,
                include: [
                  {
                    model: models.Vendor,
                    attributes: ["vendor_id", "store_name"],
                  },
                  {
                    model: models.Discount,
                    attributes: ["discount_id", "discount_percentage"],
                    required: false,
                  },
                ],
              },
            ],
          },
        ],
        transaction,
      })

      if (!cart || !cart.CartItems || cart.CartItems.length === 0) {
        await transaction.rollback()
        return res.status(400).json({
          success: false,
          message: "Cart is empty",
        })
      }

      // Check if all products are in stock
      for (const item of cart.CartItems) {
        if (item.Product.stock_quantity < item.total_quantity) {
          await transaction.rollback()
          return res.status(400).json({
            success: false,
            message: `Not enough stock for ${item.Product.product_name}`,
          })
        }
      }

      // Create order
      const order = await models.Order.create(
        {
          user_id: req.user.id,
          order_date: new Date(),
          order_status: "pending",
          total_amount: cart.total_price,
        },
        { transaction },
      )

      // Create order items
      for (const item of cart.CartItems) {
        let itemPrice = Number.parseFloat(item.Product.product_price)

        // Apply discount if available
        if (item.Product.Discount && item.Product.Discount.discount_percentage) {
          const discountAmount = itemPrice * (item.Product.Discount.discount_percentage / 100)
          itemPrice -= discountAmount
        }

        await models.OrderItem.create(
          {
            order_id: order.order_id,
            product_id: item.product_id,
            total_quantity: item.total_quantity,
            total_amount: itemPrice * item.total_quantity,
            order_status: "pending",
          },
          { transaction },
        )

        // Update product stock
        await item.Product.update(
          {
            stock_quantity: item.Product.stock_quantity - item.total_quantity,
          },
          { transaction },
        )

        // Create notification for vendor
        await models.Notification.create(
          {
            user_id: item.Product.Vendor.user_id,
            message: `New order received for ${item.Product.product_name}`,
            created_date: new Date(),
            is_read: false,
          },
          { transaction },
        )
      }

      // Create payment
      await models.Payment.create(
        {
          order_id: order.order_id,
          payment_status: "pending",
          payment_method,
          total_amount: cart.total_price,
          payment_date: new Date(),
        },
        { transaction },
      )

      // Clear cart
      await models.CartItem.destroy(
        {
          where: { cart_id: cart.cart_id },
        },
        { transaction },
      )

      await cart.update({ total_price: 0 }, { transaction })

      // Commit transaction
      await transaction.commit()

      return res.status(201).json({
        success: true,
        message: "Order created successfully",
        data: {
          order_id: order.order_id,
          total_amount: order.total_amount,
          order_status: order.order_status,
        },
      })
    } catch (error) {
      // Rollback transaction on error
      await transaction.rollback()
      throw error
    }
  } catch (error) {
    console.error("Error creating order:", error)
    return res.status(500).json({
      success: false,
      message: "Failed to create order",
      error: error.message,
    })
  }
}

// Get user orders
export const getUserOrders = async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page) || 1
    const limit = Number.parseInt(req.query.limit) || 10
    const offset = (page - 1) * limit
    const status = req.query.status

    const whereClause = { user_id: req.user.id }

    if (status) {
      whereClause.order_status = status
    }

    const { count, rows } = await models.Order.findAndCountAll({
      where: whereClause,
      include: [
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
          model: models.Payment,
        },
      ],
      order: [["order_date", "DESC"]],
      limit,
      offset,
    })

    const totalPages = Math.ceil(count / limit)

    return res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        totalItems: count,
        totalPages,
        currentPage: page,
        itemsPerPage: limit,
      },
    })
  } catch (error) {
    console.error("Error fetching user orders:", error)
    return res.status(500).json({
      success: false,
      message: "Failed to fetch user orders",
      error: error.message,
    })
  }
}

// Get order by ID
export const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params

    const order = await models.Order.findByPk(orderId, {
      include: [
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
          model: models.Payment,
        },
        {
          model: models.User,
          attributes: ["user_id", "first_name", "last_name", "email", "phone_number", "address"],
        },
      ],
    })

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      })
    }

    // Check if the user is authorized to view this order
    if (req.user.role === "customer" && order.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this order",
      })
    }

    // If user is a vendor, check if they have products in this order
    if (req.user.role === "vendor") {
      const vendor = await models.Vendor.findOne({
        where: { user_id: req.user.id },
      })

      if (!vendor) {
        return res.status(404).json({
          success: false,
          message: "Vendor profile not found",
        })
      }

      const hasVendorProducts = order.OrderItems.some((item) => item.Product.vendor_id === vendor.vendor_id)

      if (!hasVendorProducts) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to view this order",
        })
      }
    }

    return res.status(200).json({
      success: true,
      data: order,
    })
  } catch (error) {
    console.error("Error fetching order:", error)
    return res.status(500).json({
      success: false,
      message: "Failed to fetch order",
      error: error.message,
    })
  }
}

// Cancel order
export const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params

    // Start transaction
    const transaction = await sequelize.transaction()

    try {
      const order = await models.Order.findByPk(orderId, {
        include: [
          {
            model: models.OrderItem,
            include: [
              {
                model: models.Product,
              },
            ],
          },
        ],
        transaction,
      })

      if (!order) {
        await transaction.rollback()
        return res.status(404).json({
          success: false,
          message: "Order not found",
        })
      }

      // Check if the user is authorized to cancel this order
      if (order.user_id !== req.user.id) {
        await transaction.rollback()
        return res.status(403).json({
          success: false,
          message: "You are not authorized to cancel this order",
        })
      }

      // Check if order can be canceled (only pending orders)
      if (order.order_status !== "pending") {
        await transaction.rollback()
        return res.status(400).json({
          success: false,
          message: "Only pending orders can be canceled",
        })
      }

      // Update order status
      await order.update(
        {
          order_status: "canceled",
        },
        { transaction },
      )

      // Update order items status
      for (const item of order.OrderItems) {
        await item.update(
          {
            order_status: "canceled",
          },
          { transaction },
        )

        // Restore product stock
        await item.Product.update(
          {
            stock_quantity: item.Product.stock_quantity + item.total_quantity,
          },
          { transaction },
        )
      }

      // Update payment status
      const payment = await models.Payment.findOne({
        where: { order_id: order.order_id },
        transaction,
      })

      if (payment) {
        await payment.update(
          {
            payment_status: "canceled",
          },
          { transaction },
        )
      }

      // Commit transaction
      await transaction.commit()

      return res.status(200).json({
        success: true,
        message: "Order canceled successfully",
      })
    } catch (error) {
      // Rollback transaction on error
      await transaction.rollback()
      throw error
    }
  } catch (error) {
    console.error("Error canceling order:", error)
    return res.status(500).json({
      success: false,
      message: "Failed to cancel order",
      error: error.message,
    })
  }
}
