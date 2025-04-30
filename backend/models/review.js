import { DataTypes } from "sequelize"

export default (sequelize) => {
  const Review = sequelize.define(
    "Review",
    {
      review_id: {
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
      product_id: {
        type: DataTypes.INTEGER(11),
        allowNull: true,
        references: {
          model: "product",
          key: "product_id",
        },
      },
      review_text: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      review_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      rating: {
        type: DataTypes.INTEGER(11),
        allowNull: true,
      },
    },
    {
      tableName: "review",
      timestamps: false,
    },
  )

  Review.associate = (models) => {
    // Review belongs to a User
    Review.belongsTo(models.User, {
      foreignKey: "user_id",
    })

    // Review belongs to a Product
    Review.belongsTo(models.Product, {
      foreignKey: "product_id",
    })
  }

  return Review
}
