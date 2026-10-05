import React, { useState, useMemo } from "react";
import { Edit2, Download, Package, AlertTriangle, CheckCircle, Boxes, ShieldAlert, Search } from "lucide-react";
import { useData } from "../context/DataContext";
import { DataTable } from "../components/DataTable";
import { Modal } from "../components/Modal";
import { getAdminImageUrl, handleAdminImageError } from "../config";
import * as XLSX from "xlsx";

export const Inventory = () => {
  const { products, categories, orders, updateProduct, showToast } = useData();

  // Modal State for Editing Inventory
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editStock, setEditStock] = useState("");
  const [editBadInventory, setEditBadInventory] = useState("");
  const [editFacility, setEditFacility] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const formatINR = (value) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(value || 0);
  };

  // Calculate blocked stock for each product based on active/pending orders
  const blockedStockMap = useMemo(() => {
    const map = {};
    if (!orders || !Array.isArray(orders)) return map;

    // Initialize zero for all current products
    products.forEach((p) => {
      const pId = String(p._id || p.id);
      map[pId] = 0;
    });

    orders.forEach((order) => {
      // Consider orders that are Pending, Processing, or On Hold as "Blocked in Orders"
      if (order.orderStatus === "Pending" || order.orderStatus === "Processing" || order.orderStatus === "On Hold") {
        (order.items || []).forEach((item) => {
          const rawId = item.productId?._id || item.productId?.id || item.productId;
          if (rawId) {
            const pId = String(rawId);
            const qty = Number(item.quantity || 0);
            map[pId] = (map[pId] || 0) + qty;
          }
        });
      }
    });

    return map;
  }, [orders, products]);

  // Transform products with inventory stats
  const inventoryData = useMemo(() => {
    return products.map((p) => {
      const pId = String(p._id || p.id);
      const goodStock = Number(p.stock || 0);
      const blocked = Number(blockedStockMap[pId] !== undefined ? blockedStockMap[pId] : 0);
      const bad = Number(p.badInventory || 0);
      const totalStock = goodStock;
      const available = Math.max(0, totalStock - blocked - bad);
      const categoryName = p.category?.name || (typeof p.category === "string" ? p.category : "Uncategorized");
      const categoryId = p.category?._id || p.category?.id || (typeof p.category === "string" ? p.category : "");

      return {
        ...p,
        id: p._id || p.id,
        totalStock,
        blocked,
        bad,
        available,
        categoryName,
        categoryId,
        facility: p.facility || "Main Warehouse",
        sizeDisplay: p.size || p.weight || "—",
        brandDisplay: p.brand || "—"
      };
    });
  }, [products, blockedStockMap]);

  // Overall Inventory Stats
  const stats = useMemo(() => {
    let totalItems = inventoryData.length;
    let totalStockCount = 0;
    let totalBlockedCount = 0;
    let totalBadCount = 0;
    let totalAvailableCount = 0;
    let lowStockCount = 0;

    inventoryData.forEach((item) => {
      totalStockCount += item.totalStock;
      totalBlockedCount += item.blocked;
      totalBadCount += item.bad;
      totalAvailableCount += item.available;
      if (item.available <= 5) lowStockCount++;
    });

    return {
      totalItems,
      totalStockCount,
      totalBlockedCount,
      totalBadCount,
      totalAvailableCount,
      lowStockCount
    };
  }, [inventoryData]);

  // Open Edit Modal
  const handleOpenEdit = (product) => {
    setSelectedProduct(product);
    setEditStock(String(product.totalStock));
    setEditBadInventory(String(product.bad));
    setEditFacility(product.facility || "Main Warehouse");
    setIsEditOpen(true);
  };

  // Save Inventory Changes
  const handleSaveInventory = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;

    const parsedStock = parseInt(editStock);
    const parsedBad = parseInt(editBadInventory);

    if (isNaN(parsedStock) || parsedStock < 0) {
      showToast("Please enter a valid stock number.");
      return;
    }
    if (isNaN(parsedBad) || parsedBad < 0) {
      showToast("Please enter a valid bad inventory count.");
      return;
    }

    setIsSaving(true);
    try {
      await updateProduct(selectedProduct.id, {
        stock: parsedStock,
        badInventory: parsedBad,
        facility: editFacility.trim() || "Main Warehouse"
      });
      setIsEditOpen(false);
      showToast("Inventory updated successfully!");
    } catch (err) {
      console.error("Failed to update inventory:", err);
      showToast("Failed to update inventory.");
    } finally {
      setIsSaving(false);
    }
  };

  // Export Inventory as Excel
  const handleExportExcel = () => {
    if (inventoryData.length === 0) {
      showToast("No inventory data to export.");
      return;
    }

    const exportRows = inventoryData.map((item, index) => ({
      "S.No": index + 1,
      "Item SKU Code": item.sku || "N/A",
      "Product Name": item.name || "N/A",
      "Item Type (Category)": item.categoryName,
      "Facility": item.facility,
      "Brand": item.brandDisplay,
      "Size / Weight": item.sizeDisplay,
      "MRP (₹)": item.price || 0,
      "Total Inventory": item.totalStock,
      "Inventory Blocked": item.blocked,
      "Available Inventory": item.available,
      "Bad Inventory (Damaged)": item.bad,
      "Status": item.status || "Active"
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);

    // Auto-fit column widths
    const colWidths = Object.keys(exportRows[0] || {}).map((key) => {
      const maxLen = Math.max(
        key.length,
        ...exportRows.map((r) => String(r[key] ?? "").length)
      );
      return { wch: Math.min(maxLen + 3, 35) };
    });
    worksheet["!cols"] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory Stock");

    const today = new Date().toISOString().slice(0, 10);
    const fileName = `Inventory_Report_${today}.xlsx`;

    const wbOut = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbOut], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast("Inventory report downloaded successfully!");
  };

  // Setup options for categories filtering in table
  const filterOptions = categories.map((cat) => ({
    value: cat._id || cat.id,
    label: cat.name
  }));

  // Define data table columns
  const columns = [
    {
      key: "image",
      header: "Product",
      render: (row) => (
        <div className="flex items-center gap-3">
          <img
            src={getAdminImageUrl(row.image)}
            alt={row.name}
            onError={handleAdminImageError}
            className="w-10 h-10 object-cover rounded-lg border border-primary/5 shadow-xs shrink-0"
          />
          <div>
            <span className="font-display font-semibold text-xs text-primary block line-clamp-1">
              {row.name}
            </span>
            <span className="text-[10px] text-charcoal-light font-bold">
              SKU: {row.sku}
            </span>
          </div>
        </div>
      )
    },
    {
      key: "facility",
      header: "Facility",
      render: (row) => (
        <span className="text-xs font-semibold text-charcoal bg-primary/5 px-2 py-1 rounded-md border border-primary/10 inline-block">
          {row.facility}
        </span>
      )
    },
    {
      key: "categoryName",
      header: "Item Type",
      render: (row) => (
        <span className="text-xs font-medium text-charcoal-light">
          {row.categoryName}
        </span>
      )
    },
    {
      key: "sizeDisplay",
      header: "Size / Wt",
      render: (row) => (
        <span className="text-xs font-bold text-charcoal">
          {row.sizeDisplay}
        </span>
      )
    },
    {
      key: "brandDisplay",
      header: "Brand",
      render: (row) => (
        <span className="text-xs font-semibold text-primary/80">
          {row.brandDisplay}
        </span>
      )
    },
    {
      key: "price",
      header: "MRP",
      render: (row) => (
        <span className="text-xs font-bold text-primary">
          {formatINR(row.price)}
        </span>
      )
    },
    {
      key: "totalStock",
      header: "Total Stock",
      render: (row) => (
        <span className="text-xs font-bold text-charcoal">
          {row.totalStock} units
        </span>
      )
    },
    {
      key: "blocked",
      header: "Blocked",
      render: (row) => (
        <span className={`px-2 py-0.5 text-xs font-bold rounded-md border ${
          row.blocked > 0 ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-charcoal/5 text-charcoal-light border-charcoal/10"
        }`}>
          {row.blocked} units
        </span>
      )
    },
    {
      key: "available",
      header: "Available",
      render: (row) => {
        let badgeStyle = "bg-emerald-50 text-emerald-700 border-emerald-200";
        if (row.available <= 0) {
          badgeStyle = "bg-rose-50 text-rose-700 border-rose-200";
        } else if (row.available <= 5) {
          badgeStyle = "bg-amber-50 text-amber-700 border-amber-200";
        }
        return (
          <div className="flex flex-col gap-0.5">
            <span className={`px-2 py-0.5 text-xs font-bold rounded-md border ${badgeStyle}`}>
              {row.available} units
            </span>
            {row.available <= 0 ? (
              <span className="text-[9px] text-rose-600 font-bold flex items-center gap-0.5">
                <AlertTriangle size={10} /> Out of Stock
              </span>
            ) : row.available <= 5 ? (
              <span className="text-[9px] text-amber-600 font-bold flex items-center gap-0.5">
                <AlertTriangle size={10} /> Low Stock Warning
              </span>
            ) : null}
          </div>
        );
      }
    },
    {
      key: "bad",
      header: "Bad Inventory",
      render: (row) => (
        <span className={`px-2 py-0.5 text-xs font-bold rounded-md border ${
          row.bad > 0 ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-charcoal/5 text-charcoal-light border-charcoal/10"
        }`}>
          {row.bad} units
        </span>
      )
    }
  ];

  return (
    <>
      <div className="space-y-6">
        {/* Header Title & Export Button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display font-bold text-2xl text-primary leading-tight flex items-center gap-2">
              <Boxes size={26} className="text-secondary" /> Inventory Management
            </h1>
            <p className="text-sm text-charcoal-light font-medium mt-0.5">
              Track warehouse stock, blocked reserved items, available inventory, and bad stock adjustments.
            </p>
          </div>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-4.5 py-2.5 bg-primary text-secondary rounded-lg font-display font-bold text-sm shadow-md hover:bg-primary-light transition-all duration-200 cursor-pointer self-start sm:self-center"
          >
            <Download size={16} /> Export Inventory (Excel)
          </button>
        </div>

        {/* Summary KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          <div className="bg-white border border-primary/10 rounded-xl p-3.5 shadow-xs">
            <span className="text-[10px] font-bold text-charcoal-light uppercase tracking-wider block">Total SKUs</span>
            <span className="text-xl font-display font-bold text-primary mt-1 block">{stats.totalItems}</span>
          </div>

          <div className="bg-white border border-primary/10 rounded-xl p-3.5 shadow-xs">
            <span className="text-[10px] font-bold text-charcoal-light uppercase tracking-wider block">Total Physical Stock</span>
            <span className="text-xl font-display font-bold text-charcoal mt-1 block">{stats.totalStockCount} units</span>
          </div>

          <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-3.5 shadow-xs">
            <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">Blocked in Orders</span>
            <span className="text-xl font-display font-bold text-amber-900 mt-1 block">{stats.totalBlockedCount} units</span>
          </div>

          <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-3.5 shadow-xs">
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Available to Sell</span>
            <span className="text-xl font-display font-bold text-emerald-900 mt-1 block">{stats.totalAvailableCount} units</span>
          </div>

          <div className="bg-rose-50/60 border border-rose-200/80 rounded-xl p-3.5 shadow-xs col-span-2 sm:col-span-1">
            <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider block">Bad / Damaged Stock</span>
            <span className="text-xl font-display font-bold text-rose-900 mt-1 block">{stats.totalBadCount} units</span>
          </div>
        </div>

        {/* Inventory Data Table */}
        <DataTable
          columns={columns}
          data={inventoryData}
          searchKey="name"
          searchPlaceholder="Search product by name or SKU..."
          filterKey="categoryId"
          filterPlaceholder="All Categories"
          filterOptions={filterOptions}
          itemsPerPage={50}
          actionsHeader="Actions"
          renderActions={(row) => (
            <button
              onClick={() => handleOpenEdit(row)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/10 text-xs font-bold text-primary hover:bg-primary/5 hover:border-primary transition-all cursor-pointer"
              title="Edit inventory parameters"
            >
              <Edit2 size={12} /> Edit Stock
            </button>
          )}
        />
      </div>

      {/* Edit Inventory Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title={`Modify Inventory: ${selectedProduct?.name}`}
        size="md"
      >
        {selectedProduct && (
          <form onSubmit={handleSaveInventory} className="space-y-4">
            <div className="bg-background/80 border border-primary/10 rounded-lg p-3 text-xs space-y-1">
              <div className="flex justify-between text-charcoal-light font-medium">
                <span>SKU Code:</span>
                <span className="font-bold text-primary">{selectedProduct.sku}</span>
              </div>
              <div className="flex justify-between text-charcoal-light font-medium">
                <span>Currently Blocked (Active Orders):</span>
                <span className="font-bold text-amber-700">{selectedProduct.blocked} units</span>
              </div>
              <div className="flex justify-between text-charcoal-light font-medium">
                <span>Computed Available Stock:</span>
                <span className="font-bold text-emerald-700">
                  {Math.max(0, (parseInt(editStock) || 0) - selectedProduct.blocked - (parseInt(editBadInventory) || 0))} units
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-primary mb-1">
                  Warehouse / Facility Name *
                </label>
                <input
                  type="text"
                  value={editFacility}
                  onChange={(e) => setEditFacility(e.target.value)}
                  placeholder="e.g. Main Warehouse, Patna Hub"
                  className="w-full px-3.5 py-2 border border-primary/10 rounded-lg text-sm bg-background placeholder-charcoal-light focus:outline-none focus:ring-1 focus:ring-secondary/50 focus:border-secondary transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-primary mb-1">
                    Total Physical Stock *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editStock}
                    onChange={(e) => setEditStock(e.target.value)}
                    className="w-full px-3.5 py-2 border border-primary/10 rounded-lg text-sm bg-background focus:outline-none focus:ring-1 focus:ring-secondary/50 focus:border-secondary transition-all"
                    required
                  />
                  <span className="text-[10px] text-charcoal-light block mt-0.5">
                    Includes blocked + available units.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-primary mb-1">
                    Bad / Damaged Inventory
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editBadInventory}
                    onChange={(e) => setEditBadInventory(e.target.value)}
                    className="w-full px-3.5 py-2 border border-primary/10 rounded-lg text-sm bg-background focus:outline-none focus:ring-1 focus:ring-secondary/50 focus:border-secondary transition-all"
                  />
                  <span className="text-[10px] text-charcoal-light block mt-0.5">
                    Stock un-sellable due to damage.
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t border-primary/5 pt-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
                className="px-4 py-2 text-xs font-bold text-charcoal-light hover:bg-primary/5 hover:text-primary rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 text-xs font-display font-bold text-secondary bg-primary hover:bg-primary-light rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save Stock Changes"}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
};

export default Inventory;
