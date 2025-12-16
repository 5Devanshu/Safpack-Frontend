import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  AlertCircle, 
  CheckCircle, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Package,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

const exportTableToCSV = (sheets, groups, filters) => {
  const enrichedSheets = sheets.map(sheet => {
    const groupInfo = groups.find(group => group._id === sheet.sheetId);
    const variance = (sheet.closingStock || 0) - (sheet.openingStock || 0);
    const variancePercentage = sheet.openingStock > 0 ? (variance / sheet.openingStock) * 100 : 0;
    
    return {
      ...sheet,
      groupName: groupInfo?.groupName || 'Ungrouped',
      variance,
      variancePercentage,
      status: sheet.hasData ? 'Active' : sheet.hasErrors ? 'Error' : 'No Data',
      efficiencyScore: sheet.hasData ? Math.min(100, Math.max(0, 50 + (variancePercentage * 2))) : 0
    };
  });

  // Apply current filters
  let filteredData = enrichedSheets;
  if (filters.search) {
    filteredData = filteredData.filter(sheet =>
      sheet.sheetName.toLowerCase().includes(filters.search.toLowerCase()) ||
      sheet.groupName.toLowerCase().includes(filters.search.toLowerCase())
    );
  }
  if (filters.group !== 'all') {
    filteredData = filteredData.filter(sheet => sheet.groupName === filters.group);
  }
  if (filters.status !== 'all') {
    filteredData = filteredData.filter(sheet => sheet.status.toLowerCase().replace(/[^a-z]/g, '') === filters.status.replace('-', ''));
  }

  const csvData = [
    ['Sheet Name', 'Group', 'Opening Stock', 'Closing Stock', 'Variance', 'Variance %', 'Status', 'Efficiency Score', 'Last Update'],
    ...filteredData.map(sheet => [
      sheet.sheetName,
      sheet.groupName,
      sheet.openingStock || 0,
      sheet.closingStock || 0,
      sheet.variance,
      sheet.variancePercentage.toFixed(2) + '%',
      sheet.status,
      sheet.efficiencyScore.toFixed(1),
      new Date(sheet.date).toLocaleDateString()
    ])
  ];

  const csvContent = csvData.map(row => 
    row.map(cell => 
      typeof cell === 'string' && cell.includes(',') 
        ? `"${cell.replace(/"/g, '""')}"` 
        : cell
    ).join(',')
  ).join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `Sheet_Performance_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const SheetPerformanceTable = ({ 
  sheets = [], 
  groups = [], 
  onSheetSelect,
  isLoading = false 
}) => {
  // State for filtering and sorting
  const [filters, setFilters] = useState({
    search: '',
    group: 'all',
    status: 'all',
    dateRange: 'all'
  });
  
  const [sorting, setSorting] = useState({
    field: 'sheetName',
    direction: 'asc'
  });
  
  const [selectedSheets, setSelectedSheets] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Process and enrich sheet data
  const enrichedSheets = useMemo(() => {
    return sheets.map(sheet => {
      // Find group information
      const groupInfo = groups.find(group => group._id === sheet.sheetId);
      
      // Calculate metrics
      const variance = (sheet.closingStock || 0) - (sheet.openingStock || 0);
      const variancePercentage = sheet.openingStock > 0 
        ? (variance / sheet.openingStock) * 100 
        : 0;
      
      // Determine status
      let status = 'active';
      let statusColor = 'green';
      if (!sheet.hasData) {
        status = 'no-data';
        statusColor = 'yellow';
      }
      if (sheet.hasErrors) {
        status = 'error';
        statusColor = 'red';
      }
      
      // Calculate efficiency score (0-100)
      const efficiencyScore = sheet.hasData ? 
        Math.min(100, Math.max(0, 50 + (variancePercentage * 2))) : 0;
      
      return {
        ...sheet,
        groupName: groupInfo?.groupName || 'Ungrouped',
        groupId: groupInfo?._id,
        variance,
        variancePercentage,
        status,
        statusColor,
        efficiencyScore,
        lastUpdate: new Date(sheet.date),
        risk: Math.abs(variancePercentage) > 20 ? 'high' : 
              Math.abs(variancePercentage) > 10 ? 'medium' : 'low'
      };
    });
  }, [sheets, groups]);

  // Apply filters and sorting
  const filteredAndSortedSheets = useMemo(() => {
    let filtered = enrichedSheets;

    // Apply search filter
    if (filters.search) {
      filtered = filtered.filter(sheet =>
        sheet.sheetName.toLowerCase().includes(filters.search.toLowerCase()) ||
        sheet.groupName.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    // Apply group filter
    if (filters.group !== 'all') {
      filtered = filtered.filter(sheet => sheet.groupName === filters.group);
    }

    // Apply status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(sheet => sheet.status === filters.status);
    }

    // Apply date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const dayMs = 24 * 60 * 60 * 1000;
      let cutoffDate;
      
      switch (filters.dateRange) {
        case 'today':
          cutoffDate = new Date(now.getTime() - dayMs);
          break;
        case 'week':
          cutoffDate = new Date(now.getTime() - (7 * dayMs));
          break;
        case 'month':
          cutoffDate = new Date(now.getTime() - (30 * dayMs));
          break;
        default:
          cutoffDate = new Date(0);
      }
      
      filtered = filtered.filter(sheet => sheet.lastUpdate >= cutoffDate);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aVal = a[sorting.field];
      let bVal = b[sorting.field];

      // Handle different data types
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return sorting.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sorting.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [enrichedSheets, filters, sorting]);

  // Pagination
  const paginatedSheets = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedSheets.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedSheets, currentPage]);

  const totalPages = Math.ceil(filteredAndSortedSheets.length / itemsPerPage);

  // Get unique groups for filter dropdown
  const uniqueGroups = useMemo(() => {
    return [...new Set(enrichedSheets.map(sheet => sheet.groupName))].sort();
  }, [enrichedSheets]);

  // Handle sorting
  const handleSort = (field) => {
    setSorting(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Handle selection
  const handleSelectSheet = (sheetId) => {
    const newSelected = new Set(selectedSheets);
    if (newSelected.has(sheetId)) {
      newSelected.delete(sheetId);
    } else {
      newSelected.add(sheetId);
    }
    setSelectedSheets(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedSheets.size === paginatedSheets.length) {
      setSelectedSheets(new Set());
    } else {
      setSelectedSheets(new Set(paginatedSheets.map(sheet => sheet.sheetId)));
    }
  };

  // Format functions
  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num?.toFixed(0) || '0';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Status component
  const StatusBadge = ({ status, statusColor }) => {
    const icons = {
      active: CheckCircle,
      'no-data': AlertCircle,
      error: AlertCircle
    };
    
    const Icon = icons[status] || CheckCircle;
    
    return (
      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
        statusColor === 'green' ? 'bg-green-100 text-green-800' :
        statusColor === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
        'bg-red-100 text-red-800'
      }`}>
        <Icon className="h-3 w-3 mr-1" />
        {status === 'active' ? 'Active' : status === 'no-data' ? 'No Data' : 'Error'}
      </div>
    );
  };

  // Variance component
  const VarianceIndicator = ({ variance, percentage }) => {
    const isPositive = variance >= 0;
    return (
      <div className={`flex items-center ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
        <span className="font-medium">{isPositive ? '+' : ''}{formatNumber(variance)}</span>
        <span className="text-xs ml-1">({Math.abs(percentage).toFixed(1)}%)</span>
      </div>
    );
  };

  // Sort icon component
  const SortIcon = ({ field }) => {
    if (sorting.field !== field) {
      return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
    }
    return sorting.direction === 'asc' ? 
      <ArrowUp className="h-4 w-4 text-blue-500" /> : 
      <ArrowDown className="h-4 w-4 text-blue-500" />;
  };

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-48 mb-6"></div>
        <div className="space-y-4">
          <div className="grid grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
          {[...Array(8)].map((_, i) => (
            <div key={i} className="grid grid-cols-6 gap-4">
              {[...Array(6)].map((_, j) => (
                <div key={j} className="h-4 bg-gray-100 rounded"></div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Sheet Performance Analysis</h3>
          <p className="text-sm text-gray-500 mt-1">
            {filteredAndSortedSheets.length} of {enrichedSheets.length} sheets
          </p>
        </div>
        
        {/* Actions */}
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => exportTableToCSV(sheets, groups, filters)}
            disabled={isLoading}
            className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
          {selectedSheets.size > 0 && (
            <span className="text-sm text-gray-600">
              {selectedSheets.size} selected
            </span>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search sheets..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <select
          value={filters.group}
          onChange={(e) => setFilters(prev => ({ ...prev, group: e.target.value }))}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Groups</option>
          {uniqueGroups.map(group => (
            <option key={group} value={group}>{group}</option>
          ))}
        </select>
        
        <select
          value={filters.status}
          onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="no-data">No Data</option>
          <option value="error">Error</option>
        </select>
        
        <select
          value={filters.dateRange}
          onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4">
                <input
                  type="checkbox"
                  checked={selectedSheets.size === paginatedSheets.length && paginatedSheets.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th 
                className="text-left py-3 px-4 font-medium text-gray-700 cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('sheetName')}
              >
                <div className="flex items-center space-x-1">
                  <span>Sheet Name</span>
                  <SortIcon field="sheetName" />
                </div>
              </th>
              <th 
                className="text-left py-3 px-4 font-medium text-gray-700 cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('groupName')}
              >
                <div className="flex items-center space-x-1">
                  <span>Group</span>
                  <SortIcon field="groupName" />
                </div>
              </th>
              <th 
                className="text-right py-3 px-4 font-medium text-gray-700 cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('openingStock')}
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>Opening</span>
                  <SortIcon field="openingStock" />
                </div>
              </th>
              <th 
                className="text-right py-3 px-4 font-medium text-gray-700 cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('closingStock')}
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>Closing</span>
                  <SortIcon field="closingStock" />
                </div>
              </th>
              <th 
                className="text-right py-3 px-4 font-medium text-gray-700 cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('variance')}
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>Variance</span>
                  <SortIcon field="variance" />
                </div>
              </th>
              <th 
                className="text-center py-3 px-4 font-medium text-gray-700 cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center justify-center space-x-1">
                  <span>Status</span>
                  <SortIcon field="status" />
                </div>
              </th>
              <th 
                className="text-center py-3 px-4 font-medium text-gray-700 cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('lastUpdate')}
              >
                <div className="flex items-center justify-center space-x-1">
                  <span>Last Update</span>
                  <SortIcon field="lastUpdate" />
                </div>
              </th>
              {/* <th className="text-center py-3 px-4 font-medium text-gray-700">Actions</th> */}
            </tr>
          </thead>
          <tbody>
            {paginatedSheets.map((sheet, index) => (
              <tr 
                key={sheet.sheetId} 
                className={`border-b border-gray-100 hover:bg-gray-50 ${
                  selectedSheets.has(sheet.sheetId) ? 'bg-blue-50' : ''
                }`}
              >
                <td className="py-3 px-4">
                  <input
                    type="checkbox"
                    checked={selectedSheets.has(sheet.sheetId)}
                    onChange={() => handleSelectSheet(sheet.sheetId)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </td>
                <td className="py-3 px-4">
                  <div>
                    <div className="font-medium text-gray-900">{sheet.sheetName}</div>
                    {sheet.risk !== 'low' && (
                      <div className={`text-xs mt-1 ${
                        sheet.risk === 'high' ? 'text-red-600' : 'text-yellow-600'
                      }`}>
                        {sheet.risk === 'high' ? 'High Risk' : 'Medium Risk'}
                      </div>
                    )}
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className="text-gray-900">{sheet.groupName}</span>
                </td>
                <td className="py-3 px-4 text-right font-medium text-gray-900">
                  {formatNumber(sheet.openingStock || 0)}
                </td>
                <td className="py-3 px-4 text-right font-medium text-gray-900">
                  {formatNumber(sheet.closingStock || 0)}
                </td>
                <td className="py-3 px-4 text-right">
                  <VarianceIndicator 
                    variance={sheet.variance} 
                    percentage={sheet.variancePercentage} 
                  />
                </td>
                <td className="py-3 px-4 text-center">
                  <StatusBadge status={sheet.status} statusColor={sheet.statusColor} />
                </td>
                <td className="py-3 px-4 text-center">
                  <div className="text-sm text-gray-900">{formatDate(sheet.lastUpdate)}</div>
                </td>
                {/* <td className="py-3 px-4 text-center">
                  <button
                    onClick={() => onSheetSelect && onSheetSelect(sheet)}
                    className="inline-flex items-center px-2 py-1 text-sm font-medium text-blue-600 hover:text-blue-800"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                </td> */}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-700">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredAndSortedSheets.length)} of {filteredAndSortedSheets.length} results
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            <div className="flex items-center space-x-1">
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                const page = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
                if (page > totalPages) return null;
                
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-2 text-sm font-medium rounded-md ${
                      currentPage === page
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SheetPerformanceTable;