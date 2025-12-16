import { memo, useState, useMemo, useCallback, useEffect } from "react";
import {
  Position,
  useReactFlow,
  Handle,
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
} from "@xyflow/react";
import ELK from "elkjs/lib/elk.bundled.js";

import {
  ArrowLeft,
  ArrowRight,
  Link,
  Plus,
  Minus,
  Info,
  Calculator,
  Link2,
  RotateCcw,
  Database,
  TrendingUp,
  TrendingDown,
  Calendar,
} from "lucide-react";
import { useDispatch } from "react-redux";
import {
  detailSheetBarToggle,
  setDetailSheetAttributes,
  setSheetForDetail,
} from "../../../../app/LinkagesSlice";

export function generateFlowElements(metadata) {
  console.log("generateFlowElements called with:", metadata);

  if (!metadata || !Array.isArray(metadata) || metadata.length === 0) {
    console.log("No valid metadata provided");
    return { nodes: [], edges: [] };
  }

  const nodes = [];
  const edges = [];
  const sheetMap = {};
  const objectIdToSheet = {};

  // First pass: create node IDs and map _ids
  metadata.forEach((sheet, index) => {
    if (!sheet._id || !sheet.sheetName || !sheet.attributes) {
      console.warn("Invalid sheet data:", sheet);
      return;
    }

    const nodeId = `sheet-${index}`;
    sheetMap[sheet._id] = nodeId;
    objectIdToSheet[sheet._id] = sheet;

    nodes.push({
      id: nodeId,
      type: "customNode",
      position: {
        x: 100 + (index % 3) * 400,
        y: 100 + Math.floor(index / 3) * 350,
      },
      data: {
        sheetId: sheet._id,
        label: sheet.sheetName,
        attributes: sheet.attributes,
      },
    });
  });

  // Second pass: create edges and collect all mappings between sheets
  const sheetConnections = {}; // Track connections between sheets

  metadata.forEach((sheet) => {
    if (!sheet._id || !sheet.attributes) return;

    const targetId = sheetMap[sheet._id];

    sheet.attributes.forEach((attr, attrIndex) => {
      if (!attr || !attr.linkedFrom) return;

      const link = attr.linkedFrom;
      if (
        link.sheetObjectId &&
        link.attributeIndice !== null &&
        link.attributeIndice !== undefined
      ) {
        const sourceId = sheetMap[link.sheetObjectId];
        const sourceSheet = objectIdToSheet[link.sheetObjectId];
        const sourceAttr = sourceSheet?.attributes?.[link.attributeIndice];

        if (sourceId && sourceAttr && targetId) {
          const connectionKey = `${sourceId}-${targetId}`;

          // Initialize connection if it doesn't exist
          if (!sheetConnections[connectionKey]) {
            sheetConnections[connectionKey] = {
              sourceId,
              targetId,
              sourceSheet: sourceSheet.sheetName,
              targetSheet: sheet.sheetName,
              sourceSheetId: link.sheetObjectId,
              targetSheetId: sheet._id,
              mappings: [],
            };
          }

          // Add this mapping to the connection
          sheetConnections[connectionKey].mappings.push({
            sourceColumn: sourceAttr.name,
            targetColumn: attr.name,
            sourceAttrIndex: link.attributeIndice,
            targetAttrIndex: attrIndex,
          });
        }
      }
    });
  });

  // Create edges from sheet connections
  Object.values(sheetConnections).forEach((connection, index) => {
    const primaryMapping = connection.mappings[0];
    const additionalMappings = connection.mappings.slice(1);

    edges.push({
      id: `edge-${connection.sourceId}-${connection.targetId}`,
      source: connection.sourceId,
      target: connection.targetId,
      type: "customEdge",
      data: {
        sourceColumn: primaryMapping.sourceColumn,
        targetColumn: primaryMapping.targetColumn,
        sourceSheet: connection.sourceSheet,
        targetSheet: connection.targetSheet,
        sourceSheetId: connection.sourceSheetId,
        targetSheetId: connection.targetSheetId,
        sourceAttrIndex: primaryMapping.sourceAttrIndex,
        targetAttrIndex: primaryMapping.targetAttrIndex,
        additionalMappings: additionalMappings.map((mapping) => ({
          source: mapping.sourceColumn,
          target: mapping.targetColumn,
        })),
        totalMappings: connection.mappings.length,
      },
    });
  });

  console.log("Generated nodes:", nodes.length, nodes);
  console.log("Generated edges:", edges.length, edges);

  return { nodes, edges };
}

