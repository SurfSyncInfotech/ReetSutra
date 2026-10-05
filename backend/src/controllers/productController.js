import mongoose from "mongoose";
import Product from "../models/Product.js";
import Category from "../models/Category.js";
import StockNotification from "../models/StockNotification.js";
import User from "../models/User.js";
import ProductMySQL from "../models/mysql/Product.js";
import CategoryMySQL from "../models/mysql/Category.js";
import UserMySQL from "../models/mysql/User.js";
import { Op } from "sequelize";
import { sendBackInStockEmail } from "../services/emailService.js";
import { getPaginationMeta } from "../utils/pagination.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { checkRequiredFields } from "../validations/validator.js";
import { saveBase64Image, processImagesArray, deleteLocalFile, deleteLocalFiles } from "../utils/fileUpload.js";

const CATEGORY_POPULATE = { path: "category", select: "name slug status" };

const sanitizeExpiryDate = (dateVal) => {
  if (!dateVal) return null;
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return null;
  const year = d.getFullYear();
  if (year < 1900 || year > 9999) return null;
  return d;
};

/**
 * Trigger Back in Stock Emails if product stock restocked > 0
 */
export const notifySubscribersIfStockRestocked = async (productDoc) => {
  try {
    if (!productDoc || productDoc.stock <= 0) return;

    const prodIdStr = String(productDoc.id || productDoc._id);

    let pendingNotifications = [];
    try {
      pendingNotifications = await StockNotificationMySQL.findAll({
        where: { product: prodIdStr, status: "Pending" }
      });
    } catch (sqlErr) {
      pendingNotifications = await StockNotification.find({
        product: prodIdStr,
        status: "Pending"
      }).catch(() => []);
    }

    if (!pendingNotifications || pendingNotifications.length === 0) return;

    console.log(`🔔 Restock Alert: Sending ${pendingNotifications.length} notifications for ${productDoc.name}`);

    const discountedPrice = Math.round(productDoc.price * (1 - (productDoc.discount || 0) / 100));

    for (const sub of pendingNotifications) {
      let realName = "";
      if (sub.user && typeof sub.user === "object" && sub.user.name) {
        realName = sub.user.name;
      } else {
        let foundUser = await UserMySQL.findOne({ where: { email: sub.email } }).catch(() => null);
        if (!foundUser) {
          foundUser = await User.findOne({ email: sub.email }).catch(() => null);
        }
        if (foundUser && foundUser.name) {
          realName = foundUser.name;
        }
      }

      await sendBackInStockEmail({
        toEmail: sub.email,
        userName: realName || "Valued Customer",
        productName: productDoc.name,
        productImage: productDoc.image,
        productPrice: discountedPrice,
        productId: prodIdStr,
        shortDescription: productDoc.shortDescription || productDoc.description || ""
      }).catch(err => console.error("Email send failed:", err));

      sub.status = "Notified";
      sub.notifiedAt = new Date();
      await sub.save();
    }
  } catch (err) {
    console.error("Error triggering back in stock notifications:", err);
  }
};

