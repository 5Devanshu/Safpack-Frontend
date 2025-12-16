import React, { useState } from "react";
import { X, Plus, Minus, Calculator, Database, Link2 } from "lucide-react";

const NodeCreationModal = ({
  isOpen,
  onClose,
  onSave,
  attributes,
  availableSheets = [],
}) => {
  const [nodeName, setNodeName] = useState("");
  const [nodeType, setNodeType] = useState("independent");
  const [additionIndices, setAdditionIndices] = useState([]);
  const [subtractionIndices, setSubtractionIndices] = useState([]);
  const [showReference, setShowReference] = useState(false);
  const [selectedReferenceSheet, setSelectedReferenceSheet] = useState(null);
  const [selectedReferenceColumn, setSelectedReferenceColumn] = useState(null);
  const [errors, setErrors] = useState({});

  const resetForm = () => {
    setNodeName("");
    setNodeType("independent");
    setAdditionIndices([]);
    setSubtractionIndices([]);
    setShowReference(false);
    setSelectedReferenceSheet(null);
    setSelectedReferenceColumn(null);
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate node name
    if (!nodeName.trim()) {
      newErrors.nodeName = "Node name is required";
    } else if (nodeName.trim().length < 2) {
      newErrors.nodeName = "Node name must be at least 2 characters";
    } else if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(nodeName.trim())) {
      newErrors.nodeName = "Node name must start with a letter and contain only letters, numbers, and underscores";
    }

    // Check if name already exists
    if (attributes.some(attr => attr.name.toLowerCase() === nodeName.trim().toLowerCase())) {
      newErrors.nodeName = "Node name already exists";
    }

    // Validate derived node formula
    if (nodeType === "derived") {
      if (additionIndices.length === 0 && subtractionIndices.length === 0) {
        newErrors.formula = "Derived nodes must have at least one formula operation";
      }
    }

    // Validate reference
    if (showReference && nodeType === "independent") {
      if (!selectedReferenceSheet) {
        newErrors.reference = "Please select a reference sheet";
      } else if (!selectedReferenceColumn) {
        newErrors.reference = "Please select a reference column";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    const nodeData = {
      name: nodeName.trim(),
      type: nodeType,
      additionIndices: nodeType === "derived" ? additionIndices : [],
      subtractionIndices: nodeType === "derived" ? subtractionIndices : [],
      reference:
        showReference && selectedReferenceSheet && selectedReferenceColumn
          ? {
              sheetId: selectedReferenceSheet._id,
              columnIndex: selectedReferenceColumn.index,
              columnName: selectedReferenceColumn.name,
              sheetName: selectedReferenceSheet.sheetName,
            }
          : null,
    };

    onSave(nodeData);
    handleClose();
  };

  const toggleOperation = (index, operation) => {
    if (operation === "addition") {
      setAdditionIndices((prev) =>
        prev.includes(index)
          ? prev.filter((i) => i !== index)
          : [...prev.filter((i) => i !== index), index]
      );
      // Remove from subtraction if adding to addition
      setSubtractionIndices((prev) => prev.filter((i) => i !== index));
    } else {
      setSubtractionIndices((prev) =>
        prev.includes(index)
          ? prev.filter((i) => i !== index)
          : [...prev.filter((i) => i !== index), index]
      );
      // Remove from addition if adding to subtraction
      setAdditionIndices((prev) => prev.filter((i) => i !== index));
    }
    
    // Clear formula errors when user makes changes
    if (errors.formula) {
      setErrors(prev => ({ ...prev, formula: undefined }));
    }
  };

  const handleNodeNameChange = (e) => {
    setNodeName(e.target.value);
    // Clear name errors when user types
    if (errors.nodeName) {
      setErrors(prev => ({ ...prev, nodeName: undefined }));
    }
  };

  const handleReferenceChange = () => {
    setShowReference(!showReference);
    setSelectedReferenceSheet(null);
    setSelectedReferenceColumn(null);
    // Clear reference errors
    if (errors.reference) {
      setErrors(prev => ({ ...prev, reference: undefined }));
    }
  };

  const handleSheetSelect = (e) => {
    const sheet = availableSheets.find((s) => s._id === e.target.value);
    setSelectedReferenceSheet(sheet);
    setSelectedReferenceColumn(null);
    // Clear reference errors when selection changes
    if (errors.reference) {
      setErrors(prev => ({ ...prev, reference: undefined }));
    }
  };

  const handleColumnSelect = (col, index) => {
    setSelectedReferenceColumn({ ...col, index });
    // Clear reference errors when selection is made
    if (errors.reference) {
      setErrors(prev => ({ ...prev, reference: undefined }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-800">
            Create New Node
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Node Name */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2 text-gray-700">
            Node Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={nodeName}
            onChange={handleNodeNameChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.nodeName 
                ? "border-red-300 focus:ring-red-500" 
                : "border-gray-300"
            }`}
            placeholder="Enter node name (e.g., total_revenue)"
          />
          {errors.nodeName && (
            <p className="mt-1 text-sm text-red-600">{errors.nodeName}</p>
          )}
        </div>

        {/* Node Type Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-3 text-gray-700">
            Node Type <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setNodeType("independent")}
              className={`p-4 border rounded-lg flex items-center gap-3 transition-colors ${
                nodeType === "independent"
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-300 hover:border-gray-400"
              }`}
            >
              <Database className="w-5 h-5" />
              <div className="text-left">
                <div className="font-medium">Independent</div>
                <div className="text-xs text-gray-500">Manual input values</div>
              </div>
            </button>
            <button
              onClick={() => setNodeType("derived")}
              className={`p-4 border rounded-lg flex items-center gap-3 transition-colors ${
                nodeType === "derived"
                  ? "border-purple-500 bg-purple-50 text-purple-700"
                  : "border-gray-300 hover:border-gray-400"
              }`}
            >
              <Calculator className="w-5 h-5" />
              <div className="text-left">
                <div className="font-medium">Derived</div>
                <div className="text-xs text-gray-500">
                  Calculated from other nodes
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Independent Node Reference Option */}
        {nodeType === "independent" && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700">
                Reference External Sheet (Optional)
              </label>
              <button
                onClick={handleReferenceChange}
                className={`text-sm px-3 py-1 rounded-md transition-colors flex items-center gap-2 ${
                  showReference
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <Link2 className="w-4 h-4" />
                {showReference ? "Remove Reference" : "Add Reference"}
              </button>
            </div>

            {showReference && (
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg border">
                {/* Sheet Selection */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    Reference Sheet
                  </label>
                  <select
                    value={selectedReferenceSheet?._id || ""}
                    onChange={handleSheetSelect}
                    className="w-full px-3 py-2 border rounded-md border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a sheet</option>
                    {availableSheets.map((sheet) => (
                      <option key={sheet._id} value={sheet._id}>
                        {sheet.sheetName.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Column Selection */}
                {selectedReferenceSheet && (
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">
                      Reference Column
                    </label>
                    <div className="max-h-40 overflow-y-auto border rounded-md bg-white">
                      {selectedReferenceSheet.attributes.map((col, index) => (
                        <button
                          key={index}
                          onClick={() => handleColumnSelect(col, index)}
                          className={`w-full px-3 py-3 text-left transition-colors border-b border-gray-100 last:border-b-0 ${
                            selectedReferenceColumn?.index === index
                              ? "bg-blue-100 text-blue-800"
                              : "hover:bg-gray-50"
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <span className="font-medium capitalize">
                                {col.name.replace(/_/g, " ")}
                              </span>
                              {col.linkedFrom?.sheetObjectId && (
                                <div className="text-xs text-gray-500 mt-1">
                                  Linked from external sheet
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <span
                                className={`text-xs px-2 py-1 rounded ${
                                  col.derived
                                    ? "bg-purple-100 text-purple-700"
                                    : col.linkedFrom?.sheetObjectId
                                    ? "bg-green-100 text-green-700"
                                    : "bg-gray-100 text-gray-700"
                                }`}
                              >
                                {col.derived 
                                  ? "Derived" 
                                  : col.linkedFrom?.sheetObjectId 
                                  ? "Linked" 
                                  : "Independent"}
                              </span>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Reference Preview */}
                {selectedReferenceSheet && selectedReferenceColumn && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="text-sm font-medium text-blue-800 mb-1">
                      Reference Preview:
                    </div>
                    <div className="text-sm text-blue-700">
                      <span className="font-medium">{nodeName || "New Node"}</span>
                      {" → "}
                      <span className="font-medium">
                        {selectedReferenceSheet.sheetName.replace(/_/g, " ")}
                      </span>
                      {" → "}
                      <span className="font-medium">
                        {selectedReferenceColumn.name.replace(/_/g, " ")}
                      </span>
                    </div>
                  </div>
                )}

                {errors.reference && (
                  <p className="text-sm text-red-600">{errors.reference}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Derived Node Formula Builder */}
        {nodeType === "derived" && (
          <div className="mb-6">
            <label className="block text-sm font-medium mb-3 text-gray-700">
              Formula Builder <span className="text-red-500">*</span>
            </label>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {attributes.map((attr, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                >
                  <div className="flex-1">
                    <span className="font-medium capitalize">
                      {attr.name.replace(/_/g, " ")}
                    </span>
                    {attr.derived && (
                      <div className="text-xs text-purple-600 mt-1">
                        Derived field
                      </div>
                    )}
                    {attr.linkedFrom?.sheetObjectId && (
                      <div className="text-xs text-green-600 mt-1">
                        Linked from external sheet
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleOperation(index, "addition")}
                      className={`flex items-center gap-1 px-3 py-1 rounded-md text-sm transition-colors ${
                        additionIndices.includes(index)
                          ? "bg-green-500 text-white shadow-md"
                          : "bg-green-100 text-green-700 hover:bg-green-200"
                      }`}
                    >
                      <Plus className="w-4 h-4" />
                      Add
                    </button>
                    <button
                      onClick={() => toggleOperation(index, "subtraction")}
                      className={`flex items-center gap-1 px-3 py-1 rounded-md text-sm transition-colors ${
                        subtractionIndices.includes(index)
                          ? "bg-red-500 text-white shadow-md"
                          : "bg-red-100 text-red-700 hover:bg-red-200"
                      }`}
                    >
                      <Minus className="w-4 h-4" />
                      Subtract
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Formula Preview */}
            {(additionIndices.length > 0 || subtractionIndices.length > 0) && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border">
                <div className="text-sm font-medium text-blue-800 mb-2">
                  Formula Preview:
                </div>
                <div className="text-base text-blue-700 font-mono">
                  <span className="font-medium">{nodeName || "New Node"}</span>
                  <span className="mx-2">=</span>
                  {additionIndices.map((idx, i) => (
                    <span key={`add-${idx}`} className="text-green-700">
                      {i > 0 && <span className="text-blue-700"> + </span>}
                      {attributes[idx]?.name.replace(/_/g, " ")}
                    </span>
                  ))}
                  {subtractionIndices.map((idx, i) => (
                    <span key={`sub-${idx}`} className="text-red-700">
                      <span className="text-blue-700"> - </span>
                      {attributes[idx]?.name.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {errors.formula && (
              <p className="mt-2 text-sm text-red-600">{errors.formula}</p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={handleClose}
            className="px-4 py-2 border rounded-md text-gray-600 border-gray-300 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!nodeName.trim()}
            className="px-6 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Node
          </button>
        </div>
      </div>
    </div>
  );
};

export default NodeCreationModal;