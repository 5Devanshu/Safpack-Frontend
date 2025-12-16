import React, { useMemo, useCallback, useState, useEffect } from "react";
import {
  Handle,
  Position,
  Panel,
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  getBezierPath,
  BaseEdge,
  EdgeLabelRenderer,
} from "@xyflow/react";
import {
  Calculator,
  Link2,
  RotateCcw,
  Database,
  TrendingUp,
  TrendingDown,
  Calendar,
  Edit3,
  Save,
  X,
  BarChart3,
  RefreshCw,
  Info,
  Plus,
  Minus,
} from "lucide-react";
import {
  getColumnType,
  calculateDerivedValue,
  getTodaysDate,
  convertDateFormat,
  checkTodaysData,
  getTodaysColumnIndex,
} from "./Helper.jsx";

import ELK from "elkjs/lib/elk.bundled.js";
import { useSelector } from "react-redux";
import { selectAccount } from "../../../../app/DashboardSlice.js";

export const EnhancedAttributeNode = ({ data }) => {
  const {
    name,
    type,
    derived,
    linkedFrom,
    recurrentCheck,
    formula,
    value,
    index,
    hasToday,
    sheetData,
    todayColumnIndex,
    onValueUpdate,
    showTotals,
  } = data;
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [currentValue, setCurrentValue] = useState(value);

  useEffect(() => {
    // Calculate derived values when dependencies change
    if (type === "derived" && formula && sheetData && todayColumnIndex >= 0) {
      const calculatedValue = calculateDerivedValue(
        formula,
        sheetData,
        todayColumnIndex
      );
      setCurrentValue(calculatedValue);
    } else {
      setCurrentValue(value);
    }
  }, [value, formula, sheetData, todayColumnIndex, type]);

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
      return showTotals ? val.toLocaleString() : val.toLocaleString();
    }
    return val.toString();
  };

  const getDisplayValue = () => {
    if (showTotals) {
      // Calculate and show column total
      if (sheetData && sheetData[index]) {
        let total;
        if (name.toLowerCase().includes("date")) {
          total = sheetData[index].attributes.filter((val) => !!val).length;
        } else {
          total = sheetData[index].attributes.reduce((sum, val) => {
            const numVal = parseFloat(val) || 0;
            return sum + numVal;
          }, 0);
        }
        return total.toLocaleString();
      }
      return "0";
    }
    return formatValue(currentValue);
  };

  const canEdit = () => {
    return (
      !hasToday &&
      type !== "derived" &&
      type !== "referenced" &&
      type !== "recurrent" &&
      !showTotals
    );
    // return (
    //   !hasToday && type !== "derived" && type !== "referenced" && !showTotals
    // );
  };

  const isDateField = () => {
    return name.toLowerCase().includes("date");
  };

  const handleEdit = () => {
    if (canEdit()) {
      setIsEditing(true);
      setEditValue(isDateField() ? getTodaysDate() : "");
    }
  };

  const handleSave = () => {
    const finalValue = isDateField()
      ? editValue
      : parseFloat(editValue) || editValue;
    onValueUpdate(index, finalValue);
    setCurrentValue(finalValue);
    setIsEditing(false);
    setEditValue("");
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValue("");
  };

  const getValueToShow = () => {
    if (showTotals) {
      return getDisplayValue();
    }

    if (!hasToday && !isEditing) {
      return canEdit() ? "Click to enter" : "-";
    }

    return getDisplayValue();
  };

  return (
    <div
      className={`min-w-[320px] z-30 bg-white ${styles.borderColor} border-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300`}
    >
      {/* Header */}
      <div className={`${styles.headerBg} text-white px-4 py-3 rounded-t-xl`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getIcon()}
            <h3 className="font-bold text-sm capitalize">
              {name.replace(/-/g, " ")}
            </h3>
          </div>
          <div className="flex gap-2">
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
            {showTotals && (
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                Total
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className={`${styles.bgColor} px-4 py-3 rounded-b-xl`}>
        {/* Value Display/Input */}
        <div className="mb-3">
          <div className="text-center">
            {isEditing ? (
              <div className="space-y-2">
                <input
                  type={isDateField() ? "text" : "number"}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  placeholder={isDateField() ? getTodaysDate() : "Enter value"}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-center text-lg font-bold"
                  autoFocus
                />
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={handleSave}
                    className="bg-green-500 text-white p-1 rounded-md hover:bg-green-600"
                  >
                    <Save size={14} />
                  </button>
                  <button
                    onClick={handleCancel}
                    className="bg-red-500 text-white p-1 rounded-md hover:bg-red-600"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ) : (
              <div
                className={`text-2xl font-bold text-gray-900 mb-1 ${
                  canEdit() && !showTotals
                    ? "cursor-pointer hover:text-blue-600"
                    : ""
                }`}
                onClick={handleEdit}
              >
                {getValueToShow()}
                {canEdit() && !showTotals && (
                  <Edit3 size={16} className="inline ml-2 text-blue-500" />
                )}
              </div>
            )}

            {showTotals && (
              <div className="text-xs text-blue-600 font-medium">
                Column Total
              </div>
            )}

            {!showTotals && type === "derived" && formula && (
              <div className="text-xs text-gray-600">Formula Applied</div>
            )}

            {!showTotals &&
              type === "recurrent" &&
              recurrentCheck?.["is-recurrent"] && (
                <div className="text-xs text-gray-600">
                  From Period {recurrentCheck["recurrent-reference-indice"]}
                </div>
              )}
          </div>
        </div>

        {/* Formula Details for Derived Fields */}
        {!showTotals && type === "derived" && formula && (
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
            {!hasToday && !showTotals && (
              <span className="inline-flex items-center gap-1 text-red-600 font-medium">
                <Calendar size={10} />
                No Today's Data
              </span>
            )}
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

export function generateEnhancedAttributeFlowElements(
  attributes,
  sheetData,
  showTotals = false
) {
  if (!attributes || !Array.isArray(attributes)) {
    return { nodes: [], edges: [] };
  }

  const nodes = [];
  const edges = [];

  const hasToday = checkTodaysData(sheetData);
  const todayColumnIndex = getTodaysColumnIndex(sheetData);

  // Create nodes for each attribute
  attributes.forEach((attr, index) => {
    const nodeType = determineNodeType(attr);
    let currentValue = null;

    // Get today's value if available
    if (hasToday && todayColumnIndex >= 0 && sheetData[index]) {
      if (attr.derived && attr.formula) {
        currentValue = calculateDerivedValue(
          attr.formula,
          sheetData,
          todayColumnIndex
        );
      } else {
        currentValue = sheetData[index].attributes[todayColumnIndex];
      }
    }

    // Calculate derived values
    if (attr.derived && attr.formula && sheetData && todayColumnIndex >= 0) {
      currentValue = calculateDerivedValue(
        attr.formula,
        sheetData,
        todayColumnIndex
      );
    }

    nodes.push({
      id: `attr-${index}`,
      type: "enhancedAttributeNode",
      position: {
        x: 100 + (index % 3) * 360,
        y: 100 + Math.floor(index / 3) * 250,
      },
      data: {
        name: attr.name,
        type: nodeType,
        derived: attr.derived,
        linkedFrom: attr.linkedFrom,
        recurrentCheck: attr.recurrentCheck,
        formula: attr.formula,
        value: currentValue,
        index: index,
        hasToday,
        sheetData,
        todayColumnIndex,
        showTotals,
        onValueUpdate: (attrIndex, newValue) => {
          console.log(`Update attribute ${attrIndex} with value:`, newValue);
        },
      },
    });
  });

  // Create edges based on formulas
  attributes.forEach((attr, targetIndex) => {
    if (attr.derived && attr.formula) {
      // Addition edges (green)
      if (
        attr.formula.additionIndices &&
        attr.formula.additionIndices.length > 0
      ) {
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
      if (
        attr.formula.subtractionIndices &&
        attr.formula.subtractionIndices.length > 0
      ) {
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

function determineNodeType(attr) {
  if (attr.derived) {
    return "derived";
  }
  if (attr.linkedFrom?.sheetObjectId) {
    // Updated field name
    return "linked";
  }
  if (attr.recurrentCheck?.isRecurrent) {
    // Updated field name
    return "recurrent";
  }
  return "independent";
}

export const SheetDisplayControls = ({
  showTotals,
  onToggleTotals,
  hasToday,
  onSaveData,
  onRefresh,
  isSaving = false,
  onCreateNode,
}) => {
  const isAdmin = useSelector(selectAccount)?.role === "admin";
  return (
    <Panel position="top-right">
      <div className="flex flex-col gap-2 bg-white rounded-lg shadow-lg border border-gray-200 p-2">
        {isAdmin && (
          <>
            <div className="text-xs font-medium text-gray-600 px-2 py-1 border-b border-gray-200">
              Admin Controls
            </div>
            <button
              onClick={onCreateNode}
              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
            >
              <Plus size={16} />
              Create Node
            </button>
            <div className="border-b border-gray-200 my-1"></div>
          </>
        )}
        {/* Today's Data Status */}
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm ${
            hasToday
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-amber-50 text-amber-700 border border-amber-200"
          }`}
        >
          <Calendar size={16} />
          <span className="font-medium">
            {hasToday ? "Today's data available" : "No today's data"}
          </span>
        </div>

        {/* Toggle Totals Button */}
        <button
          onClick={onToggleTotals}
          className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            showTotals
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          <BarChart3 size={16} />
          {showTotals ? "Hide Totals" : "Show Totals"}
        </button>

        {/* Save Data Button - only show if no today's data */}
        {!hasToday && (
          <button
            onClick={onSaveData}
            disabled={isSaving}
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSaving ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            {isSaving ? "Saving..." : "Save Today's Data"}
          </button>
        )}

        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium bg-gray-600 text-white hover:bg-gray-700 transition-colors"
        >
          <RefreshCw size={16} />
          Refresh
        </button>

        {/* Legend */}
        <div className="border-t border-gray-200 pt-2 mt-2">
          <div className="text-xs text-gray-600 font-medium mb-2">Legend:</div>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
              <span>Derived</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              <span>Linked</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-amber-400 rounded-full"></div>
              <span>Recurrent</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
              <span>Independent</span>
            </div>
          </div>
        </div>
      </div>
    </Panel>
  );
};

const elk = new ELK();

const useLayoutedElements = () => {
  const { getNodes, setNodes, getEdges, fitView } = useReactFlow();

  const defaultOptions = {
    "elk.algorithm": "layered",
    "elk.layered.spacing.nodeNodeBetweenLayers": 150,
    "elk.spacing.nodeNode": 100,
    "elk.direction": "RIGHT",
    "elk.layered.crossingMinimization.strategy": "LAYER_SWEEP",
  };

  const getLayoutedElements = useCallback(
    (options = {}) => {
      const layoutOptions = { ...defaultOptions, ...options };
      const nodes = getNodes();
      const edges = getEdges();

      if (nodes.length === 0) return;

      const graph = {
        id: "root",
        layoutOptions: layoutOptions,
        children: nodes.map((node) => ({
          ...node,
          width: node.measured?.width || 320,
          height: node.measured?.height || 180,
        })),
        edges: edges,
      };

      elk.layout(graph).then(({ children }) => {
        children.forEach((node) => {
          node.position = { x: node.x, y: node.y };
        });
        setNodes(children);
        setTimeout(() => fitView({ padding: 0.2 }), 100);
      });
    },
    [getNodes, getEdges, setNodes, fitView]
  );

  return { getLayoutedElements };
};

export const AttributeFlowChart = ({
  attributes,
  sheetName,
  sheetData,
  showTotals,
  hasToday,
  onValueUpdate,
  onToggleTotals,
  onSaveData,
  onRefresh,
  isSaving,
  onCreateNode,
}) => {
  const { getLayoutedElements } = useLayoutedElements();
  const isAdmin = useSelector(selectAccount)?.role === "admin";

  // Generate flow elements with enhanced data
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    const elements = generateEnhancedAttributeFlowElements(
      attributes,
      sheetData,
      showTotals
    );

    // Update nodes with the onValueUpdate callback
    const enhancedNodes = elements.nodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        onValueUpdate,
      },
    }));

    return { nodes: enhancedNodes, edges: elements.edges };
  }, [attributes, sheetData, showTotals, onValueUpdate]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const nodeTypes = useMemo(
    () => ({
      enhancedAttributeNode: EnhancedAttributeNode,
    }),
    []
  );

  const edgeTypes = useMemo(
    () => ({
      formulaEdge: FormulaEdge,
    }),
    []
  );

  // Update nodes when props change
  useEffect(() => {
    const { nodes: newNodes } = generateEnhancedAttributeFlowElements(
      attributes,
      sheetData,
      showTotals
    );

    // Preserve existing positions when updating nodes
    const enhancedNodes = newNodes.map((newNode) => {
      const existingNode = nodes.find((n) => n.id === newNode.id);
      return {
        ...newNode,
        position: existingNode ? existingNode.position : newNode.position, // Keep existing position
        data: {
          ...newNode.data,
          onValueUpdate,
        },
      };
    });

    setNodes(enhancedNodes);
  }, [attributes, sheetData, showTotals, onValueUpdate]);

  useEffect(() => {
    const { nodes: newNodes } = generateEnhancedAttributeFlowElements(
      attributes,
      sheetData,
      showTotals
    );

    // Preserve existing positions when updating nodes
    const enhancedNodes = newNodes.map((newNode) => {
      const existingNode = nodes.find((n) => n.id === newNode.id);
      return {
        ...newNode,
        position: existingNode ? existingNode.position : newNode.position, // Keep existing position
        data: {
          ...newNode.data,
          onValueUpdate,
        },
      };
    });

    setNodes(enhancedNodes);
  }, [attributes, sheetData, showTotals, onValueUpdate]);

  useEffect(() => {
    getLayoutedElements({
      "elk.algorithm": "org.eclipse.elk.force",
      "elk.layered.spacing.nodeNodeBetweenLayers": 120,
      "elk.spacing.nodeNode": 80,
      // "elk.direction": "RIGHT",
      "elk.layered.crossingMinimization.strategy": "LAYER_SWEEP",
    });
  }, [getLayoutedElements]);

  return (
    <div className="h-full w-full relative">
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
        nodesDraggable={true}
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

        {/* Enhanced Controls Panel - Update with new props */}
        <SheetDisplayControls
          showTotals={showTotals}
          onToggleTotals={onToggleTotals}
          hasToday={hasToday}
          onSaveData={onSaveData}
          onRefresh={onRefresh}
          isSaving={isSaving}
          isAdmin={isAdmin}
          onCreateNode={onCreateNode}
        />
      </ReactFlow>
    </div>
  );

  //   return (
  //     <div className="h-full w-full relative">
  //       <ReactFlow
  //         nodes={nodes}
  //         edges={edges}
  //         onNodesChange={onNodesChange}
  //         onEdgesChange={onEdgesChange}
  //         nodeTypes={nodeTypes}
  //         edgeTypes={edgeTypes}
  //         fitView
  //         fitViewOptions={{ padding: 0.2 }}
  //         className="bg-gray-50"
  //       >
  //         <Background variant="dots" gap={20} size={1} color="#e5e7eb" />
  //         <Controls
  //           className="bg-white shadow-lg border border-gray-200 rounded-lg"
  //           showInteractive={false}
  //         />
  //         <MiniMap
  //           className="bg-white shadow-lg border border-gray-200 rounded-lg"
  //           nodeColor={(node) => {
  //             if (node.data.type === "derived") return "#8b5cf6";
  //             if (node.data.type === "linked") return "#10b981";
  //             if (node.data.type === "recurrent") return "#f59e0b";
  //             return "#6b7280";
  //           }}
  //           maskColor="rgba(0, 0, 0, 0.1)"
  //         />

  //         {/* Enhanced Controls Panel */}
  //         <SheetDisplayControls
  //           showTotals={showTotals}
  //           onToggleTotals={onToggleTotals}
  //           hasToday={hasToday}
  //           onSaveData={onSaveData}
  //           onRefresh={onRefresh}
  //           isSaving={isSaving}
  //         />
  //       </ReactFlow>
  //     </div>
  //   );
};