export const createProduct = async (req, res, next) => {
  try {
    const required = ["name", "sku", "price", "category"];
    const missing = checkRequiredFields(req.body, required);
    if (missing) {
      return sendError(res, `Required field missing: ${missing}`, 400);
    }

    const {
      name,
      sku,
      description,
      price,
      compareAtPrice,
      category,
      stock,
      status,
      image,
      images,
      video,
      weight,
      shortDescription,
      ingredients,
      storageInstructions,
      nutritionFacts,
      shippingInfo,
      benefits,
      expiryDate,
      brand,
      gst,
      hsnCode,
      eanCode,
      size,
      length,
      width,
      height,
      cessRate,
      facility,
      badInventory,
      shelfLife
    } = req.body;

    const processedImage = saveBase64Image(image, 'products');
    const processedImages = processImagesArray(images, 'products');

    let sqlCatId = null;
    if (!isNaN(category)) {
      const catDoc = await CategoryMySQL.findByPk(Number(category)).catch(() => null);
      if (catDoc) sqlCatId = catDoc.id;
    } else if (typeof category === "string") {
      const catDoc = await CategoryMySQL.findOne({ where: { name: category } }).catch(() => null);
      if (catDoc) sqlCatId = catDoc.id;
    }

    let newProduct = null;
    try {
      newProduct = await ProductMySQL.create({
        name,
        sku,
        description: description || "",
        price: parseFloat(price) || 0,
        compareAtPrice: compareAtPrice ? parseFloat(compareAtPrice) : null,
        categoryId: sqlCatId,
        stock: stock ? parseInt(stock) : 0,
        status: status || "Active",
        image: processedImage || "",
        images: processedImages || [],
        video: video || "",
        weight: weight || "",
        shortDescription: shortDescription || "",
        ingredients: ingredients || [],
        storageInstructions: storageInstructions || "",
        nutritionFacts: nutritionFacts || "",
        shippingInfo: shippingInfo || "",
        benefits: benefits || [],
        expiryDate: sanitizeExpiryDate(expiryDate),
        brand: brand || "",
        gst: gst ? parseFloat(gst) : 0,
        hsnCode: hsnCode || "",
        eanCode: eanCode || "",
        size: size || "",
        length: length ? parseFloat(length) : null,
        width: width ? parseFloat(width) : null,
        height: height ? parseFloat(height) : null,
        cessRate: cessRate ? parseFloat(cessRate) : 0,
        facility: facility || "Main Warehouse",
        badInventory: badInventory ? parseInt(badInventory) : 0,
        shelfLife: shelfLife || "",
        isBundle: Boolean(req.body.isBundle),
        bundleItems: req.body.bundleItems || []
      });
    } catch (mysqlErr) {
      console.error("ProductMySQL.create error:", mysqlErr.message);
      if (mongoose.connection.readyState === 1) {
        newProduct = await Product.create({
          name,
          sku,
          description,
          price,
          compareAtPrice,
          category,
          stock,
          status,
          image: processedImage || "",
          images: processedImages || [],
          video,
          weight,
          shortDescription,
          ingredients,
          benefits,
          expiryDate,
          brand,
          gst,
          hsnCode,
          eanCode,
          size,
          length,
          width,
          height,
          cessRate,
          facility,
          badInventory,
          shelfLife,
          isBundle: Boolean(req.body.isBundle),
          bundleItems: req.body.bundleItems || []
        }).catch(() => null);
      }
      if (!newProduct) {
        return sendError(res, `Failed to create product: ${mysqlErr.message}`, 400);
      }
    }

    return sendSuccess(res, "Product created successfully.", newProduct, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Edit a Product (Admin only).
 */
export const editProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    let product = null;

    if (req.body.image) {
      req.body.image = saveBase64Image(req.body.image, 'products');
    }
    if (req.body.images && Array.isArray(req.body.images)) {
      req.body.images = processImagesArray(req.body.images, 'products');
    }

    if (!isNaN(id)) {
      product = await ProductMySQL.findByPk(Number(id));
      if (product) {
        const fieldsToUpdate = [
          "name", "sku", "description", "price", "compareAtPrice", "stock",
          "status", "image", "images", "video", "weight", "shortDescription",
          "ingredients", "storageInstructions", "nutritionFacts", "shippingInfo", "benefits", "expiryDate", "brand", "gst", "hsnCode",
          "eanCode", "size", "length", "width", "height", "cessRate", "facility",
          "badInventory", "shelfLife", "isBundle", "bundleItems"
        ];
        fieldsToUpdate.forEach((field) => {
          if (req.body[field] !== undefined) {
            if (field === "price" || field === "compareAtPrice" || field === "gst" || field === "length" || field === "width" || field === "height" || field === "cessRate") {
              product[field] = req.body[field] ? parseFloat(req.body[field]) : null;
            } else if (field === "stock" || field === "badInventory") {
              product[field] = parseInt(req.body[field]) || 0;
            } else if (field === "expiryDate") {
              product[field] = sanitizeExpiryDate(req.body[field]);
            } else {
              product[field] = req.body[field];
            }
          }
        });
        if (req.body.category && !isNaN(req.body.category)) {
          product.categoryId = Number(req.body.category);
        }
        await product.save();
        if (product.stock > 0) {
          notifySubscribersIfStockRestocked(product).catch(err => console.error("Stock notify error:", err));
        }
        const freshProduct = await ProductMySQL.findByPk(Number(id), {
          include: [{ model: CategoryMySQL, as: "category" }]
        });
        return sendSuccess(res, "Product updated successfully.", freshProduct || product);
      }
    }

    if (mongoose.Types.ObjectId.isValid(id)) {
      product = await Product.findById(id);
      if (product) {
        const fieldsToUpdate = [
          "name", "sku", "description", "price", "compareAtPrice", "category", "stock",
          "status", "image", "images", "video", "weight", "shortDescription",
          "ingredients", "storageInstructions", "nutritionFacts", "shippingInfo", "benefits", "expiryDate", "brand", "gst", "hsnCode",
          "eanCode", "size", "length", "width", "height", "cessRate", "facility",
          "badInventory", "shelfLife", "isBundle", "bundleItems"
        ];
        fieldsToUpdate.forEach((field) => {
          if (req.body[field] !== undefined) {
            product[field] = req.body[field];
          }
        });
        await product.save();
        if (product.stock > 0) {
          notifySubscribersIfStockRestocked(product).catch(err => console.error("Stock notify error:", err));
        }
        return sendSuccess(res, "Product updated successfully.", product);
      }
    }

    return sendError(res, "Product not found.", 404);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a Product (Admin only).
 */
export const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isNaN(id)) {
      const prod = await ProductMySQL.findByPk(Number(id));
      if (prod) {
        if (prod.image) deleteLocalFile(prod.image);
        if (Array.isArray(prod.images)) deleteLocalFiles(prod.images);

        await prod.destroy();
        return sendSuccess(res, "Product deleted successfully.", { id });
      }
    }

    if (mongoose.Types.ObjectId.isValid(id)) {
      const product = await Product.findById(id);
      if (product) {
        if (product.image) deleteLocalFile(product.image);
        if (Array.isArray(product.images)) deleteLocalFiles(product.images);

        await Product.findByIdAndDelete(id);
        return sendSuccess(res, "Product deleted successfully.", { id });
      }
    }

    return sendError(res, "Product not found or already deleted.", 404);
  } catch (error) {
    next(error);
  }
};

