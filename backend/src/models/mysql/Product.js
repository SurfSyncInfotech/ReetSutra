import { DataTypes } from "sequelize";
import { sequelize } from "../../config/mysql.js";
import Category from "./Category.js";

export const Product = sequelize.define("Product", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  sku: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  shortDescription: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  price: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0
  },
  compareAtPrice: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  categoryId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: Category,
      key: "id"
    }
  },
  stock: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  blockedInOrders: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  status: {
    type: DataTypes.ENUM("Active", "Inactive"),
    defaultValue: "Active"
  },
  image: {
    type: DataTypes.TEXT("long"),
    allowNull: true
  },
  images: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  video: {
    type: DataTypes.TEXT("long"),
    allowNull: true
  },
  weight: {
    type: DataTypes.STRING,
    allowNull: true
  },
  ingredients: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  storageInstructions: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  nutritionFacts: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  shippingInfo: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  benefits: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  expiryDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  brand: {
    type: DataTypes.STRING,
    allowNull: true
  },
  gst: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  hsnCode: {
    type: DataTypes.STRING,
    allowNull: true
  },
  eanCode: {
    type: DataTypes.STRING,
    allowNull: true
  },
  size: {
    type: DataTypes.STRING,
    allowNull: true
  },
  length: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  width: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  height: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  cessRate: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  facility: {
    type: DataTypes.STRING,
    defaultValue: "Main Warehouse"
  },
  badInventory: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  shelfLife: {
    type: DataTypes.STRING,
    allowNull: true
  },
  isBundle: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  bundleItems: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  }
}, {
  tableName: "products"
});

// Associations
Product.belongsTo(Category, { foreignKey: "categoryId", as: "category" });
Category.hasMany(Product, { foreignKey: "categoryId", as: "products" });

export default Product;
