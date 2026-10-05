import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    sku: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    compareAtPrice: {
      type: Number,
      default: null,
      min: 0
    },
    category: {
      type: mongoose.Schema.Types.Mixed,
      ref: "Category",
      required: true
    },
    stock: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    },
    blockedInOrders: {
      type: Number,
      default: 0,
      min: 0
    },
    isBundle: {
      type: Boolean,
      default: false
    },
    bundleItems: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product"
        },
        productName: String,
        sku: String,
        quantity: {
          type: Number,
          default: 1
        }
      }
    ],
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active"
    },
    image: {
      type: String,
      required: true
    },
    images: {
      type: [String],
      default: []
    },
    video: {
      type: String,
      default: ""
    },
    weight: {
      type: String,
      default: ""
    },
    shortDescription: {
      type: String,
      default: ""
    },
    ingredients: {
      type: [String],
      default: []
    },
    storageInstructions: {
      type: String,
      default: ""
    },
    nutritionFacts: {
      type: String,
      default: ""
    },
    shippingInfo: {
      type: String,
      default: ""
    },
    benefits: {
      type: [String],
      default: []
    },
    expiryDate: {
      type: Date,
      default: null
    },
    brand: {
      type: String,
      trim: true,
      default: ""
    },
    gst: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    hsnCode: { type: String, trim: true, default: "" },
    eanCode: { type: String, trim: true, default: "" },
    size: { type: String, trim: true, default: "" },
    length: { type: Number, default: null },
    width: { type: Number, default: null },
    height: { type: Number, default: null },
    cessRate: { type: Number, default: 0, min: 0, max: 100 },
    facility: { type: String, trim: true, default: "Main Warehouse" },
    badInventory: { type: Number, default: 0, min: 0 },
    shelfLife: { type: String, trim: true, default: "" },
    rating: {
      type: Number,
      default: 5.0,
      min: 0,
      max: 5
    },
    reviewsCount: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  {
    timestamps: true
  }
);

const Product = mongoose.model("Product", productSchema);

export default Product;
