import React, { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  Info,
  Download,
  ArrowUpDown,
  Filter,
  Check,
} from "lucide-react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

const ReconciliationPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { type, data } = location.state || {};

  const [reconciliationSheets, setReconciliationSheets] = useState([]);
  const [metaData, setMetaData] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [selectedGroup, setSelectedGroup] = useState("all");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  const [selectedSheetNames, setSelectedSheetNames] = useState(new Set());
  const [showSheetFilter, setShowSheetFilter] = useState(false);

  const [sheetFilterSearch, setSheetFilterSearch] = useState("");

  useEffect(() => {
    if (!data) {
      navigate("/dashboard");
      return;
    }

    if (type === "fresh") {
      // Fresh reconciliation - initialize with empty reconciliation values
      const initialSheets = data.sheets.map((sheet) => ({
        ...sheet,
        reconOpeningStock: "",
        reconClosingStock: "",
        openingDifference: 0,
        closingDifference: 0,
      }));
      setReconciliationSheets(initialSheets);
      console.log("metaData from new reconcile page...! ", data.metaData);
      setMetaData(data.metaData);
    } else if (type === "continue") {
      // Continue - load from localStorage
      const savedReconciliation = JSON.parse(
        localStorage.getItem("reconciliationProgress")
      );
      setReconciliationSheets(savedReconciliation || data.sheets);
    }
  }, [data, type, navigate]);

  const uniqueGroups = useMemo(() => {
    if (!metaData) return [];
    const groups = [...new Set(metaData.map((meta) => meta.groupName))];
    return groups.sort();
  }, [metaData]);

  // Assign colors to groups
  const groupColors = useMemo(() => {
    const colors = [
      "bg-green-100 border-green-500",
      "bg-yellow-100 border-yellow-500",
      "bg-blue-100 border-blue-500",
      "bg-purple-100 border-purple-500",
      "bg-pink-100 border-pink-500",
      "bg-indigo-100 border-indigo-500",
      "bg-orange-100 border-orange-500",
      "bg-teal-100 border-teal-500",
    ];
    const colorMap = {};
    uniqueGroups.forEach((group, index) => {
      colorMap[group] = colors[index % colors.length];
    });
    return colorMap;
  }, [uniqueGroups]);

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Auto-save to localStorage on every change
  useEffect(() => {
    if (reconciliationSheets.length > 0) {
      localStorage.setItem(
        "reconciliationProgress",
        JSON.stringify(reconciliationSheets)
      );
      localStorage.setItem("reconciliationData", JSON.stringify(data));
    }
  }, [reconciliationSheets, data]);

  const allSheetNames = useMemo(() => {
    return [
      ...new Set(reconciliationSheets.map((sheet) => sheet.sheetName)),
    ].sort();
  }, [reconciliationSheets]);

  // Initialize with all selected
  useEffect(() => {
    if (allSheetNames.length > 0 && selectedSheetNames.size === 0) {
      setSelectedSheetNames(new Set(allSheetNames));
    }
  }, [allSheetNames]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showSheetFilter && !e.target.closest(".relative")) {
        setShowSheetFilter(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showSheetFilter]);

  const handleInputChange = (sheetName, field, value) => {
    const updatedSheets = reconciliationSheets.map((sheet) => {
      if (sheet.sheetName === sheetName) {
        const numValue = parseFloat(value) || 0;
        const updated = { ...sheet, [field]: value };

        if (field === "reconOpeningStock") {
          updated.openingDifference = numValue - (sheet.openingStockTotal || 0);
        } else if (field === "reconClosingStock") {
          updated.closingDifference = numValue - (sheet.closingStockTotal || 0);
        }

        return updated;
      }
      return sheet;
    });

    setReconciliationSheets(updatedSheets);
  };

  const handleClearReconciliation = () => {
    if (
      window.confirm(
        "Are you sure you want to clear all reconciliation data? This action cannot be undone."
      )
    ) {
      localStorage.removeItem("reconciliationProgress");
      localStorage.removeItem("reconciliationData");
      navigate(-1);
    }
  };

  const filteredSheets = reconciliationSheets.filter((sheet) => {
    const matchesSearch = sheet.sheetName
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesSheetFilter = selectedSheetNames.has(sheet.sheetName);

    if (selectedGroup === "all") return matchesSearch && matchesSheetFilter;

    const sheetMeta = metaData?.find(
      (meta) => meta.sheetName === sheet.sheetName
    );
    const matchesGroup = sheetMeta?.groupName === selectedGroup;

    return matchesSearch && matchesGroup && matchesSheetFilter;
  });

  const sortedSheets = useMemo(() => {
    let sorted = [...filteredSheets];

    // First, sort by group
    sorted.sort((a, b) => {
      const aGroup =
        metaData?.find((m) => m.sheetName === a.sheetName)?.groupName ||
        "Ungrouped";
      const bGroup =
        metaData?.find((m) => m.sheetName === b.sheetName)?.groupName ||
        "Ungrouped";

      // Compare groups first
      if (aGroup !== bGroup) {
        return aGroup.localeCompare(bGroup);
      }

      // If same group, apply the sort config
      if (sortConfig.key) {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];

        // Handle string comparison for sheet names
        if (sortConfig.key === "sheetName") {
          aVal = aVal?.toLowerCase() || "";
          bVal = bVal?.toLowerCase() || "";
        }

        // Handle numeric comparison
        if (typeof aVal === "number" || typeof bVal === "number") {
          aVal = aVal || 0;
          bVal = bVal || 0;
        }

        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      }

      return 0;
    });

    return sorted;
  }, [filteredSheets, sortConfig, metaData]);

  const totalPages = Math.ceil(sortedSheets.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedSheets = sortedSheets.slice(
    startIndex,
    startIndex + rowsPerPage
  );

  const totals = useMemo(() => {
    return sortedSheets.reduce(
      (acc, sheet) => {
        acc.openingStock += sheet.openingStockTotal || 0;
        acc.reconOpening += parseFloat(sheet.reconOpeningStock) || 0;
        acc.openingDiff += sheet.openingDifference || 0;
        acc.closingStock += sheet.closingStockTotal || 0;
        acc.reconClosing += parseFloat(sheet.reconClosingStock) || 0;
        acc.closingDiff += sheet.closingDifference || 0;
        return acc;
      },
      {
        openingStock: 0,
        reconOpening: 0,
        openingDiff: 0,
        closingStock: 0,
        reconClosing: 0,
        closingDiff: 0,
      }
    );
  }, [sortedSheets]);

  const handleSaveAndExit = () => {
    localStorage.setItem(
      "reconciliationProgress",
      JSON.stringify(reconciliationSheets)
    );
    navigate(-1);
  };

  const handleExportToExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Reconciliation");

      // Add headers
      const headers = [
        "Sheet Name",
        "Opening Stock",
        "Recon Opening",
        "Opening Difference",
        "Closing Stock",
        "Recon Closing",
        "Closing Difference",
        "Has Stock Columns",
        "Opening Count",
        "Closing Count",
        "Opening Column",
        "Closing Column",
      ];

      worksheet.addRow(headers);

      // Style header row
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
      headerRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF4472C4" },
      };
      headerRow.alignment = { horizontal: "center", vertical: "middle" };

      // Add data rows
      reconciliationSheets.forEach((sheet) => {
        const row = worksheet.addRow([
          sheet.sheetName,
          sheet.openingStockTotal || 0,
          sheet.reconOpeningStock || 0,
          sheet.openingDifference || 0,
          sheet.closingStockTotal || 0,
          sheet.reconClosingStock || 0,
          sheet.closingDifference || 0,
          sheet.hasStockColumns ? "Yes" : "No",
          sheet.openingCount,
          sheet.closingCount,
          sheet.openingColumnName,
          sheet.closingColumnName,
        ]);

        // Color formatting for difference columns
        const openingDiffCell = row.getCell(4);
        const closingDiffCell = row.getCell(7);

        if (sheet.openingDifference !== 0) {
          openingDiffCell.font = {
            bold: true,
            color: {
              argb: sheet.openingDifference >= 0 ? "FF008000" : "FFFF0000",
            },
          };
        }

        if (sheet.closingDifference !== 0) {
          closingDiffCell.font = {
            bold: true,
            color: {
              argb: sheet.closingDifference >= 0 ? "FF008000" : "FFFF0000",
            },
          };
        }
      });

      // Set column widths
      worksheet.columns = [
        { width: 40 }, // Sheet Name
        { width: 15 }, // Opening Stock
        { width: 15 }, // Recon Opening
        { width: 18 }, // Opening Difference
        { width: 15 }, // Closing Stock
        { width: 15 }, // Recon Closing
        { width: 18 }, // Closing Difference
        { width: 18 }, // Has Stock Columns
        { width: 15 }, // Opening Count
        { width: 15 }, // Closing Count
        { width: 22 }, // Opening Column
        { width: 22 }, // Closing Column
      ];

      // Hide columns 8-12 (Has Stock Columns to Closing Column)
      worksheet.getColumn(8).hidden = true;
      worksheet.getColumn(9).hidden = true;
      worksheet.getColumn(10).hidden = true;
      worksheet.getColumn(11).hidden = true;
      worksheet.getColumn(12).hidden = true;

      // Generate filename
      const currentDate = new Date().toISOString().split("T")[0];
      const filename = `reconcile_${currentDate}.xlsx`;

      // Save file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      saveAs(blob, filename);
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Export failed. Please try again.");
    }
  };

  const handleSelectAllSheets = () => {
    if (selectedSheetNames.size === allSheetNames.length) {
      setSelectedSheetNames(new Set());
    } else {
      setSelectedSheetNames(new Set(allSheetNames));
    }
  };

  const handleToggleSheet = (sheetName) => {
    const newSelected = new Set(selectedSheetNames);
    if (newSelected.has(sheetName)) {
      newSelected.delete(sheetName);
    } else {
      newSelected.add(sheetName);
    }
    setSelectedSheetNames(newSelected);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-md"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-gray-800">
                {type === "fresh"
                  ? "Stock Reconciliation"
                  : "Continue Reconciliation"}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Date Range:{" "}
                {new Date(data?.dateRange?.start).toLocaleDateString()} -{" "}
                {new Date(data?.dateRange?.end).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportToExcel}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
            >
              <Download size={18} />
              Export to Excel
            </button>
            <button
              onClick={handleClearReconciliation}
              className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-2"
            >
              Clear Reconciliation
            </button>
            <button
              onClick={handleSaveAndExit}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
            >
              <Save size={18} />
              Save & Exit
            </button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="mb-4 flex gap-4 items-center">
          <input
            type="text"
            placeholder="Search sheet name..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={selectedGroup}
            onChange={(e) => {
              setSelectedGroup(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[200px]"
          >
            <option value="all">All Groups</option>
            {uniqueGroups.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>
          <select
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={10}>10 rows</option>
            <option value={25}>25 rows</option>
            <option value={50}>50 rows</option>
            <option value={100}>100 rows</option>
          </select>
        </div>

        {/* Table */}
        <div className="overflow-hidden min-h-[450px]">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Group
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <div
                      onClick={() => handleSort("sheetName")}
                      className="flex items-center gap-1 cursor-pointer hover:text-gray-700"
                    >
                      Sheet Name
                      <ArrowUpDown size={14} />
                    </div>
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowSheetFilter(!showSheetFilter);
                        }}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        <Filter
                          size={14}
                          className={
                            selectedSheetNames.size < allSheetNames.length
                              ? "text-blue-600"
                              : ""
                          }
                        />
                      </button>

                      {showSheetFilter && (
                        <div className="absolute resize-x left-0 top-full mt-1 w-72 max-h-96 overflow-y-auto bg-white border border-gray-300 rounded-lg shadow-lg z-50">
                          <div className="sticky top-0 bg-white border-b border-gray-200 p-3">
                            <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                              <input
                                type="checkbox"
                                checked={
                                  selectedSheetNames.size ===
                                  allSheetNames.length
                                }
                                onChange={handleSelectAllSheets}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                              />
                              <span className="text-sm font-medium">
                                Select All ({allSheetNames.length})
                              </span>
                            </label>
                            <input
                              type="text"
                              placeholder="Search sheets..."
                              value={sheetFilterSearch}
                              onChange={(e) =>
                                setSheetFilterSearch(e.target.value)
                              }
                              className="mt-2 w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>

                          <div className="p-2 space-y-1">
                            {allSheetNames
                              .filter((name) =>
                                name
                                  .toLowerCase()
                                  .includes(sheetFilterSearch.toLowerCase())
                              )
                              .map((sheetName) => (
                                <label
                                  key={sheetName}
                                  className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                                  title={sheetName}
                                >
                                  <input
                                    type="checkbox"
                                    checked={selectedSheetNames.has(sheetName)}
                                    onChange={() =>
                                      handleToggleSheet(sheetName)
                                    }
                                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                  />
                                  <span className="text-sm truncate flex-1">
                                    {sheetName}
                                  </span>
                                </label>
                              ))}
                          </div>

                          <div className="sticky bottom-0 bg-white border-t border-gray-200 p-3 flex justify-end gap-2">
                            <button
                              onClick={() => {
                                setShowSheetFilter(false);
                                setSheetFilterSearch("");
                              }}
                              className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
                            >
                              Close
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </th>
                <th
                  onClick={() => handleSort("openingStockTotal")}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center gap-2">
                    Opening Stock
                    <ArrowUpDown size={14} />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("reconOpeningStock")}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center gap-2">
                    Recon Opening
                    <ArrowUpDown size={14} />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("openingDifference")}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center gap-2">
                    Opening Diff
                    <ArrowUpDown size={14} />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("closingStockTotal")}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center gap-2">
                    Closing Stock
                    <ArrowUpDown size={14} />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("reconClosingStock")}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center gap-2">
                    Recon Closing
                    <ArrowUpDown size={14} />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("closingDifference")}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center gap-2">
                    Closing Diff
                    <ArrowUpDown size={14} />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedSheets.map((sheet, index) => {
                const actualIndex = startIndex + index;
                const sheetMeta = metaData?.find(
                  (meta) => meta.sheetName === sheet.sheetName
                );
                const groupName = sheetMeta?.groupName || "Ungrouped";

                // Check if this is the first sheet of a new group in current page
                const prevSheet = index > 0 ? paginatedSheets[index - 1] : null;
                const prevMeta = prevSheet
                  ? metaData?.find(
                      (meta) => meta.sheetName === prevSheet.sheetName
                    )
                  : null;
                const isNewGroup =
                  !prevMeta || prevMeta.groupName !== groupName;

                // Count sheets in this group on current page
                let groupRowSpan = 1;
                if (isNewGroup) {
                  for (let i = index + 1; i < paginatedSheets.length; i++) {
                    const nextMeta = metaData?.find(
                      (meta) => meta.sheetName === paginatedSheets[i].sheetName
                    );
                    if (nextMeta?.groupName === groupName) {
                      groupRowSpan++;
                    } else {
                      break;
                    }
                  }
                }

                return (
                  <tr key={index} className="hover:bg-gray-50">
                    {isNewGroup && (
                      <td
                        rowSpan={groupRowSpan}
                        className={`relative px-2 py-4 border-l-4 ${
                          groupColors[groupName] ||
                          "bg-gray-100 border-gray-500"
                        }`}
                      >
                        <div className="flex items-center justify-center h-full">
                          <span
                            className="text-xs font-semibold text-gray-700 whitespace-nowrap"
                            style={{
                              writingMode: "vertical-rl",
                              transform: "rotate(180deg)",
                              letterSpacing: "0.05em",
                            }}
                          >
                            {groupName}
                          </span>
                        </div>
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {sheet.sheetName}
                    </td>
                    {/* rest of the cells remain same */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {sheet.openingStockTotal?.toLocaleString() || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="number"
                        value={sheet.reconOpeningStock}
                        onChange={(e) =>
                          handleInputChange(
                            sheet.sheetName,
                            "reconOpeningStock",
                            e.target.value
                          )
                        }
                        className="w-24 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0"
                      />
                    </td>
                    <td
                      className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${
                        sheet.openingDifference > 0
                          ? "text-green-600"
                          : sheet.openingDifference < 0
                          ? "text-red-600"
                          : "text-gray-900"
                      }`}
                    >
                      {sheet.openingDifference?.toLocaleString() || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {sheet.closingStockTotal?.toLocaleString() || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="number"
                        value={sheet.reconClosingStock}
                        onChange={(e) =>
                          handleInputChange(
                            sheet.sheetName,
                            "reconClosingStock",
                            e.target.value
                          )
                        }
                        className="w-24 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0"
                      />
                    </td>
                    <td
                      className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${
                        sheet.closingDifference > 0
                          ? "text-green-600"
                          : sheet.closingDifference < 0
                          ? "text-red-600"
                          : "text-gray-900"
                      }`}
                    >
                      {sheet.closingDifference?.toLocaleString() || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="relative group">
                        <Info
                          size={18}
                          className="text-blue-600 cursor-pointer"
                        />
                        <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 hidden group-hover:block w-64 p-3 bg-gray-900 text-white text-xs rounded shadow-lg z-[9999] pointer-events-none">
                          <div className="space-y-1">
                            <p>
                              <strong>Has Stock Columns:</strong>{" "}
                              {sheet.hasStockColumns ? "Yes" : "No"}
                            </p>
                            <p>
                              <strong>Opening Count:</strong>{" "}
                              {sheet.openingCount}
                            </p>
                            <p>
                              <strong>Closing Count:</strong>{" "}
                              {sheet.closingCount}
                            </p>
                            <p>
                              <strong>Opening Column:</strong>{" "}
                              {sheet.openingColumnName}
                            </p>
                            <p>
                              <strong>Closing Column:</strong>{" "}
                              {sheet.closingColumnName}
                            </p>
                          </div>
                          <div className="absolute left-full top-1/2 -translate-y-1/2 -ml-1 border-4 border-transparent border-l-gray-900"></div>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-gray-100 font-semibold">
              <tr className="border-t-2 border-gray-300">
                <td className="px-2 py-4"></td>
                <td className="px-6 py-4 text-sm text-gray-900">TOTAL</td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {totals.openingStock.toLocaleString()}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {totals.reconOpening.toLocaleString()}
                </td>
                <td
                  className={`px-6 py-4 text-sm ${
                    totals.openingDiff >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {totals.openingDiff.toLocaleString()}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {totals.closingStock.toLocaleString()}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {totals.reconClosing.toLocaleString()}
                </td>
                <td
                  className={`px-6 py-4 text-sm ${
                    totals.closingDiff >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {totals.closingDiff.toLocaleString()}
                </td>
                <td className="px-6 py-4"></td>
              </tr>
            </tfoot>
          </table>

          {/* Pagination */}
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {startIndex + 1} to{" "}
              {Math.min(startIndex + rowsPerPage, sortedSheets.length)} of{" "}
              {sortedSheets.length} entries
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReconciliationPage;
