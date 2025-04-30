import { DataTypes } from "sequelize"

export default (sequelize) => {
  const Notification = sequelize.define(
    "Notification",
    {
      notification_id: {
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
      message: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      created_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      is_read: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: "notification",
      timestamps: false,
    },
  )

  Notification.associate = (models) => {
    // Notification belongs to a User
    Notification.belongsTo(models.User, {
      foreignKey: "user_id",
    })
  }

  return Notification
}
