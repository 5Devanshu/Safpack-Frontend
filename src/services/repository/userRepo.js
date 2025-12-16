//These repository files will be responsible for the flow of loaders and then sending the data to the connector along with the specific endpoint.
//i.e frontend pages will call the functions from thsese repo and then pass data to this and this function will decide the further actions/
//i.e enabling the loader, which endpoint should be called, after receiving the response what to do, toasting the required messages and at last defusing loaders.
import { toast } from "react-hot-toast";
import { apiConnector } from "../Connector";
import {
  LogOut,
  setAccount,
  setAccountAfterRegister,
  setDFeature,
} from "../../app/DashboardSlice";
import { authEndpoints, userEndpoints, adminEndpoints } from "../Apis";
import { setMetadata } from "../../app/MetadataSlice";
const { LOGIN_API, ADMIN_LOGIN_API, LOGOUT_API, ADMIN_LOGOUT_API } = authEndpoints;
const { SELF_INFO_API } = userEndpoints;
const { FETCH_ALL_METAS_API } = adminEndpoints;

export function login(email, password, navigate) {
  return async (dispatch) => {
    const loadingToast = toast.loading("Letting you in...");

    try {
      // Use the auth login API endpoint
      const response = await apiConnector("POST", LOGIN_API, { email, password });

      console.log("Login API response : ", response);
      if (response.status === 200) {
        toast.success(response.data.msg || "Login Successful!");

        // Get user info from login response
        const userData = response.data.user;

        // Set account info based on user data
        const accountInfo = {
          id: userData.id,
          uname: userData.name,
          uemail: userData.email,
          role: userData.role,
          is_active: userData.is_active
        };

        dispatch(setAccount(accountInfo));

        // Fetch sheets list (metadata) - backend handles permissions
        try {
          const sheetsResponse = await apiConnector("GET", "/sheets");
          dispatch(setMetadata({ metadata: sheetsResponse.data }));
        } catch (error) {
          console.error("Error fetching sheets: ", error);
          toast.error("Failed to fetch sheets data.");
          return;
        }

        // Navigate to sheets
        dispatch(setDFeature({ dashboardFeature: "Home" }));
        navigate("/sheets");
      } else {
        throw new Error(response.data.msg);
      }
    } catch (error) {
      console.log("Login API Error....", error);
      console.log("Login API Error....", error.response?.data?.message);

      toast.error(
        error.response?.data?.msg || "Login failed. Please try again."
      );
    }

    toast.dismiss(loadingToast);
  };
}

export function logoutFunction(navigate) {
  return async (dispatch) => {
    const loadingToast = toast.loading("Logging you out...");

    try {
      // Use the user logout API endpoint (assuming backend handles role-based logout)
      const response = await apiConnector("POST", LOGOUT_API, {});

      console.log("Logout API response : ", response);

      if (response.status === 200) {
        toast.success(response.data.msg || "Logout Successful!");

        // Clear user/admin data from Redux store
        dispatch(LogOut());

        // Navigate to login page
        navigate("/");
      } else {
        throw new Error(response.data.msg);
      }
    } catch (error) {
      console.log("Logout API Error....", error);
      console.log("Logout API Error....", error.response?.data?.message);

      // Force logout even if API fails (optional)
      navigate("/");

      dispatch(LogOut())
      toast.error(
        error.response?.data?.msg || "Logout failed. Logged out locally."
      );
    }

    toast.dismiss(loadingToast);
  };
}

export function register(name, email, password, mobile, navigate) {
  return async (dispatch) => {
    const loadingToast = toast.loading("Registering you...");
    try {
      const response = await apiConnector("POST", REGISTER, {
        name,
        email_id,
        mobile,
        password,
      });
      console.log("Register API response : ", response.data.data);
      if (response.data.success) {
        toast.success("Registration Successful..");
        const temp = {
          id: response.data.data.u_id,
          uname: response.data.data.name,
          uemail: response.data.data.email,
        };
        console.log(temp);
        dispatch(setAccountAfterRegister(temp));
        navigate("/verify-email");
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      console.log("Register API Error....", error);
      toast.error(error.response?.data?.message);
    }
    toast.dismiss(loadingToast);
  };
}
