import { DataTypes } from "sequelize"

export default (sequelize) => {
  const Order = sequelize.define(
    "Order",
    {
      order_id: {
        type: DataTypes.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: DataTypes.INTEGER(11),
        allowNull: true,
        references: {
          model: "user",
          key: "user_id",
        },
      },
      order_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      order_status: {
        type: DataTypes.STRING(50),
        allowNull: true,
        defaultValue: "pending",
      },
      total_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
    },
    {
      tableName: "order",
      timestamps: false,
    },
  )

  Order.associate = (models) => {
    // Order belongs to a User
    Order.belongsTo(models.User, {
      foreignKey: "user_id",
    })

    // Order has many OrderItems
    Order.hasMany(models.OrderItem, {
      foreignKey: "order_id",
    })

    // Order has one Payment
    Order.hasOne(models.Payment, {
      foreignKey: "order_id",
    })
  }

  return Order
}
