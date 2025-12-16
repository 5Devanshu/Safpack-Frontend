import React, { useState, useEffect, useMemo, Suspense, lazy } from "react";
import {
  TrendingUp,
  TrendingDown,
  Package,
  Layers,
  AlertCircle,
  RefreshCw,
  Calendar,
  Database,
  Activity,
  BarChart3,
  Filter,
  Download,
  Settings,
} from "lucide-react";

// Import the components we just created
import StockTrendsChart from "./utils/StockTrendsChart";
import GroupAnalysis from "./utils/GroupAnalysis";
import SheetPerformanceTable from "./utils/SheetPerformanceTable";

import { selectAccount } from "../../../app/DashboardSlice";
import { fetchMetadata } from "../../../services/repository/sheetsRepo";
import { fetchStocks } from "../../../services/repository/dashboardRepo";
import { useSelector } from "react-redux";
const SuperDashboardTable = lazy(() => import("./utils/SuperDashboardTable"));

const exportToDashboardCSV = (data, filename) => {
  const csvContent = data
    .map((row) =>
      row
        .map((cell) =>
          typeof cell === "string" && cell.includes(",")
            ? `"${cell.replace(/"/g, '""')}"`
            : cell
        )
        .join(",")
    )
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const exportDashboardData = (
  computedMetrics,
  todayData,
  yesterdayData,
  metadata
) => {
  const dashboardSummary = [
    ["Dashboard Summary", "", "", ""],
    ["Metric", "Value", "Previous", "Change %"],
    ["Total Sheets", computedMetrics?.totalSheets || 0, "", ""],
    ["Total Groups", computedMetrics?.totalGroups || 0, "", ""],
    [
      "Today Closing Stock",
      computedMetrics?.todayTotalClosing || 0,
      computedMetrics?.yesterdayTotalClosing || 0,
      computedMetrics?.yesterdayTotalClosing
        ? (
            ((computedMetrics?.todayTotalClosing -
              computedMetrics?.yesterdayTotalClosing) /
              computedMetrics?.yesterdayTotalClosing) *
            100
          ).toFixed(2) + "%"
        : "N/A",
    ],
    [
      "Data Completeness",
      computedMetrics
        ? Math.round(
            (computedMetrics.sheetsWithData / computedMetrics.totalSheets) * 100
          ) + "%"
        : "0%",
      "",
      "",
    ],
    ["", "", "", ""],
    ["Group Details", "", "", ""],
    ["Group Name", "Sheet Count", "Total Stock", "Percentage"],
    ...(computedMetrics?.groupDetails || []).map((group) => [
      group.name,
      group.sheetCount,
      group.totalStock,
      computedMetrics?.todayTotalClosing
        ? (
            (group.totalStock / computedMetrics.todayTotalClosing) *
            100
          ).toFixed(2) + "%"
        : "0%",
    ]),
  ];

  exportToDashboardCSV(
    dashboardSummary,
    `Dashboard_Summary_${new Date().toISOString().split("T")[0]}.csv`
  );
};

// Utility Functions
const formatDate = (date) => {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatNumber = (num) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num?.toString() || "0";
};

const calculatePercentageChange = (current, previous) => {
  if (!previous || previous === 0) return 0;
  return ((current - previous) / previous) * 100;
};

// Loading Skeleton Components
const SkeletonCard = () => (
  <div className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse">
    <div className="flex items-center justify-between mb-4">
      <div className="h-4 bg-gray-200 rounded w-24"></div>
      <div className="h-8 w-8 bg-gray-200 rounded"></div>
    </div>
    <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
    <div className="h-3 bg-gray-200 rounded w-20"></div>
  </div>
);

const SkeletonChart = () => (
  <div className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse">
    <div className="h-6 bg-gray-200 rounded w-48 mb-6"></div>
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center space-x-3">
          <div className="h-4 bg-gray-200 rounded w-20"></div>
          <div className="flex-1 h-6 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-16"></div>
        </div>
      ))}
    </div>
  </div>
);

const SkeletonTable = () => (
  <div className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse">
    <div className="h-6 bg-gray-200 rounded w-48 mb-6"></div>
    <div className="space-y-4">
      <div className="grid grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-4 bg-gray-200 rounded"></div>
        ))}
      </div>
      {[...Array(8)].map((_, i) => (
        <div key={i} className="grid grid-cols-5 gap-4">
          {[...Array(5)].map((_, j) => (
            <div key={j} className="h-4 bg-gray-100 rounded"></div>
          ))}
        </div>
      ))}
    </div>
  </div>
);

