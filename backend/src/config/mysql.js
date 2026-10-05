import { Sequelize } from "sequelize";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const dbHost = process.env.MYSQL_HOST || "localhost";
const dbPort = process.env.MYSQL_PORT || 3306;
const dbUser = process.env.MYSQL_USER || "root";
const dbPassword = process.env.MYSQL_PASSWORD || "";
const dbName = process.env.MYSQL_DATABASE || "reetsutra_db";

const isCloudHost = dbHost !== "localhost" && dbHost !== "127.0.0.1";
const useSSL = process.env.MYSQL_SSL === "true" || isCloudHost;

export const sequelize = new Sequelize(dbName, dbUser, dbPassword, {
  host: dbHost,
  port: dbPort,
  dialect: "mysql",
  logging: false,
  dialectOptions: useSSL
    ? {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      }
    : {},
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  define: {
    timestamps: true,
    underscored: false
  }
});

export const connectMySQL = async () => {
  try {
    console.log(`Connecting to MySQL database '${dbName}' on ${dbHost}:${dbPort}...`);
    
    // Auto-create database if not exists
    const tempConnection = await mysql.createConnection({
      host: dbHost,
      port: Number(dbPort),
      user: dbUser,
      password: dbPassword,
      ...(useSSL ? { ssl: { rejectUnauthorized: false } } : {})
    });
    await tempConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
    await tempConnection.end();

    // Test connection with Sequelize
    await sequelize.authenticate();
    console.log("✅ MySQL Database Connected Successfully.");

    // Sync all models with database schema
    await sequelize.sync();
    await sequelize.query("ALTER TABLE users ADD COLUMN permissions JSON NULL;").catch(() => {});
    await sequelize.query("ALTER TABLE categories ADD COLUMN displayName VARCHAR(255) NULL;").catch(() => {});
    await sequelize.query("ALTER TABLE categories ADD COLUMN description TEXT NULL;").catch(() => {});
    await sequelize.query("ALTER TABLE banners ADD COLUMN targetCategory VARCHAR(255) DEFAULT 'All Categories';").catch(() => {});
    await sequelize.query("ALTER TABLE banners ADD COLUMN discountPercentage FLOAT DEFAULT 0;").catch(() => {});
    await sequelize.query("ALTER TABLE orders ADD COLUMN originalSubtotal FLOAT DEFAULT 0;").catch(() => {});
    await sequelize.query("ALTER TABLE orders ADD COLUMN floatingDiscountTotal FLOAT DEFAULT 0;").catch(() => {});
    await sequelize.query("ALTER TABLE coupons ADD COLUMN perUserLimit INT DEFAULT 1;").catch(() => {});
    await sequelize.query("ALTER TABLE products ADD COLUMN storageInstructions TEXT NULL;").catch(() => {});
    await sequelize.query("ALTER TABLE products ADD COLUMN nutritionFacts TEXT NULL;").catch(() => {});
    await sequelize.query("ALTER TABLE products ADD COLUMN shippingInfo TEXT NULL;").catch(() => {});
    console.log("✅ MySQL Models Synchronized.");
  } catch (error) {
    console.error(`❌ MySQL Connection Error: ${error.message}`);
    console.warn("⚠️ Please check if local MySQL server is running.");
  }
};

export default connectMySQL;
