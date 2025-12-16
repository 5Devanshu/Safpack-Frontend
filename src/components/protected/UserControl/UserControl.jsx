import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Shield,
  ShieldOff,
  User,
  Mail,
  Key,
  Users,
  FileSpreadsheet,
  X,
  Check,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  createUser,
  uploadUserInformation,
  updateUserInformation,
  revokeUserAccess,
  getAllUsers,
  grantUserAccess,
} from "../../../services/repository/userManagementRepo";
import { fetchMetadata } from "../../../services/repository/sheetsRepo";

const UserManagement = () => {
  const dispatch = useDispatch();

  // State management
  const [users, setUsers] = useState([]);
  const [metadata, setMetadata] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    name: "",
    roleIdentifier: "operator",
    selectedSheets: [],
  });

  const [createSheetSearchTerm, setCreateSheetSearchTerm] = useState("");
  const [editSheetSearchTerm, setEditSheetSearchTerm] = useState("");

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    setCreateSheetSearchTerm("");
    setNewUser({
      email: "",
      password: "",
      name: "",
      roleIdentifier: "operator",
      selectedSheets: [],
    });
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditSheetSearchTerm("");
    setSelectedUser(null);
  };

  // Create sheet map from metadata
  const sheetMap = React.useMemo(() => {
    const map = new Map();
    if (metadata && Array.isArray(metadata)) {
      metadata.forEach((sheet) => {
        map.set(sheet._id, sheet.sheetName);
      });
    }
    return map;
  }, [metadata]);

  // Fetch users and metadata on component mount
  useEffect(() => {
    fetchUsers();
    fetchMetadataData();
  }, []);

  const fetchMetadataData = async () => {
    try {
      const metadataResult = await fetchMetadata("admin");
      if (metadataResult) {
        setMetadata(metadataResult);
      }
    } catch (error) {
      console.error("Error fetching metadata:", error);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const result = await dispatch(getAllUsers());
      if (result.success) {
        setUsers(result.data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!newUser.email || !newUser.password || !newUser.name) {
      toast.error("Please fill in all required fields");
      return;
    }

    setCreatingUser(true);
    try {
      // Step 1: Create user account
      const createResult = await dispatch(
        createUser(newUser.email, newUser.password)
      );

      if (createResult.success) {
        // Step 2: Upload user information with selected sheets
        const uploadResult = await dispatch(
          uploadUserInformation(
            newUser.name,
            createResult.data._id, // This is the userId
            newUser.selectedSheets,
            newUser.roleIdentifier
          )
        );

        if (uploadResult.success) {
          setShowCreateModal(false);
          setNewUser({
            email: "",
            password: "",
            name: "",
            roleIdentifier: "operator",
            selectedSheets: [],
          });
          fetchUsers();
        }
      }
    } catch (error) {
      console.error("Error creating user:", error);
    } finally {
      setCreatingUser(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser || !selectedUser.name) return;

    try {
      const result = await dispatch(
        updateUserInformation(selectedUser.userId, selectedUser.name)
      );

      if (result.success) {
        setShowEditModal(false);
        setSelectedUser(null);
        fetchUsers();
      }
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  const handleRevokeAccess = async (userId, sheetId) => {
    try {
      const result = await dispatch(revokeUserAccess(userId, sheetId));
      if (result.success) {
        fetchUsers();
      }
    } catch (error) {
      console.error("Error revoking access:", error);
    }
  };

  const handleGrantAccess = async (selectedSheetIds) => {
    if (!selectedUser || selectedSheetIds.length === 0) return;

    try {
      const result = await dispatch(
        grantUserAccess(selectedUser.userId, selectedSheetIds, selectedUser)
      );

      if (result.success) {
        // Update local state and refresh users list
        fetchUsers();
      }
    } catch (error) {
      console.error("Error granting access:", error);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.roleIdentifier?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const GrantAccessModal = () => {
    const [selectedSheets, setSelectedSheets] = useState([]);
    const [sheetSearchTerm, setSheetSearchTerm] = useState("");

    const availableSheets = Array.from(sheetMap.entries()).filter(
      ([sheetId]) => !selectedUser?.allowedAccess?.includes(sheetId)
    );

    const filteredSheets = availableSheets.filter(([sheetId, sheetName]) =>
      sheetName.toLowerCase().includes(sheetSearchTerm.toLowerCase())
    );

    return (
      <div className="fixed inset-0 bg-black/65 bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-3xl mx-4 max-h-[80vh] overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Grant Sheet Access to {selectedUser?.name}
            </h2>
            <button
              onClick={() => setShowAccessModal(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>
          </div>

          {/* Search for sheets */}
          <div className="mb-4">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={16}
              />
              <input
                type="text"
                placeholder="Search sheets..."
                value={sheetSearchTerm}
                onChange={(e) => setSheetSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Selected sheets summary */}
          {selectedSheets.length > 0 && (
            <div className="mb-4 p-3 bg-blue-50 rounded-md">
              <div className="text-sm font-medium text-blue-900 mb-2">
                Selected Sheets ({selectedSheets.length}):
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedSheets.map((sheetId) => (
                  <span
                    key={sheetId}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                  >
                    {sheetMap
                      .get(sheetId)
                      ?.replace(/-/g, " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                    <button
                      onClick={() =>
                        setSelectedSheets(
                          selectedSheets.filter((id) => id !== sheetId)
                        )
                      }
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Available sheets list */}
          <div className="space-y-2 max-h-80 overflow-y-auto border rounded-md p-3">
            {availableSheets.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                User already has access to all available sheets
              </p>
            ) : filteredSheets.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No sheets found matching "{sheetSearchTerm}"
              </p>
            ) : (
              <>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-600">
                    {filteredSheets.length} sheet(s) available
                  </span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() =>
                        setSelectedSheets([
                          ...selectedSheets,
                          ...filteredSheets.map(([id]) => id),
                        ])
                      }
                      className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                    >
                      Select All
                    </button>
                    <button
                      onClick={() => setSelectedSheets([])}
                      className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                {filteredSheets.map(([sheetId, sheetName]) => (
                  <label
                    key={sheetId}
                    className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedSheets.includes(sheetId)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedSheets([...selectedSheets, sheetId]);
                        } else {
                          setSelectedSheets(
                            selectedSheets.filter((id) => id !== sheetId)
                          );
                        }
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div className="flex items-center space-x-2">
                      <FileSpreadsheet className="w-4 h-4 text-green-600" />
                      <span className="text-gray-700">
                        {sheetName
                          .replace(/-/g, " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                      </span>
                    </div>
                  </label>
                ))}
              </>
            )}
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => setShowAccessModal(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={() => handleGrantAccess(selectedSheets)}
              disabled={selectedSheets.length === 0}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Grant Access ({selectedSheets.length})
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-[90%] bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header section */}
        <div className="bg-white rounded-lg shadow-sm mb-4">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Users className="w-6 h-6 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">
                  User Management
                </h1>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center space-x-2"
              >
                <Plus size={16} />
                <span>Add User</span>
              </button>
            </div>
          </div>

          {/* Search and stats section */}
          <div className="px-6 py-3 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent w-80"
                />
              </div>
              <div className="text-sm text-gray-600">
                Total Users: {filteredUsers.length}
              </div>
            </div>
          </div>
        </div>

        {/* Table container with fixed height */}
        <div
          className="bg-white rounded-lg shadow-sm"
          style={{ height: "calc(100vh - 280px)" }}
        >
          <div className="h-full flex flex-col">
            {/* Table header - fixed */}
            <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </div>
                <div className="col-span-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </div>
                <div className="col-span-5 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sheet Access
                </div>
                <div className="col-span-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </div>
              </div>
            </div>

            {/* Scrollable table body */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                  <Users className="w-12 h-12 mb-2 text-gray-300" />
                  <p>No users found</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <div
                      key={user.userId}
                      className="px-6 py-3 hover:bg-gray-50"
                    >
                      <div className="grid grid-cols-12 gap-4 items-center">
                        {/* User info */}
                        <div className="col-span-3">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <User className="w-4 h-4 text-blue-600" />
                              </div>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {user.name}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                ID: {user.userId}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Role */}
                        <div className="col-span-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                            {user.roleIdentifier}
                          </span>
                        </div>

                        {/* Sheet Access */}
                        <div className="col-span-5">
                          <div className="space-y-1">
                            {user.allowedAccess?.length > 0 ? (
                              <div>
                                {/* Show sheet names with revoke buttons */}
                                <div className="space-y-1">
                                  {user.allowedAccess
                                    .slice(0, 2)
                                    .map((sheetId) => (
                                      <div
                                        key={sheetId}
                                        className="flex items-center justify-between bg-gray-100 rounded px-2 py-1 text-xs"
                                      >
                                        <span className="text-gray-700 truncate max-w-[200px]">
                                          {sheetMap
                                            .get(sheetId)
                                            ?.replace(/-/g, " ")
                                            .replace(/\b\w/g, (l) =>
                                              l.toUpperCase()
                                            ) || "Unknown Sheet"}
                                        </span>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleRevokeAccess(
                                              user.userId,
                                              sheetId
                                            );
                                          }}
                                          className="text-red-500 hover:text-red-700 ml-2"
                                          title="Revoke access"
                                        >
                                          <ShieldOff size={12} />
                                        </button>
                                      </div>
                                    ))}
                                </div>

                                {/* Show remaining count if more than 2 sheets */}
                                {user.allowedAccess.length > 2 && (
                                  <div className="text-xs text-blue-600 font-medium">
                                    +{user.allowedAccess.length - 2} more sheets
                                  </div>
                                )}

                                {/* Total count */}
                                <div className="text-xs text-gray-500">
                                  Total: {user.allowedAccess.length} sheet(s)
                                </div>
                              </div>
                            ) : (
                              <div className="text-xs text-gray-500 italic">
                                No sheet access assigned
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="col-span-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedUser(user);
                              setShowEditModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded"
                            title="Edit user and manage access"
                          >
                            <Edit size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Create User Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/65 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Create New User
                </h2>
                <button
                  onClick={() => {
                    handleCloseCreateModal;
                    setShowCreateModal(false);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* User Details Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
                    User Details
                  </h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Mail className="inline w-4 h-4 mr-1" />
                      Email *
                    </label>
                    <input
                      type="email"
                      value={newUser.email}
                      onChange={(e) =>
                        setNewUser({ ...newUser, email: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="user@example.com"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Key className="inline w-4 h-4 mr-1" />
                      Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={newUser.password}
                        onChange={(e) =>
                          setNewUser({ ...newUser, password: e.target.value })
                        }
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? (
                          <EyeOff size={20} />
                        ) : (
                          <Eye size={20} />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <User className="inline w-4 h-4 mr-1" />
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={newUser.name}
                      onChange={(e) =>
                        setNewUser({ ...newUser, name: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="John Doe"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role
                    </label>
                    <select
                      value={newUser.roleIdentifier}
                      onChange={(e) =>
                        setNewUser({
                          ...newUser,
                          roleIdentifier: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="operator">Operator</option>
                      <option value="manager">Manager</option>
                    </select>
                  </div>
                </div>

                {/* Sheet Access Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
                    Sheet Access
                  </h3>

                  {/* Selected sheets summary */}
                  {newUser.selectedSheets.length > 0 && (
                    <div className="p-3 bg-blue-50 rounded-md">
                      <div className="text-sm font-medium text-blue-900 mb-2">
                        Selected Sheets ({newUser.selectedSheets.length}):
                      </div>
                      <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                        {newUser.selectedSheets.map((sheetId) => (
                          <span
                            key={sheetId}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                          >
                            {sheetMap
                              .get(sheetId)
                              ?.replace(/-/g, " ")
                              .replace(/\b\w/g, (l) => l.toUpperCase())}
                            <button
                              onClick={() =>
                                setNewUser({
                                  ...newUser,
                                  selectedSheets: newUser.selectedSheets.filter(
                                    (id) => id !== sheetId
                                  ),
                                })
                              }
                              className="ml-1 text-blue-600 hover:text-blue-800"
                            >
                              <X size={12} />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Available Sheets with Search */}
                  <div className="border rounded-md">
                    {/* Search Bar */}
                    <div className="p-3 border-b bg-gray-50">
                      <div className="relative">
                        <Search
                          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                          size={16}
                        />
                        <input
                          type="text"
                          placeholder="Search available sheets..."
                          value={createSheetSearchTerm}
                          onChange={(e) =>
                            setCreateSheetSearchTerm(e.target.value)
                          }
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                      </div>
                    </div>

                    {/* Header with counts and actions */}
                    <div className="p-3 bg-gray-50 border-b">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          Available Sheets (
                          {
                            metadata.filter((sheet) =>
                              sheet.sheetName
                                .toLowerCase()
                                .includes(createSheetSearchTerm.toLowerCase())
                            ).length
                          }{" "}
                          of {metadata.length})
                        </span>
                        <div className="flex space-x-2">
                          <button
                            type="button"
                            onClick={() =>
                              setNewUser({
                                ...newUser,
                                selectedSheets: metadata
                                  .filter((sheet) =>
                                    sheet.sheetName
                                      .toLowerCase()
                                      .includes(
                                        createSheetSearchTerm.toLowerCase()
                                      )
                                  )
                                  .map((sheet) => sheet._id),
                              })
                            }
                            className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                          >
                            Select All Filtered
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setNewUser({ ...newUser, selectedSheets: [] })
                            }
                            className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                          >
                            Clear All
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Scrollable sheet list */}
                    <div className="max-h-80 overflow-y-auto">
                      <div className="p-3 space-y-2">
                        {metadata
                          .filter((sheet) =>
                            sheet.sheetName
                              .toLowerCase()
                              .includes(createSheetSearchTerm.toLowerCase())
                          )
                          .map((sheet) => (
                            <label
                              key={sheet._id}
                              className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={newUser.selectedSheets.includes(
                                  sheet._id
                                )}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setNewUser({
                                      ...newUser,
                                      selectedSheets: [
                                        ...newUser.selectedSheets,
                                        sheet._id,
                                      ],
                                    });
                                  } else {
                                    setNewUser({
                                      ...newUser,
                                      selectedSheets:
                                        newUser.selectedSheets.filter(
                                          (id) => id !== sheet._id
                                        ),
                                    });
                                  }
                                }}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <div className="flex items-center space-x-2">
                                <FileSpreadsheet className="w-4 h-4 text-green-600" />
                                <span className="text-gray-700">
                                  {sheet.sheetName
                                    .replace(/-/g, " ")
                                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                                </span>
                              </div>
                            </label>
                          ))}

                        {metadata.filter((sheet) =>
                          sheet.sheetName
                            .toLowerCase()
                            .includes(createSheetSearchTerm.toLowerCase())
                        ).length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            No sheets found matching "{createSheetSearchTerm}"
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-8 pt-6 border-t">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  disabled={creatingUser}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateUser}
                  disabled={
                    creatingUser ||
                    !newUser.email ||
                    !newUser.password ||
                    !newUser.name
                  }
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {creatingUser && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  <span>
                    {creatingUser ? "Creating User..." : "Create User"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {showEditModal && selectedUser && (
          <div className="fixed inset-0 bg-black/65 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-5xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Edit User: {selectedUser.name}
                </h2>
                <button
                  onClick={() => {
                    handleCloseEditModal;
                    setShowEditModal(false);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* User Details Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
                    User Details
                  </h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <User className="inline w-4 h-4 mr-1" />
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={selectedUser.name}
                      onChange={(e) =>
                        setSelectedUser({
                          ...selectedUser,
                          name: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      User ID
                    </label>
                    <input
                      type="text"
                      value={selectedUser.userId}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role
                    </label>
                    <input
                      type="text"
                      value={selectedUser.roleIdentifier}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
                    />
                  </div>

                  {/* Current Access Summary */}
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Current Access Summary
                    </h4>
                    <div className="text-sm text-gray-600">
                      <div>
                        Total Sheets:{" "}
                        <span className="font-medium">
                          {selectedUser.allowedAccess?.length || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sheet Access Management Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
                    Sheet Access Management
                  </h3>

                  {/* Current Access - Revoke Section */}
                  {selectedUser.allowedAccess?.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-gray-700 text-red-600">
                        Current Access - Click to Revoke
                      </h4>
                      <div className="border rounded-md bg-red-50">
                        <div className="max-h-40 overflow-y-auto">
                          <div className="p-3 space-y-2">
                            {selectedUser.allowedAccess.map((sheetId) => (
                              <div
                                key={sheetId}
                                className="flex items-center justify-between bg-white rounded px-3 py-2 shadow-sm"
                              >
                                <div className="flex items-center space-x-2">
                                  <FileSpreadsheet className="w-4 h-4 text-green-600" />
                                  <span className="text-sm text-gray-700 truncate max-w-[200px]" title={sheetMap.get(sheetId)?.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()) || "Unknown Sheet"}>
                                    {sheetMap
                                      .get(sheetId)
                                      ?.replace(/-/g, " ")
                                      .replace(/\b\w/g, (l) =>
                                        l.toUpperCase()
                                      ) || "Unknown Sheet"}
                                  </span>
                                </div>
                                <button
                                  onClick={() => {
                                    handleRevokeAccess(
                                      selectedUser.userId,
                                      sheetId
                                    );
                                    // Update selectedUser state to reflect the change
                                    setSelectedUser({
                                      ...selectedUser,
                                      allowedAccess:
                                        selectedUser.allowedAccess.filter(
                                          (id) => id !== sheetId
                                        ),
                                    });
                                  }}
                                  className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-100"
                                  title="Revoke access"
                                >
                                  <ShieldOff size={16} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Available Sheets - Grant Section */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-700 text-green-600">
                      Available Sheets - Click to Grant Access
                    </h4>

                    <div className="border rounded-md bg-green-50">
                      {/* Search Bar */}
                      <div className="p-3 border-b bg-white">
                        <div className="relative">
                          <Search
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                            size={16}
                          />
                          <input
                            type="text"
                            placeholder="Search available sheets..."
                            value={editSheetSearchTerm}
                            onChange={(e) =>
                              setEditSheetSearchTerm(e.target.value)
                            }
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          />
                        </div>
                      </div>

                      {/* Scrollable available sheets */}
                      <div className="max-h-60 overflow-y-auto">
                        <div className="p-3 space-y-2">
                          {Array.from(sheetMap.entries())
                            .filter(
                              ([sheetId, sheetName]) =>
                                !selectedUser.allowedAccess?.includes(
                                  sheetId
                                ) &&
                                sheetName
                                  .toLowerCase()
                                  .includes(editSheetSearchTerm.toLowerCase())
                            )
                            .map(([sheetId, sheetName]) => (
                              <div
                                key={sheetId}
                                className="flex items-center justify-between bg-white rounded px-3 py-2 shadow-sm"
                              >
                                <div className="flex items-center space-x-2  min-w-0 flex-1">
                                  <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                                  <span className="text-sm text-gray-700 truncate max-w-[300px]" title={sheetName.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}>
                                    {sheetName
                                      .replace(/-/g, " ")
                                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                                  </span>
                                </div>
                                <button
                                  onClick={() => {
                                    handleGrantAccess([sheetId]);
                                    // Update selectedUser state to reflect the change
                                    setSelectedUser({
                                      ...selectedUser,
                                      allowedAccess: [
                                        ...(selectedUser.allowedAccess || []),
                                        sheetId,
                                      ],
                                    });
                                  }}
                                  className="text-green-500 hover:text-green-700 p-1 rounded hover:bg-green-100"
                                  title="Grant access"
                                >
                                  <Shield size={16} />
                                </button>
                              </div>
                            ))}

                          {Array.from(sheetMap.entries()).filter(
                            ([sheetId, sheetName]) =>
                              !selectedUser.allowedAccess?.includes(sheetId) &&
                              sheetName
                                .toLowerCase()
                                .includes(editSheetSearchTerm.toLowerCase())
                          ).length === 0 && (
                            <div className="text-center py-4 text-gray-500">
                              {editSheetSearchTerm
                                ? `No available sheets found matching "${editSheetSearchTerm}"`
                                : "User has access to all available sheets"}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bulk Actions */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        const allSheetIds = Array.from(sheetMap.keys());
                        const newSheetIds = allSheetIds.filter(
                          (id) => !selectedUser.allowedAccess?.includes(id)
                        );
                        handleGrantAccess(newSheetIds);
                        setSelectedUser({
                          ...selectedUser,
                          allowedAccess: allSheetIds,
                        });
                      }}
                      disabled={
                        selectedUser.allowedAccess?.length === sheetMap.size
                      }
                      className="flex-1 text-xs px-3 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Grant All Access
                    </button>
                    <button
                      onClick={() => {
                        // Revoke all access
                        selectedUser.allowedAccess?.forEach((sheetId) => {
                          handleRevokeAccess(selectedUser.userId, sheetId);
                        });
                        setSelectedUser({
                          ...selectedUser,
                          allowedAccess: [],
                        });
                      }}
                      disabled={!selectedUser.allowedAccess?.length}
                      className="flex-1 text-xs px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Revoke All Access
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-8 pt-6 border-t">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateUser}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Update User
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;
