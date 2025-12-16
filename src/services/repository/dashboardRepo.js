import { toast } from "react-hot-toast";
import { apiConnector } from "../Connector";
import { dashboardEndpoints } from "../Apis";
const { GET_STOCKS_API, GET_SUPER_DASHBOARD_API } = dashboardEndpoints;

export async function fetchStocks(date = null) {
  try {
    let url = GET_STOCKS_API;
    if (date) {
      url += `?date=${date}`;
    }
    
    const stockResponse = await apiConnector("GET", url);
    
    if (stockResponse.status === 200) {
      return stockResponse.data;
    } else {
      throw new Error("Failed to fetch stock data");
    }
    
  } catch (error) {
    console.error("Error fetching stock data:", error);
    const errorMessage = error.response?.data?.message || error.message || "Failed to fetch stock data";
    toast.error(errorMessage);
    throw error; // Re-throw to allow caller to handle
  }
}

export async function fetchSuperTableData(startDate = null, endDate = null) {
  try {
    let url = GET_SUPER_DASHBOARD_API + `?startDate=${startDate}&endDate=${endDate}`;
    
    const stockResponse = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Add any auth headers you need here
      }
    });
    
    if (stockResponse.ok) {
      return stockResponse; // Return the raw response, not .data
    } else {
      throw new Error("Failed to fetch stock data");
    }
    
  } catch (error) {
    console.error("Error fetching stock data:", error);
    const errorMessage = error.response?.data?.message || error.message || "Failed to fetch stock data";
    toast.error(errorMessage);
    throw error;
  }
}