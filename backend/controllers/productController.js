import models from "../models/index.js"
import { Op } from "sequelize"

// Get all products with pagination and filtering
export const getAllProducts = async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page) || 1
    const limit = Number.parseInt(req.query.limit) || 10
    const offset = (page - 1) * limit
    const categoryId = req.query.category
    const search = req.query.search
    const minPrice = req.query.minPrice
    const maxPrice = req.query.maxPrice
    const vendorId = req.query.vendor

    const whereClause = {}

    if (categoryId) {
      whereClause.product_category_id = categoryId
    }

    if (search) {
      whereClause[Op.or] = [
        {
          product_name: {
            [Op.like]: `%${search}%`,
          },
        },
        {
          product_description: {
            [Op.like]: `%${search}%`,
          },
        },
        {
          product_tags: {
            [Op.like]: `%${search}%`,
          },
        },
      ]
    }

    if (minPrice && maxPrice) {
      whereClause.product_price = {
        [Op.between]: [minPrice, maxPrice],
      }
    } else if (minPrice) {
      whereClause.product_price = {
        [Op.gte]: minPrice,
      }
    } else if (maxPrice) {
      whereClause.product_price = {
        [Op.lte]: maxPrice,
      }
    }

    if (vendorId) {
      whereClause.vendor_id = vendorId
    }

    const { count, rows } = await models.Product.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      include: [
        {
          model: models.Vendor,
          attributes: ["vendor_id", "store_name", "rating"],
        },
        {
          model: models.ProductCategory,
          attributes: ["product_category_id", "product_category_name"],
        },
        {
          model: models.Discount,
          attributes: ["discount_id", "discount_percentage"],
          required: false,
        },
      ],
      order: [["date_added", "DESC"]],
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
    console.error("Error fetching products:", error)
    return res.status(500).json({
      success: false,
      message: "Failed to fetch products",
      error: error.message,
    })
  }
}

// Get product by ID
export const getProductById = async (req, res) => {
  try {
    const productId = req.params.id

    const product = await models.Product.findByPk(productId, {
      include: [
        {
          model: models.Vendor,
          attributes: ["vendor_id", "store_name", "rating"],
        },
        {
          model: models.ProductCategory,
          attributes: ["product_category_id", "product_category_name"],
        },
        {
          model: models.Discount,
          attributes: ["discount_id", "discount_percentage", "start_date", "end_date"],
          required: false,
        },
        {
          model: models.Review,
          include: [
            {
              model: models.User,
              attributes: ["user_id", "first_name", "last_name"],
            },
          ],
        },
      ],
    })

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      })
    }

    return res.status(200).json({
      success: true,
      data: product,
    })
  } catch (error) {
    console.error("Error fetching product:", error)
    return res.status(500).json({
      success: false,
      message: "Failed to fetch product",
      error: error.message,
    })
  }
}

// Create a new product
export const createProduct = async (req, res) => {
  try {
    const {
      product_category_id,
      product_name,
      product_description,
      product_image,
      product_price,
      stock_quantity,
      discount_id,
      product_tags,
    } = req.body

    // Validate required fields
    if (!product_category_id || !product_name || !product_price) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      })
    }

    // Get vendor_id from authenticated user
    const vendor = await models.Vendor.findOne({
      where: { user_id: req.user.id },
    })

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor profile not found",
      })
    }

    // Check if category exists
    const category = await models.ProductCategory.findByPk(product_category_id)
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Product category not found",
      })
    }

    const newProduct = await models.Product.create({
      vendor_id: vendor.vendor_id,
      product_category_id,
      product_name,
      product_description,
      product_image,
      product_price,
      stock_quantity: stock_quantity || 0,
      date_added: new Date(),
      discount_id: discount_id || null,
      product_tags,
    })

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: newProduct,
    })
  } catch (error) {
    console.error("Error creating product:", error)
    return res.status(500).json({
      success: false,
      message: "Failed to create product",
      error: error.message,
    })
  }
}

// Update a product
export const updateProduct = async (req, res) => {
  try {
    const productId = req.params.id
    const {
      product_name,
      product_description,
      product_image,
      product_price,
      stock_quantity,
      discount_id,
      product_tags,
    } = req.body

    const product = await models.Product.findByPk(productId)

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      })
    }

    // Get vendor_id from authenticated user
    const vendor = await models.Vendor.findOne({
      where: { user_id: req.user.id },
    })

    // Check if the user is the vendor who owns this product or an admin
    if (req.user.role !== "admin" && product.vendor_id !== vendor.vendor_id) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this product",
      })
    }

    await product.update({
      product_name: product_name || product.product_name,
      product_description: product_description || product.product_description,
      product_image: product_image || product.product_image,
      product_price: product_price || product.product_price,
      stock_quantity: stock_quantity !== undefined ? stock_quantity : product.stock_quantity,
      discount_id: discount_id || product.discount_id,
      product_tags: product_tags || product.product_tags,
    })

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: product,
    })
  } catch (error) {
    console.error("Error updating product:", error)
    return res.status(500).json({
      success: false,
      message: "Failed to update product",
      error: error.message,
    })
  }
}

// Delete a product
export const deleteProduct = async (req, res) => {
  try {
    const productId = req.params.id

    const product = await models.Product.findByPk(productId)

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      })
    }

    // Get vendor_id from authenticated user
    const vendor = await models.Vendor.findOne({
      where: { user_id: req.user.id },
    })

    // Check if the user is the vendor who owns this product or an admin
    if (req.user.role !== "admin" && product.vendor_id !== vendor.vendor_id) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this product",
      })
    }

    await product.destroy()

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting product:", error)
    return res.status(500).json({
      success: false,
      message: "Failed to delete product",
      error: error.message,
    })
  }
}

// Get products by vendor
export const getProductsByVendor = async (req, res) => {
  try {
    const vendorId = req.params.vendorId
    const page = Number.parseInt(req.query.page) || 1
    const limit = Number.parseInt(req.query.limit) || 10
    const offset = (page - 1) * limit

    const vendor = await models.Vendor.findByPk(vendorId)
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      })
    }

    const { count, rows } = await models.Product.findAndCountAll({
      where: { vendor_id: vendorId },
      limit,
      offset,
      include: [
        {
          model: models.ProductCategory,
          attributes: ["product_category_id", "product_category_name"],
        },
        {
          model: models.Discount,
          attributes: ["discount_id", "discount_percentage"],
          required: false,
        },
      ],
      order: [["date_added", "DESC"]],
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
    console.error("Error fetching vendor products:", error)
    return res.status(500).json({
      success: false,
      message: "Failed to fetch vendor products",
      error: error.message,
    })
  }
}
