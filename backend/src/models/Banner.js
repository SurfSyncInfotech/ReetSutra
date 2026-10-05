import mongoose from "mongoose";

const bannerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    subtitle: {
      type: String,
      trim: true,
      default: ""
    },
    bannerType: {
      type: String,
      enum: ["Permanent", "Floating"],
      default: "Permanent"
    },
    targetDevice: {
      type: String,
      enum: ["Both", "Desktop", "Mobile"],
      default: "Both"
    },
    desktopImage: {
      type: String,
      default: ""
    },
    mobileImage: {
      type: String,
      default: ""
    },
    image: {
      type: String,
      default: ""
    },
    buttonText: {
      type: String,
      default: "SHOP NOW"
    },
    buttonLink: {
      type: String,
      default: "/shop"
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active"
    },
    placement: {
      type: String,
      default: "Main Hero"
    },
    startDate: {
      type: Date,
      default: null
    },
    endDate: {
      type: Date,
      default: null
    },
    targetCategory: {
      type: String,
      default: "All Categories"
    },
    discountPercentage: {
      type: Number,
      default: 0
    },
    durationSeconds: {
      type: Number,
      default: 5
    }
  },
  {
    timestamps: true
  }
);

const Banner = mongoose.model("Banner", bannerSchema);

export default Banner;
