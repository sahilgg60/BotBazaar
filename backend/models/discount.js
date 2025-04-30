import { DataTypes } from "sequelize"

export default (sequelize) => {
  const Discount = sequelize.define(
    "Discount",
    {
      discount_id: {
        type: DataTypes.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      discount_code: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      discount_percentage: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
      },
      usage_limit: {
        type: DataTypes.INTEGER(11),
        allowNull: true,
      },
      start_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      end_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      user_id: {
        type: DataTypes.INTEGER(11),
        allowNull: false,
        references: {
          model: "user",
          key: "user_id",
        },
      },
    },
    {
      tableName: "discount",
      timestamps: false,
    },
  )

  Discount.associate = (models) => {
    // Discount belongs to a User (creator)
    Discount.belongsTo(models.User, {
      foreignKey: "user_id",
    })

    // Discount has many Products
    Discount.hasMany(models.Product, {
      foreignKey: "discount_id",
    })
  }

  return Discount
}
