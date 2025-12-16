import React, { useState, useMemo, useRef } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Treemap,
} from "recharts";
import {
  Layers,
  Package,
  TrendingUp,
  TrendingDown,
  Users,
  AlertTriangle,
  CheckCircle,
  Download,
} from "lucide-react";
import domtoimage from 'dom-to-image';

const exportChartAsPNG = async (elementId, filename) => {
  const element = document.getElementById(elementId);
  if (!element) return;

  try {
    const dataUrl = await domtoimage.toPng(element, {
      quality: 1,
      bgcolor: '#ffffff',
      width: element.offsetWidth * 2,
      height: element.offsetHeight * 2,
      style: {
        transform: 'scale(2)',
        transformOrigin: 'top left'
      }
    });

    const link = document.createElement("a");
    link.download = filename;
    link.href = dataUrl;
    link.click();
  } catch (error) {
    console.error("Export failed:", error);
  }
};

const GroupAnalysis = ({ groups = [], stockData = [], isLoading = false }) => {
  const [viewMode, setViewMode] = useState("overview"); // 'overview', 'performance', 'distribution'
  const [selectedGroup, setSelectedGroup] = useState(null);

  const chartRef = useRef(null);

  // Process group data with stock information
  const processedGroups = useMemo(() => {
    if (!groups.length || !stockData.length) return [];

    // Group sheets by groupName
    const groupedData = groups.reduce((acc, sheet) => {
      const groupName = sheet.groupName || "Ungrouped";
      if (!acc[groupName]) {
        acc[groupName] = {
          groupName,
          sheets: [],
          stockMetrics: {
            totalOpening: 0,
            totalClosing: 0,
            variance: 0,
            variancePercentage: 0,
            activeSheets: 0,
            totalSheets: 0,
            completionRate: 0,
            averageStock: 0,
          },
        };
      }
      acc[groupName].sheets.push(sheet);
      return acc;
    }, {});

    // Calculate metrics for each group
    Object.values(groupedData).forEach((group) => {
      // Find stock data for sheets in this group
      const groupSheets = stockData.filter((stock) =>
        group.sheets.some((sheet) => sheet._id === stock.sheetId)
      );

      const totalOpening = groupSheets.reduce(
        (sum, sheet) => sum + (sheet.openingStock || 0),
        0
      );
      const totalClosing = groupSheets.reduce(
        (sum, sheet) => sum + (sheet.closingStock || 0),
        0
      );
      const variance = totalClosing - totalOpening;
      const variancePercentage =
        totalOpening > 0 ? (variance / totalOpening) * 100 : 0;

      const activeSheets = groupSheets.filter((sheet) => sheet.hasData).length;
      const totalSheetsInGroup = group.sheets.length;
      const completionRate =
        totalSheetsInGroup > 0 ? (activeSheets / totalSheetsInGroup) * 100 : 0;

      group.stockMetrics = {
        totalOpening,
        totalClosing,
        variance,
        variancePercentage,
        activeSheets,
        totalSheets: totalSheetsInGroup,
        completionRate,
        averageStock:
          totalSheetsInGroup > 0 ? totalClosing / totalSheetsInGroup : 0,
      };
    });

    return Object.values(groupedData);
  }, [groups, stockData]);

  // Chart data for different visualizations
  const chartData = useMemo(() => {
    const pieData = processedGroups.map((group, index) => ({
      name: group.groupName || `Group ${index + 1}`,
      value: group.stockMetrics.totalClosing,
      sheets: group.stockMetrics.totalSheets,
      completion: group.stockMetrics.completionRate,
    }));

    const barData = processedGroups.map((group, index) => ({
      name: group.groupName || `Group ${index + 1}`,
      opening: group.stockMetrics.totalOpening,
      closing: group.stockMetrics.totalClosing,
      variance: group.stockMetrics.variance,
      completion: group.stockMetrics.completionRate,
    }));

    const treemapData = processedGroups.map((group, index) => ({
      name: group.groupName || `Group ${index + 1}`,
      size: group.stockMetrics.totalClosing,
      sheets: group.stockMetrics.totalSheets,
    }));

    return { pieData, barData, treemapData };
  }, [processedGroups]);

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num?.toFixed(0) || "0";
  };

  const COLORS = [
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#06b6d4",
    "#84cc16",
    "#f97316",
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <div
              key={index}
              className="flex items-center justify-between space-x-4"
            >
              <span className="text-sm text-gray-600 capitalize">
                {entry.dataKey}:
              </span>
              <span className="font-semibold" style={{ color: entry.color }}>
                {typeof entry.value === "number"
                  ? formatNumber(entry.value)
                  : entry.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const GroupCard = ({ group, index }) => {
    const metrics = group.stockMetrics;
    const isPositiveVariance = metrics.variance >= 0;
    const statusColor =
      metrics.completionRate >= 80
        ? "green"
        : metrics.completionRate >= 50
        ? "yellow"
        : "red";

    return (
      <div
        className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
        onClick={() =>
          setSelectedGroup(
            selectedGroup === group.groupName ? null : group.groupName
          )
        }
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Layers className="h-5 w-5 text-gray-400" />
            <h4 className="font-medium text-gray-900">
              {group.groupName || `Group ${index + 1}`}
            </h4>
          </div>
          <div
            className={`w-3 h-3 rounded-full ${
              statusColor === "green"
                ? "bg-green-400"
                : statusColor === "yellow"
                ? "bg-yellow-400"
                : "bg-red-400"
            }`}
          ></div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-600">Total Stock</p>
            <p className="font-semibold text-gray-900">
              {formatNumber(metrics.totalClosing)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Sheets</p>
            <p className="font-semibold text-gray-900">
              {metrics.activeSheets}/{metrics.totalSheets}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            {isPositiveVariance ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
            <span
              className={`text-sm font-medium ${
                isPositiveVariance ? "text-green-600" : "text-red-600"
              }`}
            >
              {isPositiveVariance ? "+" : ""}
              {Math.abs(metrics.variancePercentage).toFixed(1)}%
            </span>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Completion</p>
            <p className="text-sm font-medium">
              {metrics.completionRate.toFixed(0)}%
            </p>
          </div>
        </div>

        {selectedGroup === group.groupName && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Opening Stock:</span>
                <span className="font-medium">
                  {formatNumber(metrics.totalOpening)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Closing Stock:</span>
                <span className="font-medium">
                  {formatNumber(metrics.totalClosing)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Net Variance:</span>
                <span
                  className={`font-medium ${
                    isPositiveVariance ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {isPositiveVariance ? "+" : ""}
                  {formatNumber(metrics.variance)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Avg per Sheet:</span>
                <span className="font-medium">
                  {formatNumber(metrics.averageStock)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-48 mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 bg-gray-100 rounded"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={chartRef}
      id="group-analysis-chart"
      className="bg-white border border-gray-200 rounded-lg p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Group Analysis
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Performance breakdown by organizational groups
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={() =>
              exportChartAsPNG(
                "group-analysis-chart",
                `Group_Analysis_${viewMode}_${
                  new Date().toISOString().split("T")[0]
                }.png`
              )
            }
            disabled={isLoading}
            className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50"
          >
            <Download className="h-4 w-4 mr-1" />
          </button>
          {/* View Mode Toggle */}
          <div className="flex border border-gray-300 rounded-md">
            <button
              onClick={() => setViewMode("overview")}
              className={`px-3 py-2 text-sm ${
                viewMode === "overview"
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-600"
              } hover:bg-gray-50`}
            >
              Overview
            </button>
            <button
              onClick={() => setViewMode("performance")}
              className={`px-3 py-2 text-sm border-l border-gray-300 ${
                viewMode === "performance"
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-600"
              } hover:bg-gray-50`}
            >
              Performance
            </button>
            <button
              onClick={() => setViewMode("distribution")}
              className={`px-3 py-2 text-sm border-l border-gray-300 ${
                viewMode === "distribution"
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-600"
              } hover:bg-gray-50`}
            >
              Distribution
            </button>
          </div>
        </div>
      </div>

      {/* Content based on view mode */}
      {viewMode === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Group Cards */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-700 mb-4">
              Group Performance
            </h4>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {processedGroups.map((group, index) => (
                <GroupCard
                  key={group.groupName || index}
                  group={group}
                  index={index}
                />
              ))}
            </div>
          </div>

          {/* Stock Distribution Pie Chart */}
          <div>
            <h4 className="font-medium text-gray-700 mb-4">
              Stock Distribution
            </h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData.pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {chartData.pieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [
                      formatNumber(value),
                      "Stock Value",
                    ]}
                    labelFormatter={(label) => `Group: ${label}`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 gap-2 mt-4">
              {chartData.pieData.map((entry, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  ></div>
                  <span className="text-xs text-gray-600 truncate">
                    {entry.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {viewMode === "performance" && (
        <div>
          <h4 className="font-medium text-gray-700 mb-4">
            Group Performance Comparison
          </h4>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData.barData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                  tickLine={{ stroke: "#d1d5db" }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                  tickLine={{ stroke: "#d1d5db" }}
                  tickFormatter={formatNumber}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="opening" fill="#3b82f6" name="Opening Stock" />
                <Bar dataKey="closing" fill="#10b981" name="Closing Stock" />
                <Bar dataKey="variance" fill="#f59e0b" name="Variance" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Performance Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium text-gray-700">
                  High Performers
                </span>
              </div>
              <p className="text-lg font-semibold text-gray-900">
                {
                  processedGroups.filter(
                    (g) => g.stockMetrics.completionRate >= 80
                  ).length
                }
              </p>
              <p className="text-xs text-gray-500">
                Groups with ≥80% completion
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                <span className="text-sm font-medium text-gray-700">
                  Needs Attention
                </span>
              </div>
              <p className="text-lg font-semibold text-gray-900">
                {
                  processedGroups.filter(
                    (g) => g.stockMetrics.completionRate < 50
                  ).length
                }
              </p>
              <p className="text-xs text-gray-500">
                Groups with &lt;50% completion
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="h-5 w-5 text-blue-500" />
                <span className="text-sm font-medium text-gray-700">
                  Avg Completion
                </span>
              </div>
              <p className="text-lg font-semibold text-gray-900">
                {processedGroups.length > 0
                  ? (
                      processedGroups.reduce(
                        (sum, g) => sum + g.stockMetrics.completionRate,
                        0
                      ) / processedGroups.length
                    ).toFixed(0)
                  : 0}
                %
              </p>
              <p className="text-xs text-gray-500">Across all groups</p>
            </div>
          </div>
        </div>
      )}

      {viewMode === "distribution" && (
        <div>
          <h4 className="font-medium text-gray-700 mb-4">
            Stock Distribution Map
          </h4>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <Treemap
                data={chartData.treemapData}
                dataKey="size"
                aspectRatio={4 / 3}
                stroke="#fff"
                fill="#3b82f6"
              />
            </ResponsiveContainer>
          </div>

          {/* Distribution Summary */}
          <div className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {processedGroups.map((group, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg">
                  <h5 className="font-medium text-gray-900 mb-2">
                    {group.groupName || `Group ${index + 1}`}
                  </h5>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Stock:</span>
                      <span className="font-medium">
                        {formatNumber(group.stockMetrics.totalClosing)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Sheets:</span>
                      <span className="font-medium">
                        {group.stockMetrics.totalSheets}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{
                          width: `${group.stockMetrics.completionRate}%`,
                        }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500">
                      {group.stockMetrics.completionRate.toFixed(0)}% complete
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupAnalysis;
