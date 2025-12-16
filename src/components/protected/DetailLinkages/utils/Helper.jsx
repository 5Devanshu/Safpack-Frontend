// New utility functions for handling sheet data operations

export const checkTodaysData = (sheetData) => {
  if (!sheetData || sheetData.length === 0) return false;

  const today = getTodaysDate();
  const todayISO = new Date().toISOString().split("T")[0];

  const dateRow = sheetData[0]; // First row should contain dates
  if (!dateRow || !dateRow.attributes) return false;

  const hasToday = dateRow.attributes.some(date => {
    if (!date) return false;
    
    // Handle both string dates and date objects
    const dateStr = typeof date === 'string' ? date : String(date);
    
    // Check multiple date formats
    return (
      dateStr.includes(today) || 
      dateStr.includes(todayISO) ||
      dateStr === today ||
      dateStr === todayISO
    );
  });

  return hasToday;
};

export const convertDateFormat = (dateString, isInputToDisplay = true) => {
  try {
    if (isInputToDisplay) {
      // Convert from "2025-06-01" to "1 Jun 2025"
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString; // Return original if invalid
      
      return date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } else {
      // Convert from "1 Jun 2025" to "2025-06-01"
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString; // Return original if invalid
      
      return date.toISOString().split("T")[0];
    }
  } catch (error) {
    console.error("Error converting date format:", error);
    return dateString; // Return original string on error
  }
};

export const getTodaysDate = () => {
  const today = new Date();
  return today.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

/**
 * Get today's date in ISO format
 * @returns {string} - Today's date in "YYYY-MM-DD" format
 */
export const getTodaysDateISO = () => {
  return new Date().toISOString().split("T")[0];
};


export const getTodaysColumnIndex = (sheetData) => {
  if (!sheetData || sheetData.length === 0) return -1;

  const today = getTodaysDate();
  const todayISO = getTodaysDateISO();
  const dateRow = sheetData[0];
  
  if (!dateRow || !dateRow.attributes) return -1;

  return dateRow.attributes.findIndex(date => {
    if (!date) return false;
    
    const dateStr = typeof date === 'string' ? date : String(date);
    
    // Check multiple date formats
    return (
      dateStr.includes(today) ||
      dateStr.includes(todayISO) ||
      dateStr === today ||
      dateStr === todayISO
    );
  });
};


export const calculateColumnTotal = (sheetData, columnIndex, attributeIndex) => {
  if (!sheetData || sheetData.length === 0 || attributeIndex >= sheetData.length) {
    return 0;
  }

  const columnData = sheetData[attributeIndex];
  if (!columnData || !columnData.attributes) return 0;

  let total = 0;
  
  columnData.attributes.forEach(value => {
    if (value === null || value === undefined || value === '') return;
    
    if (typeof value === 'number' && !isNaN(value)) {
      total += value;
    } else if (typeof value === 'string') {
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        total += numValue;
      }
    }
  });

  return total;
};


export const calculateDerivedValue = (formula, sheetData, columnIndex) => {
  if (!formula || !sheetData || columnIndex < 0) return 0;

  let result = 0;

  try {
    // Add values from addition indices
    if (formula.additionIndices && Array.isArray(formula.additionIndices)) {
      formula.additionIndices.forEach(index => {
        if (index >= 0 && index < sheetData.length) {
          const row = sheetData[index];
          if (row && row.attributes && row.attributes[columnIndex] !== undefined) {
            const value = parseFloat(row.attributes[columnIndex]);
            if (!isNaN(value)) {
              result += value;
            }
          }
        }
      });
    }

    // Subtract values from subtraction indices
    if (formula.subtractionIndices && Array.isArray(formula.subtractionIndices)) {
      formula.subtractionIndices.forEach(index => {
        if (index >= 0 && index < sheetData.length) {
          const row = sheetData[index];
          if (row && row.attributes && row.attributes[columnIndex] !== undefined) {
            const value = parseFloat(row.attributes[columnIndex]);
            if (!isNaN(value)) {
              result -= value;
            }
          }
        }
      });
    }
  } catch (error) {
    console.error("Error calculating derived value:", error);
    return 0;
  }

  return result;
};


