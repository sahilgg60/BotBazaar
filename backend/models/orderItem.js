import { DataTypes } from "sequelize"

export default (sequelize) => {
  const OrderItem = sequelize.define(
    "OrderItem",
    {
      order_items_id: {
        type: DataTypes.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      order_id: {
        type: DataTypes.INTEGER(11),
        allowNull: true,
        references: {
          model: "order",
          key: "order_id",
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
      },
      total_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      order_status: {
        type: DataTypes.STRING(50),
        allowNull: true,
        defaultValue: "pending",
      },
    },
    {
      tableName: "order_items",
      timestamps: false,
    },
  )

  OrderItem.associate = (models) => {
    // OrderItem belongs to an Order
    OrderItem.belongsTo(models.Order, {
      foreignKey: "order_id",
    })

    // OrderItem belongs to a Product
    OrderItem.belongsTo(models.Product, {
      foreignKey: "product_id",
    })
  }

  return OrderItem
}
