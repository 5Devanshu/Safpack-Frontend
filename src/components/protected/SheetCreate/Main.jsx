import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import {
  Save,
  Check,
  AlertCircle,
  ArrowLeft,
  FileSpreadsheet,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  createNewSheet,
  fetchMetadata,
} from "../../../services/repository/sheetsRepo";
import { selectAccount } from "../../../app/DashboardSlice";
import toast from "react-hot-toast";

const CreateSheet = () => {
  const navigate = useNavigate();
  const account = useSelector(selectAccount);

  // State management
  const [existingSheets, setExistingSheets] = useState([]);
  const [sheetName, setSheetName] = useState("");
  const [sheetDescription, setSheetDescription] = useState("");
  const [sheetNameError, setSheetNameError] = useState("");
  const [isValidSheetName, setIsValidSheetName] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // Fetch existing sheets metadata
  useEffect(() => {
    const loadExistingSheets = async () => {
      try {
        setLoading(true);
        const fetchedMetadata = await fetchMetadata(account?.role || "user");

        if (fetchedMetadata && Array.isArray(fetchedMetadata)) {
          setExistingSheets(fetchedMetadata);
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

    // Check for duplicate names (case insensitive)
    const normalizedName = name.trim().toLowerCase();
    const isDuplicate = existingSheets.some(
      (sheet) => sheet.name.toLowerCase() === normalizedName
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

  // Handle sheet name change
  const handleSheetNameChange = (e) => {
    const value = e.target.value;
    setSheetName(value);
    validateSheetName(value);
  };

  // Create sheet
  const handleCreateSheet = async () => {
    if (!validateSheetName(sheetName)) {
      toast.error("Please provide a valid sheet name");
      return;
    }

    setIsCreating(true);

    try {
      console.log("Creating new sheet with name:", sheetName);

      const result = await createNewSheet({
        sheetName: sheetName.trim(),
        description: sheetDescription.trim() || null
      });

      if (result.success) {
        toast.success("Sheet created successfully!");
        // Navigate back to sheets view
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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
                disabled={!isValidSheetName || isCreating}
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="max-w-2xl mx-auto">
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

            {/* Sheet Description Input */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                value={sheetDescription}
                onChange={(e) => setSheetDescription(e.target.value)}
                placeholder="Brief description of what this sheet will be used for..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
              />
            </div>

            {/* Info Section */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-900 mb-2">
                What happens next?
              </h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Your sheet will be created with basic structure</li>
                <li>• You can add columns and configure data entry later</li>
                <li>• Start entering data once your sheet is ready</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateSheet;