export const getColumnType = (attribute) => {
  if (!attribute) return "independent";
  
  if (attribute.derived) {
    return "derived";
  }
  
  // Handle both old and new API formats
  if (attribute.linkedFrom?.sheetObjectId || attribute["linked-from"]) {
    return "linked";
  }
  
  // Handle recurrent check
  if (attribute.recurrentCheck?.isRecurrent || attribute["recurrent-check"]?.["is-recurrent"]) {
    return "recurrent";
  }
  
  return "independent";
};


export const determineNodeType = (attr) => {
  return getColumnType(attr);
};


export const isValidDate = (dateStr) => {
  if (!dateStr) return false;
  
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
};


export const formatNumber = (value, options = {}) => {
  const {
    decimals = 2,
    showZero = true,
    prefix = '',
    suffix = ''
  } = options;

  if (value === null || value === undefined) {
    return showZero ? '0' : '-';
  }

  const numValue = typeof value === 'number' ? value : parseFloat(value);
  
  if (isNaN(numValue)) {
    return showZero ? '0' : '-';
  }

  return `${prefix}${numValue.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })}${suffix}`;
};


export const getAttributeValue = (sheetData, attributeIndex, columnIndex) => {
  if (!sheetData || 
      attributeIndex < 0 || 
      attributeIndex >= sheetData.length ||
      columnIndex < 0) {
    return null;
  }

  const row = sheetData[attributeIndex];
  if (!row || !row.attributes || columnIndex >= row.attributes.length) {
    return null;
  }

  return row.attributes[columnIndex];
};



export const setAttributeValue = (sheetData, attributeIndex, columnIndex, value) => {
  if (!sheetData || 
      attributeIndex < 0 || 
      attributeIndex >= sheetData.length ||
      columnIndex < 0) {
    return sheetData;
  }

  const newSheetData = [...sheetData];
  const row = { ...newSheetData[attributeIndex] };
  
  if (!row.attributes) {
    row.attributes = [];
  } else {
    row.attributes = [...row.attributes];
  }

  // Extend array if necessary
  while (row.attributes.length <= columnIndex) {
    row.attributes.push(null);
  }

  row.attributes[columnIndex] = value;
  newSheetData[attributeIndex] = row;

  return newSheetData;
};

export const validateFormula = (formula, maxIndex) => {
  if (!formula) return false;

  const { additionIndices = [], subtractionIndices = [] } = formula;

  // Check if all indices are valid
  const allIndices = [...additionIndices, ...subtractionIndices];
  
  return allIndices.every(index => 
    typeof index === 'number' && 
    index >= 0 && 
    index < maxIndex
  );
};

// export const generateSampleValue = (attr, index) => {
//   if (!attr) return 0;

//   // Sample values for common attribute names
//   const sampleValues = {
//     date: getTodaysDate(),
//     purchase: 4000,
//     "opening-stock": 60,
//     "opening_stock": 60,
//     inward: 40,
//     outward: 30,
//     "closing-stock": 70,
//     "closing_stock": 70,
//     "raw-material-used": 25,
//     "raw_material_used": 25,
//     production: 45,
//     damaged: 5,
//     "available-stock": 40,
//     "available_stock": 40,
//     income: 5000,
//     expenses: 3000,
//     "net-savings": 2000,
//     "net_savings": 2000,
//   };

//   // Return specific sample value if available
//   const normalizedName = attr.name.toLowerCase().replace(/[-_]/g, "-");
//   if (sampleValues[normalizedName]) {
//     return sampleValues[normalizedName];
//   }

//   // Generate values based on attribute characteristics
//   if (attr.name.toLowerCase().includes("date")) {
//     return getTodaysDate();
//   }
  
//   if (attr.name.toLowerCase().includes("stock") || 
//       attr.name.toLowerCase().includes("inventory")) {
//     return Math.floor(Math.random() * 100) + 50;
//   }
  
//   if (attr.name.toLowerCase().includes("amount") || 
//       attr.name.toLowerCase().includes("value") || 
//       attr.name.toLowerCase().includes("purchase") ||
//       attr.name.toLowerCase().includes("income")) {
//     return Math.floor(Math.random() * 5000) + 1000;
//   }
  
//   if (attr.derived) {
//     return Math.floor(Math.random() * 200) + 10;
//   }

//   return Math.floor(Math.random() * 100);
// };