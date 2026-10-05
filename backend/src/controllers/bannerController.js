import Banner from "../models/Banner.js";
import BannerMySQL from "../models/mysql/Banner.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { checkRequiredFields } from "../validations/validator.js";
import { saveBase64Image, deleteLocalFile } from "../utils/fileUpload.js";

/**
 * Add Banner (Admin only).
 */
export const addBanner = async (req, res, next) => {
  try {
    const required = ["title"];
    const missing = checkRequiredFields(req.body, required);
    if (missing) {
      return sendError(res, `Required field missing: ${missing}`, 400);
    }

    const {
      title,
      subtitle,
      bannerType,
      targetDevice,
      desktopImage,
      mobileImage,
      image,
      buttonText,
      buttonLink,
      status,
      placement
    } = req.body;

    const savedDesktop = saveBase64Image(desktopImage, 'banners');
    const savedMobile = saveBase64Image(mobileImage, 'banners');
    const savedImage = saveBase64Image(image, 'banners');

    const mainImage = savedDesktop || savedImage || savedMobile || "";

    let newBanner = null;
    try {
      newBanner = await BannerMySQL.create({
        title,
        bannerType: bannerType || "Permanent",
        targetDevice: targetDevice || "Both",
        desktopImage: savedDesktop || mainImage,
        mobileImage: savedMobile || mainImage,
        image: mainImage,
        link: buttonLink || "/shop",
        buttonLink: buttonLink || "/shop",
        startDate: req.body.startDate || null,
        endDate: req.body.endDate || null,
        targetCategory: req.body.targetCategory || "All Categories",
        discountPercentage: req.body.discountPercentage ? parseFloat(req.body.discountPercentage) : 0,
        durationSeconds: req.body.durationSeconds ? parseInt(req.body.durationSeconds) : 5,
        status: status || "Active",
        order: 1
      });
    } catch (mysqlErr) {
      newBanner = await Banner.create({
        title,
        subtitle: subtitle || "",
        bannerType: bannerType || "Permanent",
        targetDevice: targetDevice || "Both",
        desktopImage: savedDesktop || mainImage,
        mobileImage: savedMobile || mainImage,
        image: mainImage,
        buttonText: buttonText || "SHOP NOW",
        buttonLink: buttonLink || "/shop",
        status: status || "Active",
        placement: placement || "Main Hero",
        startDate: req.body.startDate || null,
        endDate: req.body.endDate || null,
        targetCategory: req.body.targetCategory || "All Categories",
        discountPercentage: req.body.discountPercentage ? parseFloat(req.body.discountPercentage) : 0
      });
    }

    return sendSuccess(res, "Banner campaign created successfully.", newBanner, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Edit Banner (Admin only).
 */
export const editBanner = async (req, res, next) => {
  try {
    const { id } = req.params;
    let banner = null;

    if (req.body.desktopImage) req.body.desktopImage = saveBase64Image(req.body.desktopImage, 'banners');
    if (req.body.mobileImage) req.body.mobileImage = saveBase64Image(req.body.mobileImage, 'banners');
    if (req.body.image) req.body.image = saveBase64Image(req.body.image, 'banners');

    if (!isNaN(id)) {
      banner = await BannerMySQL.findByPk(Number(id));
      if (banner) {
        const fieldsToUpdate = [
          "title", "bannerType", "targetDevice", "desktopImage", "mobileImage",
          "image", "link", "buttonLink", "startDate", "endDate", "status",
          "targetCategory", "discountPercentage", "durationSeconds"
        ];
        fieldsToUpdate.forEach((field) => {
          if (req.body[field] !== undefined) banner[field] = req.body[field];
        });
        if (req.body.buttonLink && !req.body.link) banner.link = req.body.buttonLink;
        if (req.body.link && !req.body.buttonLink) banner.buttonLink = req.body.link;
        if (req.body.desktopImage || req.body.mobileImage) {
          banner.image = req.body.desktopImage || req.body.mobileImage || banner.image;
        }
        await banner.save();
        return sendSuccess(res, "Banner campaign updated successfully.", banner);
      }
    }

    banner = await Banner.findById(id).catch(() => null);
    if (!banner) {
      return sendError(res, "Banner campaign not found.", 404);
    }

    const fieldsToUpdate = [
      "title", "subtitle", "bannerType", "targetDevice",
      "desktopImage", "mobileImage", "image", "buttonText",
      "buttonLink", "status", "placement", "startDate", "endDate",
      "targetCategory", "discountPercentage"
    ];
    fieldsToUpdate.forEach((field) => {
      if (req.body[field] !== undefined) banner[field] = req.body[field];
    });
    await banner.save();

    return sendSuccess(res, "Banner campaign updated successfully.", banner);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete Banner (Admin only).
 */
export const deleteBanner = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isNaN(id)) {
      const ban = await BannerMySQL.findByPk(Number(id));
      if (ban) {
        if (ban.image) deleteLocalFile(ban.image);
        if (ban.desktopImage) deleteLocalFile(ban.desktopImage);
        if (ban.mobileImage) deleteLocalFile(ban.mobileImage);
        await ban.destroy();
        return sendSuccess(res, "Banner campaign deleted successfully.", { id });
      }
    }

    const banMongo = await Banner.findById(id).catch(() => null);
    if (banMongo) {
      if (banMongo.image) deleteLocalFile(banMongo.image);
      if (banMongo.desktopImage) deleteLocalFile(banMongo.desktopImage);
      if (banMongo.mobileImage) deleteLocalFile(banMongo.mobileImage);
      await Banner.findByIdAndDelete(id);
      return sendSuccess(res, "Banner campaign deleted successfully.", { id });
    }

    return sendSuccess(res, "Banner campaign deleted successfully.", { id });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Banners (Public website & Admin management).
 */
export const getBanners = async (req, res, next) => {
  try {
    const { status } = req.query;
    let mysqlBanners = [];
    try {
      const where = {};
      if (status) where.status = status;
      mysqlBanners = await BannerMySQL.findAll({ where, order: [["id", "DESC"]] });
    } catch (mysqlErr) {}

    let mongoBanners = [];
    try {
      const query = {};
      if (status) query.status = status;
      mongoBanners = await Promise.race([
        Banner.find(query).sort({ createdAt: -1 }).catch(() => []),
        new Promise((resolve) => setTimeout(() => resolve([]), 1500))
      ]).catch(() => []);
    } catch (e) {}

    const idSet = new Set();
    const banners = [];
    const now = new Date();

    for (const b of [...mysqlBanners, ...mongoBanners]) {
      const bannerObj = b.toJSON ? b.toJSON() : b;
      const key = String(bannerObj.id || bannerObj._id || bannerObj.title || Math.random());

      // Auto-remove expired floating banner campaign
      const isFloating = bannerObj.bannerType === "Floating" || (bannerObj.placement && bannerObj.placement.includes("Floating"));
      if (isFloating && bannerObj.endDate) {
        const endDateObj = new Date(bannerObj.endDate);
        if (typeof bannerObj.endDate === 'string' && !bannerObj.endDate.includes('T')) {
          endDateObj.setHours(23, 59, 59, 999);
        } else if (endDateObj.getHours() === 0 && endDateObj.getMinutes() === 0) {
          endDateObj.setHours(23, 59, 59, 999);
        }

        if (now > endDateObj) {
          // Delete expired floating banner from database
          const targetId = bannerObj.id || bannerObj._id;
          if (targetId && !isNaN(targetId)) {
            BannerMySQL.destroy({ where: { id: Number(targetId) } }).catch(() => {});
          }
          if (bannerObj._id) {
            Banner.findByIdAndDelete(bannerObj._id).catch(() => {});
          }
          continue; // Skip returning expired banner
        }
      }

      if (!idSet.has(key)) {
        idSet.add(key);
        banners.push(bannerObj);
      }
    }

    return sendSuccess(res, "Banners fetched successfully.", banners);
  } catch (error) {
    next(error);
  }
};

export const uploadBannerImage = async (req, res) => sendSuccess(res, "Banner image uploaded.", {});
