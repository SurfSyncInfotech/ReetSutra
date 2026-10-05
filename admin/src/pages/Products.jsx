import React, { useState } from "react";
import { Plus, Edit2, Trash2, Loader, Eye, AlertTriangle, Upload, FileSpreadsheet, Download, Search } from "lucide-react";
import { useData } from "../context/DataContext";
import { DataTable } from "../components/DataTable";
import { Modal } from "../components/Modal";
import { getAdminImageUrl, handleAdminImageError } from "../config";
import * as XLSX from "xlsx";

export const Products = () => {
  const { products, categories, addProduct, bulkImportProducts, updateProduct, deleteProduct, loading, showToast } = useData();

  // Modals state
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null); // Null for add, product object for edit
  const [deleteProductId, setDeleteProductId] = useState(null);

  // Import Excel Modal state
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importRows, setImportRows] = useState([]);
  const [isImporting, setIsImporting] = useState(false);

  // Form states
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formStock, setFormStock] = useState("");
  const [formStatus, setFormStatus] = useState("Active");
  const [formImage, setFormImage] = useState("");
  const [formImages, setFormImages] = useState(["", "", "", "", ""]);
  const [formImageNames, setFormImageNames] = useState(["", "", "", "", ""]); // Track original filenames per slot
  const [activeImageSlot, setActiveImageSlot] = useState(0);
  const [formVideo, setFormVideo] = useState("");
  const [formWeight, setFormWeight] = useState("");
  const [formShortDescription, setFormShortDescription] = useState("");
  const [formIngredients, setFormIngredients] = useState("");
  const [formBenefits, setFormBenefits] = useState("");
  const [formSkuCode, setFormSkuCode] = useState("");
  const [formBrand, setFormBrand] = useState("");
  const [formGst, setFormGst] = useState("");
  const [formExpiryDate, setFormExpiryDate] = useState("");
  const [formHsnCode, setFormHsnCode] = useState("");
  const [formEanCode, setFormEanCode] = useState("");
  const [formSize, setFormSize] = useState("");
  const [formLength, setFormLength] = useState("");
  const [formWidth, setFormWidth] = useState("");
  const [formHeight, setFormHeight] = useState("");
  const [formCessRate, setFormCessRate] = useState("");
  const [formFacility, setFormFacility] = useState("Main Warehouse");
  const [formBadInventory, setFormBadInventory] = useState("");
  const [formShelfLife, setFormShelfLife] = useState("");
  const [formStorageInstructions, setFormStorageInstructions] = useState("");
  const [formNutritionFacts, setFormNutritionFacts] = useState("");
  const [formShippingInfo, setFormShippingInfo] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Gift Box / Combo Bundle state
  const [formIsBundle, setFormIsBundle] = useState(false);
  const [formBundleItems, setFormBundleItems] = useState([]);
  const [bundleSearchQuery, setBundleSearchQuery] = useState("");
  const [bundleSelectedProduct, setBundleSelectedProduct] = useState("");
  const [bundleSelectedQty, setBundleSelectedQty] = useState("1");

  const handleAddBundleItem = () => {
    if (!bundleSelectedProduct) return;
    const targetProd = products.find(p => String(p._id || p.id) === String(bundleSelectedProduct));
    if (!targetProd) return;

    const prodId = targetProd.id || targetProd._id;
    if (formBundleItems.some(item => String(item.productId || item.productId?._id) === String(prodId))) {
      showToast("Product is already added to this gift box bundle.");
      return;
    }

    const newItem = {
      productId: prodId,
      productName: targetProd.name,
      sku: targetProd.sku || `RS-${targetProd.name.slice(0, 3).toUpperCase()}-9015`,
      quantity: parseInt(bundleSelectedQty, 10) || 1
    };

    setFormBundleItems(prev => [...prev, newItem]);
    setBundleSelectedProduct("");
    setBundleSelectedQty("1");
  };

  const handleRemoveBundleItem = (idx) => {
    setFormBundleItems(prev => prev.filter((_, i) => i !== idx));
  };

  const formatINR = (value) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(value);
  };

  // Direct Export / Download Products as Excel
  const handleExportProductsExcel = () => {
    if (!products || products.length === 0) {
      handleDownloadSampleTemplate();
      return;
    }

    const exportRows = products.map((p, idx) => ({
      "S.No": idx + 1,
      "EAN Code": p.eanCode || "",
      "Product SKU": p.sku || "",
      "Product Name": p.name || "",
      "Category Name": p.category?.name || (typeof p.category === "string" ? p.category : "Uncategorized"),
      "Brand": p.brand || "",
      "MRP (₹)": p.price || 0,
      "GST (%)": p.gst != null ? p.gst : 0,
      "HSN Code": p.hsnCode || "",
      "Shelf Life": p.shelfLife || "",
      "Length (mm)": p.length != null ? p.length : "",
      "Width (mm)": p.width != null ? p.width : "",
      "Height (mm)": p.height != null ? p.height : "",
      "Weight (gms)": p.weight || "",
      "Stock": p.stock != null ? p.stock : 0,
      "Facility": p.facility || "Main Warehouse",
      "Status": p.status || "Active",
      "Description": p.description || ""
    }));

    const ws = XLSX.utils.json_to_sheet(exportRows);
    ws["!cols"] = Object.keys(exportRows[0] || {}).map(k => ({ wch: Math.max(k.length + 3, 16) }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Products Export");

    const today = new Date().toISOString().slice(0, 10);
    const fileName = `Products_Export_${today}.xlsx`;

    const wbOut = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbOut], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast("Products report downloaded successfully!");
  };

  // Open add modal
  const handleOpenAdd = () => {
    setCurrentProduct(null);
    setFormName("");
    setFormDescription("");
    setFormPrice("");
    setFormCategory("");
    setFormStock("");
    setFormStatus("Active");
    setFormImage("");
    setFormImages(["", "", "", "", ""]);
    setFormImageNames(["", "", "", "", ""]);
    setActiveImageSlot(0);
    setFormVideo("");
    setFormWeight("");
    setFormShortDescription("");
    setFormIngredients("");
    setFormBenefits("");
    setFormSkuCode("");
    setFormBrand("");
    setFormGst("");
    setFormExpiryDate("");
    setFormHsnCode("");
    setFormEanCode("");
    setFormSize("");
    setFormLength("");
    setFormWidth("");
    setFormHeight("");
    setFormCessRate("");
    setFormFacility("Main Warehouse");
    setFormBadInventory("");
    setFormShelfLife("");
    setFormStorageInstructions("");
    setFormNutritionFacts("");
    setFormShippingInfo("");
    setFormIsBundle(false);
    setFormBundleItems([]);
    setBundleSelectedProduct("");
    setBundleSelectedQty("1");
    setFormError("");
    setIsAddEditOpen(true);
  };

  // Open edit modal
  const handleOpenEdit = (product) => {
    setCurrentProduct(product);
    setFormName(product.name);
    setFormDescription(product.description || "");
    setFormPrice(product.price);
    
    // Robust category matching by ID, Name, or Object
    let targetCatId = "";
    const catRef = product.category || product.categoryId;
    if (catRef) {
      let rawId = "";
      let rawName = "";
      if (typeof catRef === "object" && catRef !== null) {
        rawId = catRef._id || catRef.id || "";
        rawName = catRef.name || catRef.displayName || "";
      } else {
        rawId = catRef;
        rawName = String(catRef);
      }

      const matchedCat = categories.find(c => {
        const cId = String(c._id || c.id || "");
        const cName = String(c.name || "").toLowerCase();
        const cDisp = String(c.displayName || "").toLowerCase();
        const targetIdStr = String(rawId || "");
        const targetNameStr = String(rawName || "").toLowerCase();

        return (
          (cId && targetIdStr && cId === targetIdStr) ||
          (cName && targetNameStr && cName === targetNameStr) ||
          (cDisp && targetNameStr && cDisp === targetNameStr)
        );
      });

      if (matchedCat) {
        targetCatId = String(matchedCat._id || matchedCat.id);
      } else if (rawId && categories.some(c => String(c._id || c.id) === String(rawId))) {
        targetCatId = String(rawId);
      } else if (categories.length > 0) {
        targetCatId = String(categories[0]._id || categories[0].id);
      }
    } else if (categories.length > 0) {
      targetCatId = String(categories[0]._id || categories[0].id);
    }
    setFormCategory(targetCatId);
    setFormStock(product.stock);
    setFormStatus(product.status || "Active");
    setFormImage(product.image || "");

    // Map multiple images slots
    let imgs = ["", "", "", "", ""];
    if (product.images && Array.isArray(product.images)) {
      product.images.forEach((img, idx) => {
        if (idx < 5) imgs[idx] = img;
      });
      if (product.images.length === 0 && product.image) {
        imgs[0] = product.image;
      }
    } else if (product.image) {
      imgs[0] = product.image;
    }
    setFormImages(imgs);
    setFormImageNames(["", "", "", "", ""]); // reset filenames when editing (existing images are URLs)
    setActiveImageSlot(0);
    setFormVideo(product.video || "");

    setFormWeight(product.weight || "");
    setFormShortDescription(product.shortDescription || "");
    setFormIngredients(
      product.ingredients && Array.isArray(product.ingredients)
        ? product.ingredients.join(", ")
        : ""
    );
    setFormBenefits(
      product.benefits && Array.isArray(product.benefits)
        ? product.benefits.join(", ")
        : ""
    );
    setFormSkuCode(product.sku || "");
    setFormBrand(product.brand || "");
    setFormGst(product.gst !== undefined && product.gst !== null ? String(product.gst) : "");
    setFormExpiryDate(
      product.expiryDate ? new Date(product.expiryDate).toISOString().split("T")[0] : ""
    );
    setFormHsnCode(product.hsnCode || "");
    setFormEanCode(product.eanCode || "");
    setFormSize(product.size || "");
    setFormLength(product.length != null ? String(product.length) : "");
    setFormWidth(product.width != null ? String(product.width) : "");
    setFormHeight(product.height != null ? String(product.height) : "");
    setFormCessRate(product.cessRate != null ? String(product.cessRate) : "");
    setFormFacility(product.facility || "Main Warehouse");
    setFormBadInventory(product.badInventory !== undefined && product.badInventory !== null ? String(product.badInventory) : "0");
    setFormShelfLife(product.shelfLife || "");
    setFormStorageInstructions(product.storageInstructions || "");
    setFormNutritionFacts(product.nutritionFacts || "");
    setFormShippingInfo(product.shippingInfo || "");

    // Bundle fields
    const catName = product.category?.name || "";
    setFormIsBundle(Boolean(product.isBundle || catName.toLowerCase().includes("gift") || catName.toLowerCase().includes("combo")));
    setFormBundleItems(product.bundleItems || []);
    setBundleSelectedProduct("");
    setBundleSelectedQty("1");

    setFormError("");
    setIsAddEditOpen(true);
  };

  // --- Bulk Import Handlers ---
  const handleDownloadSampleTemplate = () => {
    const sampleRows = [
      {
        "EAN Code": "8901234567890",
        "Product Name": "Special Desi Ghee",
        "Category Name": "Ghee",
        "Length (mm)": 120,
        "Width (mm)": 120,
        "Height (mm)": 180,
        "Weight (gms)": 500,
        "Brand": "ReetSutra",
        "MRP": 599,
        "HSN Code": "04059020",
        "Shelf Life (Days)": 1080,
        "Stock": 150,
        "Image URL": "https://images.unsplash.com/photo-1589927986076-25584897f1f9",
        "Description": "Pure Cow Ghee traditional preparation."
      },
      {
        "EAN Code": "8901234567891",
        "Product Name": "Traditional Thekua",
        "Category Name": "Snacks",
        "Length (mm)": 100,
        "Width (mm)": 100,
        "Height (mm)": 150,
        "Weight (gms)": 250,
        "Brand": "ReetSutra",
        "MRP": 299,
        "HSN Code": "19059090",
        "Shelf Life (Days)": 180,
        "Stock": 200,
        "Image URL": "https://images.unsplash.com/photo-1599490659213-e2b9527bd087",
        "Description": "Authentic Bihari Thekua made with Jaggery."
      }
    ];

    const ws = XLSX.utils.json_to_sheet(sampleRows);
    ws["!cols"] = Object.keys(sampleRows[0]).map(k => ({ wch: Math.max(k.length + 3, 18) }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Products Import Template");

    const wbOut = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbOut], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "Products_Import_Template.xlsx";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawData = XLSX.utils.sheet_to_json(ws);

        if (rawData.length === 0) {
          showToast("Selected file is empty.");
          return;
        }

        const mapped = rawData.map((row) => {
          const name = row["Product Name"] || row["Name"] || row["name"] || "";
          const eanCode = row["EAN Code"] || row["EAN CODE"] || row["eanCode"] || "";
          const length = row["Length (mm)"] || row["length"] || null;
          const width = row["Width (mm)"] || row["width"] || null;
          const height = row["Height (mm)"] || row["height"] || null;
          const weight = row["Weight (gms)"] || row["Weight"] || row["weight"] || "";
          const brand = row["Brand"] || row["brand"] || "";
          const mrp = row["MRP"] || row["mrp"] || row["Price"] || row["price"] || 299;
          const hsnCode = row["HSN Code"] || row["HSN"] || row["hsnCode"] || "";
          const shelfLife = row["Shelf Life (Days)"] || row["Shelf Life"] || row["shelfLife"] || "";
          const category = row["Category Name"] || row["Category"] || row["category"] || "";
          const stock = row["Stock"] || row["stock"] || 100;
          const image = row["Image URL"] || row["Image"] || row["image"] || "";
          const description = row["Description"] || row["description"] || "";

          return {
            name,
            eanCode: String(eanCode).trim(),
            length: length ? parseFloat(length) : null,
            width: width ? parseFloat(width) : null,
            height: height ? parseFloat(height) : null,
            weight: weight ? String(weight).trim() : "",
            brand: String(brand).trim(),
            mrp: mrp ? parseFloat(mrp) : 299,
            hsnCode: String(hsnCode).trim(),
            shelfLife: shelfLife ? String(shelfLife).trim() : "",
            category,
            stock: stock ? parseInt(stock) : 100,
            image,
            description
          };
        });

        setImportRows(mapped);
      } catch (err) {
        console.error("Excel parse error:", err);
        showToast("Failed to parse Excel file. Please use the sample template.");
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleConfirmImport = async () => {
    if (importRows.length === 0) {
      showToast("No products to import.");
      return;
    }

    setIsImporting(true);
    try {
      await bulkImportProducts(importRows);
      showToast(`Successfully imported ${importRows.length} products!`, "success");
      setIsImportOpen(false);
      setImportRows([]);
    } catch (err) {
      console.error("Import error:", err);
    } finally {
      setIsImporting(false);
    }
  };

  // Open delete confirmation
  const handleOpenDelete = (id) => {
    setDeleteProductId(id);
    setIsDeleteOpen(true);
  };

  const compressImage = (base64Str, maxWidthPx = 1200, quality = 0.82) => {
    return new Promise((resolve) => {
      if (!base64Str || !base64Str.startsWith("data:image/")) {
        resolve(base64Str);
        return;
      }
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;
        if (width > maxWidthPx) {
          height = Math.round((height * maxWidthPx) / width);
          width = maxWidthPx;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => resolve(base64Str);
      img.src = base64Str;
    });
  };

  // Max size per image after compression (in KB). Keeps total payload manageable.
  const MAX_IMAGE_SIZE_KB = 800;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Raw file pre-check: reject files larger than 10MB before even reading
    if (file.size > 10 * 1024 * 1024) {
      showToast(`"${file.name}" bahut badi file hai (max 10MB). Chhoti image use karein.`);
      e.target.value = "";
      return;
    }

    const slotToFill = activeImageSlot; // capture current slot synchronously
    const fileName = file.name; // capture original filename

    const reader = new FileReader();
    reader.onloadend = async () => {
      const compressed = await compressImage(reader.result);

      // Check compressed base64 size
      // base64 string mein har 4 chars = 3 bytes, so actual KB = (length * 3/4) / 1024
      const base64Data = compressed.split(",")[1] || compressed;
      const sizeKB = Math.round((base64Data.length * 3) / 4 / 1024);

      if (sizeKB > MAX_IMAGE_SIZE_KB) {
        const sizeLabel = sizeKB >= 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB} KB`;
        const errorText = `Image #${slotToFill + 1} ("${fileName}") ki size ${sizeLabel} hai (Max limit: ${MAX_IMAGE_SIZE_KB} KB). Kripya is photo ko badlein ya 800 KB se chhoti image upload karein.`;
        setFormError(errorText);
        showToast(errorText, "error");
        e.target.value = "";
        return;
      }

      setFormError("");

      // Save compressed image into the captured slot
      const newImages = [...formImages];
      newImages[slotToFill] = compressed;
      setFormImages(newImages);

      // Save filename for this slot
      const newNames = [...formImageNames];
      newNames[slotToFill] = fileName;
      setFormImageNames(newNames);

      if (slotToFill === 0) {
        setFormImage(compressed);
      }

      // Auto-advance to next empty slot so the next Choose File goes to next slot
      const nextEmpty = newImages.findIndex((img, i) => i > slotToFill && !img);
      if (nextEmpty !== -1) {
        setActiveImageSlot(nextEmpty);
      }

      // Reset file input
      e.target.value = "";
    };
    reader.readAsDataURL(file);
  };

  const MAX_VIDEO_SECONDS = 30;
  const MAX_VIDEO_SIZE_MB = 20;

  const readVideoDuration = (src) => {
    return new Promise((resolve, reject) => {
      const videoEl = document.createElement("video");
      videoEl.preload = "metadata";
      videoEl.onloadedmetadata = () => resolve(videoEl.duration);
      videoEl.onerror = () => reject(new Error("Unable to read video metadata."));
      videoEl.src = src;
    });
  };

  const handleVideoFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > MAX_VIDEO_SIZE_MB * 1024 * 1024) {
      showToast(`Video file is too large (max ${MAX_VIDEO_SIZE_MB}MB).`);
      e.target.value = "";
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    readVideoDuration(objectUrl)
      .then((duration) => {
        URL.revokeObjectURL(objectUrl);
        if (duration > MAX_VIDEO_SECONDS) {
          showToast(`Video must be ${MAX_VIDEO_SECONDS} seconds or shorter (this one is ${Math.round(duration)}s).`);
          e.target.value = "";
          return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
          setFormVideo(reader.result);
        };
        reader.readAsDataURL(file);
      })
      .catch(() => {
        URL.revokeObjectURL(objectUrl);
        // Fallback: allow the video file to be loaded even if metadata duration cannot be read.
        const reader = new FileReader();
        reader.onloadend = () => {
          setFormVideo(reader.result);
        };
        reader.readAsDataURL(file);
      });
  };

  const handleVideoUrlChange = (url) => {
    setFormVideo(url);
    if (!url) return;
    readVideoDuration(url).then((duration) => {
      if (duration > MAX_VIDEO_SECONDS) {
        showToast(`Video must be ${MAX_VIDEO_SECONDS} seconds or shorter (this one is ${Math.round(duration)}s).`);
        setFormVideo("");
      }
    }).catch(() => {
      // Remote URL metadata isn't always readable (e.g. CORS) - allow it through silently.
    });
  };

  // Handle Form Submit (Add/Edit)
  const handleSubmitProduct = async (e) => {
    e.preventDefault();

    const activeImages = formImages.filter((img) => img.trim() !== "");
    const primaryImg = activeImages[0] || formImage || "";

    let catToSubmit = formCategory;
    if (!catToSubmit && categories.length > 0) {
      catToSubmit = String(categories[0]._id || categories[0].id);
      setFormCategory(catToSubmit);
    }

    if (!formName || !formPrice || !formStock || !primaryImg || !catToSubmit) {
      setFormError("Please fill out all required fields (*). Make sure a category is selected and at least one product image is uploaded.");
      return;
    }

    // Per-image size validation at submit time (safety net)
    // Only check base64 data URIs — URL images don't count toward payload size
    for (let i = 0; i < formImages.length; i++) {
      const img = formImages[i];
      if (!img || !img.startsWith("data:")) continue;

      const base64Data = img.split(",")[1] || img;
      const sizeKB = Math.round((base64Data.length * 3) / 4 / 1024);

      if (sizeKB > MAX_IMAGE_SIZE_KB) {
        const slotLabel = `Image #${i + 1}`;
        const nameLabel = formImageNames[i] ? ` ("${formImageNames[i]}")` : "";
        const sizeLabel = sizeKB >= 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB} KB`;
        setFormError(
          `${slotLabel}${nameLabel} ki size ${sizeLabel} hai (Max limit: ${MAX_IMAGE_SIZE_KB} KB). Kripya is image ko badlein ya remove karke 800 KB se chhoti image upload karein.`
        );
        setActiveImageSlot(i);
        return;
      }
    }

    const payload = {
      name: formName,
      description: formDescription,
      price: parseFloat(formPrice),
      category: catToSubmit,
      stock: parseInt(formStock),
      status: formStatus,
      image: primaryImg,
      images: activeImages,
      video: formVideo,
      weight: formWeight,
      shortDescription: formShortDescription,
      ingredients: formIngredients
        ? formIngredients.split(",").map((i) => i.trim()).filter((i) => i !== "")
        : [],
      benefits: formBenefits
        ? formBenefits.split(",").map((b) => b.trim()).filter((b) => b !== "")
        : [],
      sku: formSkuCode || undefined,
      brand: formBrand,
      gst: formGst ? parseFloat(formGst) : 0,
      expiryDate: formExpiryDate || null,
      hsnCode: formHsnCode,
      eanCode: formEanCode,
      size: formSize,
      length: formLength ? parseFloat(formLength) : null,
      width: formWidth ? parseFloat(formWidth) : null,
      height: formHeight ? parseFloat(formHeight) : null,
      cessRate: formCessRate ? parseFloat(formCessRate) : 0,
      facility: formFacility || "Main Warehouse",
      badInventory: formBadInventory ? parseInt(formBadInventory) : 0,
      shelfLife: formShelfLife || "",
      storageInstructions: formStorageInstructions || "",
      nutritionFacts: formNutritionFacts || "",
      shippingInfo: formShippingInfo || "",
      isBundle: formIsBundle,
      bundleItems: formBundleItems
    };

    setFormError("");
    setIsSubmitting(true);

    try {
      if (currentProduct) {
        await updateProduct(currentProduct.id, payload);
      } else {
        await addProduct(payload);
      }
      // ONLY CLOSE MODAL ON SUCCESS!
      setIsAddEditOpen(false);
    } catch (err) {
      // Modal stays OPEN on error so user can fix issues!
      const errMsg = err.message || "Failed to publish product.";
      if (errMsg.includes("413") || errMsg.includes("Too Large") || errMsg.includes("large")) {
        setFormError("Server error 413: Images overall size is too large for web server. Please remove or compress heavy images.");
      } else {
        setFormError(`Error: ${errMsg}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete Confirmation
  const handleDeleteConfirm = () => {
    if (deleteProductId) {
      deleteProduct(deleteProductId);
      setIsDeleteOpen(false);
      setDeleteProductId(null);
    }
  };

  // Set up categories filtering options
  const filterOptions = categories.map((cat) => ({
    value: cat._id || cat.id,
    label: cat.name
  }));

  // Flatten the populated category ref into a filterable id so DataTable's
  // generic string-equality filter can match it against filterOptions values.
  const tableData = products.map((p) => ({
    ...p,
    categoryId: p.category?._id || p.category?.id || (typeof p.category === "string" ? p.category : "")
  }));

  // Define data table columns
  const columns = [
    {
      key: "image",
      header: "Preview",
      render: (row) => (
        <img
          src={getAdminImageUrl(row.image)}
          alt={row.name}
          onError={handleAdminImageError}
          className="w-12 h-12 object-cover rounded-lg border border-primary/5 shadow-xs"
        />
      )
    },
    {
      key: "name",
      header: "Product Details",
      render: (row) => (
        <div>
          <span className="font-display font-semibold text-sm text-primary block">
            {row.name}
          </span>
          <span className="text-[10px] text-charcoal-light font-bold">
            SKU: {row.sku}
          </span>
        </div>
      )
    },
    {
      key: "category",
      header: "Category",
      render: (row) => (
        <span className="text-xs text-charcoal-light font-semibold">
          {row.category?.name || <span className="italic text-charcoal-light/60">Uncategorized</span>}
        </span>
      )
    },
    {
      key: "price",
      header: "Pricing",
      render: (row) => (
        <div className="flex items-center gap-1.5 text-xs font-semibold">
          <span className="text-primary font-bold">{formatINR(row.price)}</span>
          {row.compareAtPrice && (
            <span className="line-through text-charcoal-light text-[10px] font-medium">
              {formatINR(row.compareAtPrice)}
            </span>
          )}
        </div>
      )
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <span
          className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${row.status === "Active"
            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
            : "bg-charcoal-light/10 text-charcoal-light border-charcoal-light/25"
            }`}
        >
          {row.status}
        </span>
      )
    }
  ];

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-primary leading-tight">
            Product Management
          </h1>
          <p className="text-sm text-charcoal-light font-medium">
            Manage your gourmet snacks catalog, adjust prices, and check inventory.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-center">
          <button
            onClick={handleExportProductsExcel}
            className="flex items-center gap-1.5 px-4.5 py-2.5 bg-primary text-secondary rounded-lg font-display font-bold text-sm shadow-md hover:bg-primary-light transition-all duration-200 cursor-pointer"
          >
            <Download size={16} /> Download Products Report
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4.5 py-2.5 bg-primary text-secondary rounded-lg font-display font-bold text-sm shadow-md hover:bg-primary-light transition-all duration-200 cursor-pointer"
          >
            <Plus size={16} /> Add Product
          </button>
        </div>
      </div>

      {/* Main product data table */}
      <DataTable
        columns={columns}
        data={tableData}
        searchKey="name"
        searchPlaceholder="Search products by name..."
        filterKey="categoryId"
        filterPlaceholder="Select Category"
        filterOptions={filterOptions}
        renderActions={(row) => (
          <div className="flex items-center justify-end gap-1.5">
            <button
              onClick={() => handleOpenEdit(row)}
              className="p-1.5 rounded-lg text-charcoal hover:bg-primary/5 hover:text-primary transition-colors cursor-pointer"
              title="Edit product details"
            >
              <Edit2 size={14} />
            </button>
            <button
              onClick={() => handleOpenDelete(row.id)}
              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              title="Delete product"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      />

      {/* Add / Edit Product Modal */}
      <Modal
        isOpen={isAddEditOpen}
        onClose={() => setIsAddEditOpen(false)}
        title={currentProduct ? `Edit Product: ${currentProduct.name}` : "Create New Product"}
        size="lg"
      >
        <form onSubmit={handleSubmitProduct} className="space-y-4">
          {formError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold px-4 py-3 rounded-lg flex items-center gap-2">
              <AlertTriangle size={16} /> {formError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left side form fields */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-primary mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Special Jaggery Sattu"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2 border border-primary/10 rounded-lg text-sm bg-background placeholder-charcoal-light focus:outline-none focus:ring-1 focus:ring-secondary/50 focus:border-secondary transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-primary mb-1">
                    Category *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => {
                      const catId = e.target.value;
                      setFormCategory(catId);
                      const catDoc = categories.find(c => String(c._id || c.id) === String(catId));
                      if (catDoc && (catDoc.name.toLowerCase().includes("gift") || catDoc.name.toLowerCase().includes("combo"))) {
                        setFormIsBundle(true);
                      } else {
                        setFormIsBundle(false);
                      }
                    }}
                    className="w-full px-3.5 py-2 border border-primary/10 rounded-lg text-sm bg-background focus:outline-none focus:ring-1 focus:ring-secondary/50 focus:border-secondary transition-all disabled:opacity-50"
                    disabled={categories.length === 0}
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c._id || c.id} value={c._id || c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  {loading && categories.length === 0 ? (
                    <span className="text-[10px] text-charcoal-light flex items-center gap-1.5 mt-1">
                      <Loader size={12} className="animate-spin" /> Loading categories...
                    </span>
                  ) : categories.length === 0 ? (
                    <p className="text-[10px] text-rose-600 font-bold mt-1">
                      No categories available. Please create a category first.
                    </p>
                  ) : null}
                </div>
                <div>
                  <label className="block text-xs font-bold text-primary mb-1">
                    Weight/Qty
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 500g"
                    value={formWeight}
                    onChange={(e) => setFormWeight(e.target.value)}
                    className="w-full px-3.5 py-2 border border-primary/10 rounded-lg text-sm bg-background placeholder-charcoal-light focus:outline-none focus:ring-1 focus:ring-secondary/50 focus:border-secondary transition-all"
                  />
                </div>
              </div>

              {/* Gift Box / Combo Bundle Product Items Selector */}
              {(formIsBundle || Boolean(categories.find(c => String(c._id || c.id) === String(formCategory))?.name.toLowerCase().includes("gift")) || Boolean(categories.find(c => String(c._id || c.id) === String(formCategory))?.name.toLowerCase().includes("combo"))) && (
                <div className="bg-amber-50/80 border border-amber-300 p-3.5 rounded-xl space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                      <span>🎁 Add Products to Gift Box</span>
                    </h4>
                    <span className="text-[10px] text-amber-800 font-bold">Select items & units inside hamper</span>
                  </div>

                  {/* Search Product Input */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-amber-700 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search product by name..."
                      value={bundleSearchQuery}
                      onChange={(e) => setBundleSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 border border-amber-300 rounded-lg text-xs bg-white text-primary placeholder-amber-700/60 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  {/* Product Dropdown + Unit Quantity Selector + Add Button Side-by-Side Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                    {/* Available Products Dropdown (6 cols) */}
                    <div className="sm:col-span-6">
                      <select
                        value={bundleSelectedProduct}
                        onChange={(e) => setBundleSelectedProduct(e.target.value)}
                        className="w-full px-3 py-2 border border-amber-300 rounded-lg text-xs bg-white text-primary font-medium focus:outline-none focus:ring-1 focus:ring-amber-500"
                      >
                        <option value="">-- Select Product --</option>
                        {products
                          .filter(p => !p.isBundle && (p.category?.name || "").toLowerCase() !== "gift")
                          .filter(p => !bundleSearchQuery.trim() || p.name.toLowerCase().includes(bundleSearchQuery.toLowerCase()) || (p.sku && p.sku.toLowerCase().includes(bundleSearchQuery.toLowerCase())))
                          .map(p => (
                            <option key={p.id || p._id} value={p.id || p._id}>
                              {p.name} ({p.weight || 'Std'}) — Stock: {p.stock}
                            </option>
                          ))}
                      </select>
                    </div>

                    {/* Unit Quantity Dropdown (3 cols) */}
                    <div className="sm:col-span-3">
                      <select
                        value={bundleSelectedQty}
                        onChange={(e) => setBundleSelectedQty(e.target.value)}
                        className="w-full px-2.5 py-2 border border-amber-300 rounded-lg text-xs bg-white text-primary font-bold focus:outline-none"
                      >
                        <option value="1">1 Unit</option>
                        <option value="2">2 Units</option>
                        <option value="3">3 Units</option>
                        <option value="4">4 Units</option>
                        <option value="5">5 Units</option>
                        <option value="10">10 Units</option>
                      </select>
                    </div>

                    {/* Add Button (3 cols) */}
                    <div className="sm:col-span-3">
                      <button
                        type="button"
                        onClick={handleAddBundleItem}
                        disabled={!bundleSelectedProduct}
                        className="w-full py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-slate-950 font-extrabold text-xs rounded-lg shadow-2xs transition-all cursor-pointer whitespace-nowrap"
                      >
                        + Add Item
                      </button>
                    </div>
                  </div>

                  {/* Added Bundle Items List */}
                  {formBundleItems.length > 0 ? (
                    <div className="space-y-1.5 border-t border-amber-200 pt-2">
                      <p className="text-[10px] font-extrabold text-amber-900 uppercase">
                        Added Gift Items ({formBundleItems.length}):
                      </p>
                      <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                        {formBundleItems.map((item, idx) => (
                          <div key={idx} className="bg-white border border-amber-200 p-2 rounded-lg flex items-center justify-between text-xs font-semibold">
                            <div>
                              <span className="font-bold text-primary">{item.productName}</span>
                              <span className="text-[10px] text-gray-500 font-mono ml-2">SKU: {item.sku}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded font-mono font-bold text-[11px]">
                                {item.quantity} {item.quantity === 1 ? 'unit' : 'units'}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveBundleItem(idx)}
                                className="text-rose-600 hover:text-rose-800 text-xs font-bold cursor-pointer"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-[10.5px] italic text-amber-700 text-center py-1">
                      No items added yet. Select a product and unit quantity above to add.
                    </p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-primary mb-1">
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 299"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="w-full px-3.5 py-2 border border-primary/10 rounded-lg text-sm bg-background placeholder-charcoal-light focus:outline-none focus:ring-1 focus:ring-secondary/50 focus:border-secondary transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-primary mb-1">
                    Initial Stock *
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 150"
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value)}
                    className="w-full px-3.5 py-2 border border-primary/10 rounded-lg text-sm bg-background placeholder-charcoal-light focus:outline-none focus:ring-1 focus:ring-secondary/50 focus:border-secondary transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-primary mb-1">
                  Portal Status *
                </label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value)}
                  className="w-full px-3.5 py-2 border border-primary/10 rounded-lg text-sm bg-background focus:outline-none focus:ring-1 focus:ring-secondary/50 focus:border-secondary transition-all"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-primary mb-1">
                    SKU Code
                  </label>
                  <input
                    type="text"
                    placeholder="Sku code"
                    value={formSkuCode}
                    onChange={(e) => setFormSkuCode(e.target.value)}
                    className="w-full px-3.5 py-2 border border-primary/10 rounded-lg text-sm bg-background placeholder-charcoal-light focus:outline-none focus:ring-1 focus:ring-secondary/50 focus:border-secondary transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-primary mb-1">
                    Brand
                  </label>
                  <input
                    type="text"
                    placeholder="Brand name"
                    value={formBrand}
                    onChange={(e) => setFormBrand(e.target.value)}
                    className="w-full px-3.5 py-2 border border-primary/10 rounded-lg text-sm bg-background placeholder-charcoal-light focus:outline-none focus:ring-1 focus:ring-secondary/50 focus:border-secondary transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-primary mb-1">
                    GST (%)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 18"
                    min="0"
                    max="100"
                    value={formGst}
                    onChange={(e) => setFormGst(e.target.value)}
                    className="w-full px-3.5 py-2 border border-primary/10 rounded-lg text-sm bg-background placeholder-charcoal-light focus:outline-none focus:ring-1 focus:ring-secondary/50 focus:border-secondary transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-primary mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    max="9999-12-31"
                    value={formExpiryDate}
                    onChange={(e) => setFormExpiryDate(e.target.value)}
                    className="w-full px-3.5 py-2 border border-primary/10 rounded-lg text-sm bg-background placeholder-charcoal-light focus:outline-none focus:ring-1 focus:ring-secondary/50 focus:border-secondary transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-primary mb-1">
                    HSN Code
                  </label>
                  <input
                    type="text"
                    placeholder="HSN Code"
                    value={formHsnCode}
                    onChange={(e) => setFormHsnCode(e.target.value)}
                    className="w-full px-3.5 py-2 border border-primary/10 rounded-lg text-sm bg-background placeholder-charcoal-light focus:outline-none focus:ring-1 focus:ring-secondary/50 focus:border-secondary transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-primary mb-1">
                    EAN Code
                  </label>
                  <input
                    type="text"
                    placeholder="EAN Code"
                    value={formEanCode}
                    onChange={(e) => setFormEanCode(e.target.value)}
                    className="w-full px-3.5 py-2 border border-primary/10 rounded-lg text-sm bg-background placeholder-charcoal-light focus:outline-none focus:ring-1 focus:ring-secondary/50 focus:border-secondary transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-primary mb-1">
                    Size
                  </label>
                  <input
                    type="text"
                    placeholder="Size"
                    value={formSize}
                    onChange={(e) => setFormSize(e.target.value)}
                    className="w-full px-3.5 py-2 border border-primary/10 rounded-lg text-sm bg-background placeholder-charcoal-light focus:outline-none focus:ring-1 focus:ring-secondary/50 focus:border-secondary transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-primary mb-1">
                    CESS Rate (%)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 5"
                    min="0"
                    max="100"
                    value={formCessRate}
                    onChange={(e) => setFormCessRate(e.target.value)}
                    className="w-full px-3.5 py-2 border border-primary/10 rounded-lg text-sm bg-background placeholder-charcoal-light focus:outline-none focus:ring-1 focus:ring-secondary/50 focus:border-secondary transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-primary mb-1">
                    Length (cm)
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={formLength}
                    onChange={(e) => setFormLength(e.target.value)}
                    className="w-full px-3.5 py-2 border border-primary/10 rounded-lg text-sm bg-background placeholder-charcoal-light focus:outline-none focus:ring-1 focus:ring-secondary/50 focus:border-secondary transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-primary mb-1">
                    Width (cm)
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={formWidth}
                    onChange={(e) => setFormWidth(e.target.value)}
                    className="w-full px-3.5 py-2 border border-primary/10 rounded-lg text-sm bg-background placeholder-charcoal-light focus:outline-none focus:ring-1 focus:ring-secondary/50 focus:border-secondary transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-primary mb-1">
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={formHeight}
                    onChange={(e) => setFormHeight(e.target.value)}
                    className="w-full px-3.5 py-2 border border-primary/10 rounded-lg text-sm bg-background placeholder-charcoal-light focus:outline-none focus:ring-1 focus:ring-secondary/50 focus:border-secondary transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-primary mb-1">
                  Shelf Life (Days)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 1080 Days, 180 Days"
                  value={formShelfLife}
                  onChange={(e) => setFormShelfLife(e.target.value)}
                  className="w-full px-3.5 py-2 border border-primary/10 rounded-lg text-sm bg-background placeholder-charcoal-light focus:outline-none focus:ring-1 focus:ring-secondary/50 focus:border-secondary transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-primary mb-1">
                  Ingredients (comma separated)
                </label>
                <textarea
                  rows={2}
                  placeholder="Pure Cow Milk, Organic Sugar, Cardamom"
                  value={formIngredients}
                  onChange={(e) => setFormIngredients(e.target.value)}
                  className="w-full px-3.5 py-2 border border-primary/10 rounded-lg text-sm bg-background placeholder-charcoal-light focus:outline-none focus:ring-1 focus:ring-secondary/50 focus:border-secondary transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-primary mb-1">
                  Key Benefits (comma separated)
                </label>
                <textarea
                  rows={2}
                  placeholder="Rich in nutrition, Traditional preparation, No preservatives"
                  value={formBenefits}
                  onChange={(e) => setFormBenefits(e.target.value)}
                  className="w-full px-3.5 py-2 border border-primary/10 rounded-lg text-sm bg-background placeholder-charcoal-light focus:outline-none focus:ring-1 focus:ring-secondary/50 focus:border-secondary transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-primary mb-1">
                  Storage Instructions
                </label>
                <textarea
                  rows={2}
                  placeholder="Enter storage instructions..."
                  value={formStorageInstructions}
                  onChange={(e) => setFormStorageInstructions(e.target.value)}
                  className="w-full px-3.5 py-2 border border-primary/10 rounded-lg text-sm bg-background placeholder-charcoal-light focus:outline-none focus:ring-1 focus:ring-secondary/50 focus:border-secondary transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-primary mb-1">
                  Nutrition Facts
                </label>
                <textarea
                  rows={2}
                  placeholder="Enter nutrition facts..."
                  value={formNutritionFacts}
                  onChange={(e) => setFormNutritionFacts(e.target.value)}
                  className="w-full px-3.5 py-2 border border-primary/10 rounded-lg text-sm bg-background placeholder-charcoal-light focus:outline-none focus:ring-1 focus:ring-secondary/50 focus:border-secondary transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-primary mb-1">
                  Shipping & Delivery Info
                </label>
                <textarea
                  rows={2}
                  placeholder="Enter shipping & delivery info..."
                  value={formShippingInfo}
                  onChange={(e) => setFormShippingInfo(e.target.value)}
                  className="w-full px-3.5 py-2 border border-primary/10 rounded-lg text-sm bg-background placeholder-charcoal-light focus:outline-none focus:ring-1 focus:ring-secondary/50 focus:border-secondary transition-all resize-none"
                />
              </div>
            </div>

            {/* Right side form fields */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-primary mb-1">
                  Product Images (Up to 5) * <span className="font-normal text-charcoal-light">(max {MAX_IMAGE_SIZE_KB}KB per image)</span>
                </label>
                <div className="grid grid-cols-5 gap-2 mb-2">
                  {formImages.map((img, idx) => (
                    <div
                      key={idx}
                      onClick={() => setActiveImageSlot(idx)}
                      className={`relative aspect-square border rounded-lg cursor-pointer flex items-center justify-center overflow-hidden transition-all duration-200 ${activeImageSlot === idx
                        ? "border-secondary ring-1 ring-secondary/50 shadow-sm"
                        : "border-primary/10 hover:border-primary/20"
                        }`}
                    >
                      {img ? (
                        <img
                          src={getAdminImageUrl(img)}
                          alt={`Slot ${idx + 1}`}
                          onError={handleAdminImageError}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-[10px] font-bold text-charcoal-light/75">#{idx + 1}</span>
                      )}
                      {/* Size badge — only shown for local base64 uploads */}
                      {img && img.startsWith("data:") && (() => {
                        const b64 = img.split(",")[1] || img;
                        const kb = Math.round((b64.length * 3) / 4 / 1024);
                        const isOver = kb > MAX_IMAGE_SIZE_KB;
                        return (
                          <span
                            className={`absolute bottom-0.5 left-0.5 text-[8px] font-black px-1 py-0.5 rounded leading-none ${
                              isOver
                                ? "bg-rose-600 text-white"
                                : "bg-black/50 text-white"
                            }`}
                            title={isOver ? `Too large! Max ${MAX_IMAGE_SIZE_KB}KB` : `${kb}KB`}
                          >
                            {kb >= 1024 ? `${(kb / 1024).toFixed(1)}M` : `${kb}K`}
                          </span>
                        );
                      })()}
                      {img && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Compact images array so remaining images shift left
                            const remImgs = formImages.filter((_, i) => i !== idx);
                            const remNames = formImageNames.filter((_, i) => i !== idx);
                            while (remImgs.length < 5) remImgs.push("");
                            while (remNames.length < 5) remNames.push("");

                            setFormImages(remImgs);
                            setFormImageNames(remNames);
                            setFormImage(remImgs[0] || "");
                            setActiveImageSlot(0);
                          }}
                          className="absolute top-0.5 right-0.5 bg-rose-600 text-white rounded-full p-0.5 hover:bg-rose-700 transition-colors shadow-xs"
                          title="Remove image"
                        >
                          <Trash2 size={8} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full px-3 py-1 border border-primary/10 rounded-lg text-xs bg-background focus:outline-none file:mr-3 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-[10px] file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                  />
                  <div className="flex items-center gap-1.5 text-[10px] text-charcoal-light font-semibold">
                    <span>Or paste URL for Slot #{activeImageSlot + 1}:</span>
                    <input
                      type="text"
                      placeholder="Paste image web link"
                      value={formImages[activeImageSlot] && !formImages[activeImageSlot].startsWith("data:") ? formImages[activeImageSlot] : ""}
                      onChange={(e) => {
                        const updated = [...formImages];
                        updated[activeImageSlot] = e.target.value;
                        setFormImages(updated);
                        if (activeImageSlot === 0) {
                          setFormImage(e.target.value);
                        }
                      }}
                      className="flex-1 px-2 py-0.5 border border-primary/10 rounded-md text-[10px] bg-background placeholder-charcoal-light focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Image Preview Window */}
              <div className="h-28 border border-dashed border-primary/15 bg-background rounded-lg flex items-center justify-center overflow-hidden">
                {formImages[activeImageSlot] ? (
                  <img
                    src={getAdminImageUrl(formImages[activeImageSlot])}
                    alt={`Slot ${activeImageSlot + 1} Preview`}
                    onError={handleAdminImageError}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-2 text-charcoal-light">
                    <span className="text-[10px] block font-semibold uppercase">Slot #{activeImageSlot + 1} Empty</span>
                    <span className="text-[9px] block">Upload file or paste URL above</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-primary mb-1">
                  Product Video (optional, max {MAX_VIDEO_SECONDS}s)
                </label>
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleVideoFileChange}
                    className="w-full px-3 py-1 border border-primary/10 rounded-lg text-xs bg-background focus:outline-none file:mr-3 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-[10px] file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                  />
                  <div className="flex items-center gap-1.5 text-[10px] text-charcoal-light font-semibold">
                    <span>Or paste video URL:</span>
                    <input
                      type="text"
                      placeholder="Paste video web link"
                      value={formVideo && !formVideo.startsWith("data:") ? formVideo : ""}
                      onChange={(e) => handleVideoUrlChange(e.target.value)}
                      className="flex-1 px-2 py-0.5 border border-primary/10 rounded-md text-[10px] bg-background placeholder-charcoal-light focus:outline-none"
                    />
                  </div>
                </div>

                {formVideo ? (
                  <div className="relative mt-2 h-28 border border-dashed border-primary/15 bg-background rounded-lg overflow-hidden">
                    <video src={formVideo} controls className="w-full h-full object-contain bg-black" />
                    <button
                      type="button"
                      onClick={() => setFormVideo("")}
                      className="absolute top-1 right-1 bg-rose-600 text-white rounded-full p-1 hover:bg-rose-700 transition-colors shadow-xs"
                      title="Remove video"
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                ) : (
                  <div className="mt-2 h-16 border border-dashed border-primary/15 bg-background rounded-lg flex items-center justify-center text-center p-2 text-charcoal-light">
                    <span className="text-[10px] font-semibold uppercase">No video uploaded</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-primary mb-1">
                  Short Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Describe snack weight, primary flavor note, or visual aspect briefly."
                  value={formShortDescription}
                  onChange={(e) => setFormShortDescription(e.target.value)}
                  className="w-full px-3.5 py-2 border border-primary/10 rounded-lg text-sm bg-background placeholder-charcoal-light focus:outline-none focus:ring-1 focus:ring-secondary/50 focus:border-secondary transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-primary mb-1">
                  Full Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Provide deep product details, culinary history, serving recommendations, etc."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3.5 py-2 border border-primary/10 rounded-lg text-sm bg-background placeholder-charcoal-light focus:outline-none focus:ring-1 focus:ring-secondary/50 focus:border-secondary transition-all resize-none"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-primary/5 pt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsAddEditOpen(false)}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold text-charcoal-light hover:bg-primary/5 hover:text-primary rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-display font-bold text-secondary bg-primary hover:bg-primary-light rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader size={14} className="animate-spin" /> Saving...
                </>
              ) : currentProduct ? (
                "Save Changes"
              ) : (
                "Publish Product"
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Delete Confirmation"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-rose-700 bg-rose-50 border border-rose-200 p-4 rounded-xl">
            <AlertTriangle size={24} className="flex-shrink-0" />
            <div>
              <h4 className="text-sm font-bold">Are you absolutely sure?</h4>
              <p className="text-xs font-medium text-rose-600/90 mt-0.5">
                This action is permanent. Deleting this product will remove it from the store catalog immediately.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsDeleteOpen(false)}
              className="px-4 py-2 text-xs font-bold text-charcoal-light hover:bg-primary/5 hover:text-primary rounded-lg transition-colors cursor-pointer"
            >
              No, Keep It
            </button>
            <button
              type="button"
              onClick={handleDeleteConfirm}
              className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              Yes, Delete Product
            </button>
          </div>
        </div>
      </Modal>
      {/* Import Products Modal */}
      <Modal
        isOpen={isImportOpen}
        onClose={() => {
          setIsImportOpen(false);
          setImportRows([]);
        }}
        title="Bulk Import Products via Excel"
        size="lg"
      >
        <div className="space-y-4">
          <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold text-primary flex items-center gap-1.5">
                <FileSpreadsheet size={16} className="text-secondary" /> Download Excel Sample Template
              </h4>
              <p className="text-[11px] text-charcoal-light font-medium mt-0.5">
                Use our pre-formatted Excel template with headers: EAN Code, Product Name, Category Name, Dimensions (L/W/H), Weight, Brand, MRP, HSN Code, Shelf Life (Days), Stock.
              </p>
            </div>
            <button
              onClick={handleDownloadSampleTemplate}
              className="px-3.5 py-2 bg-secondary text-primary rounded-lg text-xs font-bold shadow-xs hover:bg-secondary-light transition-colors shrink-0 cursor-pointer"
            >
              Download Template
            </button>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-primary">
              Upload Products Excel File (.xlsx / .csv)
            </label>
            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileUpload}
              className="w-full px-3.5 py-2 border border-primary/15 rounded-lg text-xs bg-background file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-primary file:text-secondary hover:file:bg-primary-light cursor-pointer"
            />
          </div>

          {importRows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-700">
                  ✓ Parsed {importRows.length} product(s) ready to import:
                </span>
                <button
                  onClick={() => setImportRows([])}
                  className="text-[10px] font-bold text-rose-600 hover:underline cursor-pointer"
                >
                  Clear Selection
                </button>
              </div>

              <div className="max-h-48 overflow-y-auto border border-primary/10 rounded-lg bg-white divide-y divide-primary/5">
                {importRows.map((r, idx) => (
                  <div key={idx} className="p-2.5 text-xs flex items-center justify-between gap-2">
                    <div>
                      <span className="font-bold text-primary block">{idx + 1}. {r.name || "Untitled Product"}</span>
                      <span className="text-[10px] text-charcoal-light block">
                        EAN: {r.eanCode || "—"} | Category: {r.category || "General"} | Brand: {r.brand || "—"} | MRP: ₹{r.mrp} | Shelf Life: {r.shelfLife || "—"}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold bg-primary/5 px-2 py-0.5 rounded text-charcoal shrink-0">
                      Stock: {r.stock}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="border-t border-primary/5 pt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setIsImportOpen(false);
                setImportRows([]);
              }}
              className="px-4 py-2 text-xs font-bold text-charcoal-light hover:bg-primary/5 hover:text-primary rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={importRows.length === 0 || isImporting}
              onClick={handleConfirmImport}
              className="px-4.5 py-2 text-xs font-display font-bold text-secondary bg-primary hover:bg-primary-light rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              {isImporting ? "Importing..." : `Import ${importRows.length} Product(s)`}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};
export default Products;
