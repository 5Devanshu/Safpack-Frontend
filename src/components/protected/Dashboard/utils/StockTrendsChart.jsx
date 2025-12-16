import React, { useState, useMemo, useRef } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { TrendingUp, TrendingDown, BarChart3, Activity, Download } from "lucide-react";
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

const StockTrendsChart = ({ data, timeRange = "7d", isLoading = false }) => {
  const [chartType, setChartType] = useState("line"); // 'line' or 'bar'
  const [selectedMetric, setSelectedMetric] = useState("closing"); // 'opening', 'closing', 'variance'

  const chartRef = useRef(null);

  // Process data for chart visualization
  const chartData = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];

    return data
      .map((item, index) => ({
        date: new Date(item.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        sheetName: item.sheetName,
        opening: item.openingStock || 0,
        closing: item.closingStock || 0,
        variance: (item.closingStock || 0) - (item.openingStock || 0),
        hasData: item.hasData,
      }))
      .filter((item) => item.hasData); // Only show sheets with data
  }, [data]);

  // Calculate trend metrics
  const trendMetrics = useMemo(() => {
    if (chartData.length < 2) return null;

    const latest = chartData[chartData.length - 1];
    const previous = chartData[chartData.length - 2];

    const closingChange = latest.closing - previous.closing;
    const closingPercentage = (closingChange / previous.closing) * 100;

    const varianceChange = latest.variance - previous.variance;

    return {
      closingChange,
      closingPercentage,
      varianceChange,
      isPositiveTrend: closingChange >= 0,
    };
  }, [chartData]);

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num?.toFixed(0) || "0";
  };

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
                {formatNumber(entry.value)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-48 mb-6"></div>
        <div className="h-64 bg-gray-100 rounded"></div>
      </div>
    );
  }

  return (
    <div
      ref={chartRef}
      id="stock-trends-chart"
      className="bg-white border border-gray-200 rounded-lg p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Stock Trends Analysis
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Historical stock movement patterns
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-4">
          {/* Metric Selector */}
          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="closing">Closing Stock</option>
            <option value="opening">Opening Stock</option>
            <option value="variance">Stock Variance</option>
            <option value="all">All Metrics</option>
          </select>
          {/* Chart Type Toggle */}
          <div className="flex border border-gray-300 rounded-md">
            <button
              onClick={() => setChartType("line")}
              className={`px-3 py-2 text-sm ${
                chartType === "line"
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-600"
              } hover:bg-gray-50`}
            >
              <Activity className="h-4 w-4" />
            </button>
            <button
              onClick={() => setChartType("bar")}
              className={`px-3 py-2 text-sm border-l border-gray-300 ${
                chartType === "bar"
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-600"
              } hover:bg-gray-50`}
            >
              <BarChart3 className="h-4 w-4" />
            </button>
          </div>
          <button
            onClick={() =>
              exportChartAsPNG(
                "stock-trends-chart",
                `Stock_Trends_${new Date().toISOString().split("T")[0]}.png`
              )
            }
            disabled={isLoading}
            className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50"
          >
            <Download className="h-4 w-4 mr-1" />
          </button>
        </div>
      </div>

      {/* Trend Summary Cards */}
      {trendMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Latest Change</span>
              <div
                className={`flex items-center text-sm ${
                  trendMetrics.isPositiveTrend
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {trendMetrics.isPositiveTrend ? (
                  <TrendingUp className="h-4 w-4 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 mr-1" />
                )}
                {Math.abs(trendMetrics.closingPercentage).toFixed(1)}%
              </div>
            </div>
            <p className="font-semibold text-gray-900 mt-1">
              {formatNumber(Math.abs(trendMetrics.closingChange))}
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Variance Change</span>
              <div
                className={`text-sm ${
                  trendMetrics.varianceChange >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {trendMetrics.varianceChange >= 0 ? "+" : ""}
                {formatNumber(trendMetrics.varianceChange)}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">From previous period</p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Data Points</span>
              <span className="text-sm font-medium text-gray-900">
                {chartData.length}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Available periods</p>
          </div>
        </div>
      )}

      {/* Chart Container */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === "line" ? (
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fill: "#6b7280" }}
                tickLine={{ stroke: "#d1d5db" }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#6b7280" }}
                tickLine={{ stroke: "#d1d5db" }}
                tickFormatter={formatNumber}
              />
              <Tooltip content={<CustomTooltip />} />

              {(selectedMetric === "opening" || selectedMetric === "all") && (
                <Line
                  type="monotone"
                  dataKey="opening"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                  name="Opening Stock"
                />
              )}

              {(selectedMetric === "closing" || selectedMetric === "all") && (
                <Line
                  type="monotone"
                  dataKey="closing"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
                  name="Closing Stock"
                />
              )}

              {(selectedMetric === "variance" || selectedMetric === "all") && (
                <Line
                  type="monotone"
                  dataKey="variance"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={{ fill: "#f59e0b", strokeWidth: 2, r: 4 }}
                  name="Variance"
                />
              )}
            </LineChart>
          ) : (
            <BarChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fill: "#6b7280" }}
                tickLine={{ stroke: "#d1d5db" }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#6b7280" }}
                tickLine={{ stroke: "#d1d5db" }}
                tickFormatter={formatNumber}
              />
              <Tooltip content={<CustomTooltip />} />

              {(selectedMetric === "opening" || selectedMetric === "all") && (
                <Bar dataKey="opening" fill="#3b82f6" name="Opening Stock" />
              )}

              {(selectedMetric === "closing" || selectedMetric === "all") && (
                <Bar dataKey="closing" fill="#10b981" name="Closing Stock" />
              )}

              {selectedMetric === "variance" && (
                <Bar dataKey="variance" fill="#f59e0b" name="Variance" />
              )}
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Chart Legend */}
      <div className="flex items-center justify-center space-x-6 mt-4 pt-4 border-t border-gray-200">
        {(selectedMetric === "opening" || selectedMetric === "all") && (
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
            <span className="text-sm text-gray-600">Opening Stock</span>
          </div>
        )}
        {(selectedMetric === "closing" || selectedMetric === "all") && (
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
            <span className="text-sm text-gray-600">Closing Stock</span>
          </div>
        )}
        {(selectedMetric === "variance" || selectedMetric === "all") && (
          <div className="flex items-center">
            <div className="w-3 h-3 bg-yellow-500 rounded mr-2"></div>
            <span className="text-sm text-gray-600">Variance</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockTrendsChart;
