import { DataTypes } from "sequelize"

export default (sequelize) => {
  const Vendor = sequelize.define(
    "Vendor",
    {
      vendor_id: {
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
      store_name: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      store_logo: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      rating: {
        type: DataTypes.DECIMAL(3, 2),
        allowNull: true,
        defaultValue: 0.0,
      },
      date_registered: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      license_image: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      address: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      is_approved: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: "vendor",
      timestamps: false,
    },
  )

  Vendor.associate = (models) => {
    // Vendor belongs to a User
    Vendor.belongsTo(models.User, {
      foreignKey: "user_id",
    })

    // Vendor has many Products
    Vendor.hasMany(models.Product, {
      foreignKey: "vendor_id",
    })

    // Vendor manages many Discounts
    Vendor.hasMany(models.Discount, {
      foreignKey: "vendor_id",
    })
  }

  return Vendor
}
