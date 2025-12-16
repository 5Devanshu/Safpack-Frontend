import React, { useState } from 'react';
import { 
  Calendar, 
  FileText, 
  TrendingUp, 
  Users, 
  Clock, 
  Bell,
  Search,
  Filter,
  ChevronRight,
  Plus,
  Download,
  Eye,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';

// Mock data for the dashboard
const mockWorkbooks = [
  {
    id: 1,
    name: "Financial Year 2025",
    sheets: 12,
    lastUpdated: "2025-05-30",
    status: "active",
    progress: 85
  },
  {
    id: 2,
    name: "Financial Year 2024", 
    sheets: 12,
    lastUpdated: "2025-01-15",
    status: "completed",
    progress: 100
  },
  {
    id: 3,
    name: "Financial Year 2023",
    sheets: 12, 
    lastUpdated: "2024-12-31",
    status: "archived",
    progress: 100
  }
];

const mockRecentActivities = [
  {
    id: 1,
    action: "Updated",
    sheet: "Raw Material Warehouse",
    workbook: "Financial Year 2025",
    time: "2 hours ago",
    user: "You"
  },
  {
    id: 2,
    action: "Created",
    sheet: "Finished Goods",
    workbook: "Financial Year 2025", 
    time: "1 day ago",
    user: "John Doe"
  },
  {
    id: 3,
    action: "Updated",
    sheet: "Production Summary",
    workbook: "Financial Year 2025",
    time: "2 days ago",
    user: "Jane Smith"
  }
];

const mockStats = {
  totalWorkbooks: 3,
  activeSheets: 28,
  pendingUpdates: 5,
  completionRate: 92
};

// Stats Card Component
const StatsCard = ({ title, value, icon: Icon, trend, trendValue }) => {
  return (
    <div className="p-6 rounded-lg border bg-[var(--bg-primary)] border-[var(--text-secondary)] hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-[var(--text-secondary)] mb-1">{title}</p>
          <p className="text-2xl font-bold text-[var(--text-primary)]">{value}</p>
          {trend && (
            <div className="flex items-center mt-2">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-sm text-green-500">+{trendValue}%</span>
            </div>
          )}
        </div>
        <div className="p-3 rounded-lg bg-[var(--bg-secondary)]">
          <Icon className="w-6 h-6 text-[var(--accent-color)]" />
        </div>
      </div>
    </div>
  );
};

// Workbook Card Component
const WorkbookCard = ({ workbook, onOpen }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 rounded-lg border cursor-pointer transition-all hover:shadow-lg bg-[var(--bg-primary)] border-[var(--text-secondary)]">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">{workbook.name}</h3>
          <p className="text-sm text-[var(--text-secondary)]">{workbook.sheets} sheets</p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(workbook.status)}`}>
          {workbook.status}
        </span>
      </div>
      
      <div className="mb-4">
        <div className="flex justify-between text-sm text-[var(--text-secondary)] mb-1">
          <span>Progress</span>
          <span>{workbook.progress}%</span>
        </div>
        <div className="w-full bg-[var(--highlight-color)] rounded-full h-2">
          <div 
            className="bg-[var(--accent-color)] h-2 rounded-full transition-all duration-300"
            style={{ width: `${workbook.progress}%` }}
          ></div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-[var(--text-secondary)]">
          Last updated: {new Date(workbook.lastUpdated).toLocaleDateString()}
        </p>
        <button 
          onClick={() => onOpen(workbook)}
          className="flex items-center gap-1 text-sm text-[var(--accent-color)] hover:opacity-70 transition-opacity"
        >
          Open <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// Activity Item Component
const ActivityItem = ({ activity }) => {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-[var(--accent-color)] text-[var(--bg-primary)] flex items-center justify-center text-sm font-medium">
          {activity.user.charAt(0)}
        </div>
        <div>
          <p className="text-sm text-[var(--text-primary)]">
            <span className="font-medium">{activity.user}</span> {activity.action.toLowerCase()} 
            <span className="font-medium"> {activity.sheet}</span>
          </p>
          <p className="text-xs text-[var(--text-secondary)]">{activity.workbook} • {activity.time}</p>
        </div>
      </div>
      <Eye className="w-4 h-4 text-[var(--text-secondary)]" />
    </div>
  );
};

// Main Dashboard Component
const Dashboard = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  const filteredWorkbooks = mockWorkbooks.filter(workbook => {
    const matchesSearch = workbook.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || workbook.status === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const handleOpenWorkbook = (workbook) => {
    console.log('Opening workbook:', workbook);
    // Navigate to workbook view
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Header */}
      <header className="bg-[var(--bg-primary)] border-[var(--text-secondary)]">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">Dashboard</h1>
              <p className="text-[var(--text-secondary)]">Welcome back! Here's your data overview.</p>
            </div>
            <div className="flex items-center gap-4">
              {/* <button className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors">
                <Bell className="w-5 h-5 text-[var(--text-secondary)]" />
              </button>
              <div className="w-8 h-8 rounded-full bg-[var(--accent-color)] text-[var(--bg-primary)] flex items-center justify-center text-sm font-medium">
                U
              </div> */}
            </div>
          </div>
        </div>
      </header>

      <div className="p-6">
        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard 
            title="Total Workbooks" 
            value={mockStats.totalWorkbooks} 
            icon={FileText}
            trend={true}
            trendValue={12}
          />
          <StatsCard 
            title="Active Sheets" 
            value={mockStats.activeSheets} 
            icon={BarChart3}
            trend={true}
            trendValue={8}
          />
          <StatsCard 
            title="Pending Updates" 
            value={mockStats.pendingUpdates} 
            icon={Clock}
          />
          <StatsCard 
            title="Completion Rate" 
            value={`${mockStats.completionRate}%`} 
            icon={PieChart}
            trend={true}
            trendValue={5}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Workbooks Section */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-[var(--text-primary)]">Your Workbooks</h2>
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent-color)] text-[var(--bg-primary)] hover:opacity-80 transition-opacity">
                <Plus className="w-4 h-4" />
                New Workbook
              </button>
            </div>

            {/* Search and Filter */}
            <div className="flex gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--text-secondary)] w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search workbooks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-[var(--bg-primary)] border-[var(--text-secondary)] text-[var(--text-primary)]"
                />
              </div>
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-[var(--bg-primary)] border-[var(--text-secondary)] text-[var(--text-primary)]"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            {/* Workbooks Grid */}
            <div className="space-y-4">
              {filteredWorkbooks.map(workbook => (
                <WorkbookCard 
                  key={workbook.id} 
                  workbook={workbook} 
                  onOpen={handleOpenWorkbook}
                />
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Recent Activity */}
            <div className="bg-[var(--bg-primary)] border rounded-lg p-6 border-[var(--text-secondary)]">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {mockRecentActivities.map(activity => (
                  <ActivityItem key={activity.id} activity={activity} />
                ))}
              </div>
              <button className="w-full mt-4 text-sm text-[var(--accent-color)] hover:opacity-70 transition-opacity">
                View all activity
              </button>
            </div>

            {/* Quick Actions */}
            <div className="bg-[var(--bg-primary)] border rounded-lg p-6 border-[var(--text-secondary)]">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors text-left">
                  <Plus className="w-4 h-4 text-[var(--accent-color)]" />
                  <span className="text-[var(--text-primary)]">Create New Sheet</span>
                </button>
                <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors text-left">
                  <Download className="w-4 h-4 text-[var(--accent-color)]" />
                  <span className="text-[var(--text-primary)]">Export Data</span>
                </button>
                <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors text-left">
                  <BarChart3 className="w-4 h-4 text-[var(--accent-color)]" />
                  <span className="text-[var(--text-primary)]">View Reports</span>
                </button>
                <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors text-left">
                  <Activity className="w-4 h-4 text-[var(--accent-color)]" />
                  <span className="text-[var(--text-primary)]">Analytics</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;