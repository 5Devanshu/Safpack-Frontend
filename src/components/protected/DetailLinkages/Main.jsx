import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RefreshCw, X } from "lucide-react";
import { ReactFlowProvider } from "@xyflow/react";
import {
  clearSheetData,
  detailSheetAttributes,
  isDeatailSheetBar,
  sheetForDetail,
  sheetNameForDetail,
  setDetailSheetAttributes,
} from "../../../app/LinkagesSlice.js";
import { AttributeFlowChart } from "./utils/FlowElements.jsx";
import {
  calculateDerivedValue,
  checkTodaysData,
  getTodaysDate,
} from "./utils/Helper.jsx";
import { selectAccount } from "../../../app/DashboardSlice.js";
import NodeCreationModal from "./utils/NodeCreationModal.jsx";
import {
  fetchMetadata,
  getSheetsData,
  insertTodaysData,
  updateMetas,
} from "../../../services/repository/sheetsRepo.js";
import toast from "react-hot-toast";
import { ColumnCreationForm } from "../Views/utils/Helper.jsx";

const SheetDisplayNew = ({ isOpen }) => {
  const dispatch = useDispatch();
  const isDetailSheet = useSelector(isDeatailSheetBar);
  const sheetName = useSelector(sheetNameForDetail);
  const sheetId = useSelector(sheetForDetail);
  const sheetAttributes = useSelector(detailSheetAttributes);

  const [showTotals, setShowTotals] = useState(false);
  const [sheetData, setSheetData] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingUpdates, setPendingUpdates] = useState({});
  const [showNodeCreationModal, setShowNodeCreationModal] = useState(false);
  const [availableMetadata, setAvailableMetadata] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const account = useSelector(selectAccount);
  const isAdmin = account?.role === "admin";

  const handleCreateNode = useCallback(() => {
    setShowNodeCreationModal(true);
  }, []);

  // Fetch available sheets for references
  useEffect(() => {
    const fetchAvailableSheets = async () => {
      try {
        const loginRole = account?.role;
        const metadata = await fetchMetadata(loginRole);
        setAvailableMetadata(
          metadata?.filter((sheet) => sheet._id !== sheetId) || []
        );
      } catch (error) {
        console.error("Error fetching available sheets:", error);
      }
    };

    if (isOpen && sheetId) {
      fetchAvailableSheets();
    }
  }, [isOpen, sheetId, account?.role]);

  // Fetch sheet data function
  const fetchSheetData = useCallback(
    async (sheetId) => {
      try {
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1;

        const apiData = await getSheetsData(
          account?.role,
          sheetId,
          currentYear,
          currentMonth
        );
        console.log("API Sheet Data:", apiData);

        if (!apiData || apiData.length === 0) {
          // Return empty data structure based on current attributes
          const emptyData = sheetAttributes.map((attr, index) => ({
            _id: `empty-${index}`,
            attributes: [],
          }));
          return emptyData;
        }

        // Transform API data to match expected format
        const transformedData = [];
        const numAttributes = Math.max(
          apiData[0]?.attributes?.length || 0,
          sheetAttributes?.length || 0
        );

        // Create one row for each attribute
        for (let attrIndex = 0; attrIndex < numAttributes; attrIndex++) {
          const attributeRow = {
            _id: `attr-${attrIndex}`,
            attributes: [],
          };

          // Collect values for this attribute across all date entries
          apiData.forEach((entry) => {
            if (entry.attributes && entry.attributes[attrIndex] !== undefined) {
              attributeRow.attributes.push(entry.attributes[attrIndex]);
            }
          });

          transformedData.push(attributeRow);
        }

        console.log("Transformed Sheet Data:", transformedData);
        return transformedData;
      } catch (error) {
        console.error("Error fetching sheet data:", error);
        toast.error("Failed to fetch sheet data");
        return [];
      }
    },
    [account?.role, sheetAttributes]
  );

  // Refresh sheet data function
  const refreshSheetData = useCallback(async () => {
    try {
      // Fetch updated metadata first
      const loginRole = account?.role;
      const updatedMetadata = await fetchMetadata(loginRole);

      // Find the current sheet in updated metadata
      const currentSheet = updatedMetadata.find(
        (sheet) => sheet._id === sheetId
      );

      if (currentSheet) {
        // Update Redux state with fresh attributes
        dispatch(
          setDetailSheetAttributes({
            label: currentSheet.sheetName,
            attributes: currentSheet.attributes,
          })
        );

        // Fetch fresh sheet data
        const freshSheetData = await fetchSheetData(sheetId);
        setSheetData(freshSheetData);

        console.log("Data refreshed successfully");
      }
    } catch (error) {
      console.error("Error refreshing data:", error);
      toast.error("Failed to refresh data");
    }
  }, [sheetId, account?.role, dispatch, fetchSheetData]);

  // Handle node creation
  const handleSaveNode = useCallback(
    async (nodeData) => {
      try {
        setIsRefreshing(true);

        // Create new attribute with exact metadata format
        const newAttribute = {
          formula:
            nodeData.type === "derived"
              ? {
                  additionIndices: nodeData.additionIndices || [],
                  subtractionIndices: nodeData.subtractionIndices || [],
                }
              : null,
          linkedFrom: nodeData.reference
            ? {
                sheetObjectId: nodeData.reference.sheetId,
                attributeIndice: nodeData.reference.columnIndex,
              }
            : {
                sheetObjectId: null,
                attributeIndice: null,
              },
          recurrentCheck: {
            isRecurrent: false,
            recurrentReferenceIndice: null,
            recurrenceFedStatus: false,
          },
          name: nodeData.name,
          derived: nodeData.type === "derived",
        };

        // Build the complete metadata object with new attribute appended
        const updatedMetadata = {
          _id: sheetId,
          sheetName: sheetName,
          attributes: [...sheetAttributes, newAttribute],
          __v: 0,
        };

        console.log("Sending updated metadata to API:", updatedMetadata);

        // Send entire metadata collection to API
        const response = await updateMetas(
          sheetId,
          updatedMetadata,
          "newColumn"
        );

        if (response.status === 200) {
          toast.success("Node created successfully!");
          setShowNodeCreationModal(false);
          window.location.reload();

          // Refresh the metadata and sheet data after successful update
          // await refreshSheetData();
        } else {
          throw new Error("Failed to update metadata");
        }
      } catch (error) {
        console.error("Error creating node:", error);
        toast.error("Failed to create node");
      } finally {
        setIsRefreshing(false);
      }
    },
    [sheetAttributes, sheetId, sheetName, refreshSheetData]
  );

  // Load initial sheet data
  useEffect(() => {
    if (sheetId) {
      fetchSheetData(sheetId).then(setSheetData);
    }
  }, [sheetId, fetchSheetData]);

  // Handle value updates
  const handleValueUpdate = useCallback((attributeIndex, newValue) => {
    setPendingUpdates((prev) => ({
      ...prev,
      [attributeIndex]: newValue,
    }));
  }, []);

  // Save today's data
  const handleSaveData = useCallback(async () => {
    setIsSaving(true);
    try {
      const today = getTodaysDate();

      // Prepare data for API - collect all attribute values for today
      const todayData = [];

      // Add today's date as first attribute
      todayData.push(today);

      // Add values for each attribute (skip index 0 which is date)
      for (let i = 1; i < sheetAttributes.length; i++) {
        const attr = sheetAttributes[i];

        if (attr.derived && attr.formula) {
          // Calculate derived value based on the pending updates
          let result = 0;

          // Addition indices
          if (attr.formula.additionIndices) {
            attr.formula.additionIndices.forEach((index) => {
              const value = pendingUpdates[index] || 0;
              result += parseFloat(value) || 0;
            });
          }

          // Subtraction indices
          if (attr.formula.subtractionIndices) {
            attr.formula.subtractionIndices.forEach((index) => {
              const value = pendingUpdates[index] || 0;
              result -= parseFloat(value) || 0;
            });
          }

          todayData.push(result);
        } else {
          // Use pending update value or 0
          const value = pendingUpdates[i];
          todayData.push(value || 0);
        }
      }

      console.log("Saving today's data:", todayData);

      // Save data via API
      const saveResponse = await insertTodaysData(sheetId, todayData);

      if (saveResponse) {
        toast.success("Today's data saved successfully!");

        // Refresh data after save
        const updatedData = await fetchSheetData(sheetId);
        setSheetData(updatedData);
        setPendingUpdates({});
      }
    } catch (error) {
      console.error("Error saving data:", error);
      toast.error("Failed to save data");
    } finally {
      setIsSaving(false);
    }
  }, [sheetId, pendingUpdates, sheetAttributes, fetchSheetData]);

  // Toggle totals view
  const handleToggleTotals = useCallback(() => {
    setShowTotals((prev) => !prev);
  }, []);

  // Refresh data
  const handleRefresh = useCallback(() => {
    if (sheetId) {
      fetchSheetData(sheetId).then(setSheetData);
      setPendingUpdates({});
    }
  }, [sheetId, fetchSheetData]);

  // Check if today's data exists
  const hasToday = useMemo(() => {
    return checkTodaysData(sheetData);
  }, [sheetData]);

  // Close sidebar
  const onCloseBar = () => {
    dispatch(clearSheetData({}));
  };

  return (
    <div
      className={`
        ${isOpen ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"}
        fixed inset-y-0 right-0 h-full
        transition-all duration-300 ease-in-out
        w-[calc(100vw-5rem)] min-w-[800px]
        bg-white border-l border-gray-200
        flex flex-col
        shadow-2xl z-50
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-2 border-b border-gray-200 bg-gray-50">
        <div className="flex gap-2 items-center justify-center">
          <h2 className="text-2xl font-bold text-gray-900 capitalize">
            {sheetName?.replace(/_/g, " ") || "Sheet Details"}
          </h2>
          <div className="items-center justify-center flex gap-2 select-none">
            <p
              className={`${
                hasToday ? "bg-green-500" : "bg-red-500"
              } text-white rounded-full text-sm font-bold px-2 py-1 mt-1`}
            >
              {hasToday ? "Today's data available" : "Enter today's data"}
            </p>
            <p>Sheet View</p>
          </div>
        </div>
        <button
          onClick={onCloseBar}
          className="p-2 hover:bg-gray-200 rounded-full transition-colors duration-200"
        >
          <X className="w-6 h-6 text-gray-600" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden relative">
        {sheetAttributes && sheetAttributes.length > 0 ? (
          <>
            <ReactFlowProvider>
              <AttributeFlowChart
                attributes={sheetAttributes}
                sheetName={sheetName}
                sheetData={sheetData}
                showTotals={showTotals}
                hasToday={hasToday}
                onValueUpdate={handleValueUpdate}
                onToggleTotals={handleToggleTotals}
                onSaveData={handleSaveData}
                onRefresh={handleRefresh}
                isSaving={isSaving}
                onCreateNode={handleCreateNode}
              />
            </ReactFlowProvider>

            {/* Node Creation Modal */}
            {showNodeCreationModal && (
              <NodeCreationModal
                isOpen={showNodeCreationModal}
                onClose={() => setShowNodeCreationModal(false)}
                onSave={handleSaveNode}
                attributes={sheetAttributes}
                availableSheets={availableMetadata}
              />
              // <ColumnCreationForm
              //   isOpen={showNodeCreationModal}
              //   onClose={() => setShowNodeCreationModal(false)}
              //   onSave={handleSaveNode}
              //   type="independent"
              //   sheets={[{attributes:sheetAttributes, _id: sheetId}]}
              //   currentSheetId={sheetId}
              // />
            )}

            {/* Loading Overlay */}
            {isRefreshing && (
              <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-50">
                <div className="flex flex-col items-center gap-3">
                  <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
                  <p className="text-sm text-gray-600">Creating node...</p>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Sheet Selected
              </h3>
              <p className="text-gray-500">
                Select a sheet from the main view to see its attribute
                relationships
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SheetDisplayNew;
