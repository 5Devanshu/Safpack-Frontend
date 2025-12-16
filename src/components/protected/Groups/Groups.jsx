import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { 
  Users, 
  Plus, 
  Search, 
  FileText, 
  Folder, 
  FolderOpen
} from 'lucide-react';
import { 
  GroupFilterDropdown, 
  SheetCard, 
  CreateGroupModal, 
  ViewToggle, 
  GroupCard 
} from './utils/GroupsHelper';
import { selectAccount } from '../../../app/DashboardSlice';
import { fetchMetadata, updateMetas } from '../../../services/repository/sheetsRepo';

// Main Groups Management Component
const GroupsManagement = () => {
  const account = useSelector(selectAccount);
  const initialFetchRef = useRef(false);
  
  const [rawMetadata, setRawMetadata] = useState([]);
  const [metadataLoading, setMetadataLoading] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewMode, setViewMode] = useState('sheets'); // 'sheets' or 'groups'
  const [expandedGroups, setExpandedGroups] = useState(new Set());
  
  // Initialize metadata
  useEffect(() => {
    const initializeMetadata = async () => {
      if (initialFetchRef.current) return;
      initialFetchRef.current = true;
      
      try {
        setMetadataLoading(true);
        const fetchedMetadata = await fetchMetadata(account?.role || "user");
        // console.log("Fetched metadata:", fetchedMetadata);
        setRawMetadata(fetchedMetadata || []);
      } catch (error) {
        console.error("Error initializing metadata:", error);
        setRawMetadata([]);
      } finally {
        setMetadataLoading(false);
      }
    };
    
    if (account && !initialFetchRef.current) {
      initializeMetadata();
    }
  }, [account]);
  
  // Get unique groups
  const availableGroups = React.useMemo(() => {
    const groups = rawMetadata
      .map(sheet => sheet.groupName)
      .filter(groupName => groupName && groupName.trim() !== '')
      .filter((group, index, arr) => arr.indexOf(group) === index)
      .sort();
    return groups;
  }, [rawMetadata]);
  
  // Get grouped data for Group View
  const groupedData = React.useMemo(() => {
    const grouped = {};
    
    rawMetadata.forEach(sheet => {
      const groupName = sheet.groupName || 'Ungrouped';
      if (!grouped[groupName]) {
        grouped[groupName] = [];
      }
      grouped[groupName].push(sheet);
    });
    
    // Filter by search term if provided
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      Object.keys(grouped).forEach(groupName => {
        grouped[groupName] = grouped[groupName].filter(sheet => 
          (sheet.sheetName || '').toLowerCase().includes(term) ||
          groupName.toLowerCase().includes(term)
        );
        
        // Remove empty groups after filtering
        if (grouped[groupName].length === 0) {
          delete grouped[groupName];
        }
      });
    }
    
    return grouped;
  }, [rawMetadata, searchTerm]);
  
  // Handle group expansion
  const handleGroupClick = (groupName, isExpanded) => {
    const newExpanded = new Set(expandedGroups);
    if (isExpanded) {
      newExpanded.add(groupName);
    } else {
      newExpanded.delete(groupName);
    }
    setExpandedGroups(newExpanded);
  };
  
  // Handle view mode change
  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    if (mode === 'groups') {
      setSelectedGroup('all'); // Reset filter when switching to group view
    }
  };
  // Filter sheets based on selected group and search term (for Sheet View)
  const filteredSheets = React.useMemo(() => {
    let sheets = rawMetadata;
    
    // Filter by group
    if (selectedGroup === 'ungrouped') {
      sheets = sheets.filter(sheet => !sheet.groupName || sheet.groupName.trim() === '');
    } else if (selectedGroup !== 'all') {
      sheets = sheets.filter(sheet => sheet.groupName === selectedGroup);
    }
    
    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      sheets = sheets.filter(sheet => 
        (sheet.sheetName || '').toLowerCase().includes(term) ||
        (sheet.groupName || '').toLowerCase().includes(term)
      );
    }
    
    return sheets;
  }, [rawMetadata, selectedGroup, searchTerm]);
  
  // Move sheet to group
  const handleMoveToGroup = async (sheetId, groupName) => {
    try {
      const sheet = rawMetadata.find(s => s._id === sheetId);
      if (!sheet) return;
      
      const updatedMetadata = {
        ...sheet,
        groupName: groupName,
        formulaChange: [],
        nameChange: false,
      };
      
      const response = await updateMetas(sheetId, updatedMetadata, "updateGroup");
      
      if (response) {
        // Update local state
        setRawMetadata(prev => 
          prev.map(s => 
            s._id === sheetId 
              ? { ...s, groupName: groupName }
              : s
          )
        );
      }
    } catch (error) {
      console.error('Error moving sheet to group:', error);
      throw error;
    }
  };
  
  // Create new group
  const handleCreateGroup = async (groupName, sheetIds) => {
    try {
      // Update all selected sheets with the new group name
      const updatePromises = sheetIds.map(async (sheetId) => {
        const sheet = rawMetadata.find(s => s._id === sheetId);
        if (!sheet) return;
        
        const updatedMetadata = {
          ...sheet,
          groupName: groupName,
          formulaChange: [],
          nameChange: false,
        };
        
        return updateMetas(sheetId, updatedMetadata, "updateGroup");
      });
      
      await Promise.all(updatePromises);
      
      // Update local state
      setRawMetadata(prev => 
        prev.map(sheet => 
          sheetIds.includes(sheet._id)
            ? { ...sheet, groupName: groupName }
            : sheet
        )
      );
      
      // Select the newly created group
      setSelectedGroup(groupName);
    } catch (error) {
      console.error('Error creating group:', error);
      throw error;
    }
  };
  
  if (metadataLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-600">Loading groups...</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-[calc(100vh-2rem)] bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-8xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-3">
                <Users size={28} className="text-blue-600" />
                <span>Groups Management</span>
              </h1>
              {/* <p className="text-gray-600 mt-2">
                Organize and manage your sheets with groups
              </p> */}
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 px-4 py-2 rounded-xl">
                <span className="text-sm font-medium text-blue-700">
                  {viewMode === 'sheets' 
                    ? `${filteredSheets.length} Sheet${filteredSheets.length !== 1 ? 's' : ''}`
                    : `${Object.keys(groupedData).length} group${Object.keys(groupedData).length !== 1 ? 's' : ''}`
                  }
                </span>
              </div>
              
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors flex items-center space-x-2 font-medium text-sm"
              >
                <Plus size={18} />
                <span>Create Group</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Filters and Controls */}
      <div className="max-w-8xl mx-auto px-6 py-3">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <ViewToggle 
              viewMode={viewMode}
              onViewChange={handleViewModeChange}
            />
            
            {viewMode === 'sheets' && (
              <GroupFilterDropdown
                groups={availableGroups}
                selectedGroup={selectedGroup}
                onGroupSelect={setSelectedGroup}
                onCreateNew={() => setShowCreateModal(true)}
              />
            )}
          </div>
          
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={viewMode === 'sheets' ? "Search sheets..." : "Search groups and sheets..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-80 pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>
        </div>
        
        {/* Group Summary - Only show in Sheet View */}
        {viewMode === 'sheets' && selectedGroup !== 'all' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <div className="flex items-center space-x-3">
              {selectedGroup === 'ungrouped' ? (
                <>
                  <FileText size={20} className="text-gray-500" />
                  <div>
                    <h2 className="font-semibold text-gray-900">Ungrouped Sheets</h2>
                    <p className="text-sm text-gray-600">
                      {filteredSheets.length} sheet{filteredSheets.length !== 1 ? 's' : ''} without a group assignment
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <FolderOpen size={20} className="text-blue-600" />
                  <div>
                    <h2 className="font-semibold text-gray-900">{selectedGroup}</h2>
                    <p className="text-sm text-gray-600">
                      {filteredSheets.length} sheet{filteredSheets.length !== 1 ? 's' : ''} in this group
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
        
        {/* Content Area */}
        {viewMode === 'sheets' ? (
          /* Sheets Grid */
          filteredSheets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredSheets.map((sheet) => (
                <SheetCard
                  key={sheet._id}
                  sheet={sheet}
                  onMoveToGroup={handleMoveToGroup}
                  availableGroups={availableGroups}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <Folder size={48} className="text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'No sheets found' : selectedGroup === 'all' ? 'No sheets available' : 'No sheets in this group'}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm 
                  ? 'Try adjusting your search terms or filters'
                  : selectedGroup === 'ungrouped' 
                  ? 'All sheets are currently assigned to groups'
                  : 'This group is currently empty'
                }
              </p>
              {!searchTerm && selectedGroup === 'all' && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors flex items-center space-x-2 mx-auto"
                >
                  <Plus size={18} />
                  <span>Create First Group</span>
                </button>
              )}
            </div>
          )
        ) : (
          /* Groups Grid */
          Object.keys(groupedData).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
              {Object.entries(groupedData)
                .sort(([a], [b]) => {
                  // Sort ungrouped to the end
                  if (a === 'Ungrouped') return 1;
                  if (b === 'Ungrouped') return -1;
                  return a.localeCompare(b);
                })
                .map(([groupName, sheets]) => (
                  <GroupCard
                    key={groupName}
                    groupName={groupName === 'Ungrouped' ? null : groupName}
                    sheets={sheets}
                    onGroupClick={handleGroupClick}
                    onMoveToGroup={handleMoveToGroup}
                    availableGroups={availableGroups}
                    isExpanded={expandedGroups.has(groupName)}
                  />
                ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <FolderOpen size={48} className="text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'No groups found' : 'No groups available'}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm 
                  ? 'Try adjusting your search terms'
                  : 'Create your first group to organize your sheets'
                }
              </p>
              {!searchTerm && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors flex items-center space-x-2 mx-auto"
                >
                  <Plus size={18} />
                  <span>Create First Group</span>
                </button>
              )}
            </div>
          )
        )}
      </div>
      
      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateGroup={handleCreateGroup}
        existingGroups={availableGroups}
        selectedSheets={rawMetadata}
      />
    </div>
  );
};

export default GroupsManagement;