export const CustomNode = ({ data }) => {
  const { label, attributes, sheetId } = data;
  const dispatch = useDispatch();

  const handleNodeClick = (e) => {
    console.log("Node clicked:", e);
    dispatch(setSheetForDetail({ sheetForDetail: e }));
    dispatch(setDetailSheetAttributes({ label, attributes }));
  };

  return (
    <div
      onClick={() => handleNodeClick(sheetId)}
      className="min-w-72 max-h-72 z-30 bg-white border-2 border-gray-300 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-t-xl">
        <h3 className="font-bold text-lg capitalize">
          {label.replace(/_/g, " ")}
        </h3>
      </div>

      {/* Attributes */}
      <div className="p-4 space-y-2 max-h-60 overflow-y-auto ">
        {attributes.map((attr, index) => (
          <div
            key={index}
            className={`px-2 py-1 rounded-lg border-l-4 transition-colors duration-200 ${
              attr.derived
                ? "bg-purple-50 border-purple-400 hover:bg-purple-100"
                : attr.linkedFrom?.sheetObjectId
                ? "bg-green-50 border-green-400 hover:bg-green-100"
                : attr.recurrentCheck?.isRecurrent
                ? "bg-amber-50 border-amber-400 hover:bg-amber-100"
                : "bg-gray-50 border-gray-300 hover:bg-gray-100"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-800 capitalize text-sm">
                {attr.name.replace(/_/g, " ")}
              </span>
              <div className="flex gap-1">
                {attr.derived && (
                  <span className="bg-purple-200 text-purple-800 px-2 py-[3px] rounded-full text-xs font-medium">
                    Derived
                  </span>
                )}
                {attr.linkedFrom?.sheetObjectId && (
                  <span className="bg-green-200 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                    Linked
                  </span>
                )}
                {attr.recurrentCheck?.isRecurrent && (
                  <span className="bg-amber-200 text-amber-800 px-2 py-1 rounded-full text-xs font-medium">
                    Recurrent
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Connection Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-blue-500 border-2 border-white"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-blue-500 border-2 border-white"
      />
    </div>
  );
};

export const CustomEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
}) => {
  const { setEdges } = useReactFlow();
  const [showTooltip, setShowTooltip] = useState(false);
  const [isClicked, setIsClicked] = useState(false);

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition: Position.Right,
    targetX,
    targetY,
    targetPosition: Position.Left,
  });

  // Handle click on the link button
  const handleLinkClick = (e) => {
    e.stopPropagation(); // Prevent event bubbling
    setIsClicked(!isClicked);
  };

  // Handle clicks outside to hide the tooltip
  useEffect(() => {
    const handleClickOutside = () => {
      setIsClicked(false);
    };

    if (isClicked) {
      document.addEventListener("click", handleClickOutside);
      return () => {
        document.removeEventListener("click", handleClickOutside);
      };
    }
  }, [isClicked]);

  // Show tooltip when hovering (only if not clicked) or when clicked
  const shouldShowTooltip = (showTooltip && !isClicked) || isClicked;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{ stroke: "#3b82f6", strokeWidth: 2 }}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: "all",
          }}
          className="z-20 absolute translate-0.5"
        >
          <button
            className={`nodrag nopan border-2 border-blue-500 rounded-full p-1.5 transition-all duration-200 shadow-lg ${
              isClicked ? "bg-blue-500 scale-110" : "bg-white hover:bg-blue-50"
            }`}
            onMouseEnter={() => !isClicked && setShowTooltip(true)}
            onMouseLeave={() => !isClicked && setShowTooltip(false)}
            onClick={handleLinkClick}
          >
            <Link
              size={14}
              className={isClicked ? "text-white" : "text-blue-600"}
            />
          </button>

          {shouldShowTooltip && data && (
            <div
              className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-blue-900 text-white px-2 py-2 rounded-lg shadow-lg text-sm min-w-64 max-w-80 z-0"
              style={{ pointerEvents: "none" }}
              onClick={(e) => e.stopPropagation()} // Prevent clicks on tooltip from closing it
            >
              {/* Sheet Names Header with count */}
              <div className="flex justify-between items-center mb-2">
                <div className="text-xs font-medium truncate flex-1">
                  {data.sourceSheet?.replace(/_/g, " ")}
                </div>
                <div className="mx-1 flex items-center">
                  <ArrowRight className="w-3 h-3 text-yellow-400" />
                  {data.totalMappings > 1 && (
                    <span className="ml-1 bg-yellow-500 text-blue-900 text-xs px-1 rounded-full font-bold">
                      {data.totalMappings}
                    </span>
                  )}
                </div>
                <div className="text-xs font-medium truncate flex-1">
                  {data.targetSheet?.replace(/_/g, " ")}
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-blue-700 mb-2"></div>

              {/* Column mappings with scroll */}
              <div className="max-h-32 overflow-y-auto space-y-1">
                {/* Primary mapping */}
                <div className="flex items-center justify-between">
                  <span className="text-cyan-300 text-xs font-medium truncate">
                    {data.sourceColumn?.replace(/_/g, " ")}
                  </span>
                  <span className="text-yellow-400 mx-1">
                    <ArrowRight className="w-3 h-3" />
                  </span>
                  <span className="text-cyan-300 text-xs font-medium truncate">
                    {data.targetColumn?.replace(/_/g, " ")}
                  </span>
                </div>

                {/* Additional mappings */}
                {data.additionalMappings &&
                  data.additionalMappings.map((mapping, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between"
                    >
                      <span className="text-cyan-300 text-xs truncate">
                        {mapping.source?.replace(/_/g, " ")}
                      </span>
                      <span className="text-yellow-400 mx-1">
                        <ArrowRight className="w-3 h-3" />
                      </span>
                      <span className="text-cyan-300 text-xs truncate">
                        {mapping.target?.replace(/_/g, " ")}
                      </span>
                    </div>
                  ))}
              </div>

              {/* Tooltip arrow */}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-blue-900"></div>
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

//Everything for the sheet display...

// Utility functions for generating ReactFlow elements from attribute data

export function generateAttributeFlowElements(attributes) {
  if (!attributes || !Array.isArray(attributes)) {
    return { nodes: [], edges: [] };
  }

  const nodes = [];
  const edges = [];

  // Create nodes for each attribute
  attributes.forEach((attr, index) => {
    const nodeType = determineNodeType(attr);

    nodes.push({
      id: `attr-${index}`,
      type: "attributeNode",
      position: {
        x: 100 + (index % 4) * 320,
        y: 100 + Math.floor(index / 4) * 200,
      },
      data: {
        name: attr.name,
        type: nodeType,
        derived: attr.derived,
        linkedFrom: attr.linkedFrom,
        recurrentCheck: attr.recurrentCheck,
        formula: attr.formula,
        value: generateSampleValue(attr, index),
        index: index,
      },
    });
  });

  // Create edges based on formulas
  attributes.forEach((attr, targetIndex) => {
    if (attr.derived && attr.formula) {
      // Addition edges (green)
      if (attr.formula.additionIndices?.length > 0) {
        attr.formula.additionIndices.forEach((sourceIndex) => {
          if (sourceIndex < attributes.length) {
            edges.push({
              id: `edge-add-${sourceIndex}-${targetIndex}`,
              source: `attr-${sourceIndex}`,
              target: `attr-${targetIndex}`,
              type: "formulaEdge",
              animated: true,
              data: {
                operation: "addition",
                sourceColumn: attributes[sourceIndex]?.name,
                targetColumn: attr.name,
                sourceIndex,
                targetIndex,
              },
            });
          }
        });
      }

      // Subtraction edges (red)
      if (attr.formula.subtractionIndices?.length > 0) {
        attr.formula.subtractionIndices.forEach((sourceIndex) => {
          if (sourceIndex < attributes.length) {
            edges.push({
              id: `edge-sub-${sourceIndex}-${targetIndex}`,
              source: `attr-${sourceIndex}`,
              target: `attr-${targetIndex}`,
              type: "formulaEdge",
              animated: true,
              data: {
                operation: "subtraction",
                sourceColumn: attributes[sourceIndex]?.name,
                targetColumn: attr.name,
                sourceIndex,
                targetIndex,
              },
            });
          }
        });
      }
    }

    // Create edges for recurrent relationships
    if (
      attr.recurrentCheck?.isRecurrent &&
      attr.recurrentCheck?.recurrentReferenceIndice !== null
    ) {
      const refIndex = attr.recurrentCheck.recurrentReferenceIndice;
      if (refIndex < attributes.length) {
        edges.push({
          id: `edge-recurrent-${refIndex}-${targetIndex}`,
          source: `attr-${refIndex}`,
          target: `attr-${targetIndex}`,
          type: "formulaEdge",
          animated: true,
          data: {
            operation: "recurrent",
            sourceColumn: attributes[refIndex]?.name,
            targetColumn: attr.name,
            sourceIndex: refIndex,
            targetIndex,
          },
        });
      }
    }
  });

  return { nodes, edges };
}

export function determineNodeType(attr) {
  if (attr.derived) {
    return "derived";
  }
  if (attr.linkedFrom?.sheetObjectId) {
    return "linked";
  }
  if (attr.recurrentCheck?.isRecurrent) {
    return "recurrent";
  }
  return "independent";
}

// Generate sample values for demonstration
export function generateSampleValue(attr, index) {
  const sampleValues = {
    date: new Date().toLocaleDateString(),
    purchase: 4000,
    "opening-stock": 60,
    inward: 40,
    outward: 30,
    "closing-stock": 70,
    "raw-material-used": 25,
    production: 45,
    damaged: 5,
    "available-stock": 40,
  };

  // Return specific sample value if available, otherwise generate based on type
  if (sampleValues[attr.name]) {
    return sampleValues[attr.name];
  }

  // Generate values based on attribute characteristics
  if (attr.name.includes("date")) {
    return new Date().toLocaleDateString();
  }
  if (attr.name.includes("stock") || attr.name.includes("inventory")) {
    return Math.floor(Math.random() * 100) + 50;
  }
  if (
    attr.name.includes("amount") ||
    attr.name.includes("value") ||
    attr.name.includes("purchase")
  ) {
    return Math.floor(Math.random() * 5000) + 1000;
  }
  if (attr.derived) {
    // For derived fields, we could calculate based on formula
    return Math.floor(Math.random() * 200) + 10;
  }

  return Math.floor(Math.random() * 100);
}

export function calculateDerivedValue(attr, attributes) {
  if (!attr.derived || !attr.formula) {
    return null;
  }

  let result = 0;

  // Add values from addition indices
  if (attr.formula["addition-indices"]) {
    attr.formula["addition-indices"].forEach((index) => {
      if (attributes[index]) {
        const value =
          typeof attributes[index].value === "number"
            ? attributes[index].value
            : parseFloat(attributes[index].value) || 0;
        result += value;
      }
    });
  }

  // Subtract values from subtraction indices
  if (attr.formula["subtraction-indices"]) {
    attr.formula["subtraction-indices"].forEach((index) => {
      if (attributes[index]) {
        const value =
          typeof attributes[index].value === "number"
            ? attributes[index].value
            : parseFloat(attributes[index].value) || 0;
        result -= value;
      }
    });
  }

  return result;
}

export const AttributeNode = ({ data }) => {
  const { name, type, derived, linkedFrom, recurrentCheck, formula, value } =
    data;

  const getNodeStyles = () => {
    switch (type) {
      case "derived":
        return {
          borderColor: "border-purple-400",
          bgColor: "bg-purple-50",
          headerBg: "bg-gradient-to-r from-purple-500 to-purple-600",
          badgeColor: "bg-purple-100 text-purple-800",
        };
      case "linked":
        return {
          borderColor: "border-green-400",
          bgColor: "bg-green-50",
          headerBg: "bg-gradient-to-r from-green-500 to-green-600",
          badgeColor: "bg-green-100 text-green-800",
        };
      case "recurrent":
        return {
          borderColor: "border-amber-400",
          bgColor: "bg-amber-50",
          headerBg: "bg-gradient-to-r from-amber-500 to-amber-600",
          badgeColor: "bg-amber-100 text-amber-800",
        };
      default:
        return {
          borderColor: "border-gray-300",
          bgColor: "bg-gray-50",
          headerBg: "bg-gradient-to-r from-gray-500 to-gray-600",
          badgeColor: "bg-gray-100 text-gray-800",
        };
    }
  };

  const styles = getNodeStyles();

  const getIcon = () => {
    switch (type) {
      case "derived":
        return <Calculator size={16} className="text-white" />;
      case "linked":
        return <Link2 size={16} className="text-white" />;
      case "recurrent":
        return <RotateCcw size={16} className="text-white" />;
      default:
        return <Database size={16} className="text-white" />;
    }
  };

  const formatValue = (val) => {
    if (val === null || val === undefined) return "-";
    if (typeof val === "number") {
      return val.toLocaleString();
    }
    return val.toString();
  };

  return (
    <div
      className={`min-w-[280px] bg-white ${styles.borderColor} border-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300`}
    >
      {/* Header */}
      <div className={`${styles.headerBg} text-white px-4 py-3 rounded-t-xl`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getIcon()}
            <h3 className="font-bold text-md capitalize">
              {name.replace(/-/g, " ")}
            </h3>
          </div>
          {type !== "independent" && (
            <span
              className={`${styles.badgeColor} px-2 py-1 rounded-full text-xs font-medium`}
            >
              {type === "derived"
                ? "Derived"
                : type === "linked"
                ? "Linked"
                : "Recurrent"}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className={`${styles.bgColor} px-4 py-3 rounded-b-xl`}>
        {/* Value Display */}
        <div className="mb-3">
          <div className="text-center">
            {/* <div className="text-2xl font-bold text-gray-900 mb-1">
              {formatValue(value)}
            </div> */}
            {type === "derived" && formula && (
              <div className="text-xs text-gray-600">Formula Applied</div>
            )}
            {type === "recurrent" && recurrentCheck?.["is-recurrent"] && (
              <div className="text-xs text-gray-600">
                From Period {recurrentCheck["recurrent-reference-indice"]}
              </div>
            )}
          </div>
        </div>

        {/* Formula Details for Derived Fields */}
        {type === "derived" && formula && (
          <div className="border-t border-purple-200 pt-2">
            <div className="text-xs text-gray-700 mb-1 font-medium">
              Formula:
            </div>
            <div className="flex flex-wrap gap-1 text-xs">
              {formula["addition-indices"]?.map((idx, i) => (
                <span key={`add-${idx}`} className="inline-flex items-center">
                  <TrendingUp size={10} className="text-green-600 mr-1" />
                  <span className="bg-green-100 text-green-800 px-1 py-0.5 rounded">
                    Col {idx}
                  </span>
                  {i < formula["addition-indices"].length - 1 && (
                    <span className="mx-1">+</span>
                  )}
                </span>
              ))}
              {formula["subtraction-indices"]?.length > 0 &&
                formula["addition-indices"]?.length > 0 && (
                  <span className="mx-1">-</span>
                )}
              {formula["subtraction-indices"]?.map((idx, i) => (
                <span key={`sub-${idx}`} className="inline-flex items-center">
                  <TrendingDown size={10} className="text-red-600 mr-1" />
                  <span className="bg-red-100 text-red-800 px-1 py-0.5 rounded">
                    Col {idx}
                  </span>
                  {i < formula["subtraction-indices"].length - 1 && (
                    <span className="mx-1">-</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Status Indicators */}
        <div className="flex justify-between items-center mt-2 text-xs">
          <div className="flex gap-2">
            {recurrentCheck?.["is-recurrent"] && (
              <span className="inline-flex items-center gap-1 text-amber-700">
                <Calendar size={10} />
                Recurrent
              </span>
            )}
            {linkedFrom && (
              <span className="inline-flex items-center gap-1 text-green-700">
                <Link2 size={10} />
                External Link
              </span>
            )}
          </div>
          <span className="text-gray-500 capitalize">
            {type === "independent" ? "Independent" : type}
          </span>
        </div>
      </div>

      {/* Connection Handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-blue-500 border-2 border-white !top-[-6px]"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-blue-500 border-2 border-white !bottom-[-6px]"
      />
    </div>
  );
};

export const FormulaEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
  style,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const { operation, sourceColumn, targetColumn, sourceIndex, targetIndex } =
    data;

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });

  const getEdgeColor = () => {
    switch (operation) {
      case "addition":
        return "#10b981"; // Green
      case "subtraction":
        return "#ef4444"; // Red
      default:
        return "#6b7280"; // Gray
    }
  };

  const getOperationIcon = () => {
    switch (operation) {
      case "addition":
        return <Plus size={12} className="text-white" />;
      case "subtraction":
        return <Minus size={12} className="text-white" />;
      default:
        return <Info size={12} className="text-white" />;
    }
  };

  const getOperationLabel = () => {
    switch (operation) {
      case "addition":
        return "Added to";
      case "subtraction":
        return "Subtracted from";
      default:
        return "Related to";
    }
  };

  const edgeColor = getEdgeColor();
  const strokeWidth =
    operation === "addition" || operation === "subtraction" ? 3 : 2;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        animated={true}
        style={{
          stroke: edgeColor,
          strokeWidth,
          strokeDasharray:
            operation === "subtraction"
              ? "8,4"
              : operation === "addition"
              ? "9,4"
              : "none",
          ...style,
        }}
        markerEnd={`url(#arrow-${operation})`}
      />

      {/* Arrow Markers */}
      <defs>
        <marker
          id={`arrow-${operation}`}
          markerWidth="12"
          markerHeight="12"
          refX="10"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <polygon points="0 0, 12 3, 0 6" fill={edgeColor} />
        </marker>
      </defs>

      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: "all",
          }}
          className="z-20"
        >
          <button
            className="nodrag nopan rounded-full p-2 shadow-lg hover:scale-110 transition-all duration-200 border-2 border-white"
            style={{ backgroundColor: edgeColor }}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            {getOperationIcon()}
          </button>

          {showTooltip && (
            <div
              className="absolute bottom-full mb-3 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-3 py-2 rounded-lg shadow-xl text-sm whitespace-nowrap z-50"
              style={{ pointerEvents: "none" }}
            >
              <div className="text-center">
                <div className="font-medium mb-1">
                  {sourceColumn || `Column ${sourceIndex}`}
                </div>
                <div className="text-xs text-gray-300 mb-1">
                  {getOperationLabel()}
                </div>
                <div className="font-medium">
                  {targetColumn || `Column ${targetIndex}`}
                </div>
              </div>

              {/* Tooltip arrow */}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

const elk = new ELK();
const useLayoutedElements = () => {
  const { getNodes, setNodes, getEdges, fitView } = useReactFlow();

  const defaultOptions = {
    "elk.algorithm": "layered",
    "elk.layered.spacing.nodeNodeBetweenLayers": 120,
    "elk.spacing.nodeNode": 80,
    "elk.direction": "DOWN",
    "elk.layered.crossingMinimization.strategy": "LAYER_SWEEP",
  };

  const useLayoutedElements = () => {
    const { getNodes, setNodes, getEdges, setEdges, fitView } = useReactFlow();

    const defaultOptions = {
      "elk.algorithm": "layered",
      "elk.layered.spacing.nodeNodeBetweenLayers": 150,
      "elk.spacing.nodeNode": 100,
    };

    const getLayoutedElements = useCallback(
      (options) => {
        const layoutOptions = { ...defaultOptions, ...options };
        const nodes = getNodes();
        const edges = getEdges();

        const graph = {
          id: "root",
          layoutOptions: layoutOptions,
          children: nodes.map((node) => ({
            ...node,
            width: node.measured?.width || 300,
            height: node.measured?.height || 200,
          })),
          edges: edges,
        };

        elk.layout(graph).then(({ children }) => {
          children.forEach((node) => {
            node.position = { x: node.x, y: node.y };
          });
          setNodes(children);

          // Force edge re-render after nodes are positioned
          setTimeout(() => {
            setEdges([...edges]);
            fitView();
          }, 50);
        });
      },
      [getNodes, getEdges, setNodes, setEdges, fitView]
    );

    return { getLayoutedElements };
  };

  return { getLayoutedElements };
};

export const AttributeFlowChart = ({ attributes, sheetName }) => {
  const { getLayoutedElements } = useLayoutedElements();

  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    return generateAttributeFlowElements(attributes);
  }, [attributes]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const nodeTypes = useMemo(
    () => ({
      attributeNode: AttributeNode,
    }),
    []
  );

  const edgeTypes = useMemo(
    () => ({
      formulaEdge: FormulaEdge,
    }),
    []
  );

  useEffect(() => {
    if (nodes.length > 0) {
      // Delay to ensure nodes are rendered and measured
      setTimeout(() => {
        getLayoutedElements();
      }, 100);
    }
  }, [getLayoutedElements, nodes.length]);

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 1.5 }}
        className="bg-gray-50"
        panOnDrag={false}
        zoomOnScroll={false}
        zoomOnPinch={false}
        panOnScroll={false}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
      >
        <Background variant="dots" gap={20} size={1} color="#e5e7eb" />
        <Controls
          className="bg-white shadow-lg border border-gray-200 rounded-lg"
          showInteractive={true}
        />
        <MiniMap
          className="bg-white shadow-lg border border-gray-200 rounded-lg"
          nodeColor={(node) => {
            if (node.data.type === "derived") return "#8b5cf6";
            if (node.data.type === "linked") return "#10b981";
            if (node.data.type === "recurrent") return "#f59e0b";
            return "#6b7280";
          }}
          maskColor="rgba(0, 0, 0, 0.1)"
        />
      </ReactFlow>
    </div>
  );
};
