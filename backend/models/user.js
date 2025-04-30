import { DataTypes } from "sequelize"
import bcrypt from "bcrypt"

export default (sequelize) => {
  const User = sequelize.define(
    "User",
    {
      user_id: {
        type: DataTypes.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      first_name: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      last_name: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      password: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      phone_number: {
        type: DataTypes.STRING(15),
        allowNull: false,
      },
      address: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      role: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: "customer",
      },
      resetPasswordToken: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      resetPasswordExpires: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      images: {
        type: DataTypes.TEXT("long"),
        allowNull: true,
      },
    },
    {
      tableName: "user",
      timestamps: true,
      hooks: {
        beforeCreate: async (user) => {
          if (user.password) {
            const salt = await bcrypt.genSalt(10)
            user.password = await bcrypt.hash(user.password, salt)
          }
        },
        beforeUpdate: async (user) => {
          if (user.changed("password")) {
            const salt = await bcrypt.genSalt(10)
            user.password = await bcrypt.hash(user.password, salt)
          }
        },
      },
    },
  )

  User.prototype.comparePassword = async function (password) {
    return await bcrypt.compare(password, this.password)
  }

  User.associate = (models) => {
    // User has one Vendor profile
    User.hasOne(models.Vendor, {
      foreignKey: "user_id",
    })

    // User has one Admin profile
    User.hasOne(models.Admin, {
      foreignKey: "user_id",
    })

    // User has many Reviews
    User.hasMany(models.Review, {
      foreignKey: "user_id",
    })

    // User has many Orders
    User.hasMany(models.Order, {
      foreignKey: "user_id",
    })

    // User has one Cart
    User.hasOne(models.Cart, {
      foreignKey: "user_id",
    })

    // User receives many Notifications
    User.hasMany(models.Notification, {
      foreignKey: "user_id",
    })

    // User has many Discounts
    User.hasMany(models.Discount, {
      foreignKey: "user_id",
    })
  }

  return User
}
