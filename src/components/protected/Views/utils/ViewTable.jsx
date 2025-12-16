import React, { useState, useEffect } from "react";
import { Search, X, Plus, ChevronRight, Info } from "lucide-react";
import toast from "react-hot-toast";

const ViewTable = ({
  // Data props
  currentSheet,
  processedData,
  rawSheetsData,
  selectedSheetId,
  timestampsData,
  
  // Loading & status
  loading,
  
  // Admin & permissions
  isAdmin,
  
  // State values
  hoveredColumn,
  showColumnTypeDropdown,
  dropdownPosition,
  columnType,
  showColumnModal,
  contextMenuPosition,
  showContextMenu,
  selectedColumnIndex,
  expandedRows,
  
  // Modal state
  showModal,
  modalType,
  modalData,
  selectedRowIndex,
  subrowsData,
  showSubrowsModal,
  currentSubrowsColumn,
  showAddOnModal,
  addOnFieldName,
  addOnValue,
  addOnPosition,
  
  // Callback functions
  onRowClick,
  onBlankRowClick,
  onRowDoubleClick,
  onColumnHover,
  onColumnTypeDropdownToggle,
  onColumnModalOpen,
  onContextMenuOpen,
  onColumnSelect,
  onRowExpand,
  onModalClose,
  onModalSubmit,
  onInputChange,
  onSubrowsModalOpen,
  onSubrowsModalClose,
  onSubrowsSave,
  onAddOnClick,
  onAddOnSave,
  onAddOnCancel,
}) => {

  // Utility functions
  const getColumnType = (attribute) => {
    if (attribute.derived) return "derived";
    if (
      attribute["linkedFrom"] &&
      attribute["linkedFrom"].sheetObjectId != null
    )
      return "referenced";
    if (attribute.recurrentCheck && attribute.recurrentCheck.isRecurrent)
      return "recurrent";
    return "normal";
  };

  const getColumnClass = (type) => {
    switch (type) {
      case "derived":
        return "bg-yellow-100 text-yellow-800";
      case "referenced":
        return "bg-blue-100 text-blue-800";
      case "recurrent":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-50";
    }
  };

  const checkTodaysData = () => {
    const today = new Date().toISOString().split("T")[0];
    const todayFormatted = new Date().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    if (currentSheet && currentSheet.attributes.length > 0) {
      const dateAttribute = currentSheet.attributes[0];
      const hasToday = dateAttribute.data.some(
        (date) => date.includes(todayFormatted) || date.includes(today)
      );
      return hasToday;
    }
    return false;
  };

  const convertDateFormat = (dateString, isInputToDisplay = true) => {
    if (isInputToDisplay) {
      // Convert yyyy-mm-dd to display format (dd MMM yyyy)
      const date = new Date(dateString);
      return date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } else {
      // Convert display format to yyyy-mm-dd
      try {
        const date = new Date(dateString);
        return date.toISOString().split("T")[0];
      } catch (error) {
        console.error("Error converting date:", error);
        return new Date().toISOString().split("T")[0]; // Fallback to today
      }
    }
  };

  const getTodaysDate = () => {
    const today = new Date();
    return today.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const renderFormulaTooltip = (attribute, columnIndex) => {
    // Handle derived columns
    if (attribute.derived && attribute.formula) {
      const additionIndices = attribute.formula["additionIndices"] || [];
      const subtractionIndices = attribute.formula["subtractionIndices"] || [];

      const additionTerms = additionIndices.map(
        (idx) => currentSheet.attributes[idx]?.name || `Column${idx}`
      );
      const subtractionTerms = subtractionIndices.map(
        (idx) => currentSheet.attributes[idx]?.name || `Column${idx}`
      );

      return (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 p-3 bg-black text-white text-xs rounded-lg shadow-lg z-50 whitespace-nowrap">
          <div className="font-semibold mb-1">Formula:</div>
          <div className="flex items-center gap-1 flex-wrap">
            {additionTerms.map((term, idx) => (
              <span
                key={`add-${idx}`}
                className="bg-green-600 px-2 py-1 rounded text-white font-medium"
              >
                {term
                  .replace(/-/g, " ")
                  .replace(/\b\w/g, (l) => l.toUpperCase())}
              </span>
            ))}
            {additionTerms.length > 0 && subtractionTerms.length > 0 && (
              <span className="text-gray-300 mx-1 font-bold">-</span>
            )}
            {subtractionTerms.map((term, idx) => (
              <span
                key={`sub-${idx}`}
                className="bg-red-600 px-2 py-1 rounded text-white font-medium"
              >
                {term
                  .replace(/-/g, " ")
                  .replace(/\b\w/g, (l) => l.toUpperCase())}
              </span>
            ))}
          </div>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-black"></div>
        </div>
      );
    }

    // Handle recurrent columns
    if (attribute.recurrentCheck?.isRecurrent) {
      const refIndex = attribute.recurrentCheck.recurrentReferenceIndice;
      const refColumn = currentSheet.attributes[refIndex];

      return (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 p-3 bg-purple-900 text-white text-xs rounded-lg shadow-lg z-50 whitespace-nowrap">
          <div className="font-semibold mb-1">Recurrent Reference:</div>
          <div className="flex items-center gap-1">
            <span className="bg-purple-600 px-2 py-1 rounded text-white font-medium">
              {refColumn?.name
                .replace(/-/g, " ")
                .replace(/\b\w/g, (l) => l.toUpperCase()) ||
                `Column ${refIndex}`}
            </span>
            <span className="text-purple-300">→ Previous Period</span>
          </div>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-purple-900"></div>
        </div>
      );
    }

    return null;
  };

  const calculateRecurrentValue = (attribute, columnIndex, rowIndex) => {
    // Check if this is a recurrent column
    if (!attribute.recurrentCheck?.isRecurrent) {
      return attribute.data[rowIndex] || "0";
    }

    const referenceColumnIndex =
      attribute.recurrentCheck.recurrentReferenceIndice;

    // Get the reference column
    const referenceColumn = currentSheet.attributes[referenceColumnIndex];
    if (!referenceColumn) {
      return "0"; // No reference column found
    }

    // For recurrent columns, we need to get the value from the previous period
    // If this is the first row (rowIndex = 0), there's no previous period
    if (rowIndex === 0) {
      return "0"; // No previous period for first row
    }

    // Get the value from the previous row (previous period) of the reference column
    const previousPeriodValue = referenceColumn.data[rowIndex - 1];

    return previousPeriodValue || "0";
  };

  const calculateDerivedValueForDisplay = (attribute, rowIndex) => {
    // Check if this is a derived column
    if (!attribute.derived || !attribute.formula) {
      return attribute.data[rowIndex] || "0";
    }

    const additionIndices = attribute.formula.additionIndices || [];
    const subtractionIndices = attribute.formula.subtractionIndices || [];

    let result = 0;

    // Add values from addition indices
    additionIndices.forEach((index) => {
      const refAttr = currentSheet.attributes[index];
      if (refAttr && refAttr.data[rowIndex] !== undefined) {
        const value = parseFloat(refAttr.data[rowIndex]) || 0;
        result += value;
      }
    });

    // Subtract values from subtraction indices
    subtractionIndices.forEach((index) => {
      const refAttr = currentSheet.attributes[index];
      if (refAttr && refAttr.data[rowIndex] !== undefined) {
        const value = parseFloat(refAttr.data[rowIndex]) || 0;
        result -= value;
      }
    });

    return result;
  };

  const hasSubrows = (attr) => {
    return (
      attr.hasSubrows && attr.subrowsConfig && attr.subrowsConfig.subrowsEnabled
    );
  };

  const getSubrowsForRowAndColumn = (rowIndex, columnIndex) => {
    // Get the sheet data for the current row
    const sheetData = rawSheetsData[selectedSheetId] || [];
    if (!sheetData[rowIndex] || !sheetData[rowIndex].subrows) {
      return [];
    }

    // Get subrows for the specific column index
    const columnSubrows =
      sheetData[rowIndex].subrows[columnIndex.toString()] || [];
    return columnSubrows;
  };

  const isRowExpanded = (rowIndex, columnIndex) => {
    return expandedRows.has(`${rowIndex}-${columnIndex}`);
  };

  const renderSubrowsTable = (subrows, attr) => {
    if (!subrows || subrows.length === 0) {
      return (
        <div className="text-center py-4 text-gray-500">
          No subrows data available for this entry
        </div>
      );
    }

    // Get column configuration from metadata
    const subrowColumns = attr.subrowsConfig.subrowColumns || [];

    return (
      <div className="overflow-x-auto overflow-y-auto max-h-64">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              {subrowColumns.map((column, index) => (
                <th
                  key={index}
                  className={`text-left py-2 px-3 font-medium text-gray-700 ${
                    column.type === "number" ? "text-left" : "text-left"
                  }`}
                >
                  {column.name
                    .replace(/_/g, " ")
                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {subrows.map((subrow, subIndex) => (
              <tr
                key={subrow._id || subIndex}
                className="border-b border-gray-100 hover:bg-gray-50"
              >
                {subrowColumns.map((column, colIndex) => (
                  <td
                    key={colIndex}
                    className={`py-2 px-3 ${
                      column.type === "number"
                        ? "text-left font-medium text-gray-900"
                        : "text-left text-gray-900"
                    }`}
                  >
                    {column.type === "number" &&
                    typeof subrow[column.name] === "number"
                      ? subrow[column.name].toFixed(2)
                      : subrow[column.name] || "-"}
                  </td>
                ))}
              </tr>
            ))}
            {/* Total row for aggregate fields */}
            {attr.subrowsConfig.aggregateField && (
              <tr className="border-t-2 border-gray-300 bg-gray-50 font-semibold">
                <td
                  colSpan={subrowColumns.length - 1}
                  className="py-2 px-3 text-right"
                >
                  Total:
                </td>
                <td className="py-2 px-3 text-left">
                  {subrows
                    .reduce((total, subrow) => {
                      const value =
                        parseFloat(subrow[attr.subrowsConfig.aggregateField]) ||
                        0;
                      return total + value;
                    }, 0)
                    .toFixed(2)}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  const shouldOpenSubrowsModal = (attr) => {
    return (
      attr.hasSubrows &&
      attr.subrowsConfig &&
      attr.subrowsConfig.subrowsEnabled &&
      attr.subrowsConfig.subrowColumns &&
      attr.subrowsConfig.subrowColumns.length > 0
    );
  };

  const getExistingSubrowsData = (columnName, rowIndex = null) => {
    // For insert mode
    if (modalType === "insert") {
      return subrowsData[columnName] || [];
    }

    // For update mode - get from API data
    if (modalType === "update" && rowIndex !== null) {
      const sheetData = rawSheetsData[selectedSheetId] || [];
      if (sheetData[rowIndex] && sheetData[rowIndex].subrows) {
        const columnIndex = currentSheet.attributes.findIndex(
          (attr) => attr.name === columnName
        );
        return sheetData[rowIndex].subrows[columnIndex.toString()] || [];
      }
    }

    return [];
  };

  const getRecurrentValueForDisplay = (attribute) => {
    if (!attribute.recurrentCheck?.isRecurrent) {
      return "0";
    }

    const referenceColumnIndex =
      attribute.recurrentCheck.recurrentReferenceIndice;

    // Get the reference column
    if (currentSheet && currentSheet.attributes[referenceColumnIndex]) {
      const refColumn = currentSheet.attributes[referenceColumnIndex];
      if (refColumn.data && refColumn.data.length > 0) {
        const lastValue = refColumn.data[refColumn.data.length - 1];
        if (lastValue !== undefined && lastValue !== "") {
          return lastValue.toString();
        }
      }
    }

    return "0";
  };

  const renderSubrowsButton = (fieldName) => {
    const attr = currentSheet.attributes.find((a) => a.name === fieldName);

    if (!shouldOpenSubrowsModal(attr)) {
      return null;
    }

    const hasExistingSubrows =
      getExistingSubrowsData(fieldName, selectedRowIndex).length > 0;
    const hasModifiedSubrows =
      subrowsData[fieldName] && subrowsData[fieldName].length > 0;

    // Show different states based on data availability
    let buttonText = "+ Add";
    let buttonClass =
      "text-blue-700 border border-blue-300 hover:bg-blue-200/30";

    if (hasModifiedSubrows) {
      buttonText = "✓ Modified";
      buttonClass =
        "text-yellow-700 border border-yellow-300 hover:bg-yellow-200/30";
    } else if (hasExistingSubrows) {
      buttonText = "✓ Saved";
      buttonClass =
        "text-green-700 border border-green-300 hover:bg-green-200/30";
    }

    return (
      <button
        type="button"
        onClick={() => onSubrowsModalOpen(attr)}
        className={`absolute px-2 text-xs rounded transition-colors w-full h-full ${buttonClass}`}
        title={
          hasModifiedSubrows
            ? "Subrows modified - click to edit"
            : hasExistingSubrows
            ? "Subrows exist - click to view/edit"
            : "Click to add subrows details"
        }
      >
        <div className="flex items-end justify-end h-full">{buttonText}</div>
      </button>
    );
  };

  // Event handlers
  const handleRowClick = (rowIndex) => {
    onRowClick(rowIndex);
  };

  const handleBlankRowClick = () => {
    // Check if today's data already exists
    if (checkTodaysData()) {
      toast.error(
        "Today's data already exists. You cannot add duplicate entries for today."
      );
      return;
    }
    onBlankRowClick();
  };

  const handleRowDoubleClick = (rowIndex, columnIndex) => {
    const attr = currentSheet.attributes[columnIndex];
    if (!hasSubrows(attr)) {
      return;
    }
    onRowDoubleClick(rowIndex, columnIndex);
  };

  const handleInputChange = (fieldName, value) => {
    onInputChange(fieldName, value);
  };

  const handleModalSubmit = () => {
    onModalSubmit();
  };

  const handleAddOnClick = (fieldName, event) => {
    onAddOnClick(fieldName, event);
  };

  const handleAddOnSave = () => {
    onAddOnSave();
  };

  const handleAddOnCancel = () => {
    onAddOnCancel();
  };

  const handleDropdownClick = (event) => {
    onColumnTypeDropdownToggle(event);
  };

  // Render Table
  const renderTable = () => {
    if (loading || !currentSheet || processedData.length === 0) {
      return (
        <div className="p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-500">
            {loading ? "Loading sheet data..." : "Processing data..."}
          </p>
        </div>
      );
    }

    // Add safety check for attributes
    if (!currentSheet.attributes || currentSheet.attributes.length === 0) {
      return (
        <div className="p-8 text-center">
          <p className="text-gray-500">
            No data available for the selected period.
          </p>
        </div>
      );
    }

    // Get the number of rows from the first attribute
    const numRows = currentSheet.attributes[0]?.data.length || 0;
    const rows = [];

    // Create rows by getting data from each attribute at the same index
    for (let rowIndex = 0; rowIndex < numRows; rowIndex++) {
      const row = currentSheet.attributes.map(
        (attr) => attr.data[rowIndex] || "0"
      );
      rows.push(row);
    }

    // Add blank row at end for new data entry
    const blankRow = currentSheet.attributes.map(() => "");
    rows.push(blankRow);

    const totalsRow = currentSheet.attributes.map((attr, cellIndex) => {
      const columnType = getColumnType(attr);
      if (attr.name.toLowerCase() === "date") return "Total";

      if (columnType === "derived") {
        // Calculate total for derived columns using calculated values
        let total = 0;
        for (let i = 0; i < numRows; i++) {
          const value = calculateDerivedValueForDisplay(attr, i);
          const numValue = parseFloat(value) || 0;
          if (!isNaN(numValue)) {
            total += numValue;
          }
        }
        return total;
      } else if (columnType === "normal" || columnType === "referenced") {
        let total = 0;
        for (let i = 0; i < numRows; i++) {
          const value = attr.data[i] || 0;
          if (typeof value === "number") {
            total += value;
          }
        }
        return total;
      } else if (columnType === "recurrent") {
        // Calculate total for recurrent columns using calculated values
        let total = 0;
        for (let i = 0; i <= numRows; i++) {
          const value = calculateRecurrentValue(attr, cellIndex, i);
          const numValue = parseFloat(value) || 0;
          if (!isNaN(numValue)) {
            total += numValue;
          }
        }
        return total;
      }
      return "";
    });

    return (
      <div className="flex-1 overflow-x-auto scrollbar-hide">
        <div className="flex flex-row overflow-y-auto gap-2">
          <table className="table-auto w-max min-w-full">
            <thead className="sticky top-0 bg-white z-10">
              <tr className="border-b border-gray-200 transition-all duration-200">
                {currentSheet.attributes.map((attr, index) => {
                  const columnType = getColumnType(attr);
                  const isHovered = hoveredColumn === index;
                  const isHighlighted =
                    hoveredColumn !== null &&
                    hoveredColumn !== index &&
                    (currentSheet.attributes[hoveredColumn]?.derived ||
                      currentSheet.attributes[hoveredColumn]?.recurrentCheck
                        ?.isRecurrent);

                  let headerClass = getColumnClass(columnType);

                  if (isHighlighted) {
                    const hoveredAttr = currentSheet.attributes[hoveredColumn];
                    if (hoveredAttr?.formula) {
                      const additionIndices =
                        hoveredAttr.formula["additionIndices"] || [];
                      const subtractionIndices =
                        hoveredAttr.formula["subtractionIndices"] || [];

                      if (additionIndices.includes(index)) {
                        headerClass = "bg-green-200 text-green-900";
                      } else if (subtractionIndices.includes(index)) {
                        headerClass = "bg-red-200 text-red-900";
                      }
                    } else if (hoveredAttr?.recurrentCheck?.isRecurrent) {
                      const recurrentIndex =
                        hoveredAttr.recurrentCheck.recurrentReferenceIndice;
                      if (recurrentIndex === index) {
                        headerClass = "bg-purple-200 text-purple-900";
                      }
                    }
                  }

                  return (
                    <th
                      key={index}
                      className={`relative px-4 py-3 text-center text-xs font-medium uppercase tracking-wider whitespace-nowrap transition-all duration-200 ${headerClass}`}
                      onMouseEnter={() => {
                        if (attr.derived || attr.recurrentCheck?.isRecurrent) {
                          onColumnHover(index);
                        }
                      }}
                      onMouseLeave={() => onColumnHover(null)}
                      onContextMenu={(e) => {
                        if (isAdmin) {
                          e.preventDefault();
                          onContextMenuOpen(index, e.clientX, e.clientY);
                        }
                      }}
                    >
                      <div className="flex items-center justify-center gap-1">
                        {attr.name
                          .replace(/-/g, " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                        {(columnType === "derived" ||
                          columnType === "recurrent") && (
                          <Info className="w-3 h-3 text-gray-600" />
                        )}
                      </div>
                      {isHovered &&
                        (attr.derived || attr.recurrentCheck?.isRecurrent) &&
                        renderFormulaTooltip(attr, index)}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rows.map((row, rowIndex) => {
                const isBlankRow = rowIndex === rows.length - 1;

                return (
                  <React.Fragment key={rowIndex}>
                    {/* Main row */}
                    <tr
                      className={`hover:bg-gray-50 cursor-pointer ${
                        isBlankRow
                          ? checkTodaysData()
                            ? "display-none bg-green-50 cursor-default"
                            : "bg-blue-50 cursor-pointer hover:bg-blue-100"
                          : "cursor-none"
                      }`}
                      onClick={() =>
                        isBlankRow
                          ? handleBlankRowClick()
                          : handleRowClick(rowIndex)
                      }
                    >
                      {row.map((cell, cellIndex) => {
                        const attr = currentSheet.attributes[cellIndex];
                        const columnType = getColumnType(attr);
                        const isDisabled =
                          (columnType === "derived" ||
                            columnType === "referenced") &&
                          !isBlankRow;
                        const hasSubrowsEnabled = hasSubrows(attr);
                        const isExpanded =
                          hasSubrowsEnabled &&
                          isRowExpanded(rowIndex, cellIndex);

                        return (
                          <td
                            key={cellIndex}
                            className={`px-4 py-3 whitespace-nowrap text-sm ${
                              columnType === "derived"
                                ? "text-gray-950"
                                : columnType === "referenced"
                                ? "text-gray-950"
                                : columnType === "recurrent"
                                ? "text-gray-950"
                                : "text-gray-900 font-medium"
                            } ${isDisabled ? "opacity-75" : ""} text-center`}
                            onDoubleClick={(e) => {
                              if (isBlankRow) return;
                              if (hasSubrowsEnabled) {
                                e.stopPropagation();
                                handleRowDoubleClick(rowIndex, cellIndex);
                              }
                            }}
                          >
                            <div className="flex items-center justify-center relative">
                              <div
                                className={`${
                                  columnType === "derived" && !isBlankRow
                                    ? "bg-yellow-200 rounded-md px-3 py-1 w-full inline-block"
                                    : columnType === "referenced" && !isBlankRow
                                    ? "bg-gray-200 rounded-md w-full px-3 py-1 inline-block"
                                    : columnType === "recurrent" && !isBlankRow
                                    ? "bg-purple-200 rounded-md w-full px-3 py-1 inline-block"
                                    : ""
                                }`}
                              >
                                {/* Main cell content */}
                                {isBlankRow &&
                                (columnType === "derived" ||
                                  columnType === "referenced" ||
                                  columnType === "recurrent")
                                  ? "--"
                                  : (() => {
                                      let displayValue = cell;
                                      return (
                                        displayValue ||
                                        (isBlankRow
                                          ? checkTodaysData()
                                            ? "Data complete"
                                            : "Click to enter today's data"
                                          : "0")
                                      );
                                    })()}
                              </div>
                              {hasSubrowsEnabled && !isBlankRow && (
                                <span
                                  className={`ml-2 cursor-pointer text-xs font-bold transition-transform duration-200 ${
                                    isExpanded
                                      ? "text-blue-600 transform"
                                      : "text-gray-400 hover:text-blue-600"
                                  }`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRowDoubleClick(rowIndex, cellIndex);
                                  }}
                                  title={
                                    isExpanded
                                      ? "Click to collapse"
                                      : "Click to expand subrows"
                                  }
                                >
                                  {isExpanded ? "▼" : "▶"}
                                </span>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                    {/* Expanded subrows section */}
                    {currentSheet.attributes.map((attr, colIndex) => {
                      if (
                        !hasSubrows(attr) ||
                        isBlankRow ||
                        !isRowExpanded(rowIndex, colIndex)
                      ) {
                        return null;
                      }

                      const subrows = getSubrowsForRowAndColumn(
                        rowIndex,
                        colIndex
                      );

                      return (
                        <tr
                          key={`expanded-${rowIndex}-${colIndex}`}
                          className="bg-blue-50"
                        >
                          <td
                            colSpan={currentSheet.attributes.length}
                            className="px-4 py-3"
                          >
                            <div className="bg-white rounded-lg border border-blue-200 p-4 shadow-sm">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="text-sm font-semibold text-gray-800">
                                  {attr.name
                                    .replace(/-/g, " ")
                                    .replace(/\b\w/g, (l) =>
                                      l.toUpperCase()
                                    )}{" "}
                                  - Subrows Details
                                </h4>
                                <button
                                  onClick={() =>
                                    handleRowDoubleClick(rowIndex, colIndex)
                                  }
                                  className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                  <X size={16} />
                                </button>
                              </div>

                              {renderSubrowsTable(subrows, attr)}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}

              {/* Totals row */}
              <tr className="bg-gray-100 font-semibold border-t-2 border-gray-300">
                {totalsRow.map((total, cellIndex) => (
                  <td
                    key={cellIndex}
                    className="px-4 py-3 whitespace-nowrap text-sm text-gray-800 text-center"
                  >
                    {total}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
          {isAdmin && (
            <div
              onClick={handleDropdownClick}
              className="flex rounded-[1rem] items-center justify-center cursor-pointer bg-gray-200 border-l border-gray-200 px-4 relative flex-shrink-0"
              style={{ minWidth: "150px" }}
            >
              <div className="absolute top-2 left-2">
                <div className="relative">
                  <button className="flex flex-row items-center justify-center text-sm text-gray-700 hover:text-blue-600">
                    <Plus className="w-5 h-5 mb-1" /> Add Attribute
                  </button>
                </div>
              </div>
              {showColumnTypeDropdown && (
                <div
                  className="absolute top-20 right-0 mt-2 w-40 bg-white shadow-lg rounded-md border border-gray-200 z-50 column-dropdown-container"
                  style={{
                    left: dropdownPosition.x - 100,
                    top: dropdownPosition.y + 10,
                  }}
                >
                  <button
                    className="w-full px-4 py-2 text-left hover:bg-gray-100"
                    onClick={() => onColumnModalOpen("independent")}
                  >
                    Independent
                  </button>
                  <button
                    className="w-full px-4 py-2 text-left hover:bg-gray-100"
                    onClick={() => onColumnModalOpen("derived")}
                  >
                    Derived
                  </button>
                </div>
              )}
              <button className="flex flex-col items-center text-sm text-gray-700 hover:text-blue-600">
                <Plus className="w-5 h-5 mb-1" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render Modal
  const renderModal = () => {
    if (!showModal) return null;

    return (
      <div className="fixed inset-0 bg-black/70 bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4">
          <h2 className="text-lg font-semibold mb-4">
            {modalType === "insert"
              ? "Values to be fed today"
              : "Update Row Values"}
          </h2>

          <div className="grid grid-cols-4 gap-4">
            {currentSheet.attributes.map((attr, index) => {
              const columnType = getColumnType(attr);

              const isRecurrentField = columnType === "recurrent";
              const isRecurrentDisabled =
                isRecurrentField && attr.recurrentCheck?.recurrenceFedStatus;

              const isDisabled =
                columnType === "derived" ||
                columnType === "referenced" ||
                isRecurrentDisabled;

              const isDateField =
                attr.name.toLowerCase() === "date" || index === 0;

              // For insert mode, date field should be disabled and show today's date
              const shouldDisableDateInInsert =
                modalType === "insert" && isDateField;

              // Final disabled state
              const finalDisabled = isDisabled || shouldDisableDateInInsert;

              let displayValue = modalData[attr.name] || "";

              // Handle date field properly
              if (isDateField) {
                if (modalType === "insert") {
                  // For insert mode, always show today's date in correct format
                  displayValue = getTodaysDate();
                } else {
                  // For update mode, show the existing date
                  displayValue = modalData[attr.name] || "";
                }
              } else if (
                isRecurrentField &&
                !displayValue &&
                modalType === "insert"
              ) {
                if (attr.recurrentCheck?.recurrenceFedStatus) {
                  displayValue = getRecurrentValueForDisplay(attr);
                }
              } else if (
                isRecurrentField &&
                !displayValue &&
                modalType === "update" &&
                selectedRowIndex !== null
              ) {
                displayValue = calculateRecurrentValue(
                  attr,
                  index,
                  selectedRowIndex
                );
              }

              // Handle subrows total calculation
              if (
                shouldOpenSubrowsModal(attr) &&
                subrowsData[attr.name] &&
                subrowsData[attr.name].length > 0
              ) {
                const total = subrowsData[attr.name].reduce((sum, subrow) => {
                  const aggregateField = attr.subrowsConfig.aggregateField;
                  const value = parseFloat(subrow[aggregateField]) || 0;
                  return sum + value;
                }, 0);
                displayValue = total.toString();
              }

              // Input type should be text for date field, number for others
              const inputType = isDateField ? "text" : "number";

              return (
                <div key={index} className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    {attr.name
                      .replace(/-/g, " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                    {columnType === "derived" && " ⭐"}
                    {columnType === "referenced" && " 🔗"}
                    {columnType === "recurrent" && " 🔄"}
                    {shouldDisableDateInInsert && " 📅"}
                    {!isDateField && !isDisabled && " 🔢"}
                  </label>
                  <div className="relative">
                    <div className="flex items-center relative">
                      <input
                        type={inputType}
                        value={displayValue || ""}
                        onChange={(e) => {
                          if (!finalDisabled) {
                            handleInputChange(attr.name, e.target.value);
                          }
                        }}
                        disabled={finalDisabled}
                        placeholder={
                          isDateField
                            ? shouldDisableDateInInsert
                              ? "Today's date (auto-filled)"
                              : "Select Date"
                            : isRecurrentField && isRecurrentDisabled
                            ? "Auto-calculated from previous period"
                            : isRecurrentField && !isRecurrentDisabled
                            ? "Enter value or auto-fill from previous period"
                            : columnType === "derived"
                            ? "Auto-calculated"
                            : columnType === "referenced"
                            ? "Referenced from another sheet"
                            : "Enter number"
                        }
                        {...(!isDateField &&
                          !finalDisabled && {
                            step: "any",
                            min: undefined,
                          })}
                        className={`flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm ${
                          columnType === "derived"
                            ? "bg-yellow-50 border-yellow-300"
                            : columnType === "referenced"
                            ? "bg-blue-50 border-blue-300 opacity-60"
                            : isRecurrentField && !isRecurrentDisabled
                            ? "bg-purple-50 border-purple-300 opacity-60"
                            : shouldDisableDateInInsert
                            ? "bg-gray-50 border-gray-300"
                            : "bg-blue-50 border-blue-300"
                        } ${
                          finalDisabled ? "cursor-not-allowed opacity-75" : ""
                        }`}
                      />

                      {/* Add the subrows button here */}
                      {renderSubrowsButton(attr.name)}

                      {/* Add-on button for recurrent fields */}
                      {isRecurrentField && (
                        <button
                          type="button"
                          onClick={(e) => handleAddOnClick(attr.name, e)}
                          className="ml-2 w-6 h-6 bg-purple-600 text-white rounded-full text-xs font-bold hover:bg-purple-700 transition-colors flex items-center justify-center"
                          title="Add value to recurrent amount"
                        >
                          +
                        </button>
                      )}
                    </div>

                    {/* Help text */}
                    {columnType === "derived" && attr.humanFormula && (
                      <div className="text-xs text-gray-500 mt-1">
                        Formula: {attr.humanFormula}
                      </div>
                    )}
                    {columnType === "recurrent" && (
                      <div className="text-xs text-purple-600 mt-1">
                        Value from previous period of:{" "}
                        {currentSheet.attributes[
                          attr.recurrentCheck?.recurrentReferenceIndice
                        ]?.name
                          ?.replace(/-/g, " ")
                          ?.replace(/\b\w/g, (l) => l.toUpperCase()) ||
                          "Unknown"}
                      </div>
                    )}
                    {isDateField && shouldDisableDateInInsert && (
                      <div className="text-xs text-gray-600 mt-1">
                        Today's date - automatically filled for new entries
                      </div>
                    )}
                    {isDateField && !shouldDisableDateInInsert && (
                      <div className="text-xs text-blue-600 mt-1">
                        You can modify this date if needed
                      </div>
                    )}
                    {shouldOpenSubrowsModal(attr) && (
                      <div className="text-xs text-blue-600 mt-1">
                        {subrowsData[attr.name] &&
                        subrowsData[attr.name].length > 0
                          ? `Subrows: ${
                              subrowsData[attr.name].length
                            } entries, Total: ${displayValue}`
                          : "Click 'Details' button to add subrows"}
                      </div>
                    )}
                    {!isDateField &&
                      !isDisabled &&
                      !shouldOpenSubrowsModal(attr) && (
                        <div className="text-xs text-blue-600 mt-1">
                          Number field - Only numeric values allowed
                        </div>
                      )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => onModalClose()}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleModalSubmit}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 capitalize"
            >
              {modalType}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderAddOnModal = () => {
    if (!showAddOnModal) return null;

    return (
      <div
        className="fixed bg-white border border-gray-300 rounded-lg shadow-lg p-4 z-[60] min-w-[250px]"
        style={{
          left: `${addOnPosition.x}px`,
          top: `${addOnPosition.y}px`,
        }}
      >
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-gray-800 mb-1">
            Add to Recurrent Value
          </h3>
          <p className="text-xs text-gray-600">
            Current value: {modalData[addOnFieldName] || "0"}
          </p>
        </div>

        <div className="mb-3">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Amount to Add:
          </label>
          <input
            type="number"
            value={addOnValue}
            onChange={(e) => onInputChange("addOnValue", e.target.value)}
            placeholder="Enter amount"
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            autoFocus
            step="any"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleAddOnSave}
            className="flex-1 bg-purple-600 text-white text-xs py-1 px-2 rounded hover:bg-purple-700 transition-colors"
          >
            Add
          </button>
          <button
            onClick={handleAddOnCancel}
            className="flex-1 bg-gray-300 text-gray-700 text-xs py-1 px-2 rounded hover:bg-gray-400 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      {renderTable()}
      {renderModal()}
      {renderAddOnModal()}
    </>
  );
};

export default ViewTable;