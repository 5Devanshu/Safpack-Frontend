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

export const ColumnCreationForm = ({
  isOpen,
  onClose,
  onSave,
  type,
  sheets,
  currentSheetId,
  availableAttributes = null,
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
  const currentAttributes =
    availableAttributes ||
    sheets.find((s) => s["_id"] === currentSheetId)?.attributes ||
    [];

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
    // Add all non-date columns to additions (skip first column which is date)
    const allIndices = currentAttributes
      .map((attr, index) => ({ attr, index }))
      .filter(
        ({ attr, index }) =>
          index > 0 && // Skip first column (date)
          attr.name.toLowerCase() !== "date" &&
          !attr.derived // Skip already derived columns
      )
      .map(({ index }) => index);

    setDerivedAdditions(allIndices);
    setDerivedSubtractions([]);
  };

  const handleSubtractAll = () => {
    // Add all non-date columns to subtractions (skip first column which is date)
    const allIndices = currentAttributes
      .map((attr, index) => ({ attr, index }))
      .filter(
        ({ attr, index }) =>
          index > 0 && // Skip first column (date)
          attr.name.toLowerCase() !== "date" &&
          !attr.derived // Skip already derived columns
      )
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

  const filteredColumnsForReference = selectedReferenceSheet
    ? selectedReferenceSheet.attributes.filter((col) =>
        col.name.toLowerCase().includes(columnSearchTerm.toLowerCase())
      )
    : [];

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

        {/* Independent Column with Reference */}
        {type === "independent" && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              {/* <button
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
              </button> */}
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

                  <div className="flex flex-col gap-3 overflow-y-auto max-h-[10rem]">
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
                          <span className="text-xs text-gray-600">Required</span>
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

            {currentAttributes.filter(
              (attr, index) =>
                index > 0 && attr.name.toLowerCase() !== "date" && !attr.derived
            ).length > 0 && (
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
            )}

            <div className="space-y-2 max-h-40 overflow-y-auto">
              {currentAttributes.filter(
                (attr, index) =>
                  index > 0 &&
                  attr.name.toLowerCase() !== "date" &&
                  !attr.derived
              ).length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">No columns available for formula.</p>
                  <p className="text-xs mt-1">
                    Add some independent columns first.
                  </p>
                </div>
              ) : (
                <div className="h-[10rem] flex flex-col gap-1 bg-gray-100 p-2 rounded-md overflow-y-auto">
                  {currentAttributes.map((attr, index) => {
                    // Skip date columns, first column, and other derived columns
                    if (
                      index === 0 ||
                      attr.name.toLowerCase() === "date"
                      // || attr.derived
                    ) {
                      return null;
                    }

                    const isInAddition = derivedAdditions.includes(index);
                    const isInSubtraction = derivedSubtractions.includes(index);

                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded"
                      >
                        <div className="flex flex-row items-center gap-4">
                          <span className="font-medium">
                            {attr.name
                              .replace(/-/g, " ")
                              .replace(/\b\w/g, (l) => l.toUpperCase())}
                          </span>
                          {attr.derived && (
                            <span className="text-xs text-yellow-600 bg-yellow-200/90 px-2 py-0.5 rounded-full">
                              Derived
                            </span>
                          )}
                          {attr.linkedFrom?.sheetObjectId && (
                            <span className="text-xs text-blue-600 bg-blue-200/90 px-2 py-0.5 rounded-full">
                              Referenced
                            </span>
                          )}
                          {attr.recurrentCheck?.isRecurrent && (
                            <span className="text-xs text-purple-600 bg-purple-200/90 px-2 py-0.5 rounded-full">
                              Recurrent
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
              )}
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
