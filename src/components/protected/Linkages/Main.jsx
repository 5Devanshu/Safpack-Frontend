import React, { useCallback, useState, useEffect, useMemo, memo } from "react";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
} from "@xyflow/react";
import { CustomEdge, CustomNode, generateFlowElements } from "./utils/Helper";
import ELK from "elkjs/lib/elk.bundled.js";
import { ReactFlowProvider, Panel, useReactFlow } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { isDeatailSheetBar } from "../../../app/LinkagesSlice";
import { useSelector } from "react-redux";
import SheetDisplayNew from "../DetailLinkages/Main";
import { fetchMetadata } from "../../../services/repository/sheetsRepo";
import { selectAccount } from "../../../app/DashboardSlice";

// Sample metadata with proper linked-from structure
const sampleMetadata = [
  {
    "object-id": "507f1f77bcf86cd799439011",
    "sheet-name": "raw-material-warehouse",
    department: "Operations",
    "last-modified": "2025-05-29T10:30:00Z",
    "modified-by": "John Doe",
    attributes: [
      {
        name: "date",
        derived: false,
        formula: null,
        "linked-from": null,
        "recurrent-check": {
          "is-recurrent": false,
          "recurrent-reference-indice": null,
          "recurrence-fed-status": false,
        },
      },
      {
        name: "purchase",
        derived: false,
        formula: null,
        "linked-from": null,
        "recurrent-check": {
          "is-recurrent": false,
          "recurrent-reference-indice": null,
          "recurrence-fed-status": false,
        },
      },
      {
        name: "opening-stock",
        derived: false,
        formula: null,
        "linked-from": null,
        "recurrent-check": {
          "is-recurrent": true,
          "recurrent-reference-indice": 4,
          "recurrence-fed-status": true,
        },
      },
      {
        name: "inward",
        derived: false,
        formula: null,
        "linked-from": null,
        "recurrent-check": {
          "is-recurrent": false,
          "recurrent-reference-indice": null,
          "recurrence-fed-status": false,
        },
      },
      {
        name: "outward",
        derived: false,
        formula: null,
        "linked-from": null,
        "recurrent-check": {
          "is-recurrent": false,
          "recurrent-reference-indice": null,
          "recurrence-fed-status": false,
        },
      },
      {
        name: "closing-stock",
        derived: true,
        formula: {
          "addition-indices": [1, 2],
          "subtraction-indices": [3],
        },
        "linked-from": null,
        "recurrent-check": {
          "is-recurrent": false,
          "recurrent-reference-indice": null,
          "recurrence-fed-status": false,
        },
      },
    ],
  },
  {
    "object-id": "507f1f77bcf86cd799439012",
    "sheet-name": "finished-goods",
    department: "Production",
    "last-modified": "2025-05-29T14:45:00Z",
    "modified-by": "Sarah Wilson",
    attributes: [
      {
        name: "date",
        derived: false,
        formula: null,
        "linked-from": null,
        "recurrent-check": {
          "is-recurrent": false,
          "recurrent-reference-indice": null,
          "recurrence-fed-status": false,
        },
      },
      {
        name: "raw-material-used",
        derived: false,
        formula: null,
        "linked-from": {
          "sheet-object-id": "507f1f77bcf86cd799439011",
          "attribute-indice": 3,
        },
        "recurrent-check": {
          "is-recurrent": false,
          "recurrent-reference-indice": null,
          "recurrence-fed-status": false,
        },
      },
      {
        name: "production",
        derived: false,
        formula: null,
        "linked-from": null,
        "recurrent-check": {
          "is-recurrent": false,
          "recurrent-reference-indice": null,
          "recurrence-fed-status": false,
        },
      },
      {
        name: "damaged",
        derived: false,
        formula: null,
        "linked-from": null,
        "recurrent-check": {
          "is-recurrent": false,
          "recurrent-reference-indice": null,
          "recurrence-fed-status": false,
        },
      },
      {
        name: "available-stock",
        derived: true,
        formula: {
          "addition-indices": [1],
          "subtraction-indices": [3, 2],
        },
        "linked-from": null,
        "recurrent-check": {
          "is-recurrent": false,
          "recurrent-reference-indice": null,
          "recurrence-fed-status": false,
        },
      },
    ],
  },
  {
    "object-id": "507f1f77bcf86cd799439013",
    "sheet-name": "unfinished-goods",
    department: "Production",
    "last-modified": "2025-05-29T14:45:00Z",
    "modified-by": "Sarah Wilson",
    attributes: [
      {
        name: "date",
        derived: false,
        formula: null,
        "linked-from": null,
        "recurrent-check": {
          "is-recurrent": false,
          "recurrent-reference-indice": null,
          "recurrence-fed-status": false,
        },
      },
      {
        name: "raw-material-used",
        derived: false,
        formula: null,
        "linked-from": {
          "sheet-object-id": "507f1f77bcf86cd799439011",
          "attribute-indice": 2,
        },
        "recurrent-check": {
          "is-recurrent": false,
          "recurrent-reference-indice": null,
          "recurrence-fed-status": false,
        },
      },
      {
        name: "production",
        derived: false,
        formula: null,
        "linked-from": null,
        "recurrent-check": {
          "is-recurrent": false,
          "recurrent-reference-indice": null,
          "recurrence-fed-status": false,
        },
      },
      {
        name: "damaged",
        derived: false,
        formula: null,
        "linked-from": null,
        "recurrent-check": {
          "is-recurrent": false,
          "recurrent-reference-indice": null,
          "recurrence-fed-status": false,
        },
      },
      {
        name: "available-stock",
        derived: true,
        formula: {
          "addition-indices": [1],
          "subtraction-indices": [0, 2],
        },
        "linked-from": null,
        "recurrent-check": {
          "is-recurrent": false,
          "recurrent-reference-indice": null,
          "recurrence-fed-status": false,
        },
      },
    ],
  },
];

