import { DataTypes } from "sequelize"

export default (sequelize) => {
  const Admin = sequelize.define(
    "Admin",
    {
      admin_id: {
        type: DataTypes.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      admin_name: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      password: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      phone_number: {
        type: DataTypes.STRING(15),
        allowNull: true,
      },
      address: {
        type: DataTypes.TEXT,
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
      tableName: "admin",
      timestamps: false,
    },
  )

  Admin.associate = (models) => {
    // Admin belongs to a User
    Admin.belongsTo(models.User, {
      foreignKey: "user_id",
    })

    // Admin views many Reports
    Admin.hasMany(models.Report, {
      foreignKey: "admin_id",
    })
  }

  return Admin
}