/**
 * Get All Products with search, category, status & pagination filters.
 */
export const getProducts = async (req, res, next) => {
  try {
    const { search, category, status, page = 1, limit = 50 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    const where = {};
    if (status) where.status = status;
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { sku: { [Op.like]: `%${search}%` } },
        { brand: { [Op.like]: `%${search}%` } }
      ];
    }

    let products = [];
    let total = 0;

    try {
      const { rows, count } = await ProductMySQL.findAndCountAll({
        where,
        include: [{ model: CategoryMySQL, as: "category" }],
        order: [["id", "DESC"]],
        limit: limitNum,
        offset: offset
      });
      products = rows;
      total = count;
    } catch (mysqlErr) {
      try {
        const query = {};
        if (status) query.status = status;
        const mongoPromise = Promise.all([
          Product.find(query).populate(CATEGORY_POPULATE).skip(offset).limit(limitNum),
          Product.countDocuments(query)
        ]);
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Mongo timeout")), 1500));
        const [mProds, mTotal] = await Promise.race([mongoPromise, timeoutPromise]);
        products = mProds || [];
        total = mTotal || 0;
      } catch (e) {
        products = [];
        total = 0;
      }
    }

    const meta = getPaginationMeta(pageNum, limitNum, total);

    return sendSuccess(res, "Products fetched successfully.", {
      products,
      pagination: meta
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Single Product By ID.
 */
export const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let product = null;

    if (!isNaN(id)) {
      product = await ProductMySQL.findByPk(Number(id), {
        include: [{ model: CategoryMySQL, as: "category" }]
      });
    }

    if (!product && mongoose.Types.ObjectId.isValid(id)) {
      product = await Product.findById(id).populate(CATEGORY_POPULATE);
    }

    if (!product) {
      return sendError(res, "Product not found.", 404);
    }

    return sendSuccess(res, "Product details fetched.", product);
  } catch (error) {
    next(error);
  }
};

/**
 * Subscribe Customer to Back-In-Stock Email Alerts
 */
export const subscribeStockNotification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { email } = req.body;

    if (!email || !email.trim()) {
      return sendError(res, "Email address is required.", 400);
    }

    let product = null;
    if (!isNaN(id)) {
      product = await ProductMySQL.findByPk(Number(id));
    }
    if (!product) {
      product = await Product.findById(id).catch(() => null);
    }

    if (!product) {
      return sendError(res, "Product not found.", 404);
    }

    const cleanEmail = email.trim().toLowerCase();
    const prodIdStr = String(product.id || product._id);

    // Check if already pending subscription exists
    const existing = await StockNotification.findOne({
      product: prodIdStr,
      email: cleanEmail,
      status: "Pending"
    });

    if (existing) {
      return sendSuccess(res, `You are already subscribed! We will email ${cleanEmail} as soon as ${product.name} is restocked.`, existing);
    }

    const userIdVal = req.user ? String(req.user.id || req.user._id) : null;

    const newSub = await StockNotification.create({
      product: prodIdStr,
      user: userIdVal,
      email: cleanEmail,
      status: "Pending"
    });

    return sendSuccess(res, `Success! We will email ${cleanEmail} as soon as ${product.name} is back in stock.`, newSub, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk Import Products (Admin only).
 */
export const bulkImportProducts = async (req, res, next) => {
  try {
    const { products } = req.body;
    if (!Array.isArray(products) || products.length === 0) {
      return sendError(res, "Products array is required for bulk import.", 400);
    }

    const allCategories = await Category.find();

    const createdProducts = [];
    for (const item of products) {
      let categoryId = null;
      if (item.category) {
        const found = allCategories.find(c =>
          c.name.toLowerCase() === String(item.category).toLowerCase()
        );
        if (found) categoryId = found._id;
      }

      let shelfLifeVal = item.shelfLife ? String(item.shelfLife).trim() : "";
      if (shelfLifeVal && !isNaN(shelfLifeVal)) {
        shelfLifeVal = `${shelfLifeVal} Days`;
      }

      const productSku = item.sku || item.eanCode || `RS-${String(item.name).slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

      const newP = await Product.create({
        name: item.name,
        sku: productSku,
        eanCode: item.eanCode || "",
        hsnCode: item.hsnCode || "",
        brand: item.brand || "",
        price: item.mrp || item.price ? parseFloat(item.mrp || item.price) : 299,
        compareAtPrice: item.compareAtPrice ? parseFloat(item.compareAtPrice) : null,
        category: categoryId,
        stock: item.stock ? parseInt(item.stock) : 100,
        status: item.status || "Active",
        image: item.image || item.imageUrl || "https://images.unsplash.com/photo-1599490659213-e2b9527bd087?auto=format&fit=crop&w=600&q=80",
        images: item.image ? [item.image] : [],
        weight: item.weight ? String(item.weight) : "",
        length: item.length ? parseFloat(item.length) : null,
        width: item.width ? parseFloat(item.width) : null,
        height: item.height ? parseFloat(item.height) : null,
        shelfLife: shelfLifeVal,
        description: item.description || ""
      });

      createdProducts.push(newP);
    }

    return sendSuccess(res, `Successfully imported ${createdProducts.length} products.`, {
      importedCount: createdProducts.length
    }, 201);
  } catch (error) {
    next(error);
  }
};

export const addProduct = createProduct;