// KPI Card Component
const KPICard = ({
  title,
  value,
  previousValue,
  icon: Icon,
  trend,
  isLoading,
}) => {
  const percentageChange = calculatePercentageChange(value, previousValue);
  const isPositive = percentageChange >= 0;

  if (isLoading) return <SkeletonCard />;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wider">
          {title}
        </h3>
        <Icon className="h-5 w-5 text-gray-400" />
      </div>
      <div className="flex items-baseline justify-between">
        <p className="text-2xl font-semibold text-gray-900">
          {formatNumber(value)}
        </p>
        {previousValue !== undefined && (
          <div
            className={`flex items-center text-sm ${
              isPositive ? "text-green-600" : "text-red-600"
            }`}
          >
            {isPositive ? (
              <TrendingUp className="h-4 w-4 mr-1" />
            ) : (
              <TrendingDown className="h-4 w-4 mr-1" />
            )}
            {Math.abs(percentageChange).toFixed(1)}%
          </div>
        )}
      </div>
      {trend && <p className="text-xs text-gray-500 mt-2">{trend}</p>}
    </div>
  );
};

// Group Summary Component
const GroupSummary = ({ groups, isLoading }) => {
  if (isLoading) return <SkeletonChart />;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">
        Group Overview
      </h3>
      <div className="space-y-4 max-h-[40vh] overflow-y-auto">
        {groups.map((group, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
          >
            <div className="flex items-center space-x-3">
              <Layers className="h-5 w-5 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900">{group.name}</p>
                <p className="text-sm text-gray-500">
                  {group.sheetCount} sheets
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold text-gray-900">
                {formatNumber(group.totalStock)}
              </p>
              <p className="text-sm text-gray-500">Total Stock</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Stock Comparison Component
const StockComparison = ({ todayData, yesterdayData, isLoading }) => {
  if (isLoading) return <SkeletonChart />;

  const totalTodayOpening =
    todayData?.sheets?.reduce(
      (sum, sheet) => sum + (sheet.openingStock || 0),
      0
    ) || 0;
  const totalTodayClosing =
    todayData?.sheets?.reduce(
      (sum, sheet) => sum + (sheet.closingStock || 0),
      0
    ) || 0;
  const totalYesterdayOpening =
    yesterdayData?.sheets?.reduce(
      (sum, sheet) => sum + (sheet.openingStock || 0),
      0
    ) || 0;
  const totalYesterdayClosing =
    yesterdayData?.sheets?.reduce(
      (sum, sheet) => sum + (sheet.closingStock || 0),
      0
    ) || 0;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">
        Stock Comparison
      </h3>
      <div className="grid grid-cols-1 gap-6">
        <div className="space-y-4">
          <h4 className="font-medium text-gray-700">
            Today ({formatDate(new Date())})
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Opening Stock:</span>
              <span className="font-semibold">
                {formatNumber(totalTodayOpening)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Closing Stock:</span>
              <span className="font-semibold">
                {formatNumber(totalTodayClosing)}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t">
              <span className="text-gray-600">Net Movement:</span>
              <span
                className={`font-semibold ${
                  totalTodayClosing - totalTodayOpening >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {totalTodayClosing - totalTodayOpening >= 0 ? "+" : ""}
                {formatNumber(totalTodayClosing - totalTodayOpening)}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-medium text-gray-700">
            Yesterday ({formatDate(new Date(Date.now() - 86400000))})
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Opening Stock:</span>
              <span className="font-semibold">
                {formatNumber(totalYesterdayOpening)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Closing Stock:</span>
              <span className="font-semibold">
                {formatNumber(totalYesterdayClosing)}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t">
              <span className="text-gray-600">Net Movement:</span>
              <span
                className={`font-semibold ${
                  totalYesterdayClosing - totalYesterdayOpening >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {totalYesterdayClosing - totalYesterdayOpening >= 0 ? "+" : ""}
                {formatNumber(totalYesterdayClosing - totalYesterdayOpening)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Sheet Status Table Component
const SheetStatusTable = ({ sheets, groups, isLoading }) => {
  if (isLoading) return <SkeletonTable />;

  const [filteredSheets, setFilteredSheets] = useState(sheets || []);
  const [selectedGroup, setSelectedGroup] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const groupName =
    groups.find((g) => g._id === sheets.sheetId)?.groupName || "Ungrouped";

  useEffect(() => {
    let filtered = sheets || [];

    if (selectedGroup !== "all") {
      filtered = filtered.filter((sheet) => {
        const sheetMeta = groups.find((g) => g._id === sheet.sheetId);
        return sheetMeta?.groupName === selectedGroup;
      });
    }

    if (searchTerm) {
      filtered = filtered.filter((sheet) =>
        sheet.sheetName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredSheets(filtered);
  }, [sheets, selectedGroup, searchTerm, groups]);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Sheet Performance
        </h3>
        <div className="flex items-center space-x-4">
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Groups</option>
            {groups.map((group, index) => (
              <option key={index} value={group.groupName}>
                {group.groupName}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Search sheets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-medium text-gray-700">
                Sheet Name
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">
                Group
              </th>
              <th className="text-right py-3 px-4 font-medium text-gray-700">
                Opening Stock
              </th>
              <th className="text-right py-3 px-4 font-medium text-gray-700">
                Closing Stock
              </th>
              <th className="text-right py-3 px-4 font-medium text-gray-700">
                Variance
              </th>
              <th className="text-center py-3 px-4 font-medium text-gray-700">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredSheets.map((sheet, index) => {
              const groupName =
                groups.find((g) =>
                  g.sheets?.some((s) => s._id === sheet.sheetId)
                )?.groupName || "Unknown";
              const variance =
                (sheet.closingStock || 0) - (sheet.openingStock || 0);

              return (
                <tr
                  key={index}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-900">
                      {sheet.sheetName}
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatDate(sheet.date)}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{groupName}</td>
                  <td className="py-3 px-4 text-right font-medium">
                    {formatNumber(sheet.openingStock || 0)}
                  </td>
                  <td className="py-3 px-4 text-right font-medium">
                    {formatNumber(sheet.closingStock || 0)}
                  </td>
                  <td
                    className={`py-3 px-4 text-right font-medium ${
                      variance >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {variance >= 0 ? "+" : ""}
                    {formatNumber(variance)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        sheet.hasData
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {sheet.hasData ? "Active" : "No Data"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Main Dashboard Component
const ProfessionalDashboard = () => {
  // State Management
  const account = useSelector(selectAccount);
  const [dashboardData, setDashboardData] = useState({
    todayData: null,
    yesterdayData: null,
    metadata: null,
    isLoading: true,
    error: null,
    lastUpdated: null,
  });

  const [refreshing, setRefreshing] = useState(false);

  // Date Management
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  // API Data Fetching
  const fetchAllData = async () => {
    try {
      setRefreshing(true);

      const [todayResponse, yesterdayResponse, metadataResponse] =
        await Promise.allSettled([
          fetchStocks(today),
          fetchStocks(yesterday),
          fetchMetadata(account?.role || "user"),
        ]);

      setDashboardData({
        todayData:
          todayResponse.status === "fulfilled" ? todayResponse.value : null,
        yesterdayData:
          yesterdayResponse.status === "fulfilled"
            ? yesterdayResponse.value
            : null,
        metadata:
          metadataResponse.status === "fulfilled"
            ? metadataResponse.value
            : null,
        isLoading: false,
        error: null,
        lastUpdated: new Date(),
      });

      console.log(
        "Today Data:",
        todayResponse.status === "fulfilled" ? todayResponse.value : null
      );
      console.log(
        "Yesterday Data:",
        yesterdayResponse.status === "fulfilled"
          ? yesterdayResponse.value
          : null
      );
      console.log(
        "Metadata hello:",
        metadataResponse.status === "fulfilled" ? metadataResponse.value : null
      );
    } catch (error) {
      console.error("Dashboard data fetch error:", error);
      setDashboardData((prev) => ({
        ...prev,
        isLoading: false,
        error: error.message,
      }));
    } finally {
      setRefreshing(false);
    }
  };

  // Initial Data Load
  useEffect(() => {
    fetchAllData();
  }, []);

  // Computed Values
  const computedMetrics = useMemo(() => {
    const { todayData, yesterdayData, metadata } = dashboardData;

    if (!todayData || !metadata) return null;

    // Group metadata by groupName
    const groupedMetadata = metadata.reduce((acc, sheet) => {
      const groupName = sheet.groupName || "Ungrouped";
      if (!acc[groupName]) {
        acc[groupName] = {
          name: groupName,
          sheets: [],
          sheetCount: 0,
          totalStock: 0,
        };
      }
      acc[groupName].sheets.push(sheet);
      acc[groupName].sheetCount++;
      return acc;
    }, {});

    // Calculate stock metrics for each group
    Object.values(groupedMetadata).forEach((group) => {
      group.totalStock =
        todayData.data?.sheets
          ?.filter((sheet) => group.sheets.some((s) => s._id === sheet.sheetId))
          ?.reduce((sum, sheet) => sum + (sheet.closingStock || 0), 0) || 0;
    });

    return {
      totalSheets: metadata.length,
      totalGroups: Object.keys(groupedMetadata).length,
      groupDetails: Object.values(groupedMetadata),
      todayTotalOpening:
        todayData.data?.sheets?.reduce(
          (sum, sheet) => sum + (sheet.openingStock || 0),
          0
        ) || 0,
      todayTotalClosing:
        todayData.data?.sheets?.reduce(
          (sum, sheet) => sum + (sheet.closingStock || 0),
          0
        ) || 0,
      yesterdayTotalOpening:
        yesterdayData?.data?.sheets?.reduce(
          (sum, sheet) => sum + (sheet.openingStock || 0),
          0
        ) || 0,
      yesterdayTotalClosing:
        yesterdayData?.data?.sheets?.reduce(
          (sum, sheet) => sum + (sheet.closingStock || 0),
          0
        ) || 0,
      sheetsWithData: todayData.data?.summary?.sheetsWithData || 0,
      sheetsWithoutData: todayData.data?.summary?.sheetsWithoutData || 0,
      sheetsWithErrors: todayData.data?.summary?.sheetsWithErrors || 0,
    };
  }, [dashboardData]);

  const { isLoading, error, lastUpdated, todayData, yesterdayData, metadata } =
    dashboardData;

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Dashboard Error
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchAllData}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Stock Management Dashboard
            </h1>
            {/* <p className="text-sm text-gray-500 mt-1">
              {lastUpdated &&
                `Last updated: ${lastUpdated.toLocaleTimeString()}`}
            </p> */}
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={fetchAllData}
              disabled={refreshing}
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
            <button
              onClick={() =>
                exportDashboardData(
                  computedMetrics,
                  todayData?.data,
                  yesterdayData?.data,
                  metadata
                )
              }
              disabled={isLoading}
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard
            title="Total Sheets"
            value={computedMetrics?.totalSheets || 0}
            previousValue={computedMetrics?.totalSheets}
            icon={Package}
            isLoading={isLoading}
            trend="Active inventory sheets"
          />
          <KPICard
            title="Total Groups"
            value={computedMetrics?.totalGroups || 0}
            icon={Layers}
            isLoading={isLoading}
            trend="Organizational groups"
          />
          <KPICard
            title="Today's Closing Stock"
            value={computedMetrics?.todayTotalClosing || 0}
            previousValue={computedMetrics?.yesterdayTotalClosing}
            icon={Database}
            isLoading={isLoading}
            trend="Current stock position"
          />
          <KPICard
            title="Data Completeness"
            value={
              computedMetrics
                ? Math.round(
                    (computedMetrics.sheetsWithData /
                      computedMetrics.totalSheets) *
                      100
                  )
                : 0
            }
            icon={Activity}
            isLoading={isLoading}
            trend="Sheets with current data"
          />
        </div>
        <Suspense fallback={<SkeletonTable />}>
          <SuperDashboardTable metaData={dashboardData.metadata}/>
        </Suspense>

        {/* Stock Comparison and Group Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <StockComparison
            todayData={todayData?.data}
            yesterdayData={yesterdayData?.data}
            isLoading={isLoading}
          />
          <GroupSummary
            groups={computedMetrics?.groupDetails || []}
            isLoading={isLoading}
          />
        </div>

        {/* Advanced Analytics Section */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Suspense fallback={<SkeletonChart />}>
            <StockTrendsChart
              data={todayData?.data?.sheets || []}
              isLoading={isLoading}
            />
          </Suspense>
          <Suspense fallback={<SkeletonChart />}>
            <GroupAnalysis
              groups={metadata || []}
              stockData={todayData?.data?.sheets || []}
              isLoading={isLoading}
            />
          </Suspense>
        </div>

        {/* Advanced Sheet Performance Table */}
        <Suspense fallback={<SkeletonTable />}>
          {/* <SheetPerformanceTable 
            sheets={todayData?.data?.sheets || []}
            groups={metadata || []}
            onSheetSelect={(sheet) => console.log('Selected sheet:', sheet)}
            isLoading={isLoading}
          /> */}
        </Suspense>
      </div>
    </div>
  );
};

export default ProfessionalDashboard;
