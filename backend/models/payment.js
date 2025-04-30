import { DataTypes } from "sequelize"

export default (sequelize) => {
  const Payment = sequelize.define(
    "Payment",
    {
      payment_id: {
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
      payment_status: {
        type: DataTypes.STRING(50),
        allowNull: true,
        defaultValue: "pending",
      },
      payment_method: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      total_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      payment_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "payment",
      timestamps: false,
    },
  )

  Payment.associate = (models) => {
    // Payment belongs to an Order
    Payment.belongsTo(models.Order, {
      foreignKey: "order_id",
    })
  }

  return Payment
}
