import React, { useState, useEffect, useMemo } from "react";
import {
  Calendar,
  Info,
  Loader2,
  Check,
  ArrowUpDown,
  Filter,
} from "lucide-react";
import { DateRangePicker } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { fetchSuperTableData } from "../../../../services/repository/dashboardRepo";
import { useNavigate } from "react-router-dom";

const SuperDashboardTable = ({ metaData }) => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(null);
  const [isComplete, setIsComplete] = useState(false);
  const [sheets, setSheets] = useState([]);
  const [summary, setSummary] = useState(null);
  const [dateRange, setDateRange] = useState([
    {
      startDate: new Date(),
      endDate: new Date(),
      key: "selection",
    },
  ]);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const navigate = useNavigate();
  const [hasReconciliationData, setHasReconciliationData] = useState(false);

  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [selectedSheetNames, setSelectedSheetNames] = useState(new Set());
  const [showSheetFilter, setShowSheetFilter] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState("all");
  const filteredSheets = sheets.filter((sheet) => {
    const matchesSearch = sheet.sheetName
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesSheetFilter = selectedSheetNames.has(sheet.sheetName);

    // Add group filter
    const sheetMeta = metaData?.find(
      (meta) => meta.sheetName === sheet.sheetName
    );
    const groupName = sheetMeta?.groupName || "Ungrouped";
    const matchesGroup = selectedGroup === "all" || groupName === selectedGroup;

    return matchesSearch && matchesSheetFilter && matchesGroup;
  });

  const [sheetFilterSearch, setSheetFilterSearch] = useState("");

  const uniqueGroups = useMemo(() => {
    if (!metaData) return [];
    const groups = [...new Set(metaData.map((meta) => meta.groupName))];
    return groups.sort();
  }, [metaData]);

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

  const allSheetNames = useMemo(() => {
    return [...new Set(sheets.map((sheet) => sheet.sheetName))].sort();
  }, [sheets]);

  const sortedSheets = useMemo(() => {
  let sorted = [...filteredSheets];

  // First, sort by group
  sorted.sort((a, b) => {
    const aGroup = metaData?.find(m => m.sheetName === a.sheetName)?.groupName || "Ungrouped";
    const bGroup = metaData?.find(m => m.sheetName === b.sheetName)?.groupName || "Ungrouped";
    
    // Compare groups first
    if (aGroup !== bGroup) {
      return aGroup.localeCompare(bGroup);
    }
    
    // If same group, apply the sort config
    if (sortConfig.key) {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      if (sortConfig.key === "sheetName") {
        aVal = aVal?.toLowerCase() || "";
        bVal = bVal?.toLowerCase() || "";
      }

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

  // Initialize sheet filter with all selected
  useEffect(() => {
    setSelectedSheetNames(new Set(allSheetNames));
  }, [allSheetNames]);

  const totals = useMemo(() => {
  const result = sortedSheets.reduce(
    (acc, sheet) => {
      acc.openingStock += sheet.openingStockTotal || 0;
      acc.closingStock += sheet.closingStockTotal || 0;
      return acc;
    },
    {
      openingStock: 0,
      closingStock: 0,
    }
  );
  result.difference = result.closingStock - result.openingStock;
  return result;
}, [sortedSheets]);

  const totalPages = Math.ceil(sortedSheets.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedSheets = sortedSheets.slice(
    startIndex,
    startIndex + rowsPerPage
  );

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
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

  const handleFetchData = async () => {
    const start = dateRange[0].startDate
      .toLocaleDateString("en-GB")
      .split("/")
      .join("-");
    const end = dateRange[0].endDate
      .toLocaleDateString("en-GB")
      .split("/")
      .join("-");

    setLoading(true);
    setIsComplete(false);
    setSheets([]);
    setProgress(null);
    setSummary(null);

    try {
      const response = await fetchSuperTableData(start, end);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const jsonStr = line.slice(6);
            try {
              const data = JSON.parse(jsonStr);

              if (data.type === "progress") {
                setProgress(data);
              } else if (data.type === "sheet") {
                setSheets((prev) => [...prev, data.data]);
                setProgress(data.progress);
              } else if (data.type === "complete") {
                setSummary(data.summary);
                setLoading(false);
                setIsComplete(true);
              }
            } catch (e) {
              console.error("Parse error:", e);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
    }
  };
  useEffect(() => {
    const savedData = localStorage.getItem("reconciliationData");
    setHasReconciliationData(!!savedData);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showSheetFilter && !e.target.closest(".relative")) {
        setShowSheetFilter(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showSheetFilter]);

  // Add this function to save current data for reconciliation
  const handleReconcile = () => {
    const reconciliationData = {
      sheets: sheets,
      summary: summary,
      dateRange: {
        start: dateRange[0].startDate,
        end: dateRange[0].endDate,
      },
      timestamp: new Date().toISOString(),
      metaData: metaData,
    };
    localStorage.setItem(
      "reconciliationData",
      JSON.stringify(reconciliationData)
    );
    navigate("/reconciliation", {
      state: { type: "fresh", data: reconciliationData },
    });
  };

  const handleContinueReconciliation = () => {
    const savedData = JSON.parse(localStorage.getItem("reconciliationData"));
    navigate("/reconciliation", {
      state: { type: "continue", data: savedData },
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Sheet Performance
        </h2>

        <div className="flex gap-4 items-end">
          <div className="flex-1 relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Range
            </label>
            <input
              type="text"
              readOnly
              value={`${dateRange[0].startDate.toLocaleDateString(
                "en-US"
              )} - ${dateRange[0].endDate.toLocaleDateString("en-US")}`}
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            />
            {showDatePicker && (
              <div className="absolute z-50 mt-2 bg-white shadow-lg rounded-lg">
                <DateRangePicker
                  ranges={dateRange}
                  onChange={(item) => setDateRange([item.selection])}
                  months={2}
                  direction="horizontal"
                />
                <div className="flex justify-end gap-2 p-3 border-t">
                  <button
                    onClick={() => setShowDatePicker(false)}
                    className="px-4 py-2 text-sm bg-gray-200 rounded hover:bg-gray-300"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleFetchData}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Calendar size={18} />
            Fetch Data
          </button>

          <div className="relative group">
            <button
              onClick={handleReconcile}
              disabled={!summary || sheets.length === 0}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
            >
              Reconcile
            </button>
            {(!summary || sheets.length === 0) && (
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block w-48 p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-50 pointer-events-none">
                Please fetch data first
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
              </div>
            )}
          </div>

          {hasReconciliationData && (
            <button
              onClick={handleContinueReconciliation}
              className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center gap-2"
            >
              Continue Last
            </button>
          )}
        </div>

        {progress && (
          <div className="mt-4 flex items-center gap-3">
            {isComplete ? (
              <Check className="text-green-600" size={20} />
            ) : (
              <Loader2 className="animate-spin text-blue-600" size={20} />
            )}
            <span className="text-sm text-gray-600">
              {isComplete ? "Completed" : "Processing"}:{" "}
              {progress.processed || 0} /{" "}
              {progress.total || progress.totalSheets || 0} sheets
              {progress.percentage && ` (${progress.percentage}%)`}
            </span>
          </div>
        )}
      </div>

      {sheets.length > 0 && (
        <>
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
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          <div className="overflow-hidden  min-h-[450px]">
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
                          <div
                            className="absolute left-0 top-full mt-1 w-72 max-h-96 overflow-y-auto bg-white border border-gray-300 rounded-lg shadow-lg z-50"
                            style={{
                              width: "288px",
                              minWidth: "288px",
                              maxWidth: "600px",
                              maxHeight: "384px",
                              resize: "horizontal",
                            }}
                          >
                            <div className="sticky z-40 top-0 bg-white border-b border-gray-200 p-3">
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
                                    className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded group relative"
                                    title={sheetName}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={selectedSheetNames.has(
                                        sheetName
                                      )}
                                      onChange={() =>
                                        handleToggleSheet(sheetName)
                                      }
                                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                    />
                                    <span className="text-sm truncate flex-1">
                                      {sheetName}
                                    </span>

                                    {/* Tooltip */}
                                    <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 hidden group-hover:block w-auto max-w-xs p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-[9999] pointer-events-none whitespace-nowrap">
                                      {sheetName}
                                    </div>
                                  </label>
                                ))}
                            </div>

                            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-3 flex justify-end gap-2">
                              <button
                                onClick={() => {setShowSheetFilter(false); setSheetFilterSearch("");}}
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
                    onClick={() => handleSort("closingStockTotal")}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    <div className="flex items-center gap-2">
                      Closing Stock
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
                  const sheetMeta = metaData?.find(
                    (meta) => meta.sheetName === sheet.sheetName
                  );
                  const groupName = sheetMeta?.groupName || "Ungrouped";

                  const prevSheet =
                    index > 0 ? paginatedSheets[index - 1] : null;
                  const prevMeta = prevSheet
                    ? metaData?.find(
                        (meta) => meta.sheetName === prevSheet.sheetName
                      )
                    : null;
                  const isNewGroup =
                    !prevMeta || prevMeta.groupName !== groupName;

                  let groupRowSpan = 1;
                  if (isNewGroup) {
                    for (let i = index + 1; i < paginatedSheets.length; i++) {
                      const nextMeta = metaData?.find(
                        (meta) =>
                          meta.sheetName === paginatedSheets[i].sheetName
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {sheet.openingStockTotal?.toLocaleString() || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {sheet.closingStockTotal?.toLocaleString() || 0}
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
                    {totals.closingStock.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold">
                    <span className={totals.difference < 0 ? "text-red-600" : totals.difference > 0 ? "text-green-600" : "text-gray-900"}>
                      {totals.difference.toLocaleString()}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {startIndex + 1} to{" "}
                {Math.min(startIndex + rowsPerPage, sortedSheets.length)} of{" "}
                {sortedSheets.length} entries
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
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
        </>
      )}

      {summary && (
        <>
          <div className="mt-6 p-4 bg-blue-50 rounded-md">
            <h3 className="text-sm font-semibold text-gray-800 mb-2">
              Summary
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Total Sheets</p>
                <p className="font-semibold">{summary.totalSheets}</p>
              </div>
              <div>
                <p className="text-gray-600">Total Opening Stock</p>
                <p className="font-semibold">
                  {summary.aggregateTotals?.totalOpeningStock?.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Total Closing Stock</p>
                <p className="font-semibold">
                  {summary.aggregateTotals?.totalClosingStock?.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Stock Difference</p>
                <p
                  className={`font-semibold ${
                    summary.aggregateTotals?.stockDifference < 0
                      ? "text-red-600"
                      : "text-green-600"
                  }`}
                >
                  {summary.aggregateTotals?.stockDifference?.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
          {/* <div className="mt-6 flex gap-4 justify-end">
                <button
                    onClick={handleReconcile}
                    disabled={!summary || sheets.length === 0}
                    className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    Reconcile
                </button>
                <button
                    onClick={handleContinueReconciliation}
                    disabled={!hasReconciliationData}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    Continue Last Reconciliation
                </button>
            </div> */}
        </>
      )}
    </div>
  );
};

export default SuperDashboardTable;
