import models from "../models/index.js"

// Get user cart
export const getUserCart = async (req, res) => {
  try {
    // Find user's cart
    let cart = await models.Cart.findOne({
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
    })

    // If cart doesn't exist, create one
    if (!cart) {
      cart = await models.Cart.create({
        user_id: req.user.id,
        created_at: new Date(),
        total_price: 0.0,
      })

      cart.CartItems = []
    }

    // Calculate total price
    let totalPrice = 0
    if (cart.CartItems && cart.CartItems.length > 0) {
      cart.CartItems.forEach((item) => {
        let itemPrice = Number.parseFloat(item.Product.product_price)

        // Apply discount if available
        if (item.Product.Discount && item.Product.Discount.discount_percentage) {
          const discountAmount = itemPrice * (item.Product.Discount.discount_percentage / 100)
          itemPrice -= discountAmount
        }

        totalPrice += itemPrice * item.total_quantity
      })

      // Update cart total price
      await cart.update({ total_price: totalPrice })
    }

    return res.status(200).json({
      success: true,
      data: cart,
    })
  } catch (error) {
    console.error("Error fetching cart:", error)
    return res.status(500).json({
      success: false,
      message: "Failed to fetch cart",
      error: error.message,
    })
  }
}

// Add item to cart
export const addToCart = async (req, res) => {
  try {
    const { product_id, quantity = 1 } = req.body

    // Check if product exists
    const product = await models.Product.findByPk(product_id)
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      })
    }

    // Check if product is in stock
    if (product.stock_quantity < quantity) {
      return res.status(400).json({
        success: false,
        message: "Not enough stock available",
      })
    }

    // Find or create user's cart
    const [cart, created] = await models.Cart.findOrCreate({
      where: { user_id: req.user.id },
      defaults: {
        user_id: req.user.id,
        created_at: new Date(),
        total_price: 0.0,
      },
    })

    // Check if item already exists in cart
    let cartItem = await models.CartItem.findOne({
      where: {
        cart_id: cart.cart_id,
        product_id,
      },
    })

    let itemPrice = Number.parseFloat(product.product_price)

    // Apply discount if available
    if (product.discount_id) {
      const discount = await models.Discount.findByPk(product.discount_id)
      if (discount && discount.discount_percentage) {
        const discountAmount = itemPrice * (discount.discount_percentage / 100)
        itemPrice -= discountAmount
      }
    }

    if (cartItem) {
      // Update quantity and price
      await cartItem.update({
        total_quantity: cartItem.total_quantity + quantity,
        total_price: itemPrice * (cartItem.total_quantity + quantity),
      })
    } else {
      // Create new cart item
      cartItem = await models.CartItem.create({
        cart_id: cart.cart_id,
        product_id,
        total_quantity: quantity,
        total_price: itemPrice * quantity,
      })
    }

    // Update cart total price
    const cartItems = await models.CartItem.findAll({
      where: { cart_id: cart.cart_id },
      include: [
        {
          model: models.Product,
          include: [
            {
              model: models.Discount,
              attributes: ["discount_id", "discount_percentage"],
              required: false,
            },
          ],
        },
      ],
    })

    let totalPrice = 0
    cartItems.forEach((item) => {
      let itemPrice = Number.parseFloat(item.Product.product_price)

      // Apply discount if available
      if (item.Product.Discount && item.Product.Discount.discount_percentage) {
        const discountAmount = itemPrice * (item.Product.Discount.discount_percentage / 100)
        itemPrice -= discountAmount
      }

      totalPrice += itemPrice * item.total_quantity
    })

    await cart.update({ total_price: totalPrice })

    return res.status(200).json({
      success: true,
      message: "Item added to cart successfully",
      data: {
        cart,
        cartItem,
      },
    })
  } catch (error) {
    console.error("Error adding to cart:", error)
    return res.status(500).json({
      success: false,
      message: "Failed to add item to cart",
      error: error.message,
    })
  }
}

