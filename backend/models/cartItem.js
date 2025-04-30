import { DataTypes } from "sequelize"

export default (sequelize) => {
  const CartItem = sequelize.define(
    "CartItem",
    {
      cart_items_id: {
        type: DataTypes.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      cart_id: {
        type: DataTypes.INTEGER(11),
        allowNull: true,
        references: {
          model: "cart",
          key: "cart_id",
        },
      },
      product_id: {
        type: DataTypes.INTEGER(11),
        allowNull: true,
        references: {
          model: "product",
          key: "product_id",
        },
      },
      total_quantity: {
        type: DataTypes.INTEGER(11),
        allowNull: true,
        defaultValue: 1,
      },
      total_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
    },
    {
      tableName: "cart_items",
      timestamps: false,
    },
  )

  CartItem.associate = (models) => {
    // CartItem belongs to a Cart
    CartItem.belongsTo(models.Cart, {
      foreignKey: "cart_id",
    })

    // CartItem belongs to a Product
    CartItem.belongsTo(models.Product, {
      foreignKey: "product_id",
    })
  }

  return CartItem
}
