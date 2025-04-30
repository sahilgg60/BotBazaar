import { DataTypes } from "sequelize"

export default (sequelize) => {
  const ProductCategory = sequelize.define(
    "ProductCategory",
    {
      product_category_id: {
        type: DataTypes.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      product_category_name: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: "product_category",
      timestamps: false,
    },
  )

  ProductCategory.associate = (models) => {
    // ProductCategory has many Products
    ProductCategory.hasMany(models.Product, {
      foreignKey: "product_category_id",
    })
  }

  return ProductCategory
}
