import { DataTypes } from "sequelize"

export default (sequelize) => {
  const Product = sequelize.define(
    "Product",
    {
      product_id: {
        type: DataTypes.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      vendor_id: {
        type: DataTypes.INTEGER(11),
        allowNull: true,
        references: {
          model: "vendor",
          key: "vendor_id",
        },
      },
      product_category_id: {
        type: DataTypes.INTEGER(11),
        allowNull: true,
        references: {
          model: "product_category",
          key: "product_category_id",
        },
      },
      product_name: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      product_description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      product_image: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      product_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      stock_quantity: {
        type: DataTypes.INTEGER(11),
        allowNull: true,
        defaultValue: 0,
      },
      date_added: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      discount_id: {
        type: DataTypes.INTEGER(11),
        allowNull: true,
        references: {
          model: "discount",
          key: "discount_id",
        },
      },
      product_tags: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
    },
    {
      tableName: "product",
      timestamps: false,
    },
  )

  Product.associate = (models) => {
    // Product belongs to a Vendor
    Product.belongsTo(models.Vendor, {
      foreignKey: "vendor_id",
    })

    // Product belongs to a ProductCategory
    Product.belongsTo(models.ProductCategory, {
      foreignKey: "product_category_id",
    })

    // Product has many Reviews
    Product.hasMany(models.Review, {
      foreignKey: "product_id",
    })

    // Product has many OrderItems
    Product.hasMany(models.OrderItem, {
      foreignKey: "product_id",
    })

    // Product has many CartItems
    Product.hasMany(models.CartItem, {
      foreignKey: "product_id",
    })

    // Product has one Discount
    Product.belongsTo(models.Discount, {
      foreignKey: "discount_id",
    })
  }

  return Product
}
