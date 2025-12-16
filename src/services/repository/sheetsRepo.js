import { toast } from "react-hot-toast";
import { apiConnector } from "../Connector";
import { userEndpoints, adminEndpoints, sheetEndpoints } from "../Apis";
const { INSERT_TODAY_API, SELF_INFO_API, GET_SHEET_API, UPDATE_ROW_API } =
  userEndpoints;
const { FETCH_ALL_METAS_API, UPDATE_METAS_API } = adminEndpoints;
const { REFERENCE_LINK_CHECK_API, CREATE_SHEET_API } = sheetEndpoints;

export async function fetchMetadata(login_role) {
  if (login_role === "user") {
    // Handle user login flow
    try {
      const userInfoResponse = await apiConnector("GET", SELF_INFO_API);
      return userInfoResponse.data.allowedAccess;

      //   dispatch(setMetadata({ metadata: userInfoResponse.data.allowedAccess }));
    } catch (error) {
      console.error("Error fetching metas: ", error);
      toast.error("Failed to fetch metas.");
      return;
    }
  } else {
    try {
      // Fetch all metadata for admin
      const metadataResponse = await apiConnector("GET", FETCH_ALL_METAS_API);
      // console.log("Metadata API response: ", metadataResponse);
      return metadataResponse.data;
      //   dispatch(setMetadata({ metadata: metadataResponse.data }));
    } catch (error) {
      console.error("Error fetching admin metadata: ", error);
      toast.error("Failed to fetch metadata.");
      return;
    }
  }
}
export async function getSheetsData(login_role, sheetId, year, month) {
  // console.log("sheetId..", sheetId);
  const loadingToast = toast.loading("Fetching Sheets Data...");

  try {
    let url = `${GET_SHEET_API}/${sheetId}/values`;
    // Add query parameters if provided
    const params = new URLSearchParams();
    if (year) params.append("year", year);
    if (month) params.append("month", month);

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await apiConnector("GET", url);
    // console.log("Sheets Data API response: ", response);

    if (response.status === 200) {
      toast.success("Sheets data fetched successfully!");
      return response.data?.data;
    } else {
      toast.error("Failed to fetch sheets data.");
      return [];
    }
  } catch (error) {
    console.error("Error fetching sheets data: ", error);
    toast.error("An error occurred while fetching sheets data.");
    return [];
  } finally {
    toast.dismiss(loadingToast);
  }
}

export async function insertTodaysData(sheetId, data, date, subrows) {
  const messages = [
    "Inserting Today's Data... Please don't close the browser!",
    "Processing your data... Keep this window open!",
    "Almost there... Do not refresh or close the tab!",
  ];

  let messageIndex = 0;
  const loadingToast = toast.loading(messages[messageIndex]);

  // Rotate messages every 3 seconds
  const messageInterval = setInterval(() => {
    messageIndex = (messageIndex + 1) % messages.length;
    toast.loading(messages[messageIndex], { id: loadingToast });
  }, 3000);

  try {
    const response = await apiConnector(
      "POST",
      `${INSERT_TODAY_API}/${sheetId}`,
      { attributes: data, date, subrows }
    );
    console.log("Insert Today's Data API response: ", response);

    if (response.status === 201) {
      toast.success("Today's data inserted successfully!");
      return response.data; // Return the inserted data
    } else {
      toast.error("Failed to insert today's data.");
    }
  } catch (error) {
    console.error("Error inserting today's data: ", error);
    toast.error("An error occurred while inserting today's data.");
  } finally {
    clearInterval(messageInterval);
    toast.dismiss(loadingToast);
  }
}

