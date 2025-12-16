import { useState, useEffect } from "react";
import {
  X,
  Plus,
  ChevronDown,
  Minus,
  Info,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { checkAvailableLinks } from "../../../../services/repository/sheetsRepo";

import { createPortal } from "react-dom";

export const ColumnCreationForm = ({
  isOpen,
  onClose,
  onSave,
  type,
  sheets,
  currentSheetId,
}) => {
  const [columnName, setColumnName] = useState("");
  const [showReference, setShowReference] = useState(false);
  const [selectedReferenceSheet, setSelectedReferenceSheet] = useState(null);
  const [selectedReferenceColumn, setSelectedReferenceColumn] = useState(null);
  const [isReferenceDropdownOpen, setIsReferenceDropdownOpen] = useState(false);
  const [derivedAdditions, setDerivedAdditions] = useState([]);
  const [derivedSubtractions, setDerivedSubtractions] = useState([]);

  const [showRecurrent, setShowRecurrent] = useState(false);
  const [selectedRecurrentColumn, setSelectedRecurrentColumn] = useState(null);
  const [availableSheetsForReference, setAvailableSheetsForReference] =
    useState([]);
  const [sheetSearchTerm, setSheetSearchTerm] = useState("");
  const [columnSearchTerm, setColumnSearchTerm] = useState("");

  const [showSubrows, setShowSubrows] = useState(false);
  const [subrowColumns, setSubrowColumns] = useState([]);
  const [aggregateField, setAggregateField] = useState("");
  const [aggregationType, setAggregationType] = useState("sum");
  const [subrowsEnabled, setSubrowsEnabled] = useState(true);

  // Get available sheets (excluding current sheet) from processed data
  const availableSheets = sheets.filter(
    (sheet) => sheet["_id"] !== currentSheetId
  );

  // Get current sheet attributes from processed data
  const currentSheet = sheets.find((s) => s["_id"] === currentSheetId);
  const currentAttributes = currentSheet?.attributes || [];

  const [isHidden, setIsHidden] = useState(false);

  useEffect(() => {
    const checkReferences = async () => {
      if (currentSheetId && type === "independent") {
        const result = await checkAvailableLinks(currentSheetId);
        if (result.success) {
          const filteredSheets = availableSheets.filter(
            (sheet) => !result.unavailableSheets.includes(sheet._id)
          );
          setAvailableSheetsForReference(filteredSheets);
        }
      }
    };

    checkReferences();
  }, [currentSheetId, type]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isReferenceDropdownOpen && !event.target.closest(".relative")) {
        setIsReferenceDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isReferenceDropdownOpen]);

  const handleSave = () => {
    console.log("Saving column data...");
    if (columnName.trim()) {
      const columnData = {
        name: columnName.trim().toLowerCase().replace(/\s+/g, "-"),
        reference: showReference
          ? {
              sheetId: selectedReferenceSheet?.["_id"],
              columnIndex: selectedReferenceColumn?.index,
              columnName: selectedReferenceColumn?.name,
            }
          : null,
        additionIndices: derivedAdditions,
        subtractionIndices: derivedSubtractions,
        recurrent:
          showRecurrent && selectedRecurrentColumn
            ? {
                recurrentColumnIndex: selectedRecurrentColumn.index,
                recurrentColumnName: selectedRecurrentColumn.name,
              }
            : null,
        // Add subrows configuration with subrowsEnabled
        hasSubrows: showSubrows,
        subrowsConfig: showSubrows
          ? {
              subrowsEnabled, // Add this line
              subrowColumns: subrowColumns.filter((col) => col.name.trim()),
              aggregateField,
              aggregationType,
            }
          : null,
        isHidden: isHidden,
      };

      console.log("Column data being saved:", columnData);
      onSave(columnData);
      resetForm();
      onClose();
    }
  };

  const handleReferenceToggle = () => {
    if (showRecurrent) {
      // If recurrent is active, disable it first
      setShowRecurrent(false);
      setSelectedRecurrentColumn(null);
    }
    setShowReference(!showReference);
    if (showReference) {
      // If turning off reference, clear selections
      setSelectedReferenceSheet(null);
      setSelectedReferenceColumn(null);
    }
  };

  const handleRecurrentToggle = () => {
    // console.log("Current attributes for debugging:", currentAttributes);
    // console.log("Sample attribute structure:", currentAttributes[0]);
    if (showReference) {
      // If reference is active, disable it first
      setShowReference(false);
      setSelectedReferenceSheet(null);
      setSelectedReferenceColumn(null);
    }
    setShowRecurrent(!showRecurrent);
    if (showRecurrent) {
      // If turning off recurrent, clear selections
      setSelectedRecurrentColumn(null);
    }
  };

  const resetForm = () => {
    setColumnName("");
    setShowReference(false);
    setSelectedReferenceSheet(null);
    setSelectedReferenceColumn(null);
    setIsReferenceDropdownOpen(false);
    setDerivedAdditions([]);
    setDerivedSubtractions([]);
    setShowRecurrent(false);
    setSelectedRecurrentColumn(null);
    setSheetSearchTerm("");
    setColumnSearchTerm("");
    setShowSubrows(false);
    setSubrowColumns([]);
    setAggregateField("");
    setAggregationType("sum");
    setSubrowsEnabled(true);
    setIsHidden(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Handle checkbox changes to prevent conflicts between addition and subtraction
  const handleAdditionChange = (index, isChecked) => {
    if (isChecked) {
      // Add to additions and remove from subtractions if present
      setDerivedAdditions((prev) => [
        ...prev.filter((i) => i !== index),
        index,
      ]);
      setDerivedSubtractions((prev) => prev.filter((i) => i !== index));
    } else {
      // Remove from additions
      setDerivedAdditions((prev) => prev.filter((i) => i !== index));
    }
  };

  const handleSubtractionChange = (index, isChecked) => {
    if (isChecked) {
      // Add to subtractions and remove from additions if present
      setDerivedSubtractions((prev) => [
        ...prev.filter((i) => i !== index),
        index,
      ]);
      setDerivedAdditions((prev) => prev.filter((i) => i !== index));
    } else {
      // Remove from subtractions
      setDerivedSubtractions((prev) => prev.filter((i) => i !== index));
    }
  };

  const handleAddAll = () => {
    // Add all non-derived columns to additions
    const allIndices = currentAttributes
      .map((attr, index) => ({ attr, index }))
      .filter(({ attr }) => attr.name.toLowerCase() !== "date")
      .map(({ index }) => index);

    setDerivedAdditions(allIndices);
    setDerivedSubtractions([]);
  };

  const handleSubtractAll = () => {
    // Add all non-derived columns to subtractions
    const allIndices = currentAttributes
      .map((attr, index) => ({ attr, index }))
      .filter(({ attr }) => attr.name.toLowerCase() !== "date")
      .map(({ index }) => index);

    setDerivedSubtractions(allIndices);
    setDerivedAdditions([]);
  };

  if (!isOpen) return null;

  const getColumnTypeForDisplay = (col) => {
    if (col.derived === true) {
      return "Derived";
    }
    if (
      col.linkedFrom?.sheetObjectId !== null &&
      col.linkedFrom?.sheetObjectId !== undefined
    ) {
      return "Referenced";
    }
    if (col.recurrentCheck?.isRecurrent === true) {
      return "Recurrent";
    }
    return "Independent";
  };

  const getColumnTypeClass = (col) => {
    const type = getColumnTypeForDisplay(col);
    switch (type) {
      case "Derived":
        return "bg-yellow-100 text-yellow-700";
      case "Referenced":
        return "bg-blue-100 text-blue-700";
      case "Recurrent":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const filteredSheetsForReference = availableSheetsForReference.filter(
    (sheet) =>
      sheet.sheetName.toLowerCase().includes(sheetSearchTerm.toLowerCase())
  );

  const handleSubrowsToggle = () => {
    if (showReference) {
      setShowReference(false);
      setSelectedReferenceSheet(null);
      setSelectedReferenceColumn(null);
    }
    if (showRecurrent) {
      setShowRecurrent(false);
      setSelectedRecurrentColumn(null);
    }
    setShowSubrows(!showSubrows);
    if (showSubrows) {
      // Clear subrows data when turning off
      setSubrowColumns([]);
      setAggregateField("");
      setAggregationType("sum");
      setSubrowsEnabled(true); // Reset to default
    }
  };

  const handleAddSubrowColumn = () => {
    const newColumn = {
      id: Date.now(),
      name: "",
      type: "string",
      required: false,
    };
    setSubrowColumns([...subrowColumns, newColumn]);
  };

  const handleUpdateSubrowColumn = (id, field, value) => {
    setSubrowColumns(
      subrowColumns.map((col) =>
        col.id === id ? { ...col, [field]: value } : col
      )
    );
  };

  const handleRemoveSubrowColumn = (id) => {
    setSubrowColumns(subrowColumns.filter((col) => col.id !== id));
    // Clear aggregate field if the removed column was selected
    const removedColumn = subrowColumns.find((col) => col.id === id);
    if (removedColumn && aggregateField === removedColumn.name) {
      setAggregateField("");
    }
  };
  const filteredColumnsForReference = selectedReferenceSheet
    ? selectedReferenceSheet.attributes.filter((col) => col.isDeleted !== true).filter((col) =>
        col.name.toLowerCase().includes(columnSearchTerm.toLowerCase())
      )
    : [];

  return (
    <div className="fixed inset-0 bg-black/60 bg-opacity-50 flex items-center justify-center z-50">
      <div className="p-6 rounded-lg w-200 bg-white shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            Create {type === "derived" ? "Derived" : "Independent"} Column
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-900"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Column Name Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2 text-gray-700">
            Column Name
          </label>
          <input
            type="text"
            value={columnName}
            onChange={(e) => setColumnName(e.target.value)}
            className="w-full px-3 py-2 border rounded-md text-gray-800 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter column name"
          />
        </div>

        {/* isHidden Toggle */}
        <div className="mb-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-700">Column Visibility</span>
              <span className="text-xs text-gray-500">
                Hidden columns are not displayed by default in the table view
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isHidden}
                onChange={(e) => setIsHidden(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
            </label>
          </div>
          {isHidden && (
            <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded-md">
              <div className="flex items-center gap-2">
                <span className="text-sm text-orange-800 font-medium">⚠️ Hidden Column</span>
              </div>
              <div className="text-xs text-orange-700 mt-1">
                This column will be hidden by default. Users can show it using the "Show Hidden" button.
              </div>
            </div>
          )}
        </div>

        {/* Independent Column with Reference */}
        {type === "independent" && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={handleReferenceToggle}
                disabled={showRecurrent}
                className={`flex items-center gap-2 px-3 py-2 text-sm border rounded-md transition-colors ${
                  showReference
                    ? "bg-blue-100 text-blue-700 border-blue-300"
                    : showRecurrent
                    ? "border-gray-200 text-gray-400 cursor-not-allowed"
                    : "border-gray-300 text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Plus className="w-4 h-4" />
                {showReference ? "Remove Reference" : "Reference Column"}
              </button>
              <button
                onClick={handleRecurrentToggle}
                disabled={showReference}
                className={`flex items-center gap-2 px-3 py-2 text-sm border rounded-md transition-colors ${
                  showRecurrent
                    ? "bg-purple-100 text-purple-700 border-purple-300"
                    : showReference
                    ? "border-gray-200 text-gray-400 cursor-not-allowed"
                    : "border-gray-300 text-gray-600 hover:bg-gray-100"
                }`}
              >
                <RotateCcw className="w-4 h-4" />
                {showRecurrent ? "Remove Recurrent" : "Add Recurrent"}
              </button>
              <button
                onClick={handleSubrowsToggle}
                disabled={showReference || showRecurrent}
                className={`flex items-center gap-2 px-3 py-2 text-sm border rounded-md transition-colors ${
                  showSubrows
                    ? "bg-green-100 text-green-700 border-green-300"
                    : showReference || showRecurrent
                    ? "border-gray-200 text-gray-400 cursor-not-allowed"
                    : "border-gray-300 text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Plus className="w-4 h-4" />
                {showSubrows ? "Remove Subrows" : "Enable Subrows"}
              </button>
            </div>

            {showReference && (
              <div className="space-y-3 p-4 bg-blue-50 rounded-lg border">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">
                    Reference from another sheet
                  </label>
                  <button
                    onClick={() => setShowReference(false)}
                    className="text-gray-500 hover:text-gray-900"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Sheet Dropdown */}
                <div className="relative">
                  {/* Search Input */}
                  <div className="relative mb-2">
                    <input
                      type="text"
                      placeholder="Search sheets..."
                      value={sheetSearchTerm}
                      onChange={(e) => setSheetSearchTerm(e.target.value)}
                      onFocus={() => setIsReferenceDropdownOpen(true)}
                      className="w-full px-3 py-2 pr-8 border rounded-md bg-white border-gray-300 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>

                  {/* Selected Sheet Display */}
                  {selectedReferenceSheet && (
                    <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded-md flex items-center justify-between">
                      <span className="text-sm text-blue-800 font-medium">
                        Selected:{" "}
                        {selectedReferenceSheet.sheetName
                          .replace(/-/g, " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                      </span>
                      <button
                        onClick={() => {
                          setSelectedReferenceSheet(null);
                          setSelectedReferenceColumn(null);
                          setSheetSearchTerm("");
                          setColumnSearchTerm("");
                        }}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* Dropdown List */}
                  {isReferenceDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 w-full border rounded-md shadow-lg bg-white z-20 max-h-48 overflow-y-auto">
                      {filteredSheetsForReference.length > 0 ? (
                        filteredSheetsForReference.map((sheet) => (
                          <button
                            key={sheet["_id"]}
                            onClick={() => {
                              setSelectedReferenceSheet(sheet);
                              setSelectedReferenceColumn(null);
                              setIsReferenceDropdownOpen(false);
                              setSheetSearchTerm(sheet.sheetName);
                              setColumnSearchTerm("");
                            }}
                            className="w-full px-3 py-2 text-left hover:bg-gray-100 border-b border-gray-100 last:border-b-0 focus:outline-none focus:bg-blue-50"
                          >
                            <div className="flex items-center justify-between">
                              <span>
                                {sheet["sheetName"]
                                  .replace(/-/g, " ")
                                  .replace(/\b\w/g, (l) => l.toUpperCase())}
                              </span>
                              <span className="text-xs text-gray-500">
                                {sheet.attributes?.length || 0} columns
                              </span>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-gray-500 text-sm">
                          {sheetSearchTerm
                            ? `No sheets found for "${sheetSearchTerm}"`
                            : "No sheets available for reference"}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Column Selection */}
                {selectedReferenceSheet && (
                  <div className="space-y-2">
                    {/* <label className="text-sm font-medium text-gray-700">
                      Select Column
                    </label> */}

                    {/* Column Search Input */}
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search columns..."
                        value={columnSearchTerm}
                        onChange={(e) => setColumnSearchTerm(e.target.value)}
                        className="w-full px-3 py-2 border rounded-md bg-white border-gray-300 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Selected Column Display */}
                    {selectedReferenceColumn && (
                      <div className="p-2 bg-green-50 border border-green-200 rounded-md flex items-center justify-between">
                        <span className="text-sm text-green-800 font-medium">
                          Selected:{" "}
                          {selectedReferenceColumn.name
                            .replace(/-/g, " ")
                            .replace(/\b\w/g, (l) => l.toUpperCase())}
                        </span>
                        <button
                          onClick={() => {
                            setSelectedReferenceColumn(null);
                            setColumnSearchTerm("");
                          }}
                          className="text-green-600 hover:text-green-800"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {/* Column List */}
                    <div className="max-h-32 overflow-y-auto border rounded-md bg-white">
                      {filteredColumnsForReference.length > 0 ? (
                        filteredColumnsForReference.map((col, index) => {
                          // Find the original index in the unfiltered array
                          const originalIndex =
                            selectedReferenceSheet.attributes.findIndex(
                              (attr) => attr.name === col.name && attr.isDeleted !== true
                            );

                          return (
                            <button
                              key={originalIndex}
                              onClick={() => {
                                setSelectedReferenceColumn({
                                  ...col,
                                  index: originalIndex,
                                });
                                setColumnSearchTerm(col.name);
                              }}
                              className={`w-full px-3 py-2 text-left transition-colors border-b border-gray-100 last:border-b-0 focus:outline-none ${
                                selectedReferenceColumn?.index === originalIndex
                                  ? "bg-blue-100 text-blue-800"
                                  : "hover:bg-gray-100 text-gray-800"
                              }`}
                            >
                              <div className="flex justify-between items-center">
                                <span className="capitalize">
                                  {col.name
                                    .replace(/-/g, " ")
                                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                                </span>
                                <span
                                  className={`text-xs px-2 py-1 rounded ${getColumnTypeClass(
                                    col
                                  )}`}
                                >
                                  {getColumnTypeForDisplay(col)}
                                </span>
                              </div>
                            </button>
                          );
                        })
                      ) : (
                        <div className="px-3 py-2 text-gray-500 text-sm">
                          {columnSearchTerm
                            ? `No columns found for "${columnSearchTerm}"`
                            : "No columns available"}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Reference Preview */}
                {selectedReferenceSheet && selectedReferenceColumn && (
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <div className="text-sm font-medium text-blue-800 mb-1">
                      Reference Preview:
                    </div>
                    <div className="text-sm text-blue-700">
                      <span className="font-medium">
                        {columnName || "New Column"}
                      </span>
                      {" will reference "}
                      <span className="font-medium">
                        {selectedReferenceColumn.name
                          .replace(/-/g, " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                      </span>
                      {" from "}
                      <span className="font-medium">
                        {selectedReferenceSheet.sheetName
                          .replace(/-/g, " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {showRecurrent && (
              <div className="space-y-4 p-4 bg-purple-50 rounded-lg border">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">
                    Reference Column from Current Sheet
                  </label>
                  <button
                    onClick={() => setShowRecurrent(false)}
                    className="text-gray-500 hover:text-gray-900"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="max-h-32 overflow-y-auto flex flex-col gap-2">
                  {currentAttributes.map((col, index) => {
                    // if (col.derived) return null;
                    return (
                      <button
                        key={index}
                        onClick={() =>
                          setSelectedRecurrentColumn({ ...col, index })
                        }
                        className={`w-full px-3 py-2 rounded-md text-left transition-colors ${
                          selectedRecurrentColumn?.index === index
                            ? "bg-purple-200 text-purple-800 border border-purple-300"
                            : "bg-white hover:bg-purple-50 border border-gray-200"
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="font-medium capitalize">
                              {col.name.replace(/_/g, " ").replace(/-/g, " ")}
                            </span>
                            {/* {col.linkedFrom?.sheetObjectId && (
                              <div className="text-xs text-gray-500 mt-1">
                                Linked from external sheet
                              </div>
                            )} */}
                          </div>
                          <div className="flex gap-2">
                            <span
                              className={`text-xs px-2 py-1 rounded ${getColumnTypeClass(
                                col
                              )}`}
                            >
                              {getColumnTypeForDisplay(col)}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Recurrent Preview */}
                {selectedRecurrentColumn && (
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <div className="text-sm font-medium text-purple-800 mb-1">
                      Recurrent Preview:
                    </div>
                    <div className="text-sm text-purple-700">
                      <span className="font-medium">
                        {columnName || "New Column"}
                      </span>
                      {" will get its value from "}
                      <span className="font-medium">
                        {selectedRecurrentColumn.name
                          .replace(/_/g, " ")
                          .replace(/-/g, " ")}
                      </span>
                      {" from the previous period"}
                    </div>
                  </div>
                )}
              </div>
            )}

            {showSubrows && (
              <div className="space-y-4 p-4 bg-green-50 rounded-lg border mt-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">
                    Configure Subrows Structure
                  </label>
                  <button
                    onClick={() => setShowSubrows(false)}
                    className="text-gray-500 hover:text-gray-900"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 bg-white rounded border border-gray-200">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-700">
                      Enable Subrows Input
                    </span>
                    <span className="text-xs text-gray-500">
                      When enabled, users can input data through subrows. When
                      disabled, only direct input is allowed.
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={subrowsEnabled}
                      onChange={(e) => setSubrowsEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                  </label>
                </div>

                {/* Subrow Columns Configuration */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Subrow Columns
                    </span>
                    <button
                      onClick={handleAddSubrowColumn}
                      className="flex items-center gap-1 px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      <Plus className="w-3 h-3" />
                      Add Column
                    </button>
                  </div>

                  {subrowColumns.length === 0 && (
                    <div className="text-sm text-gray-500 text-center py-4 border-2 border-dashed border-gray-300 rounded-md">
                      No subrow columns configured. Click "Add Column" to start.
                    </div>
                  )}

                  <div className="flex flex-col gap-2 max-h-[10rem] overflow-y-auto">
                    {subrowColumns.map((column) => (
                      <div
                        key={column.id}
                        className="flex items-center gap-2 p-3 bg-white rounded border border-gray-200"
                      >
                        {/* Column Name */}
                        <div className="flex-1">
                          <input
                            type="text"
                            placeholder="Column name"
                            value={column.name}
                            onChange={(e) =>
                              handleUpdateSubrowColumn(
                                column.id,
                                "name",
                                e.target.value
                              )
                            }
                            className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                          />
                        </div>

                        {/* Column Type */}
                        <div className="w-24">
                          <select
                            value={column.type}
                            onChange={(e) =>
                              handleUpdateSubrowColumn(
                                column.id,
                                "type",
                                e.target.value
                              )
                            }
                            className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                          >
                            <option value="string">Text</option>
                            <option value="number">Number</option>
                            <option value="date">Date</option>
                          </select>
                        </div>

                        {/* Required Checkbox */}
                        <div className="flex items-center gap-1">
                          <input
                            type="checkbox"
                            checked={column.required}
                            onChange={(e) =>
                              handleUpdateSubrowColumn(
                                column.id,
                                "required",
                                e.target.checked
                              )
                            }
                            className="text-green-600 focus:ring-green-500"
                          />
                          <span className="text-xs text-gray-600">
                            Required
                          </span>
                        </div>

                        {/* Remove Button */}
                        <button
                          onClick={() => handleRemoveSubrowColumn(column.id)}
                          className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Aggregate Configuration */}
                {subrowColumns.length > 0 && (
                  <div className="space-y-3 pt-3 border-t border-gray-200">
                    <span className="text-sm font-medium text-gray-700">
                      Aggregation Settings
                    </span>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Aggregate Field Selection */}
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          Aggregate Field
                        </label>
                        <select
                          value={aggregateField}
                          onChange={(e) => setAggregateField(e.target.value)}
                          className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                        >
                          <option value="">Select field to aggregate</option>
                          {subrowColumns
                            .filter(
                              (col) => col.type === "number" && col.name.trim()
                            )
                            .map((col) => (
                              <option key={col.id} value={col.name}>
                                {col.name}
                              </option>
                            ))}
                        </select>
                      </div>

                      {/* Aggregation Type */}
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          Aggregation Type
                        </label>
                        <select
                          value={aggregationType}
                          onChange={(e) => setAggregationType(e.target.value)}
                          className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                          disabled={!aggregateField}
                        >
                          <option value="sum">Sum</option>
                          {/* Future options: average, max, min */}
                        </select>
                      </div>
                    </div>

                    {/* Preview */}
                    {aggregateField && (
                      <div className="p-2 bg-green-100 rounded text-sm text-green-800">
                        <strong>Preview:</strong> The main column value will be
                        the {aggregationType} of "{aggregateField}" from all
                        subrows.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Derived Column Selection */}
        {type === "derived" && (
          <div className="mb-4 space-y-3">
            <label className="text-sm font-medium text-gray-700">
              Select columns to Aggregate
            </label>

            <div className="flex items-center gap-4">
              <button
                onClick={handleAddAll}
                className="text-xs px-3 py-1 rounded bg-green-100 text-green-700 hover:bg-green-200"
              >
                add all
              </button>
              <button
                onClick={handleSubtractAll}
                className="text-xs px-3 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200"
              >
                subtract all
              </button>
            </div>

            <div className="space-y-2 max-h-40 overflow-y-auto">
              {currentAttributes.map((attr, index) => {
                // Skip date columns and other derived columns
                if (attr.name.toLowerCase() === "date") {
                  return null;
                }

                const isInAddition = derivedAdditions.includes(index);
                const isInSubtraction = derivedSubtractions.includes(index);

                return (
                  <div
                    key={index}
                    className="flex items-center justify-between text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {attr.name
                          .replace(/-/g, " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                      </span>
                      {attr["linkedFrom"] &&
                        attr["linkedFrom"].sheetObjectId && (
                          <span className="text-xs text-blue-600">
                            Referenced
                          </span>
                        )}
                    </div>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={isInAddition}
                          onChange={(e) =>
                            handleAdditionChange(index, e.target.checked)
                          }
                          className="text-green-600 focus:ring-green-500"
                        />
                        <span className="text-green-700">add</span>
                      </label>
                      <label className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={isInSubtraction}
                          onChange={(e) =>
                            handleSubtractionChange(index, e.target.checked)
                          }
                          className="text-red-600 focus:ring-red-500"
                        />
                        <span className="text-red-700">subtract</span>
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Formula Preview */}
            {(derivedAdditions.length > 0 ||
              derivedSubtractions.length > 0) && (
              <div className="mt-3 p-3 bg-gray-100 rounded-md">
                <div className="text-xs font-medium text-gray-700 mb-1">
                  Formula Preview:
                </div>
                <div className="flex items-center gap-1 flex-wrap">
                  {derivedAdditions.map((idx, i) => (
                    <span
                      key={`add-${idx}`}
                      className="bg-green-600 text-white px-2 py-1 rounded text-xs"
                    >
                      {currentAttributes[idx]?.name
                        .replace(/-/g, " ")
                        .replace(/\b\w/g, (l) => l.toUpperCase())}
                    </span>
                  ))}
                  {derivedAdditions.length > 0 &&
                    derivedSubtractions.length > 0 && (
                      <span className="text-gray-600 mx-1">-</span>
                    )}
                  {derivedSubtractions.map((idx, i) => (
                    <span
                      key={`sub-${idx}`}
                      className="bg-red-600 text-white px-2 py-1 rounded text-xs"
                    >
                      {currentAttributes[idx]?.name
                        .replace(/-/g, " ")
                        .replace(/\b\w/g, (l) => l.toUpperCase())}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Buttons */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={handleClose}
            className="px-4 py-2 border rounded-md text-gray-600 border-gray-300 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={
              !columnName.trim() ||
              (type === "derived" &&
                derivedAdditions.length === 0 &&
                derivedSubtractions.length === 0)
            }
            className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export const ColumnUpdateForm = ({
  isOpen,
  onClose,
  onSave,
  existingColumns = [],
  existingData = {},
  availableSheets = [],
  currentSheetId,
}) => {
  // console.log("🔍 ColumnUpdateForm Props:");
  // console.log("➡️ isOpen:", isOpen);
  // console.log("➡️ onClose (function?):", typeof onClose);
  // console.log("➡️ onSave (function?):", typeof onSave);
  // console.log("➡️ existingColumns:", existingColumns);
  // console.log("➡️ existingData:", existingData);
  // console.log("➡️ availableSheets:", availableSheets);
  // console.log("➡️ currentSheetId:", currentSheetId);
  const [columnName, setColumnName] = useState("");
  const [additionIndices, setAdditionIndices] = useState([]);
  const [subtractionIndices, setSubtractionIndices] = useState([]);
  const [reference, setReference] = useState(null);
  const [errors, setErrors] = useState({});
  const [isDerived, setIsDerived] = useState(false);

  const [showReference, setShowReference] = useState(false);
  const [selectedReferenceSheet, setSelectedReferenceSheet] = useState(null);
  const [selectedReferenceColumn, setSelectedReferenceColumn] = useState(null);
  const [isReferenceDropdownOpen, setIsReferenceDropdownOpen] = useState(false);
  const [showRecurrent, setShowRecurrent] = useState(false);
  const [selectedRecurrentColumn, setSelectedRecurrentColumn] = useState(null);
  const [availableSheetsForReference, setAvailableSheetsForReference] =
    useState([]);
  const [sheetSearchTerm, setSheetSearchTerm] = useState("");
  const [columnSearchTerm, setColumnSearchTerm] = useState("");

  const [showSubrows, setShowSubrows] = useState(false);
  const [subrowsEnabled, setSubrowsEnabled] = useState(false);
  const [subrowColumns, setSubrowColumns] = useState([]);
  const [aggregateField, setAggregateField] = useState("");
  const [aggregationType, setAggregationType] = useState("sum");
  const [hasSubrows, setHasSubrows] = useState(false);

  const [isHidden, setIsHidden] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  // Initialize form with existing data
  useEffect(() => {
    if (existingData && isOpen) {
      setSubrowsEnabled(existingData.subrowsConfig.subrowsEnabled || false);
      setColumnName(existingData.name || "");
      setAdditionIndices(existingData.additionIndices || []);
      setSubtractionIndices(existingData.subtractionIndices || []);
      setReference(existingData.reference || null);
      setIsDerived(existingData.isDerived || false);
    }
  }, [existingData, isOpen]);

  useEffect(() => {
    if (isDerived) {
      // When switching to derived, clear all independent options
      setShowReference(false);
      setShowRecurrent(false);
      setShowSubrows(false);
      setHasSubrows(false);
      setSubrowsEnabled(false);
      setSelectedReferenceSheet(null);
      setSelectedReferenceColumn(null);
      setSelectedRecurrentColumn(null);
    } else{
      setAdditionIndices([]);
      setSubtractionIndices([]);
    }
  }, [isDerived]);

  useEffect(() => {
    const checkReferences = async () => {
      if (currentSheetId && isOpen) {
        try {
          const result = await checkAvailableLinks(currentSheetId);
          if (result.success) {
            const filteredSheets = availableSheets.filter(
              (sheet) => !result.unavailableSheets.includes(sheet._id)
            );
            setAvailableSheetsForReference(filteredSheets);
          } else {
            setAvailableSheetsForReference(availableSheets);
          }
        } catch (error) {
          console.error("Error checking available links:", error);
          setAvailableSheetsForReference(availableSheets);
        }
      } else {
        setAvailableSheetsForReference(availableSheets);
      }
    };

    checkReferences();
  }, [currentSheetId, isOpen, availableSheets]);

  // Initialize form with existing data
  
  useEffect(() => {
    if (existingData && isOpen) {
      // console.log("Initializing form with existing data:", existingData);
      // console.log("Existing columns:", existingColumns);
      setColumnName(existingData.name || "");
      setIsDerived(existingData.isDerived || false);
      setIsHidden(existingData.isHidden || false);
      if (existingData.isDerived) {
      setAdditionIndices(existingData.additionIndices || []);
      setSubtractionIndices(existingData.subtractionIndices || []);
    } else {
      setAdditionIndices([]);
      setSubtractionIndices([]);
    }
      // console.log("Has Subrows are: ", existingData.hasSubrows.hasSubrows);
      setHasSubrows(existingData.hasSubrows.hasSubrows || false);
      setShowSubrows(existingData.hasSubrows.hasSubrows || false);
      if (existingData.subrowsConfig) {
        setSubrowsEnabled(existingData.subrowsConfig.subrowsEnabled || false);
        setSubrowColumns(
          existingData.subrowsConfig.subrowColumns?.map((col) => ({
            ...col,
            id: Date.now() + Math.random(), // Add unique ID for editing
          })) || []
        );
        setAggregateField(existingData.subrowsConfig.aggregateField || "");
        setAggregationType(existingData.subrowsConfig.aggregationType || "sum");
      }

      // Initialize reference data
      if (existingData.reference) {
        setShowReference(true);
        setReference(existingData.reference);
        // Find and set the reference sheet and column
        const refSheet = availableSheets.find(
          (sheet) => sheet._id === existingData.reference.sheetId
        );
        if (refSheet) {
          setSelectedReferenceSheet(refSheet);
          const refColumn =
            refSheet.attributes[existingData.reference.columnIndex];
          if (refColumn) {
            setSelectedReferenceColumn({
              ...refColumn,
              index: existingData.reference.columnIndex,
            });
            setSheetSearchTerm(refSheet.sheetName);
            setColumnSearchTerm(refColumn.name);
          }
        }
      }

      // Initialize recurrent data
      if (existingData.recurrent) {
        setShowRecurrent(true);
        const recurrentColumn =
          existingColumns[existingData.recurrent.referenceColumnIndex];
        if (recurrentColumn) {
          setSelectedRecurrentColumn({
            ...recurrentColumn,
            index: existingData.recurrent.referenceColumnIndex,
          });
        }
      }
    }
  }, [existingData, isOpen, availableSheets, existingColumns]);

  // Add click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isReferenceDropdownOpen && !event.target.closest(".relative")) {
        setIsReferenceDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isReferenceDropdownOpen]);

  const getColumnTypeForDisplay = (col) => {
    if (col.derived === true) return "Derived";
    if (
      col.linkedFrom?.sheetObjectId !== null &&
      col.linkedFrom?.sheetObjectId !== undefined
    )
      return "Referenced";
    if (col.recurrentCheck?.isRecurrent === true) return "Recurrent";
    return "Independent";
  };

  const getColumnTypeClass = (col) => {
    const type = getColumnTypeForDisplay(col);
    switch (type) {
      case "Derived":
        return "bg-yellow-100 text-yellow-700";
      case "Referenced":
        return "bg-blue-100 text-blue-700";
      case "Recurrent":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const handleReferenceToggle = () => {
    if (showRecurrent) {
      setShowRecurrent(false);
      setSelectedRecurrentColumn(null);
    }
    if (showSubrows) {
      setShowSubrows(false);
      setHasSubrows(false);
      setSubrowColumns([]);
      setAggregateField("");
      setAggregationType("sum");
      setSubrowsEnabled(false);
    }
    setShowReference(!showReference);
    if (showReference) {
      setSelectedReferenceSheet(null);
      setSelectedReferenceColumn(null);
      setSheetSearchTerm("");
      setColumnSearchTerm("");
      setReference(null);
    }
  };

  const handleRecurrentToggle = () => {
    if (showReference) {
      setShowReference(false);
      setSelectedReferenceSheet(null);
      setSelectedReferenceColumn(null);
      setSheetSearchTerm("");
      setColumnSearchTerm("");
      setReference(null);
    }
    if (showSubrows) {
      setShowSubrows(false);
      setHasSubrows(false);
      setSubrowColumns([]);
      setAggregateField("");
      setAggregationType("sum");
      setSubrowsEnabled(false);
    }
    const newShowRecurrent = !showRecurrent;
    setShowRecurrent(newShowRecurrent);
    if (!newShowRecurrent) {
      setSelectedRecurrentColumn(null);
    }
  };

  const handleSubrowsToggle = () => {
    if (showReference) {
      setShowReference(false);
      setSelectedReferenceSheet(null);
      setSelectedReferenceColumn(null);
      setSheetSearchTerm("");
      setColumnSearchTerm("");
      setReference(null);
    }
    if (showRecurrent) {
      setShowRecurrent(false);
      setSelectedRecurrentColumn(null);
    }
    const newShowSubrows = !showSubrows;
    setShowSubrows(newShowSubrows);
    setHasSubrows(newShowSubrows);
    if (!newShowSubrows) {  // Changed from showSubrows to !newShowSubrows
      // Clear subrows data when turning off
      setSubrowColumns([]);
      setAggregateField("");
      setAggregationType("sum");
      setSubrowsEnabled(false);
    }
  };

  const handleAddSubrowColumn = () => {
    const newColumn = {
      id: Date.now(),
      name: "",
      type: "string",
      required: false,
    };
    setSubrowColumns([...subrowColumns, newColumn]);
  };

  const handleUpdateSubrowColumn = (id, field, value) => {
    setSubrowColumns(
      subrowColumns.map((col) =>
        col.id === id ? { ...col, [field]: value } : col
      )
    );
  };

  const handleRemoveSubrowColumn = (id) => {
    setSubrowColumns(subrowColumns.filter((col) => col.id !== id));
    // Clear aggregate field if the removed column was selected
    const removedColumn = subrowColumns.find((col) => col.id === id);
    if (removedColumn && aggregateField === removedColumn.name) {
      setAggregateField("");
    }
  };

  const handleDeleteColumn = () => {
    const formData = {
      name: columnName.trim(),
      additionIndices: isDerived ? additionIndices : [],
      subtractionIndices: isDerived ? subtractionIndices : [],
      reference:
        showReference && selectedReferenceSheet && selectedReferenceColumn
          ? {
              sheetId: selectedReferenceSheet._id,
              columnIndex: selectedReferenceColumn.index,
              columnName: selectedReferenceColumn.name,
            }
          : null,
      recurrent:
        showRecurrent && selectedRecurrentColumn
        ? {
            referenceColumnIndex: selectedRecurrentColumn.index,
            referenceColumnName: selectedRecurrentColumn.name,
          }
        : null,
      hasSubrows: hasSubrows,
      subrowsConfig: hasSubrows
        ? {
            subrowsEnabled,
            subrowColumns: subrowColumns
              .filter((col) => col.name.trim())
              .map((col) => ({
                name: col.name,
                type: col.type,
                required: col.required,
                autoIncrement:
                  col.type === "number" &&
                  col.name.toLowerCase().includes("sr"),
                isAggregateField: col.name === aggregateField,
              })),
            aggregateField,
            aggregationType,
          }
        : null,
      isHidden: isHidden,
      isDeleted: true, // Mark as deleted
    };

    onSave(formData);
    setShowDeleteConfirmation(false);
  };

  const filteredSheetsForReference = availableSheetsForReference.filter(
    (sheet) =>
      sheet.sheetName.toLowerCase().includes(sheetSearchTerm.toLowerCase())
  );

  const filteredColumnsForReference = selectedReferenceSheet
    ? selectedReferenceSheet.attributes.filter((col) =>
        col.name.toLowerCase().includes(columnSearchTerm.toLowerCase())
      )
    : [];

  const validateForm = () => {
    const newErrors = {};

    if (!columnName.trim()) {
      newErrors.columnName = "Column name is required";
    }

    if (isDerived) {
      if (additionIndices.length === 0 && subtractionIndices.length === 0) {
        newErrors.formula = "At least one column must be selected for formula";
      }

      const overlap = additionIndices.some((idx) =>
        subtractionIndices.includes(idx)
      );
      if (overlap) {
        newErrors.formula = "A column cannot be both added and subtracted";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    const cleanAdditionIndices = isDerived 
      ? additionIndices.filter(idx => !existingColumns[idx]?.isDeleted)
      : [];
    
    const cleanSubtractionIndices = isDerived 
      ? subtractionIndices.filter(idx => !existingColumns[idx]?.isDeleted) 
      : [];

    const formData = {
      name: columnName.trim(),
      additionIndices: cleanAdditionIndices,
      subtractionIndices: cleanSubtractionIndices,
      isDerived: isDerived,
      reference:
        (showReference && selectedReferenceSheet && selectedReferenceColumn)
          ? {
              sheetId: selectedReferenceSheet._id,
              columnIndex: selectedReferenceColumn.index,
              columnName: selectedReferenceColumn.name,
            }
          : null,
      recurrent:
        showRecurrent && selectedRecurrentColumn
        ? {
            referenceColumnIndex: selectedRecurrentColumn.index,
            referenceColumnName: selectedRecurrentColumn.name,
          }
        : null,
      // NEW: Add subrows data
      hasSubrows: hasSubrows,
      subrowsConfig: hasSubrows
        ? {
            subrowsEnabled,
            subrowColumns: subrowColumns
              .filter((col) => col.name.trim())
              .map((col) => ({
                name: col.name,
                type: col.type,
                required: col.required,
                autoIncrement:
                  col.type === "number" &&
                  col.name.toLowerCase().includes("sr"),
                isAggregateField: col.name === aggregateField,
              })),
            aggregateField,
            aggregationType,
          }
        : null,
      isHidden: isHidden,
    };

    onSave(formData);
  };

  const handleClose = () => {
    setColumnName("");
    setAdditionIndices([]);
    setSubtractionIndices([]);
    setReference(null);
    setErrors({});
    setIsDerived(false);
    setShowReference(false);
    setSelectedReferenceSheet(null);
    setSelectedReferenceColumn(null);
    setShowRecurrent(false);
    setSelectedRecurrentColumn(null);
    setSheetSearchTerm("");
    setColumnSearchTerm("");
    setShowSubrows(false);
    setHasSubrows(false);
    setSubrowsEnabled(false);
    setSubrowColumns([]);
    setAggregateField("");
    setAggregationType("sum");
    setIsHidden(false);
    setShowDeleteConfirmation(false);
    onClose();
  };

  const toggleColumnInFormula = (columnIndex, type) => {
    if (type === "addition") {
      setAdditionIndices((prev) =>
        prev.includes(columnIndex)
          ? prev.filter((idx) => idx !== columnIndex)
          : [...prev, columnIndex]
      );
    } else {
      setSubtractionIndices((prev) =>
        prev.includes(columnIndex)
          ? prev.filter((idx) => idx !== columnIndex)
          : [...prev, columnIndex]
      );
    }
  };

  const generateFormulaPreview = () => {
    if (
      !isDerived ||
      (additionIndices.length === 0 && subtractionIndices.length === 0)
    ) {
      return "No formula";
    }

    const additionTerms = additionIndices.filter(idx => !existingColumns[idx]?.isDeleted).map(
      (idx) => existingColumns[idx]?.name || `Column${idx}`
    );
    const subtractionTerms = subtractionIndices.filter(idx => !existingColumns[idx]?.isDeleted).map(
      (idx) => existingColumns[idx]?.name || `Column${idx}`
    );

    const parts = [];
    if (additionTerms.length > 0) {
      parts.push(additionTerms.join(" + "));
    }
    if (subtractionTerms.length > 0) {
      parts.push(" - " + subtractionTerms.join(" - "));
    }
    return parts.join("");
  };

  const renderDeleteConfirmation = () => {
    if (!showDeleteConfirmation) return null;

    return (
      <div className="fixed inset-0 bg-black/60 bg-opacity-50 flex items-center justify-center z-[60]">
        <div className="bg-white rounded-lg shadow-xl p-6 max-w-md mx-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-red-600 text-xl">⚠️</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Delete Column</h3>
              <p className="text-sm text-gray-600">This action cannot be undone</p>
            </div>
          </div>
          
          <div className="mb-6">
            <p className="text-gray-700">
              Are you sure you want to delete the column <strong>"{columnName}"</strong>? 
              This will remove the column from all views and reports.
            </p>
          </div>
          
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowDeleteConfirmation(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteColumn}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
            >
              Delete Column
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Update Column</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="flex items-start justify-center flex-row w-full gap-6">
            {/* Left Column - Basic Info */}
            <div className={`${(isDerived || showRecurrent || showReference || showSubrows) ? "w-1/2" : "w-full"} space-y-6`}>
              {/* Column Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Column Name *
                </label>
                <input
                  type="text"
                  value={columnName}
                  onChange={(e) => setColumnName(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.columnName ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Enter column name"
                />
                {errors.columnName && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.columnName}
                  </p>
                )}
              </div>

              {/* isHidden Toggle */}
              <div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-700">Column Visibility</span>
                    <span className="text-xs text-gray-500">
                      Hidden columns are not displayed by default in the table view
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isHidden}
                      onChange={(e) => setIsHidden(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                  </label>
                </div>
                {isHidden && (
                  <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded-md">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-orange-800 font-medium">⚠️ Hidden Column</span>
                    </div>
                    <div className="text-xs text-orange-700 mt-1">
                      This column will be hidden by default. Users can show it using the "Show Hidden" button.
                    </div>
                  </div>
                )}
              </div>

              {/* Column Type Toggle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Column Type
                </label>
                <div className="flex space-x-4 justify-between">
                  <button
                    onClick={() => setIsDerived(false)}
                    className={`px-4 py-2 rounded-md min-w-[10rem] border transition-all ${
                      !isDerived
                        ? "bg-blue-50 border-blue-500 text-blue-700"
                        : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    Independent
                  </button>
                  <button
                    onClick={() => setIsDerived(true)}
                    className={`px-4 py-2 min-w-[10rem] rounded-md border transition-all ${
                      isDerived
                        ? "bg-blue-50 border-blue-500 text-blue-700"
                        : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    Derived (Formula)
                  </button>
                </div>
              </div>

              {/* Reference, Recurrent, SubRows Options for Independent Columns */}
              {!isDerived && (
                <div className="">
                  <div className={`flex items-center ${(isDerived || showRecurrent || showReference || showSubrows) ? "max-w-[60%] flex-wrap gap-3" : "justify-between"}`}>
                    <button
                      onClick={handleReferenceToggle}
                      disabled={false}
                      className={`flex items-center min-w-[10rem] gap-2 px-2 py-2 text-sm border rounded-md transition-colors ${
                        showReference
                          ? "bg-blue-100 text-blue-700 border-blue-300"
                          : showRecurrent || showSubrows
                          ? "border-gray-200 text-gray-400 cursor-not-allowed"
                          : "border-gray-300 text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      <Plus className="w-4 h-4" />
                      {showReference ? "Remove Reference" : "Reference Column"}
                    </button>
                    <button
                      onClick={handleRecurrentToggle}
                      disabled={false}
                      className={`flex items-center min-w-[10rem] justify-center gap-2 px-3 py-2 text-sm border rounded-md transition-colors ${
                        showRecurrent
                          ? "bg-purple-100 text-purple-700 border-purple-300"
                          : showReference || showSubrows
                          ? "border-gray-200 text-gray-400 cursor-not-allowed"
                          : "border-gray-300 text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      <RotateCcw className="w-4 h-4" />
                      {showRecurrent ? "Remove Recurrent" : "Add Recurrent"}
                    </button>
                    <button
                      onClick={handleSubrowsToggle}
                      disabled={false}
                      className={`flex items-center min-w-[10rem] gap-2 px-3 py-2 text-sm border rounded-md transition-colors ${
                        showSubrows
                          ? "bg-green-100 text-green-700 border-green-300"
                          : showReference || showRecurrent
                          ? "border-gray-200 text-gray-400 cursor-not-allowed"
                          : "border-gray-300 text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      <Plus className="w-4 h-4" />
                      {showSubrows ? "Remove Subrows" : "Enable Subrows"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Configuration */}
            {(isDerived || showRecurrent || showReference || showSubrows) && (
              <div className="w-1/2 space-y-6">
                {/* Reference Configuration */}
                {!isDerived && showReference && (
                  <div className="space-y-4 p-4 bg-blue-50 rounded-lg border">
                    <h3 className="text-lg font-medium text-gray-900">
                      Reference Configuration
                    </h3>

                    {/* Sheet Search and Selection */}
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Reference Sheet
                      </label>

                      <div className="relative mb-2">
                        <input
                          type="text"
                          placeholder="Search sheets..."
                          value={sheetSearchTerm}
                          onChange={(e) => setSheetSearchTerm(e.target.value)}
                          onFocus={() => setIsReferenceDropdownOpen(true)}
                          className="w-full px-3 py-2 pr-8 border rounded-md bg-white border-gray-300 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>

                      {selectedReferenceSheet && (
                        <div className="mb-2 p-2 bg-blue-100 border border-blue-200 rounded-md flex items-center justify-between">
                          <span className="text-sm text-blue-800 font-medium">
                            Selected:{" "}
                            {selectedReferenceSheet.sheetName
                              .replace(/-/g, " ")
                              .replace(/\b\w/g, (l) => l.toUpperCase())}
                          </span>
                          <button
                            onClick={() => {
                              setSelectedReferenceSheet(null);
                              setSelectedReferenceColumn(null);
                              setSheetSearchTerm("");
                              setColumnSearchTerm("");
                            }}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      {isReferenceDropdownOpen && (
                        <div className="absolute top-full left-0 mt-1 w-full border rounded-md shadow-lg bg-white z-20 max-h-48 overflow-y-auto">
                          {filteredSheetsForReference.length > 0 ? (
                            filteredSheetsForReference.map((sheet) => (
                              <button
                                key={sheet._id}
                                onClick={() => {
                                  setSelectedReferenceSheet(sheet);
                                  setSelectedReferenceColumn(null);
                                  setIsReferenceDropdownOpen(false);
                                  setSheetSearchTerm(sheet.sheetName);
                                  setColumnSearchTerm("");
                                }}
                                className="w-full px-3 py-2 text-left hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
                              >
                                {sheet.sheetName
                                  .replace(/-/g, " ")
                                  .replace(/\b\w/g, (l) => l.toUpperCase())}
                              </button>
                            ))
                          ) : (
                            <div className="px-3 py-2 text-gray-500 text-sm">
                              {sheetSearchTerm
                                ? `No sheets found for "${sheetSearchTerm}"`
                                : "No sheets available"}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Column Selection */}
                    {selectedReferenceSheet && (
                      <div className="space-y-2">
                        {/* <label className="text-sm font-medium text-gray-700">
                        Select Column
                      </label> */}

                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Search columns..."
                            value={columnSearchTerm}
                            onChange={(e) =>
                              setColumnSearchTerm(e.target.value)
                            }
                            className="w-full px-3 py-2 border rounded-md bg-white border-gray-300 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        {selectedReferenceColumn && (
                          <div className="p-2 bg-green-50 border border-green-200 rounded-md flex items-center justify-between">
                            <span className="text-sm text-green-800 font-medium">
                              Selected:{" "}
                              {selectedReferenceColumn.name
                                .replace(/-/g, " ")
                                .replace(/\b\w/g, (l) => l.toUpperCase())}
                            </span>
                            <button
                              onClick={() => {
                                setSelectedReferenceColumn(null);
                                setColumnSearchTerm("");
                              }}
                              className="text-green-600 hover:text-green-800"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )}

                        <div className="max-h-32 overflow-y-auto border rounded-md bg-white">
                          {filteredColumnsForReference.length > 0 ? (
                            filteredColumnsForReference.map((col) => {
                              const originalIndex =
                                selectedReferenceSheet.attributes.findIndex(
                                  (attr) => attr.name === col.name
                                );
                              return (
                                <button
                                  key={originalIndex}
                                  onClick={() => {
                                    setSelectedReferenceColumn({
                                      ...col,
                                      index: originalIndex,
                                    });
                                    setColumnSearchTerm(col.name);
                                  }}
                                  className={`w-full px-3 py-2 text-left transition-colors border-b border-gray-100 last:border-b-0 ${
                                    selectedReferenceColumn?.index ===
                                    originalIndex
                                      ? "bg-blue-100 text-blue-800"
                                      : "hover:bg-gray-100 text-gray-800"
                                  }`}
                                >
                                  <div className="flex justify-between items-center">
                                    <span className="capitalize">
                                      {col.name
                                        .replace(/-/g, " ")
                                        .replace(/\b\w/g, (l) =>
                                          l.toUpperCase()
                                        )}
                                    </span>
                                    <span
                                      className={`text-xs px-2 py-1 rounded ${getColumnTypeClass(
                                        col
                                      )}`}
                                    >
                                      {getColumnTypeForDisplay(col)}
                                    </span>
                                  </div>
                                </button>
                              );
                            })
                          ) : (
                            <div className="px-3 py-2 text-gray-500 text-sm">
                              {columnSearchTerm
                                ? `No columns found for "${columnSearchTerm}"`
                                : "No columns available"}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Recurrent Configuration */}
                {!isDerived && showRecurrent && (
                  <div className="space-y-4 p-4 bg-purple-50 rounded-lg border">
                    <h3 className="text-lg font-medium text-gray-900">
                      Recurrent Configuration
                    </h3>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Reference Column from Current Sheet
                      </label>

                      <div className="max-h-32 overflow-y-auto flex flex-col gap-2">
                        {existingColumns.map((col, index) => {
                          if (
                            // col.derived ||
                            col.isDeleted || index === existingData.currentColumnIndex
                          )
                            return null;

                          return (
                            <button
                              key={index}
                              onClick={() =>
                                setSelectedRecurrentColumn({ ...col, index })
                              }
                              className={`w-full px-3 py-2 rounded-md text-left transition-colors ${
                                selectedRecurrentColumn?.index === index
                                  ? "bg-purple-200 text-purple-800 border border-purple-300"
                                  : "bg-white hover:bg-purple-50 border border-gray-200"
                              }`}
                            >
                              <div className="flex justify-between items-center">
                                <span className="font-medium capitalize">
                                  {col.name
                                    .replace(/_/g, " ")
                                    .replace(/-/g, " ")}
                                </span>
                                <span
                                  className={`text-xs px-2 py-1 rounded ${getColumnTypeClass(
                                    col
                                  )}`}
                                >
                                  {getColumnTypeForDisplay(col)}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {selectedRecurrentColumn && (
                        <div className="p-3 bg-purple-100 rounded-lg">
                          <div className="text-sm font-medium text-purple-800 mb-1">
                            Recurrent Preview:
                          </div>
                          <div className="text-sm text-purple-700">
                            <span className="font-medium">
                              {columnName || "Column"}
                            </span>
                            {" will get its value from "}
                            <span className="font-medium">
                              {selectedRecurrentColumn.name
                                .replace(/_/g, " ")
                                .replace(/-/g, " ")}
                            </span>
                            {" from the previous period"}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {!isDerived && showSubrows && (
                  <div className="space-y-4 p-4 bg-green-50 rounded-lg border">
                    <h3 className="text-lg font-medium text-gray-900">
                      Subrows Configuration
                    </h3>

                    {/* Subrows Enabled Toggle */}
                    <div className="flex items-center justify-between p-3 bg-white rounded border border-gray-200">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-700">
                          Enable Subrows Input
                        </span>
                        <span className="text-xs text-gray-500">
                          When enabled, users can input data through subrows
                        </span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={subrowsEnabled}
                          onChange={(e) => setSubrowsEnabled(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                      </label>
                    </div>

                    {/* Subrow Columns Management */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">
                          Subrow Columns
                        </span>
                        <button
                          onClick={handleAddSubrowColumn}
                          className="flex items-center gap-1 px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          <Plus className="w-3 h-3" />
                          Add Column
                        </button>
                      </div>

                      {subrowColumns.length === 0 && (
                        <div className="text-sm text-gray-500 text-center py-4 border-2 border-dashed border-gray-300 rounded-md">
                          No subrow columns configured. Click "Add Column" to
                          start.
                        </div>
                      )}

                      {subrowColumns.map((column) => (
                        <div
                          key={column.id}
                          className="flex items-center gap-2 p-3 bg-white rounded border border-gray-200"
                        >
                          {/* Column Name */}
                          <div className="flex-1">
                            <input
                              type="text"
                              placeholder="Column name"
                              value={column.name}
                              onChange={(e) =>
                                handleUpdateSubrowColumn(
                                  column.id,
                                  "name",
                                  e.target.value
                                )
                              }
                              className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                            />
                          </div>

                          {/* Column Type */}
                          <div className="w-24">
                            <select
                              value={column.type}
                              onChange={(e) =>
                                handleUpdateSubrowColumn(
                                  column.id,
                                  "type",
                                  e.target.value
                                )
                              }
                              className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                            >
                              <option value="string">Text</option>
                              <option value="number">Number</option>
                              <option value="date">Date</option>
                            </select>
                          </div>

                          {/* Required Checkbox */}
                          <div className="flex items-center gap-1">
                            <input
                              type="checkbox"
                              checked={column.required}
                              onChange={(e) =>
                                handleUpdateSubrowColumn(
                                  column.id,
                                  "required",
                                  e.target.checked
                                )
                              }
                              className="text-green-600 focus:ring-green-500"
                            />
                            <span className="text-xs text-gray-600">
                              Required
                            </span>
                          </div>

                          {/* Remove Button */}
                          <button
                            onClick={() => handleRemoveSubrowColumn(column.id)}
                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Aggregate Configuration */}
                    {subrowColumns.length > 0 && (
                      <div className="space-y-3 pt-3 border-t border-gray-200">
                        <span className="text-sm font-medium text-gray-700">
                          Aggregation Settings
                        </span>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {/* Aggregate Field Selection */}
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">
                              Aggregate Field
                            </label>
                            <select
                              value={aggregateField}
                              onChange={(e) =>
                                setAggregateField(e.target.value)
                              }
                              className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                            >
                              <option value="">
                                Select field to aggregate
                              </option>
                              {subrowColumns
                                .filter(
                                  (col) =>
                                    col.type === "number" && col.name.trim()
                                )
                                .map((col) => (
                                  <option key={col.id} value={col.name}>
                                    {col.name}
                                  </option>
                                ))}
                            </select>
                          </div>

                          {/* Aggregation Type */}
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">
                              Aggregation Type
                            </label>
                            <select
                              value={aggregationType}
                              onChange={(e) =>
                                setAggregationType(e.target.value)
                              }
                              className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                              disabled={!aggregateField}
                            >
                              <option value="sum">Sum</option>
                            </select>
                          </div>
                        </div>

                        {/* Preview */}
                        {aggregateField && (
                          <div className="p-3 bg-green-100 rounded">
                            <div className="text-sm font-medium text-green-800 mb-2">
                              Configuration Preview:
                            </div>
                            <div className="text-sm text-green-700 space-y-1">
                              <div>
                                • The main column value will be the{" "}
                                {aggregationType} of "{aggregateField}" from all
                                subrows
                              </div>
                              <div>
                                • Subrows input is currently{" "}
                                <strong>
                                  {subrowsEnabled ? "enabled" : "disabled"}
                                </strong>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Formula Section - Only show if derived */}
                {isDerived && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <label className="block text-sm font-medium text-gray-700">
                        Formula Configuration
                      </label>
                      <Info className="w-4 h-4 text-gray-400" />
                    </div>

                    {/* Formula Preview */}
                    <div className="mb-4 p-3 bg-gray-50 rounded-md">
                      <p className="text-sm text-gray-600 mb-1">
                        Formula Preview:
                      </p>
                      <p className="font-mono text-sm text-gray-800">
                        {generateFormulaPreview()}
                      </p>
                    </div>

                    {/* Column Selection */}
                    <div className="space-y-3">
                      <p className="text-sm text-gray-600">
                        Select columns to include in formula:
                      </p>
                      <div className="flex flex-col overflow-y-auto max-h-[20rem] bg-gray-100/50 p-2 gap-2 rounded-xl">
                        {existingColumns.map((column, index) => {
                          if (column.isDeleted || index === existingData.currentColumnIndex) {
                            return null;
                          }
                          return (
                            <div
                              key={index}
                              className="flex items-center justify-between p-3 border border-gray-200 rounded-md hover:bg-white"
                            >
                              <span className="text-sm font-medium text-gray-900">
                                {column.name}
                              </span>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() =>
                                    toggleColumnInFormula(index, "addition")
                                  }
                                  className={`flex items-center px-3 py-1 rounded text-xs font-medium transition-all ${
                                    additionIndices.includes(index)
                                      ? "bg-green-100 text-green-800 border border-green-300"
                                      : "bg-gray-100 text-gray-600 border border-gray-300 hover:bg-green-50"
                                  }`}
                                >
                                  <Plus className="w-3 h-3 mr-1" />
                                  Add
                                </button>
                                <button
                                  onClick={() =>
                                    toggleColumnInFormula(index, "subtraction")
                                  }
                                  className={`flex items-center px-3 py-1 rounded text-xs font-medium transition-all ${
                                    subtractionIndices.includes(index)
                                      ? "bg-red-100 text-red-800 border border-red-300"
                                      : "bg-gray-100 text-gray-600 border border-gray-300 hover:bg-red-50"
                                  }`}
                                >
                                  <Minus className="w-3 h-3 mr-1" />
                                  Subtract
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {errors.formula && (
                      <p className="mt-2 text-sm text-red-600">
                        {errors.formula}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          {/* Left side - Delete button */}
          <button
            onClick={() => setShowDeleteConfirmation(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
          >
            Delete Column
          </button>
          
          {/* Right side - Cancel and Update buttons */}
          <div className="flex items-center space-x-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={Object.keys(errors).length > 0}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Update Column
            </button>
          </div>
        </div>
      </div>
      {renderDeleteConfirmation()}
    </div>
  );
};

export const processLastRowWithZeroDate = async (sheetData, sheetId) => {
  if (!sheetData || sheetData.length === 0) return false;

  const lastRow = sheetData[sheetData.length - 1];

  // Check if last row's first attribute (date column) is "0"
  if (lastRow.attributes && lastRow.attributes[0] === "0") {
    console.log("Found last row with date = 0, processing...");

    // Get today's date in the correct format
    const today = new Date();
    const formattedDate = today.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    // Create updated row array
    const updatedRowArray = [...lastRow.attributes];
    updatedRowArray[0] = formattedDate; // Set today's date

    // Get current sheet metadata for calculations
    const currentSheetMeta = rawMetadata.find((sheet) => sheet._id === sheetId);
    if (!currentSheetMeta) return false;

    // Calculate recurrent values
    currentSheetMeta.attributes.forEach((attr, attrIndex) => {
      if (attr.recurrentCheck?.isRecurrent) {
        const refIndex = attr.recurrentCheck.recurrentReferenceIndice;
        if (refIndex !== null && sheetData.length > 1) {
          // Get value from previous row (second last row)
          const previousRowValue =
            sheetData[sheetData.length - 2].attributes[refIndex];
          updatedRowArray[attrIndex] = previousRowValue || "0";
        }
      }
    });

    // Calculate derived values
    currentSheetMeta.attributes.forEach((attr, attrIndex) => {
      if (attr.derived && attr.formula) {
        let calculatedValue = 0;

        // Add values from addition indices
        if (attr.formula.additionIndices?.length > 0) {
          attr.formula.additionIndices.forEach((idx) => {
            const value = parseFloat(updatedRowArray[idx]) || 0;
            calculatedValue += value;
          });
        }

        // Subtract values from subtraction indices
        if (attr.formula.subtractionIndices?.length > 0) {
          attr.formula.subtractionIndices.forEach((idx) => {
            const value = parseFloat(updatedRowArray[idx]) || 0;
            calculatedValue -= value;
          });
        }

        updatedRowArray[attrIndex] = calculatedValue;
      }
    });

    console.log("Updated row array with calculations:", updatedRowArray);

    // Call update API
    try {
      const targetDate = lastRow.createdAt;
      const rowIndex = sheetData.length - 1;

      await updateRowData(sheetId, {
        rowIndex: rowIndex,
        attributes: updatedRowArray,
        targetDate: targetDate,
      });

      console.log("Successfully updated last row with date 0");
      return true; // Indicate that update was performed
    } catch (error) {
      console.error("Error updating last row with date 0:", error);
      return false;
    }
  }

  return false; // No update needed
};

export const InfoTooltip = () => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [buttonPosition, setButtonPosition] = useState({ x: 0, y: 0 });

  const handleMouseEnter = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setButtonPosition({
      x: rect.left + rect.width / 2,
      y: rect.bottom, // Changed from rect.top to rect.bottom
    });
    setShowTooltip(true);
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  return (
    <>
      <button
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
        type="button"
      >
        <Info size={16} />
      </button>

      {showTooltip &&
        createPortal(
          <div
            className="fixed bg-gray-900 text-white text-xs rounded-lg shadow-xl p-3 w-80"
            style={{
              left: buttonPosition.x - 160, // Center the tooltip (320px / 2)
              top: buttonPosition.y + 8, // Position below the button with 8px gap
              zIndex: 9999999,
            }}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <div className="font-medium mb-2 text-center">
              Column Type Color Guide
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-300 rounded border"></div>
                <span className="flex-1">Independent</span>
                <span className="text-gray-300">Normal columns</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-300 rounded border"></div>
                <span className="flex-1 text-yellow-300">Derived</span>
                <span className="text-gray-300">
                  Calculated from other columns
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-300 rounded border"></div>
                <span className="flex-1 text-blue-300">Referenced</span>
                <span className="text-gray-300">Linked from other sheets</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-purple-300 rounded border"></div>
                <span className="flex-1 text-purple-300">Recurrent</span>
                <span className="text-gray-300">
                  Values from previous period
                </span>
              </div>
            </div>

            <div className="border-t border-gray-700 mt-2 pt-2">
              <div className="text-center text-gray-400 text-xs">
                Hover over derived/recurrent columns to see relationships
              </div>
            </div>

            {/* Tooltip arrow pointing up (since tooltip is below button) */}
            <div
              className="absolute border-4 border-transparent border-b-gray-900"
              style={{
                bottom: "100%",
                left: "50%",
                transform: "translateX(-50%)",
              }}
            ></div>
          </div>,
          document.body
        )}
    </>
  );
};