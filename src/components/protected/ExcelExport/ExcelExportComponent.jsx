import React, { useState, useRef, useEffect } from "react";
import {
  Download,
  Search,
  Calendar,
  Check,
  X,
  Loader2,
  FileSpreadsheet,
} from "lucide-react";
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { getSheetsData } from "../../../services/repository/sheetsRepo";

const ExcelExportComponent = ({ allMetadata }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSheets, setSelectedSheets] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState({
    current: 0,
    total: 0,
  });

  const tooltipRef = useRef(null);
  const buttonRef = useRef(null);

  const months = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ];

  const years = Array.from(
    { length: 10 },
    (_, i) => new Date().getFullYear() - 5 + i
  );

  const filteredSheets = allMetadata.filter((sheet) =>
    sheet.sheetName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectAll = () => {
    if (selectedSheets.size === filteredSheets.length) {
      setSelectedSheets(new Set());
    } else {
      setSelectedSheets(new Set(filteredSheets.map((sheet) => sheet._id)));
    }
  };

  const handleSheetSelect = (sheetId) => {
    const newSelected = new Set(selectedSheets);
    if (newSelected.has(sheetId)) {
      newSelected.delete(sheetId);
    } else {
      newSelected.add(sheetId);
    }
    setSelectedSheets(newSelected);
  };

  const formatAttributeName = (name) => {
    return name.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const processSheetData = (sheetMeta, sheetData) => {
    const worksheetData = [];

    // Separate attributes into visible, hidden, and deleted
    const visibleAttrs = [];
    const hiddenAttrs = [];
    const deletedAttrs = [];
    
    sheetMeta.attributes.forEach((attr, index) => {
      if (attr.isDeleted) {
        deletedAttrs.push({ attr, index });
      } else if (attr.isHidden) {
        hiddenAttrs.push({ attr, index });
      } else {
        visibleAttrs.push({ attr, index });
      }
    });

    // Reorder: visible + hidden + blank column + deleted
    const orderedAttrs = [
      ...visibleAttrs,
      ...hiddenAttrs,
      { attr: { name: 'SEPARATOR' }, index: -1 }, // Blank separator
      ...deletedAttrs
    ];

    // Add sheet info row at the top
    worksheetData.push([`Sheet: ${sheetMeta.sheetName} | ID: ${sheetMeta._id}`]);
    worksheetData.push([]); // Empty row for spacing

    // Create header row with reordered columns
    const headers = orderedAttrs.map(item => 
      item.index === -1 ? '' : formatAttributeName(item.attr.name)
    );
    worksheetData.push(headers);

    // Initialize totals array
    const totals = new Array(orderedAttrs.length).fill(0);
    const isNumericColumn = new Array(orderedAttrs.length).fill(true);

    // Process each data row
    sheetData.forEach((record) => {
      const row = [];
      orderedAttrs.forEach((item, newIndex) => {
        if (item.index === -1) {
          // Blank separator column
          row.push('');
          isNumericColumn[newIndex] = false;
        } else {
          const value = record.attributes[item.index];
          const attr = item.attr;
          
          if (attr.name.toLowerCase().includes("date")) {
            row.push(
              typeof value === "string"
                ? value
                : new Date(value).toLocaleDateString()
            );
            isNumericColumn[newIndex] = false;
          } else {
            const numValue = typeof value === 'number' ? value : (parseFloat(value) || 0);
            row.push(numValue);
            if (isNumericColumn[newIndex]) {
              totals[newIndex] += numValue;
            }
          }
        }
      });
      worksheetData.push(row);
    });

    // Add totals row
    const totalsRow = totals.map((total, index) => 
      isNumericColumn[index] ? total : ''
    );
    totalsRow[0] = 'TOTAL';
    worksheetData.push(totalsRow);

    // Return data along with column metadata for styling
    return {
      data: worksheetData,
      columnInfo: orderedAttrs.map((item, index) => ({
        index,
        isHidden: item.attr.isHidden || false,
        isDeleted: item.attr.isDeleted || false,
        isSeparator: item.index === -1
      }))
    };
  };

  const handleExport = async () => {
    if (selectedSheets.size === 0) return;
    console.log("Exporting sheets:", selectedSheets);

    setIsExporting(true);
    setExportProgress({ current: 0, total: selectedSheets.size });

    try {
      const workbook = new ExcelJS.Workbook();
      const selectedMetadata = allMetadata.filter((sheet) =>
        selectedSheets.has(sheet._id)
      );
      let currentSheet = 0;

      // Process each selected sheet
      for (const sheetId of selectedSheets) {
        const sheetMeta = allMetadata.find((sheet) => sheet._id === sheetId);
        if (!sheetMeta) continue;

        setExportProgress({
          current: currentSheet + 1,
          total: selectedSheets.size,
        });

        try {
          const sheetData = await getSheetsData(
            "admin",
            sheetId,
            selectedYear,
            selectedMonth
          );
          const { data: worksheetData, columnInfo } = processSheetData(sheetMeta, sheetData);
          console.log(
            `Processing sheet ${sheetMeta.sheetName} with ${worksheetData.length} rows`
          );

          // Sanitize sheet name for Excel
          const sanitizedSheetName = sheetMeta.sheetName
            .replace(/[\\\/\?\*\[\]]/g, "_")
            .substring(0, 31);

          const worksheet = workbook.addWorksheet(sanitizedSheetName);

          // Add all rows
          worksheetData.forEach((row) => {
            worksheet.addRow(row);
          });

          // Freeze panes: first column and first 3 rows
          worksheet.views = [
            { 
              state: 'frozen', 
              xSplit: 1, 
              ySplit: 3,
              activeCell: 'B4'
            }
          ];

          // Style sheet info row (row 1)
          const sheetInfoRow = worksheet.getRow(1);
          sheetInfoRow.font = { bold: true, size: 12 };
          sheetInfoRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD3D3D3' }
          };
          sheetInfoRow.alignment = { vertical: 'middle', horizontal: 'left' };

          // Style header row (row 3) and apply column-specific formatting
          const headerRow = worksheet.getRow(3);
          headerRow.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
          headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
          
          // Apply column-specific styling
          columnInfo.forEach((colInfo, colIndex) => {
            const excelColIndex = colIndex + 1; // Excel columns are 1-indexed
            const column = worksheet.getColumn(excelColIndex);

            if (colInfo.isHidden) {
              // Hide the column
              column.hidden = true;
            } else if (colInfo.isDeleted) {
              // Red background for deleted columns
              headerRow.getCell(excelColIndex).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFFF0000' }
              };
              
              // Apply red background to all data cells in deleted columns
              for (let rowIndex = 4; rowIndex <= worksheetData.length; rowIndex++) {
                const cell = worksheet.getRow(rowIndex).getCell(excelColIndex);
                cell.fill = {
                  type: 'pattern',
                  pattern: 'solid',
                  fgColor: { argb: 'FFFF0000' }
                };
                cell.font = { color: { argb: 'FFFFFFFF' } }; // White text on red background
              }
            } else if (colInfo.isSeparator) {
              // Separator column - just leave it empty with no special formatting
              headerRow.getCell(excelColIndex).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFFFFFFF' }
              };
            } else {
              // Normal visible columns - blue header
              headerRow.getCell(excelColIndex).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF4472C4' }
              };
            }
          });

          // Style totals row (last row)
          const totalsRow = worksheet.getRow(worksheetData.length);
          totalsRow.font = { bold: true, size: 11 };
          totalsRow.alignment = { vertical: 'middle', horizontal: 'right' };
          
          // Apply totals row colors based on column type
          columnInfo.forEach((colInfo, colIndex) => {
            const excelColIndex = colIndex + 1;
            const cell = totalsRow.getCell(excelColIndex);
            
            if (colInfo.isDeleted) {
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFFF0000' }
              };
              cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            } else if (!colInfo.isSeparator) {
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFFFC000' }
              };
            }
          });

          // Auto-size columns
          worksheet.columns.forEach((column, index) => {
            let maxLength = 0;
            column.eachCell({ includeEmpty: true }, (cell) => {
              const columnLength = cell.value ? cell.value.toString().length : 10;
              if (columnLength > maxLength) {
                maxLength = columnLength;
              }
            });
            column.width = Math.min(Math.max(maxLength + 2, 10), 50);
          });

          console.log(`Added sheet ${sanitizedSheetName} to workbook`);
        } catch (error) {
          console.error(
            `Error processing sheet ${sheetMeta.sheetName}:`,
            error
          );
        }
        currentSheet++;
      }

      // Add metadata sheet
      const metadataRows = createMetadataSheet(selectedMetadata);
      const metadataSheet = workbook.addWorksheet('Metadata_Info');
      
      metadataRows.forEach((row) => {
        metadataSheet.addRow(row);
      });

      // Auto-size metadata columns
      metadataSheet.columns.forEach((column) => {
        let maxLength = 0;
        column.eachCell({ includeEmpty: true }, (cell) => {
          const columnLength = cell.value ? cell.value.toString().length : 15;
          if (columnLength > maxLength) {
            maxLength = columnLength;
          }
        });
        column.width = Math.min(Math.max(maxLength + 2, 15), 60);
      });

      // Generate filename
      const monthName = months.find((m) => m.value === selectedMonth)?.label;
      const filename = `Sheets_Export_${monthName}_${selectedYear}.xlsx`;

      // Save file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, filename);

      console.log(`Excel file generated: ${filename}`);

      // Close the tooltip and reset selections
      setIsOpen(false);
      setSelectedSheets(new Set());
    } catch (error) {
      console.error("Export failed:", error);
      alert("Export failed. Please try again.");
    } finally {
      setIsExporting(false);
      setExportProgress({ current: 0, total: 0 });
    }
  };

  const createMetadataSheet = (allSelectedMetadata) => {
    const metadataRows = [
      [
        "Sheet Name",
        "Column Name",
        "Type",
        "Subtype",
        "Has Subrows",
        "Subrow Columns",
        "Formula Info",
        "Required Info",
      ],
    ];

    allSelectedMetadata.forEach((sheetMeta, sheetIndex) => {
      sheetMeta.attributes.forEach((attr, attrIndex) => {
        // Helper function to get column names from indices
        const getColumnNamesFromIndices = (indices) => {
          if (!indices || indices.length === 0) return [];
          return indices.map((index) => {
            const targetAttr = sheetMeta.attributes[index];
            return targetAttr
              ? formatAttributeName(targetAttr.name)
              : `Column ${index}`;
          });
        };

        // Build formula info with column names
        let formulaInfo = "-";
        if (attr.derived && attr.formula) {
          const addColumns = getColumnNamesFromIndices(
            attr.formula.additionIndices
          );
          const subtractColumns = getColumnNamesFromIndices(
            attr.formula.subtractionIndices
          );

          const parts = [];
          if (addColumns.length > 0)
            parts.push(`Add: [${addColumns.join(", ")}]`);
          if (subtractColumns.length > 0)
            parts.push(`Subtract: [${subtractColumns.join(", ")}]`);

          if (parts.length > 0) formulaInfo = parts.join(", ");
        }

        const row = [
          attrIndex === 0 ? sheetMeta.sheetName : "", // Show sheet name only for first attribute
          formatAttributeName(attr.name),
          attr.derived ? "Derived" : "Independent",
          attr.recurrentCheck?.isRecurrent
            ? "Recurrent"
            : attr.linkedFrom?.sheetObjectId
            ? "Referenced"
            : "-",
          attr.hasSubrows ? "Yes" : "No",
          attr.hasSubrows && attr.subrowsConfig
            ? attr.subrowsConfig.subrowColumns.map((col) => col.name).join(", ")
            : "-",
          formulaInfo,
          attr.hasSubrows && attr.subrowsConfig
            ? attr.subrowsConfig.subrowColumns
                .map(
                  (col) =>
                    `${col.name}: ${col.required ? "Required" : "Optional"}`
                )
                .join("; ")
            : "-",
        ];
        metadataRows.push(row);
      });

      // Add blank row between sheets (except after the last sheet)
      if (sheetIndex < allSelectedMetadata.length - 1) {
        metadataRows.push(["", "", "", "", "", "", "", ""]);
      }
    });

    return metadataRows;
  };

  // Close tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        tooltipRef.current &&
        !tooltipRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative">
      {/* Export Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting}
        className="bg-gray-600 text-white px-4 py-1.5 rounded-md text-sm hover:bg-gray-700 flex items-center gap-2 justify-center"
      >
        {isExporting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-3.5 h-3.5" />
        )}
        {isExporting ? "Exporting..." : "Export Data"}
      </button>

      {/* Floating Tooltip */}
      {isOpen && (
        <div
          ref={tooltipRef}
          className="absolute top-full -right-[100%] mt-2 w-96 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden"
        >
          {/* Header */}
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <h3 className="font-semibold text-gray-900">Export to Excel</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>

          <div className="p-4 space-y-4">
            {/* Date Selection */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Year
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                >
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Month
                </label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                >
                  {months.map((month) => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search sheets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
              />
            </div>

            {/* Select All */}
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={
                      selectedSheets.size === filteredSheets.length &&
                      filteredSheets.length > 0
                    }
                    onChange={handleSelectAll}
                    className="sr-only"
                  />
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      selectedSheets.size === filteredSheets.length &&
                      filteredSheets.length > 0
                        ? "bg-emerald-600 border-emerald-600"
                        : "border-gray-300 hover:border-emerald-400"
                    }`}
                  >
                    {selectedSheets.size === filteredSheets.length &&
                      filteredSheets.length > 0 && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                  </div>
                </div>
                <span className="font-medium text-gray-900">Select All</span>
              </label>
              <span className="text-sm text-gray-500">
                {selectedSheets.size} of {filteredSheets.length} selected
              </span>
            </div>

            {/* Sheets List */}
            <div className="max-h-48 overflow-y-auto space-y-2">
              {filteredSheets.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  No sheets found
                </p>
              ) : (
                filteredSheets.map((sheet) => (
                  <label
                    key={sheet._id}
                    className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                  >
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={selectedSheets.has(sheet._id)}
                        onChange={() => handleSheetSelect(sheet._id)}
                        className="sr-only"
                      />
                      <div
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                          selectedSheets.has(sheet._id)
                            ? "bg-emerald-600 border-emerald-600"
                            : "border-gray-300 hover:border-emerald-400"
                        }`}
                      >
                        {selectedSheets.has(sheet._id) && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {sheet.sheetName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {sheet.attributes.length} columns
                      </p>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            {isExporting && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>
                  Processing {exportProgress.current} of {exportProgress.total}
                  ...
                </span>
              </div>
            )}
            <div className="flex gap-2 ml-auto">
              <button
                onClick={() => setIsOpen(false)}
                disabled={isExporting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                disabled={selectedSheets.size === 0 || isExporting}
                className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 border border-transparent rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isExporting
                  ? "Exporting..."
                  : `Export ${selectedSheets.size} Sheet${
                      selectedSheets.size !== 1 ? "s" : ""
                    }`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExcelExportComponent;
