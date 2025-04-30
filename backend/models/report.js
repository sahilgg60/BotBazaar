import { DataTypes } from "sequelize"

export default (sequelize) => {
  const Report = sequelize.define(
    "Report",
    {
      report_id: {
        type: DataTypes.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      admin_id: {
        type: DataTypes.INTEGER(11),
        allowNull: true,
        references: {
          model: "admin",
          key: "admin_id",
        },
      },
      report_type: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      report_details: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      created_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "report",
      timestamps: false,
    },
  )

  Report.associate = (models) => {
    // Report is viewed by an Admin
    Report.belongsTo(models.Admin, {
      foreignKey: "admin_id",
    })
  }

  return Report
}
