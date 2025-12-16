import Base from "antd/es/typography/Base";

//All the API endpoints will be declared here and then this will be used in entire frontend to access the endpoints...
const BaseURL = import.meta.env.VITE_API_BASE_URL || "https://backend.safpack.org/api"; //production fallback

export const authEndpoints = {
  LOGIN_API: BaseURL + "/auth/login",
  LOGOUT_API: BaseURL + "/auth/logout",

  ADMIN_LOGIN_API: BaseURL + "/auth/login",
  ADMIN_LOGOUT_API: BaseURL + "/auth/logout",
};

export const userEndpoints = {
  SELF_INFO_API: BaseURL + "/auth/me",
  INSERT_TODAY_API: BaseURL + "/rows",
  GET_SHEET_API: BaseURL + "/sheets",
  UPDATE_ROW_API: BaseURL + "/rows",
};

export const adminEndpoints = {
  FETCH_ALL_METAS_API: BaseURL + "/sheets",
  UPDATE_METAS_API: BaseURL + "/sheets",
};

export const userManagementAPIs = {
  USER_SIGNUP_API: BaseURL + "/users",
  UPLOAD_USER_INFO_API: BaseURL + "/users",
  UPDATE_USER_INFO_API: BaseURL + "/users",
  REVOKE_ACCESS_API: BaseURL + "/users",
  ALL_USERS_API: BaseURL + "/users",

  ADMIN_SIGNUP_API: BaseURL + "/users",
  ADMIN_INFO_UPLOAD_API: BaseURL + "/users"
};

export const sheetEndpoints = {
  REFERENCE_LINK_CHECK_API: BaseURL + "/sheets",
  CREATE_SHEET_API: BaseURL + "/sheets",
}

export const dashboardEndpoints = {
  GET_STOCKS_API: BaseURL + "/sheets",
  GET_SUPER_DASHBOARD_API: BaseURL + "/sheets",
}
