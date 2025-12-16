import React, { useState, useEffect } from "react";
import {
  Plus,
  Filter,
  FileText,
  Folder,
  FolderOpen,
  X,
  Check,
  AlertCircle,
  ChevronDown,
  Move,
  Grid3X3,
  LayoutGrid,
} from "lucide-react";

// View Toggle Component
export const ViewToggle = ({ viewMode, onViewChange }) => {
  return (
    <div className="flex items-center bg-gray-100 rounded-xl p-1">
      <button
        onClick={() => onViewChange("sheets")}
        className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium ${
          viewMode === "sheets"
            ? "bg-white text-blue-600 shadow-sm"
            : "text-gray-600 hover:text-gray-800"
        }`}
      >
        <Grid3X3 size={16} />
        <span>Sheet View</span>
      </button>
      <button
        onClick={() => onViewChange("groups")}
        className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium ${
          viewMode === "groups"
            ? "bg-white text-blue-600 shadow-sm"
            : "text-gray-600 hover:text-gray-800"
        }`}
      >
        <LayoutGrid size={16} />
        <span>Group View</span>
      </button>
    </div>
  );
};

const MoveButton = ({ sheet, onMoveToGroup, availableGroups }) => {
  const [showMoveDropdown, setShowMoveDropdown] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMoveDropdown && !event.target.closest('.move-dropdown-container')) {
        setShowMoveDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMoveDropdown]);
  
  const handleMoveToGroup = async (groupName) => {
    setIsMoving(true);
    try {
      await onMoveToGroup(sheet._id, groupName);
      setShowMoveDropdown(false);
    } catch (error) {
      console.error('Error moving sheet:', error);
    }
    setIsMoving(false);
  };
  
  return (
    <div className="relative move-dropdown-container">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowMoveDropdown(!showMoveDropdown);
        }}
        disabled={isMoving}
        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-600 rounded transition-all disabled:opacity-50"
      >
        <Move size={14} />
      </button>
      
      {showMoveDropdown && (
        <div className="absolute right-0 top-full mt-2 w-50 bg-white border border-gray-200 rounded-xl shadow-lg z-10 h-[8rem] overflow-y-auto">
          <div className="p-2">
            <button
              onClick={() => handleMoveToGroup(null)}
              disabled={isMoving}
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors disabled:opacity-50"
            >
              Remove from group
            </button>
            
            {availableGroups.length > 0 && (
              <>
                <div className="border-t border-gray-100 my-2"></div>
                {availableGroups
                  .filter(group => group !== sheet.groupName)
                  .map((group) => (
                    <button
                      key={group}
                      onClick={() => handleMoveToGroup(group)}
                      disabled={isMoving}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 bg-gray-100 mb-[0.4rem] text-gray-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                    >
                      <Folder size={14} />
                      <span>{group}</span>
                    </button>
                  ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Group Card Component (for Group View)
export const GroupCard = ({
  groupName,
  sheets,
  onGroupClick,
  onEditGroup,
  onMoveToGroup,
  availableGroups,
  isExpanded = false,
}) => {
  const [showSheets, setShowSheets] = useState(false);

  const handleGroupClick = () => {
    setShowSheets(!showSheets);
    onGroupClick?.(groupName, !showSheets);
  };

  useEffect(() => {
    setShowSheets(isExpanded);
  }, [isExpanded]);
  return (
    <div className="bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 ">
      {/* Group Header */}
      <div className="p-6 cursor-pointer" onClick={handleGroupClick}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1">
            <div className="p-3 bg-blue-50 rounded-lg">
              {showSheets ? (
                <FolderOpen size={24} className="text-blue-600" />
              ) : (
                <Folder size={24} className="text-blue-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 text-lg truncate">
                {groupName || "Ungrouped"}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {sheets.length} sheet{sheets.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm font-medium">
              {sheets.length}
            </div>
            <ChevronDown
              size={18}
              className={`text-gray-400 transition-transform duration-200 ${
                showSheets ? "rotate-180" : ""
              }`}
            />
          </div>
        </div>
      </div>

      {/* Expanded Sheets */}
      {showSheets && (
        <div className="border-t border-gray-100">
          <div className="p-4 space-y-3 max-h-[20rem] overflow-y-auto">
            {sheets.map((sheet) => (
              <div
                key={sheet._id}
                className="relative" // Add relative positioning
              >
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group">
                  <div className="p-2 bg-white rounded-lg">
                    <FileText size={16} className="text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 truncate">
                      {sheet.sheetName || "Untitled Sheet"}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {sheet.attributes?.length || 0} columns • ID:{" "}
                      {sheet._id?.slice(-6)}
                    </p>
                  </div>

                  {/* Move Button with Dropdown */}
                  <MoveButton
                    sheet={sheet}
                    onMoveToGroup={onMoveToGroup}
                    availableGroups={availableGroups}
                  />
                </div>
              </div>
            ))}

            {sheets.length === 0 && (
              <div className="text-center py-6 text-gray-500">
                <Folder size={24} className="mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No sheets in this group</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Group Filter Dropdown Component
export const GroupFilterDropdown = ({
  groups,
  selectedGroup,
  onGroupSelect,
  onCreateNew,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && !event.target.closest(".group-filter-dropdown")) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative group-filter-dropdown">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-64 px-4 py-3 bg-white border border-gray-200 rounded-xl hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
      >
        <div className="flex items-center space-x-3">
          <Filter size={18} className="text-gray-500" />
          <span className="text-gray-700 font-medium">
            {selectedGroup === "all"
              ? "All Sheets"
              : selectedGroup === "ungrouped"
              ? "Ungrouped Sheets"
              : selectedGroup || "Select Group"}
          </span>
        </div>
        <ChevronDown
          size={16}
          className={`text-gray-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50">
          <div className="p-2">
            <button
              onClick={() => {
                onGroupSelect("all");
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors ${
                selectedGroup === "all"
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-700"
              }`}
            >
              All Sheets
            </button>
            <button
              onClick={() => {
                onGroupSelect("ungrouped");
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors ${
                selectedGroup === "ungrouped"
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-700"
              }`}
            >
              Ungrouped Sheets
            </button>

            {groups.length > 0 && (
              <>
                <div className="border-t border-gray-100 my-2"></div>
                <div className="max-h-[12rem] overflow-y-auto">
                    {groups.map((group) => (
                    <button
                        key={group}
                        onClick={() => {
                        onGroupSelect(group);
                        setIsOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2 ${
                        selectedGroup === group
                            ? "bg-blue-50 text-blue-700"
                            : "text-gray-700"
                        }`}
                    >
                        <Folder size={14} />
                        <span>{group}</span>
                    </button>
                    ))}
                </div>
              </>
            )}

            <div className="border-t border-gray-100 my-2"></div>
            <button
              onClick={() => {
                onCreateNew();
                setIsOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-blue-50 text-blue-600 hover:text-blue-700 transition-colors flex items-center space-x-2"
            >
              <Plus size={14} />
              <span>Create New Group</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Sheet Card Component
export const SheetCard = ({ sheet, onMoveToGroup, availableGroups }) => {
  const [showMoveDropdown, setShowMoveDropdown] = useState(false);
  const [isMoving, setIsMoving] = useState(false);

  const handleMoveToGroup = async (groupName) => {
    setIsMoving(true);
    try {
      await onMoveToGroup(sheet._id, groupName);
      setShowMoveDropdown(false);
    } catch (error) {
      console.error("Error moving sheet:", error);
    }
    setIsMoving(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showMoveDropdown &&
        !event.target.closest(".move-dropdown-container")
      ) {
        setShowMoveDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMoveDropdown]);

  return (
    <div className="group bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200">
      <div className="p-6">
        <div className="flex items-start justify-between min-w-0">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className="p-2 bg-blue-50 rounded-lg flex-shrink-0">
              <FileText size={20} className="text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate" title={sheet.sheetName.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}>
                {sheet.sheetName.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()) || "Untitled Sheet"}
              </h3>
              <div className="flex items-center mt-1">
                {sheet.groupName ? (
                  <div className="flex items-center space-x-1">
                    <Folder size={12} className="text-green-500" />
                    <span className="text-sm text-green-600 font-medium">
                      {sheet.groupName}
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-gray-500">Ungrouped</span>
                )}
              </div>
            </div>
          </div>
          
          <div className="relative move-dropdown-container">
            <button
              onClick={() => setShowMoveDropdown(!showMoveDropdown)}
              disabled={isMoving}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50"
              title="Move to group"
            >
              <Move size={16} />
            </button>

            {showMoveDropdown && (
              <div className="absolute right-0 top-full mt-2 w-50 bg-white border border-gray-200 rounded-xl shadow-lg z-10 h-[8rem] overflow-y-auto ">
                <div className="p-2">
                  <button
                    onClick={() => handleMoveToGroup(null)}
                    disabled={isMoving}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors disabled:opacity-50"
                  >
                    Remove from group
                  </button>

                  {availableGroups.length > 0 && (
                    <>
                      <div className="border-t border-gray-100 my-2"></div>
                      {availableGroups
                        .filter((group) => group !== sheet.groupName)
                        .map((group) => (
                          <button
                            key={group}
                            onClick={() => handleMoveToGroup(group)}
                            disabled={isMoving}
                            className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 bg-gray-100 mb-[0.4rem] text-gray-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                          >
                            <Folder size={14} />
                            <span>{group}</span>
                          </button>
                        ))}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-gray-500">
            {sheet.attributes?.length || 0} columns
          </span>
          <span className="text-xs text-gray-400">
            ID: {sheet._id?.slice(-6)}
          </span>
        </div>
      </div>
    </div>
  );
};

// Create Group Modal Component
export const CreateGroupModal = ({
  isOpen,
  onClose,
  onCreateGroup,
  existingGroups = [],
  selectedSheets = [],
}) => {
  const [groupName, setGroupName] = useState("");
  const [selectedSheetsForGroup, setSelectedSheetsForGroup] = useState([]);
  const [errors, setErrors] = useState({});
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setGroupName("");
      setSelectedSheetsForGroup([]);
      setErrors({});
    }
  }, [isOpen]);

  const validateGroupName = (name) => {
    const errors = {};

    if (!name.trim()) {
      errors.name = "Group name is required";
    } else if (name.length < 2) {
      errors.name = "Group name must be at least 2 characters";
    } else if (name.length > 50) {
      errors.name = "Group name must be less than 50 characters";
    } else if (/[",\'@#%$^&*()]/.test(name)) {
      errors.name = "Group name contains invalid characters";
    } else if (existingGroups.includes(name.trim())) {
      errors.name = "Group name already exists";
    }

    if (selectedSheetsForGroup.length === 0) {
      errors.sheets = "At least one sheet must be selected";
    }

    return errors;
  };

  const handleSubmit = async () => {
    const validationErrors = validateGroupName(groupName);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length === 0) {
      setIsCreating(true);
      try {
        await onCreateGroup(groupName.trim(), selectedSheetsForGroup);
        onClose();
      } catch (error) {
        console.error("Error creating group:", error);
        setErrors({ submit: "Failed to create group. Please try again." });
      }
      setIsCreating(false);
    }
  };

  const handleSheetToggle = (sheetId) => {
    setSelectedSheetsForGroup((prev) =>
      prev.includes(sheetId)
        ? prev.filter((id) => id !== sheetId)
        : [...prev, sheetId]
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/75 bg-opacity-20 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
            <FolderOpen size={22} className="text-blue-600" />
            <span>Create New Group</span>
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Group Name
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                errors.name ? "border-red-300" : ""
              }`}
              placeholder="Enter group name..."
              maxLength={50}
            />
            {errors.name && (
              <p className="mt-2 text-sm text-red-600 flex items-center space-x-1">
                <AlertCircle size={14} />
                <span>{errors.name}</span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Sheets to Add
            </label>
            <div className="max-h-[12rem] overflow-y-auto border border-gray-200 rounded-xl p-3 space-y-2">
              {selectedSheets.map((sheet) => (
                <label
                  key={sheet._id}
                  className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedSheetsForGroup.includes(sheet._id)}
                    onChange={() => handleSheetToggle(sheet._id)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <FileText size={16} className="text-gray-500" />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-900">
                      {sheet.sheetName || "Untitled Sheet"}
                    </span>
                    {sheet.groupName && (
                      <span className="text-xs text-gray-500 ml-2">
                        (Currently in: {sheet.groupName})
                      </span>
                    )}
                  </div>
                </label>
              ))}
            </div>
            {errors.sheets && (
              <p className="mt-2 text-sm text-red-600 flex items-center space-x-1">
                <AlertCircle size={14} />
                <span>{errors.sheets}</span>
              </p>
            )}
          </div>

          {errors.submit && (
            <p className="text-sm text-red-600 flex items-center space-x-1">
              <AlertCircle size={14} />
              <span>{errors.submit}</span>
            </p>
          )}

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isCreating}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {isCreating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Check size={16} />
                  <span>Create Group</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
