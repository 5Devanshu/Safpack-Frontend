import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import {
  Plus,
  Save,
  X,
  Calendar,
  FileSpreadsheet,
  Trash2,
  Edit3,
  Check,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  createNewSheet,
  fetchMetadata,
} from "../../../services/repository/sheetsRepo";
import { selectAccount } from "../../../app/DashboardSlice";
import toast from "react-hot-toast";
import { ColumnCreationForm } from "./utils/Helper";

const CreateSheet = () => {
  const navigate = useNavigate();
  const account = useSelector(selectAccount);

  // State management
  const [existingSheets, setExistingSheets] = useState([]);
  const [sheetName, setSheetName] = useState("");
  const [sheetNameError, setSheetNameError] = useState("");
  const [isValidSheetName, setIsValidSheetName] = useState(false);
  const [attributes, setAttributes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showColumnModal, setShowColumnModal] = useState(false);
  const [showColumnTypeDropdown, setShowColumnTypeDropdown] = useState(false);
  const [selectedColumnType, setSelectedColumnType] = useState(null);
  const [editingColumn, setEditingColumn] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  // Initialize with default Date column
  useEffect(() => {
    const defaultDateColumn = {
      name: "date",
      formula: {
        additionIndices: [],
        subtractionIndices: [],
      },
      linkedFrom: {
        sheetObjectId: null,
        attributeIndice: null,
      },
      recurrentCheck: {
        isRecurrent: false,
        recurrentReferenceIndice: null,
        recurrenceFedStatus: false,
      },
      derived: false,
    };
    setAttributes([defaultDateColumn]);
  }, []);

  // Fetch existing sheets metadata
  useEffect(() => {
    const loadExistingSheets = async () => {
      try {
        setLoading(true);
        const loginRole = account?.role || "user";
        const fetchedMetadata = await fetchMetadata(loginRole);

        if (fetchedMetadata && Array.isArray(fetchedMetadata)) {
          const sheetsInfo = fetchedMetadata.map((sheet) => ({
            _id: sheet._id,
            sheetName: sheet.sheetName,
          }));
          setExistingSheets(sheetsInfo);
        }
      } catch (error) {
        console.error("Error loading existing sheets:", error);
        toast.error("Failed to load existing sheets");
      } finally {
        setLoading(false);
      }
    };

    if (account) {
      loadExistingSheets();
    }
  }, [account]);

  // Validate sheet name
  const validateSheetName = (name) => {
    if (!name.trim()) {
      setSheetNameError("Sheet name is required");
      setIsValidSheetName(false);
      return false;
    }

    if (name.trim().length < 2) {
      setSheetNameError("Sheet name must be at least 2 characters");
      setIsValidSheetName(false);
      return false;
    }

    if (!/^[a-zA-Z][a-zA-Z0-9_\s]*$/.test(name.trim())) {
      setSheetNameError(
        "Sheet name must start with a letter and contain only letters, numbers, underscores, and spaces"
      );
      setIsValidSheetName(false);
      return false;
    }

    // Check for duplicate names (case insensitive)
    const normalizedName = name.trim().toLowerCase().replace(/\s+/g, "_");
    const isDuplicate = existingSheets.some(
      (sheet) =>
        sheet.sheetName.toLowerCase().replace(/\s+/g, "_") === normalizedName
    );

    if (isDuplicate) {
      setSheetNameError("A sheet with this name already exists");
      setIsValidSheetName(false);
      return false;
    }

    setSheetNameError("");
    setIsValidSheetName(true);
    return true;
  };

  const checkColumnDependencies = (columnIndex) => {
    const dependencies = {
      usedInFormulas: [],
      usedAsRecurrent: [],
      usedAsReference: [] // for future reference tracking
    };

    attributes.forEach((attr, index) => {
      if (index === columnIndex) return; // Skip self

      // Check if used in formulas (derived columns)
      if (attr.derived && attr.formula) {
        if (attr.formula.additionIndices?.includes(columnIndex)) {
          dependencies.usedInFormulas.push({
            columnIndex: index,
            columnName: attr.name,
            usage: 'addition'
          });
        }
        if (attr.formula.subtractionIndices?.includes(columnIndex)) {
          dependencies.usedInFormulas.push({
            columnIndex: index,
            columnName: attr.name,
            usage: 'subtraction'
          });
        }
      }

      // Check if used as recurrent reference
      if (attr.recurrentCheck?.isRecurrent && 
          attr.recurrentCheck.recurrentReferenceIndice === columnIndex) {
        dependencies.usedAsRecurrent.push({
          columnIndex: index,
          columnName: attr.name
        });
      }
    });

    return dependencies;
  };

  // Handle sheet name change
  const handleSheetNameChange = (e) => {
    const value = e.target.value;
    setSheetName(value);
    validateSheetName(value);
  };

  // Handle column type selection
  const handleColumnTypeSelect = (type) => {
    setSelectedColumnType(type);
    setShowColumnTypeDropdown(false);
    setShowColumnModal(true);
  };

  // Close column type dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showColumnTypeDropdown &&
        !event.target.closest(".column-type-dropdown")
      ) {
        setShowColumnTypeDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showColumnTypeDropdown]);

  const handleAddColumn = (columnData) => {
    const newAttribute = {
      name: columnData.name,
      formula: {
        additionIndices: columnData.additionIndices || [],
        subtractionIndices: columnData.subtractionIndices || [],
      },
      linkedFrom: columnData.reference
        ? {
            sheetObjectId: columnData.reference.sheetId,
            attributeIndice: columnData.reference.columnIndex,
          }
        : {
            sheetObjectId: null,
            attributeIndice: null,
          },
      recurrentCheck: columnData.recurrent
        ? {
            isRecurrent: true,
            recurrentReferenceIndice: columnData.recurrent.recurrentColumnIndex,
            recurrenceFedStatus: false,
          }
        : {
            isRecurrent: false,
            recurrentReferenceIndice: null,
            recurrenceFedStatus: false,
          },
      derived:
        columnData.additionIndices?.length > 0 ||
        columnData.subtractionIndices?.length > 0,

      //Subrows configuration
      hasSubrows: columnData.hasSubrows || false,
      subrowsConfig:
        columnData.hasSubrows && columnData.subrowsConfig
          ? {
              subrowsEnabled: columnData.subrowsConfig.subrowsEnabled,
              subrowColumns: columnData.subrowsConfig.subrowColumns.map(
                (col) => ({
                  name: col.name,
                  type: col.type,
                  required: col.required,
                  autoIncrement:
                    col.type === "number" &&
                    col.name.toLowerCase().includes("sr")
                      ? true
                      : false,
                  isAggregateField:
                    col.name === columnData.subrowsConfig.aggregateField,
                })
              ),
              aggregationType:
                columnData.subrowsConfig.aggregationType || "sum",
              aggregateField: columnData.subrowsConfig.aggregateField,
            }
          : {
              subrowsEnabled: false,
              subrowColumns: [],
              aggregationType: "sum",
              aggregateField: null,
            },
    };

    if (editingColumn !== null) {
      // Update existing column
      const updatedAttributes = [...attributes];
      updatedAttributes[editingColumn] = newAttribute;
      setAttributes(updatedAttributes);
      setEditingColumn(null);
    } else {
      // Add new column
      setAttributes([...attributes, newAttribute]);
    }

    setShowColumnModal(false);
  };

  // Edit column
  const handleEditColumn = (index) => {
    if (index === 0) {
      toast.error("Date column cannot be edited");
      return;
    }
    setEditingColumn(index);
    setSelectedColumnType(
      attributes[index].derived ? "derived" : "independent"
    );
    setShowColumnModal(true);
  };

  // Delete column
  const handleDeleteColumn = (index) => {
    if (index === 0) {
      toast.error("Date column cannot be deleted");
      return;
    }

    // Check dependencies
    const dependencies = checkColumnDependencies(index);
    const hasDependendencies = 
      dependencies.usedInFormulas.length > 0 || 
      dependencies.usedAsRecurrent.length > 0;

    if (hasDependendencies) {
      // Create dependency message
      let dependencyMessage = "This column cannot be deleted because:\n";
      
      if (dependencies.usedInFormulas.length > 0) {
        dependencyMessage += "Used in formulas:\n";
        dependencies.usedInFormulas.forEach(dep => {
          dependencyMessage += `  • ${dep.columnName.replace(/_/g, ' ')} (${dep.usage})\n`;
        });
      }
      
      if (dependencies.usedAsRecurrent.length > 0) {
        dependencyMessage += "\n🔄 Used as recurrent reference:\n";
        dependencies.usedAsRecurrent.forEach(dep => {
          dependencyMessage += `  • ${dep.columnName.replace(/_/g, ' ')}\n`;
        });
      }
      
      dependencyMessage += "\nPlease remove these dependencies first before deleting this column.";
      
      toast.error(dependencyMessage, {
        duration: 6000,
        style: {
          maxWidth: '500px',
          whiteSpace: 'pre-line'
        }
      });
      return;
    }

    // Safe to delete - no dependencies found
    const columnName = attributes[index].name.replace(/_/g, ' ');
    const updatedAttributes = attributes.filter((_, i) => i !== index);

    // Update formula indices for derived columns
    const adjustedAttributes = updatedAttributes.map((attr) => {
      if (attr.derived && attr.formula) {
        const adjustedFormula = {
          additionIndices: attr.formula.additionIndices
            .map((idx) => (idx > index ? idx - 1 : idx))
            .filter((idx) => idx !== index),
          subtractionIndices: attr.formula.subtractionIndices
            .map((idx) => (idx > index ? idx - 1 : idx))
            .filter((idx) => idx !== index),
        };
        return { ...attr, formula: adjustedFormula };
      }

      // Update recurrent references
      if (attr.recurrentCheck?.isRecurrent && 
          attr.recurrentCheck.recurrentReferenceIndice > index) {
        return {
          ...attr,
          recurrentCheck: {
            ...attr.recurrentCheck,
            recurrentReferenceIndice: attr.recurrentCheck.recurrentReferenceIndice - 1
          }
        };
      }

      return attr;
    });

    setAttributes(adjustedAttributes);
    toast.success(`Column "${columnName}" deleted successfully`);
  };

  // Create sheet
  const handleCreateSheet = async () => {
    if (!validateSheetName(sheetName) || attributes.length === 0) {
      toast.error("Please provide a valid sheet name and at least one column");
      return;
    }

    setIsCreating(true);

    const sheetMetadata = {
      sheetName: sheetName.trim().replace(/\s+/g, "_"),
      attributes: attributes,
    };

    try {
      console.log("Creating new sheet with metadata:", sheetMetadata);

      const result = await createNewSheet(sheetMetadata);

      if (result.success) {
        toast.success("Sheet created successfully!");
        // Navigate back to sheets view or wherever appropriate
        navigate("/sheets");
      } else {
        toast.error(result.error || "Failed to create sheet");
      }
    } catch (error) {
      console.error("Error creating sheet:", error);
      toast.error("Failed to create sheet");
    } finally {
      setIsCreating(false);
    }
  };

  // Get column type for display
  const getColumnType = (attr) => {
    if (attr.derived) return "derived";
    if (attr.linkedFrom?.sheetObjectId) return "referenced";
    if (attr.recurrentCheck?.isRecurrent) return "recurrent";
    return "independent";
  };

  // Get column type styling
  const getColumnTypeClass = (type) => {
    switch (type) {
      case "derived":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "referenced":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "recurrent":
        return "bg-purple-100 text-purple-800 border-purple-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/sheets")}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center space-x-3">
                <FileSpreadsheet className="w-8 h-8 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">
                  Create New Sheet
                </h1>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate("/sheets")}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSheet}
                disabled={
                  !isValidSheetName || attributes.length === 0 || isCreating
                }
                className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {isCreating ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>{isCreating ? "Creating..." : "Create Sheet"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-8xl mx-auto px-2 sm:px-6 lg:px-4 py-4 h-[calc(100vh-9rem)]">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
          {/* Left Column - Sheet Configuration */}
          <div className="lg:col-span-1 h-full">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-full">
              {/* <h2 className="text-lg font-semibold text-gray-900 mb-6">Sheet Configuration</h2> */}

              {/* Sheet Name Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sheet Name *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={sheetName}
                    onChange={handleSheetNameChange}
                    placeholder="e.g., Financial Tracker, Inventory Management"
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 ${
                      sheetNameError
                        ? "border-red-300 focus:ring-red-500"
                        : isValidSheetName
                        ? "border-green-300 focus:ring-green-500"
                        : "border-gray-300 focus:ring-blue-500"
                    }`}
                  />
                  {isValidSheetName && (
                    <Check className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-500" />
                  )}
                  {sheetNameError && (
                    <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-red-500" />
                  )}
                </div>
                {sheetNameError && (
                  <p className="mt-2 text-sm text-red-600">{sheetNameError}</p>
                )}
                {isValidSheetName && (
                  <p className="mt-2 text-sm text-green-600">
                    Sheet name is available!
                  </p>
                )}
              </div>

              {/* Sheet Statistics */}
              <div className="bg-gray-100 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Sheet Summary
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Total Columns:</span>
                    <span className="font-medium text-gray-900">
                      {attributes.length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Derived Columns:</span>
                    <span className="font-medium text-yellow-600">
                      {attributes.filter((attr) => attr.derived).length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Referenced Columns:</span>
                    <span className="font-medium text-blue-600">
                      {
                        attributes.filter(
                          (attr) => attr.linkedFrom?.sheetObjectId
                        ).length
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Recurrent Columns:</span>
                    <span className="font-medium text-purple-600">
                      {
                        attributes.filter(
                          (attr) => attr.recurrentCheck?.isRecurrent
                        ).length
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Column Management */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border h-full border-gray-200">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Column Configuration
                  </h2>
                  <div className="relative column-type-dropdown">
                    <button
                      onClick={() =>
                        setShowColumnTypeDropdown(!showColumnTypeDropdown)
                      }
                      className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Column</span>
                    </button>

                    {/* Column Type Dropdown */}
                    {showColumnTypeDropdown && (
                      <div className="absolute right-0 top-full mt-2 w-48 bg-white shadow-lg rounded-lg border border-gray-200 z-50 py-2">
                        <button
                          onClick={() => handleColumnTypeSelect("independent")}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors group"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                              <FileSpreadsheet className="w-4 h-4 text-gray-600" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">
                                Independent
                              </div>
                              <div className="text-xs text-gray-500">
                                Manual input values
                              </div>
                            </div>
                          </div>
                        </button>

                        <button
                          onClick={() => handleColumnTypeSelect("derived")}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors group"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center group-hover:bg-yellow-200 transition-colors">
                              <span className="text-yellow-600 font-bold text-sm">
                                fx
                              </span>
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">
                                Derived
                              </div>
                              <div className="text-xs text-gray-500">
                                Calculated from other columns
                              </div>
                            </div>
                          </div>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Columns List */}
              <div className="p-6 h-[calc(100vh-18rem)] overflow-y-auto">
                {attributes.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No columns defined yet</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Click "Add Column" to get started
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 flex flex-col overflow-y-auto">
                    {attributes.map((attr, index) => {
                      const columnType = getColumnType(attr);
                      const typeClass = getColumnTypeClass(columnType);

                      return (
                        <div
                          key={index}
                          className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="flex-shrink-0">
                              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                                <span className="text-sm font-medium text-gray-600">
                                  {index + 1}
                                </span>
                              </div>
                            </div>

                            <div className="flex-1">
                              <div className="flex items-center space-x-3">
                                <h3 className="font-medium text-gray-900 capitalize">
                                  {attr.name.replace(/_/g, " ")}
                                </h3>
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium border ${typeClass}`}
                                >
                                  {columnType === "independent"
                                    ? "Independent"
                                    : columnType === "derived"
                                    ? "Derived"
                                    : columnType === "referenced"
                                    ? "Referenced"
                                    : "Recurrent"}
                                </span>
                                {(() => {
                                  const deps = checkColumnDependencies(index);
                                  const hasDeps = deps.usedInFormulas.length > 0 || deps.usedAsRecurrent.length > 0;
                                  
                                  if (hasDeps && index !== 0) {
                                    return (
                                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-300 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" />
                                        Used by {deps.usedInFormulas.length + deps.usedAsRecurrent.length}
                                      </span>
                                    );
                                  }
                                  return null;
                                })()}
                                {index === 0 && (
                                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-300">
                                    Required
                                  </span>
                                )}
                              </div>

                              {/* Formula preview for derived columns */}
                              {attr.derived && attr.formula && (
                                <div className="mt-2 text-sm text-gray-600">
                                  <span className="font-medium">Formula: </span>
                                  {attr.formula.additionIndices?.length > 0 && (
                                    <span className="text-green-600">
                                      +
                                      {attr.formula.additionIndices
                                        .map(
                                          (idx) =>
                                            attributes[idx]?.name?.replace(
                                              /_/g,
                                              " "
                                            ) || `Column ${idx}`
                                        )
                                        .join(" +")}
                                    </span>
                                  )}
                                  {attr.formula.subtractionIndices?.length >
                                    0 && (
                                    <span className="text-red-600">
                                      {attr.formula.additionIndices?.length > 0
                                        ? " "
                                        : ""}
                                      -
                                      {attr.formula.subtractionIndices
                                        .map(
                                          (idx) =>
                                            attributes[idx]?.name?.replace(
                                              /_/g,
                                              " "
                                            ) || `Column ${idx}`
                                        )
                                        .join(" -")}
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* Recurrent reference preview */}
                              {attr.recurrentCheck?.isRecurrent && (
                                <div className="mt-2 text-sm text-purple-600">
                                  <span className="font-medium">
                                    Recurrent from:{" "}
                                  </span>
                                  {attributes[
                                    attr.recurrentCheck.recurrentReferenceIndice
                                  ]?.name?.replace(/_/g, " ") ||
                                    "Previous period"}
                                </div>
                              )}

                              {/* Reference preview */}
                              {attr.linkedFrom?.sheetObjectId && (
                                <div className="mt-2 text-sm text-blue-600">
                                  <span className="font-medium">
                                    Referenced from external sheet
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center space-x-2">
                            {/* <button
                              onClick={() => handleEditColumn(index)}
                              disabled={index === 0}
                              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title={
                                index === 0
                                  ? "Date column cannot be edited"
                                  : "Edit column"
                              }
                            >
                              <Edit3 className="w-4 h-4" />
                            </button> */}
                            <button
                              onClick={() => handleDeleteColumn(index)}
                              disabled={index === 0}
                              className={`p-2 rounded-lg transition-colors ${
                                index === 0 
                                  ? "text-gray-300 cursor-not-allowed" 
                                  : checkColumnDependencies(index).usedInFormulas.length > 0 || 
                                    checkColumnDependencies(index).usedAsRecurrent.length > 0
                                    ? "text-orange-500 hover:text-orange-600 hover:bg-orange-50"
                                    : "text-gray-500 hover:text-red-600 hover:bg-red-50"
                              }`}
                              title={
                                index === 0
                                  ? "Date column cannot be deleted"
                                  : checkColumnDependencies(index).usedInFormulas.length > 0 || 
                                    checkColumnDependencies(index).usedAsRecurrent.length > 0
                                    ? "Column has dependencies - click to view details"
                                    : "Delete column"
                              }
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Column Creation Modal */}
      {showColumnModal && (
        <ColumnCreationForm
          isOpen={showColumnModal}
          onClose={() => {
            setShowColumnModal(false);
            setEditingColumn(null);
            setSelectedColumnType(null);
          }}
          onSave={handleAddColumn}
          type={selectedColumnType}
          sheets={existingSheets}
          currentSheetId={null}
          existingData={
            editingColumn !== null
              ? {
                  name: attributes[editingColumn]?.name || "",
                  additionIndices:
                    attributes[editingColumn]?.formula?.additionIndices || [],
                  subtractionIndices:
                    attributes[editingColumn]?.formula?.subtractionIndices ||
                    [],
                  reference: attributes[editingColumn]?.linkedFrom
                    ?.sheetObjectId
                    ? {
                        sheetId:
                          attributes[editingColumn]?.linkedFrom?.sheetObjectId,
                        columnIndex:
                          attributes[editingColumn]?.linkedFrom
                            ?.attributeIndice,
                      }
                    : null,
                  recurrent: attributes[editingColumn]?.recurrentCheck
                    ?.isRecurrent
                    ? {
                        recurrentColumnIndex:
                          attributes[editingColumn]?.recurrentCheck
                            ?.recurrentReferenceIndice,
                      }
                    : null,
                }
              : null
          }
          availableAttributes={attributes}
        />
      )}
    </div>
  );
};

export default CreateSheet;
