import { toast } from "react-hot-toast";
import { apiConnector } from "../Connector";
import { userManagementAPIs } from "../Apis";
const {
  ALL_USERS_API,
  REVOKE_ACCESS_API,
  UPDATE_USER_INFO_API,
  UPLOAD_USER_INFO_API,
  USER_SIGNUP_API,
} = userManagementAPIs;

export function createUser(email, password) {
  return async (dispatch) => {
    const loadingToast = toast.loading("Creating user...");

    try {
      const response = await apiConnector("POST", USER_SIGNUP_API, {
        email,
        password,
      });

      console.log("Create User API response:", response);

      if (response.status === 201) {
        toast.success(response.data.msg || "User created successfully!");
        return {
          success: true,
          data: response.data.userInfo,
        };
      } else {
        throw new Error(response.data.msg);
      }
    } catch (error) {
      console.log("Create User API Error:", error);
      toast.error(
        error.response?.data?.msg || "Failed to create user. Please try again."
      );
      return {
        success: false,
        error: error.response?.data?.msg || "Failed to create user",
      };
    } finally {
      toast.dismiss(loadingToast);
    }
  };
}

export function uploadUserInformation(
  name,
  userId,
  allowedAccess,
  roleIdentifier = "operator"
) {
  return async (dispatch) => {
    const loadingToast = toast.loading("Updating user information...");

    try {
      const response = await apiConnector("POST", UPLOAD_USER_INFO_API, {
        name,
        userId,
        allowedAccess,
        roleIdentifier,
      });

      console.log("Upload User Info API response:", response);

      if (response.status === 201) {
        toast.success("User information updated successfully!");
        return {
          success: true,
          data: response.data,
        };
      } else {
        throw new Error(response.data.msg);
      }
    } catch (error) {
      console.log("Upload User Info API Error:", error);
      toast.error(
        error.response?.data?.msg || "Failed to update user information."
      );
      return {
        success: false,
        error: error.response?.data?.msg || "Failed to update user information",
      };
    } finally {
      toast.dismiss(loadingToast);
    }
  };
}

export function updateUserInformation(userId, name) {
  return async (dispatch) => {
    const loadingToast = toast.loading("Updating user...");

    try {
      const response = await apiConnector("PATCH", UPDATE_USER_INFO_API, {
        userId,
        name,
      });

      console.log("Update User Info API response:", response);

      if (response.status >= 200  || response.status <=300) {
        toast.success("User updated successfully!");
        return {
          success: true,
          data: response.data,
        };
      } else {
        throw new Error(response.data.msg);
      }
    } catch (error) {
      console.log("Update User Info API Error:", error);
      toast.error(error.response?.data?.msg || "Failed to update user.");
      return {
        success: false,
        error: error.response?.data?.msg || "Failed to update user",
      };
    } finally {
      toast.dismiss(loadingToast);
    }
  };
}

export function revokeUserAccess(userId, sheetId) {
  return async (dispatch) => {
    const loadingToast = toast.loading("Revoking access...");

    try {
      const response = await apiConnector("PATCH", REVOKE_ACCESS_API, {
        userId,
        sheetId,
      });

      console.log("Revoke Access API response:", response);

      if (response.status === 200) {
        toast.success("Access revoked successfully!");
        return {
          success: true,
          data: response.data,
        };
      } else {
        throw new Error(response.data.msg);
      }
    } catch (error) {
      console.log("Revoke Access API Error:", error);
      toast.error(error.response?.data?.msg || "Failed to revoke access.");
      return {
        success: false,
        error: error.response?.data?.msg || "Failed to revoke access",
      };
    } finally {
      toast.dismiss(loadingToast);
    }
  };
}

export function getAllUsers() {
  return async (dispatch) => {
    try {
      const response = await apiConnector("GET", ALL_USERS_API);

      console.log("Get All Users API response:", response);

      if (response.status === 200) {
        return {
          success: true,
          data: response.data,
        };
      } else {
        throw new Error(response.data.msg);
      }
    } catch (error) {
      console.log("Get All Users API Error:", error);
      toast.error(error.response?.data?.msg || "Failed to fetch users.");
      return {
        success: false,
        error: error.response?.data?.msg || "Failed to fetch users",
      };
    }
  };
}

export function grantUserAccess(userId, newSheetIds, currentUserData) {
  return async (dispatch) => {
    const loadingToast = toast.loading("Granting access...");
    
    try {
      // Merge current access with new sheet IDs
      const updatedAccess = [...new Set([...currentUserData.allowedAccess, ...newSheetIds])];
      
      // Use uploadUserInformation to update the allowedAccess
      const response = await apiConnector("PATCH", UPDATE_USER_INFO_API, {
        name: currentUserData.name,
        userId: currentUserData.userId,
        allowedAccess: updatedAccess,
        roleIdentifier: currentUserData.roleIdentifier
      });
      
      console.log("Grant Access API response:", response);
      
      if (response.status >= 200  || response.status <=300 ) {
        toast.success("Access granted successfully!");
        return {
          success: true,
          data: response.data
        };
      } else {
        throw new Error(response.data.msg);
      }
    } catch (error) {
      console.log("Grant Access API Error:", error);
      toast.error(
        error.response?.data?.msg || "Failed to grant access."
      );
      return {
        success: false,
        error: error.response?.data?.msg || "Failed to grant access"
      };
    } finally {
      toast.dismiss(loadingToast);
    }
  };
}