export async function updateMetas(sheetId, data, action) {
  // Define action-specific configurations
  const actionConfig = {
    newColumn: {
      loadingMessage: "Adding new column...",
      successMessage: "Column added successfully!",
      errorMessage: "Failed to add column.",
    },
    nameChange: {
      loadingMessage: "Updating sheet name...",
      successMessage: "Sheet name updated successfully!",
      errorMessage: "Failed to update sheet name.",
    },
    formulaUpdate: {
      loadingMessage: "Updating formula...",
      successMessage: "Formula updated successfully!",
      errorMessage: "Failed to update formula.",
    },
    insertData: {
      loadingMessage: "Inserting today's data...",
      successMessage: "Today's data inserted successfully!",
      errorMessage: "Failed to insert today's data.",
    },
    default: {
      loadingMessage: "Updating metadata...",
      successMessage: "Metadata updated successfully!",
      errorMessage: "Failed to update metadata.",
    },
  };

  const config = actionConfig[action] || actionConfig.default;
  const loadingToast = toast.loading(config.loadingMessage);

  try {
    const response = await apiConnector(
      "POST",
      `${UPDATE_METAS_API}/${sheetId}`,
      { ...data }
    );
    console.log("Update Metas API response: ", response);

    if (response.status === 200) {
      toast.success(config.successMessage);
      return response;
    } else {
      toast.error(config.errorMessage);
    }
  } catch (error) {
    console.error(`Error ${action}: `, error);
    toast.error(
      `An error occurred while ${action
        .replace(/([A-Z])/g, " $1")
        .toLowerCase()}.`
    );
  } finally {
    toast.dismiss(loadingToast);
  }
}

export async function updateRowData(sheetId, data) {
  console.log("heyyyy...updaterowdata function repo...", data);
  
  const messages = [
    "Updating row data... Please don't close the browser!",
    "Processing your updates... Keep this window open!",
    "Almost done... Do not refresh or close the tab!"
  ];
  
  let messageIndex = 0;
  const loadingToast = toast.loading(messages[messageIndex]);
  
  const messageInterval = setInterval(() => {
    messageIndex = (messageIndex + 1) % messages.length;
    toast.loading(messages[messageIndex], { id: loadingToast });
  }, 3000);

  try {
    const response = await apiConnector(
      "POST",
      `${UPDATE_ROW_API}/${sheetId}`,
      { ...data }
    );
    console.log("Update Row Data API response: ", response);

    if (response.status === 200) {
      toast.success("Row data updated successfully!");
      return response.data;
    } else {
      toast.error("Failed to update row data.");
    }
  } catch (error) {
    console.error("Error updating row data: ", error);
    toast.error("An error occurred while updating row data.");
  } finally {
    clearInterval(messageInterval);
    toast.dismiss(loadingToast);
  }
}

export async function checkAvailableLinks(sheetId) {
  // No loading toast since this is typically called during UI interactions
  try {
    const response = await apiConnector(
      "GET",
      `${REFERENCE_LINK_CHECK_API}/${sheetId}`
    );
    console.log("Reference Link Check API response: ", response);

    if (response.status === 200) {
      return {
        success: true,
        data: response.data, // This will contain { "unavailable": ["684756a3e8871e043f90832c"] }
        unavailableSheets: response.data.unavailable || [],
      };
    } else {
      throw new Error(response.data.msg || "Failed to check available links");
    }
  } catch (error) {
    console.error("Error checking available links: ", error);
    // Only show error toast for actual errors, not for expected API responses
    if (error.response?.status !== 200) {
      toast.error(
        error.response?.data?.msg ||
          "Failed to check available reference links."
      );
    }
    return {
      success: false,
      error: error.response?.data?.msg || "Failed to check available links",
      unavailableSheets: [],
    };
  }
}

export async function createNewSheet(sheetData) {
  const loadingToast = toast.loading("Creating new sheet...");

  try {
    console.log(CREATE_SHEET_API, "api endpoint used...");
    const response = await apiConnector("POST", CREATE_SHEET_API, {
      ...sheetData,
    });

    console.log("Create Sheet API response:", response);

    if (response.status === 201 || response.status === 200) {
      toast.success("Sheet created successfully!");
      return {
        success: true,
        data: response.data,
      };
    } else {
      throw new Error(response.data.msg || "Failed to create sheet");
    }
  } catch (error) {
    console.error("Error creating sheet:", error);
    toast.error(
      error.response?.data?.msg || "Failed to create sheet. Please try again."
    );
    return {
      success: false,
      error: error.response?.data?.msg || "Failed to create sheet",
    };
  } finally {
    toast.dismiss(loadingToast);
  }
}
