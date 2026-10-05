import { DataTypes } from "sequelize";
import { sequelize } from "../../config/mysql.js";

export const Banner = sequelize.define("Banner", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: true
  },
  bannerType: {
    type: DataTypes.STRING,
    defaultValue: "Permanent"
  },
  targetDevice: {
    type: DataTypes.STRING,
    defaultValue: "Both"
  },
  image: {
    type: DataTypes.TEXT("long"),
    allowNull: true
  },
  desktopImage: {
    type: DataTypes.TEXT("long"),
    allowNull: true
  },
  mobileImage: {
    type: DataTypes.TEXT("long"),
    allowNull: true
  },
  link: {
    type: DataTypes.STRING,
    allowNull: true
  },
  buttonLink: {
    type: DataTypes.STRING,
    allowNull: true
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  targetCategory: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: "All Categories"
  },
  discountPercentage: {
    type: DataTypes.FLOAT,
    allowNull: true,
    defaultValue: 0
  },
  durationSeconds: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 5
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: "Active"
  },
  order: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: "banners"
});

export default Banner;