// Update cart item
export const updateCartItem = async (req, res) => {
  try {
    const { cart_items_id } = req.params
    const { quantity } = req.body

    // Check if quantity is valid
    if (quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be at least 1",
      })
    }

    // Find cart item
    const cartItem = await models.CartItem.findOne({
      where: {
        cart_items_id,
      },
      include: [
        {
          model: models.Cart,
          where: { user_id: req.user.id },
          required: true,
        },
        {
          model: models.Product,
          include: [
            {
              model: models.Discount,
              attributes: ["discount_id", "discount_percentage"],
              required: false,
            },
          ],
        },
      ],
    })

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: "Cart item not found",
      })
    }

    // Check if product is in stock
    if (cartItem.Product.stock_quantity < quantity) {
      return res.status(400).json({
        success: false,
        message: "Not enough stock available",
      })
    }

    let itemPrice = Number.parseFloat(cartItem.Product.product_price)

    // Apply discount if available
    if (cartItem.Product.Discount && cartItem.Product.Discount.discount_percentage) {
      const discountAmount = itemPrice * (cartItem.Product.Discount.discount_percentage / 100)
      itemPrice -= discountAmount
    }

    // Update cart item
    await cartItem.update({
      total_quantity: quantity,
      total_price: itemPrice * quantity,
    })

    // Update cart total price
    const cartItems = await models.CartItem.findAll({
      where: { cart_id: cartItem.cart_id },
      include: [
        {
          model: models.Product,
          include: [
            {
              model: models.Discount,
              attributes: ["discount_id", "discount_percentage"],
              required: false,
            },
          ],
        },
      ],
    })

    let totalPrice = 0
    cartItems.forEach((item) => {
      let itemPrice = Number.parseFloat(item.Product.product_price)

      // Apply discount if available
      if (item.Product.Discount && item.Product.Discount.discount_percentage) {
        const discountAmount = itemPrice * (item.Product.Discount.discount_percentage / 100)
        itemPrice -= discountAmount
      }

      totalPrice += itemPrice * item.total_quantity
    })

    await cartItem.Cart.update({ total_price: totalPrice })

    return res.status(200).json({
      success: true,
      message: "Cart item updated successfully",
      data: cartItem,
    })
  } catch (error) {
    console.error("Error updating cart item:", error)
    return res.status(500).json({
      success: false,
      message: "Failed to update cart item",
      error: error.message,
    })
  }
}

// Remove item from cart
export const removeFromCart = async (req, res) => {
  try {
    const { cart_items_id } = req.params

    // Find cart item
    const cartItem = await models.CartItem.findOne({
      where: {
        cart_items_id,
      },
      include: [
        {
          model: models.Cart,
          where: { user_id: req.user.id },
          required: true,
        },
      ],
    })

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: "Cart item not found",
      })
    }

    // Store cart_id before deleting
    const cartId = cartItem.cart_id

    // Delete cart item
    await cartItem.destroy()

    // Update cart total price
    const cartItems = await models.CartItem.findAll({
      where: { cart_id: cartId },
      include: [
        {
          model: models.Product,
          include: [
            {
              model: models.Discount,
              attributes: ["discount_id", "discount_percentage"],
              required: false,
            },
          ],
        },
      ],
    })

    let totalPrice = 0
    cartItems.forEach((item) => {
      let itemPrice = Number.parseFloat(item.Product.product_price)

      // Apply discount if available
      if (item.Product.Discount && item.Product.Discount.discount_percentage) {
        const discountAmount = itemPrice * (item.Product.Discount.discount_percentage / 100)
        itemPrice -= discountAmount
      }

      totalPrice += itemPrice * item.total_quantity
    })

    const cart = await models.Cart.findByPk(cartId)
    await cart.update({ total_price: totalPrice })

    return res.status(200).json({
      success: true,
      message: "Item removed from cart successfully",
    })
  } catch (error) {
    console.error("Error removing from cart:", error)
    return res.status(500).json({
      success: false,
      message: "Failed to remove item from cart",
      error: error.message,
    })
  }
}

// Clear cart
export const clearCart = async (req, res) => {
  try {
    // Find user's cart
    const cart = await models.Cart.findOne({
      where: { user_id: req.user.id },
    })

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      })
    }

    // Delete all cart items
    await models.CartItem.destroy({
      where: { cart_id: cart.cart_id },
    })

    // Update cart total price
    await cart.update({ total_price: 0 })

    return res.status(200).json({
      success: true,
      message: "Cart cleared successfully",
    })
  } catch (error) {
    console.error("Error clearing cart:", error)
    return res.status(500).json({
      success: false,
      message: "Failed to clear cart",
      error: error.message,
    })
  }
}