const elk = new ELK();

const useLayoutedElements = () => {
  const { getNodes, setNodes, getEdges, fitView } = useReactFlow();

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
        window.requestAnimationFrame(() => fitView());
      });
    },
    [getNodes, getEdges, setNodes, fitView]
  );

  return { getLayoutedElements };
};

// Main Linkages Component
const LinkagesFlow = () => {
  const [metadata, setMetadata] = useState([]);
  const [loading, setLoading] = useState(true);
  const [flowReady, setFlowReady] = useState(false);
  const { getLayoutedElements } = useLayoutedElements();
  const account = useSelector(selectAccount);

  // Fetch metadata on component mount
  useEffect(() => {
    const loadMetadata = async () => {
      try {
        setLoading(true);
        setFlowReady(false);
        const loginRole = account?.role || "user";
        const fetchedMetadata = await fetchMetadata(loginRole);
        // console.log("Fetched metadata:", fetchedMetadata);
        setMetadata(fetchedMetadata || []);

        setTimeout(() => {
          setFlowReady(true);
        }, 100);
      } catch (error) {
        console.error("Error loading metadata:", error);
        toast.error("Failed to load sheet data");
        setMetadata([]);
      } finally {
        setLoading(false);
      }
    };

    loadMetadata();
  }, []);

  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    if (!flowReady || !metadata || metadata.length === 0) {
      return { nodes: [], edges: [] };
    }
    return generateFlowElements(metadata);
  }, [metadata, flowReady]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const nodeTypes = useMemo(
    () => ({
      customNode: CustomNode,
    }),
    []
  );

  const edgeTypes = useMemo(
    () => ({
      customEdge: CustomEdge,
    }),
    []
  );

  // Apply layout when nodes are ready
  useEffect(() => {
    console.log("Nodes updated:", nodes.length, "edges:", edges.length);
    if (nodes.length > 0) {
      setTimeout(() => {
        getLayoutedElements({
          "elk.algorithm": "layered",
          "elk.direction": "RIGHT",
        });
      }, 100);
    }
  }, [nodes.length, edges.length, getLayoutedElements]);

  // Update nodes and edges when initialNodes/initialEdges change
  useEffect(() => {
    console.log(
      "Initial nodes/edges updated:",
      initialNodes.length,
      initialEdges.length
    );
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  // Conditional rendering logic - but keep hooks above
  if (loading) {
    return (
      <div className="h-screen w-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading sheet data...</div>
      </div>
    );
  }

  if (!metadata || metadata.length === 0) {
    return (
      <div className="h-screen w-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">No sheet data available</div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-gray-50">
      <div className="flex-1 h-[calc(100vh-2.8rem)]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          fitViewOptions={{ padding: 0.5 }}
          className="bg-gray-50 relative"
          panOnDrag={true}
          zoomOnScroll={true}
          zoomOnPinch={true}
          panOnScroll={true}
          nodesDraggable={true}
          nodesConnectable={false}
          elementsSelectable={true}
          defaultEdgeOptions={{
            type: "customEdge",
            animated: false,
          }}
          onInit={() => console.log("ReactFlow initialized")}
        >
          <Background variant="dots" gap={20} size={1} color="#000000" />
          <Controls className="bg-white shadow-lg border" />
          <MiniMap
            className="bg-white shadow-lg border rounded-lg"
            nodeColor="#3b82f6"
            maskColor="rgba(0, 0, 0, 0.1)"
          />
          <Panel position="top-right">
            <div className="flex flex-col gap-2">
              <button
                className="bg-blue-600 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-700 transition-colors"
                onClick={() =>
                  getLayoutedElements({
                    "elk.algorithm": "layered",
                    "elk.direction": "DOWN",
                  })
                }
              >
                Vertical Layout
              </button>
              <button
                className="bg-blue-600 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-700 transition-colors"
                onClick={() =>
                  getLayoutedElements({
                    "elk.algorithm": "layered",
                    "elk.direction": "RIGHT",
                  })
                }
              >
                Horizontal Layout
              </button>
              <button
                className="bg-green-600 text-white px-3 py-2 rounded-md text-sm hover:bg-green-700 transition-colors"
                onClick={() =>
                  getLayoutedElements({
                    "elk.algorithm": "org.eclipse.elk.radial",
                  })
                }
              >
                Radial Layout
              </button>
              <button
                className="bg-purple-600 text-white px-3 py-2 rounded-md text-sm hover:bg-purple-700 transition-colors"
                onClick={() =>
                  getLayoutedElements({
                    "elk.algorithm": "org.eclipse.elk.force",
                  })
                }
              >
                Force Layout
              </button>
            </div>
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
};

const Linkages = () => {
  const isDetailSheet = useSelector(isDeatailSheetBar);
  return (
    <div className="w-full h-screen flex flex-col overflow-y-auto scrollbar-hide">
      <ReactFlowProvider>
        <LinkagesFlow />
      </ReactFlowProvider>
      <SheetDisplayNew isOpen={isDetailSheet} />
    </div>
  );
};

export default Linkages;
