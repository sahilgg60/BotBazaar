import { DataTypes } from "sequelize"

export default (sequelize) => {
  const Cart = sequelize.define(
    "Cart",
    {
      cart_id: {
        type: DataTypes.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: DataTypes.INTEGER(30),
        allowNull: false,
        references: {
          model: "user",
          key: "user_id",
        },
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      total_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0.0,
      },
    },
    {
      tableName: "cart",
      timestamps: false,
    },
  )

  Cart.associate = (models) => {
    // Cart belongs to a User
    Cart.belongsTo(models.User, {
      foreignKey: "user_id",
    })

    // Cart has many CartItems
    Cart.hasMany(models.CartItem, {
      foreignKey: "cart_id",
    })
  }

  return Cart
}
