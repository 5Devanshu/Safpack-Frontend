import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export const SubRows = ({ 
  isOpen, 
  onClose, 
  onSave, 
  columnName, 
  initialSubrows = [],
  currentTotal = 0 
}) => {
  const [subrows, setSubrows] = useState([]);
  const [errors, setErrors] = useState({});

  // Initialize subrows when modal opens
  useEffect(() => {
  if (isOpen) {
    console.log("SubrowsModal opened with initialSubrows:", initialSubrows);
    
    if (initialSubrows && initialSubrows.length > 0) {
      // Convert API format [srNo, department, note, value] to form format
      const formattedSubrows = initialSubrows.map(row => ({
        srNo: row[0].toString(),
        department: row[1],
        note: row[2],
        value: row[3].toString()
      }));
      
      console.log("Converted subrows to form format:", formattedSubrows);
      setSubrows(formattedSubrows);
    } else {
      // Start with one empty row
      setSubrows([{ srNo: '', department: '', note: '', value: '' }]);
    }
    setErrors({});
  }
}, [isOpen, initialSubrows]);

  const calculateTotal = () => {
    return subrows.reduce((total, row) => {
      const value = parseFloat(row.value) || 0;
      return total + value;
    }, 0);
  };

  // Add new row
  const addRow = () => {
    setSubrows([...subrows, { srNo: '', department: '', note: '', value: '' }]);
  };

  // Remove row
  const removeRow = (index) => {
    if (subrows.length > 1) {
      const newSubrows = subrows.filter((_, i) => i !== index);
      setSubrows(newSubrows);
    } else {
      toast.error("At least one row is required");
    }
  };

  // Update row field
  const updateRow = (index, field, value) => {
    const newSubrows = [...subrows];
    
    // Validation based on field type
    if (field === 'srNo') {
      // Only allow positive integers
      const numberRegex = /^\d*$/;
      if (value === "" || numberRegex.test(value)) {
        newSubrows[index][field] = value;
      }
    } else if (field === 'department' || field === 'note') {
      // Only allow letters, spaces, and common punctuation for text fields
      const stringRegex = /^[a-zA-Z\s\-\.,']*$/;
      if (value === "" || stringRegex.test(value)) {
        newSubrows[index][field] = value;
      }
    } else if (field === 'value') {
      // Allow decimal numbers
      const numberRegex = /^\d*\.?\d*$/;
      if (value === "" || numberRegex.test(value)) {
        newSubrows[index][field] = value;
      }
    }
    
    setSubrows(newSubrows);
    
    // Clear errors for this field
    if (errors[`${index}-${field}`]) {
      const newErrors = { ...errors };
      delete newErrors[`${index}-${field}`];
      setErrors(newErrors);
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    let hasValidRow = false;

    subrows.forEach((row, index) => {
      const hasAnyValue = row.srNo || row.department || row.note || row.value;
      
      if (hasAnyValue) {
        hasValidRow = true;
        
        // Validate required fields if any field is filled
        if (!row.srNo.trim()) {
          newErrors[`${index}-srNo`] = "Sr.No is required";
        }
        if (!row.department.trim()) {
          newErrors[`${index}-department`] = "Department is required";
        }
        if (!row.value || parseFloat(row.value) <= 0) {
          newErrors[`${index}-value`] = "Value must be greater than 0";
        }
      }
    });

    if (!hasValidRow) {
      toast.error("At least one complete row is required");
      return false;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle save
  const handleSave = () => {
    if (!validateForm()) {
      return;
    }

    // Filter out empty rows and prepare data
    const validSubrows = subrows.filter(row => {
      return row.srNo && row.department && row.value && parseFloat(row.value) > 0;
    }).map(row => [
      parseInt(row.srNo),
      row.department.trim(),
      row.note.trim(),
      parseFloat(row.value)
    ]);

    if (validSubrows.length === 0) {
      toast.error("No valid rows to save");
      return;
    }

    const total = validSubrows.reduce((sum, row) => sum + row[3], 0);
    
    onSave({
      subrows: validSubrows,
      total: total
    });
  };

  // Handle close
  const handleClose = () => {
    setSubrows([]);
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/65 flex items-center justify-center z-[70]">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            {columnName} - Entry Details
          </h2>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Current Total:</span>
            <span className="text-lg font-semibold text-blue-600">
              {calculateTotal().toFixed(2)}
            </span>
          </div>
          {currentTotal > 0 && (
            <div className="text-xs text-gray-500 mt-1">
              Previous total: {currentTotal}
            </div>
          )}
        </div>

        {/* Table Header */}
        <div className="grid grid-cols-12 gap-2 mb-2 font-medium text-gray-700 text-sm">
          <div className="col-span-2">Sr.No *</div>
          <div className="col-span-3">Department *</div>
          <div className="col-span-4">Note</div>
          <div className="col-span-2">Value *</div>
          <div className="col-span-1">Action</div>
        </div>

        {/* Subrows */}
        <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
          {subrows.map((row, index) => {
            console.log(`Rendering row ${index}:`, row); // Add this debug line
            
            return (
                <div key={`subrow-${index}`} className="grid grid-cols-12 gap-2 items-start">
                <div className="col-span-2">
                    <input
                    type="text"
                    value={row.srNo || ''} // Add fallback
                    onChange={(e) => {
                        console.log(`Updating srNo for row ${index}:`, e.target.value);
                        updateRow(index, 'srNo', e.target.value);
                    }}
                    placeholder="301"
                    className={`w-full px-2 py-2 border rounded text-sm ${
                        errors[`${index}-srNo`] ? 'border-red-300' : 'border-gray-300'
                    } focus:outline-none focus:ring-1 focus:ring-blue-300`}
                    />
                    {errors[`${index}-srNo`] && (
                    <div className="text-xs text-red-500 mt-1">{errors[`${index}-srNo`]}</div>
                    )}
                </div>
                
                <div className="col-span-3">
                    <input
                    type="text"
                    value={row.department || ''} // Add fallback
                    onChange={(e) => {
                        console.log(`Updating department for row ${index}:`, e.target.value);
                        updateRow(index, 'department', e.target.value);
                    }}
                    placeholder="Department name"
                    className={`w-full px-2 py-2 border rounded text-sm ${
                        errors[`${index}-department`] ? 'border-red-300' : 'border-gray-300'
                    } focus:outline-none focus:ring-1 focus:ring-blue-300`}
                    />
                    {errors[`${index}-department`] && (
                    <div className="text-xs text-red-500 mt-1">{errors[`${index}-department`]}</div>
                    )}
                </div>
                
                <div className="col-span-4">
                    <input
                    type="text"
                    value={row.note || ''} // Add fallback
                    onChange={(e) => {
                        console.log(`Updating note for row ${index}:`, e.target.value);
                        updateRow(index, 'note', e.target.value);
                    }}
                    placeholder="Additional notes (optional)"
                    className="w-full px-2 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-300"
                    />
                </div>
                
                <div className="col-span-2">
                    <input
                    type="text"
                    value={row.value || ''} // Add fallback
                    onChange={(e) => {
                        console.log(`Updating value for row ${index}:`, e.target.value);
                        updateRow(index, 'value', e.target.value);
                    }}
                    placeholder="0.00"
                    className={`w-full px-2 py-2 border rounded text-sm ${
                        errors[`${index}-value`] ? 'border-red-300' : 'border-gray-300'
                    } focus:outline-none focus:ring-1 focus:ring-blue-300`}
                    />
                    {errors[`${index}-value`] && (
                    <div className="text-xs text-red-500 mt-1">{errors[`${index}-value`]}</div>
                    )}
                </div>
                
                <div className="col-span-1">
                    <button
                    onClick={() => removeRow(index)}
                    disabled={subrows.length === 1}
                    className="p-2 text-red-500 hover:bg-red-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Remove row"
                    >
                    <Trash2 size={16} />
                    </button>
                </div>
                </div>
            );
            })}
        </div>

        {/* Add Row Button */}
        <button
          onClick={addRow}
          className="flex items-center gap-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-md text-sm font-medium mb-4"
        >
          <Plus size={16} />
          Add Row
        </button>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            onClick={handleClose}
            className="px-4 py-2 border border-gray-300 text-gray-600 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
           Save {/*  ({calculateTotal().toFixed(2)}) */}
          </button>
        </div>
      </div>
    </div>
  );
};

export const SubRowsClosing = ({ 
  isOpen, 
  onClose, 
  onSave, 
  columnName, 
  initialSubrows = [],
  currentTotal = 0 
}) => {
  const [subrows, setSubrows] = useState([]);
  const [errors, setErrors] = useState({});

  // Initialize subrows when modal opens
  useEffect(() => {
    if (isOpen) {
      console.log("SubrowsClosingModal opened with initialSubrows:", initialSubrows);
      
      if (initialSubrows && initialSubrows.length > 0) {
        // Convert API format [description, note, value] to form format
        const formattedSubrows = initialSubrows.map(row => ({
          description: row[0],
          note: row[1],
          value: row[2].toString()
        }));
        
        console.log("Converted closing stock subrows to form format:", formattedSubrows);
        setSubrows(formattedSubrows);
      } else {
        // Start with one empty row
        setSubrows([{ description: '', note: '', value: '' }]);
      }
      setErrors({});
    }
  }, [isOpen, initialSubrows]);

  const calculateTotal = () => {
    return subrows.reduce((total, row) => {
      const value = parseFloat(row.value) || 0;
      return total + value;
    }, 0);
  };

  // Add new row
  const addRow = () => {
    setSubrows([...subrows, { description: '', note: '', value: '' }]);
  };

  // Remove row
  const removeRow = (index) => {
    if (subrows.length > 1) {
      const newSubrows = subrows.filter((_, i) => i !== index);
      setSubrows(newSubrows);
    } else {
      toast.error("At least one row is required");
    }
  };

  // Update row field
  const updateRow = (index, field, value) => {
    const newSubrows = [...subrows];
    
    // Validation based on field type
    if (field === 'description' || field === 'note') {
      // Only allow letters, spaces, and common punctuation for text fields
      const stringRegex = /^[a-zA-Z0-9\s\-\.,']*$/;
      if (value === "" || stringRegex.test(value)) {
        newSubrows[index][field] = value;
      }
    } else if (field === 'value') {
      // Allow decimal numbers
      const numberRegex = /^\d*\.?\d*$/;
      if (value === "" || numberRegex.test(value)) {
        newSubrows[index][field] = value;
      }
    }
    
    setSubrows(newSubrows);
    
    // Clear errors for this field
    if (errors[`${index}-${field}`]) {
      const newErrors = { ...errors };
      delete newErrors[`${index}-${field}`];
      setErrors(newErrors);
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    let hasValidRow = false;

    subrows.forEach((row, index) => {
      const hasAnyValue = row.description || row.note || row.value;
      
      if (hasAnyValue) {
        hasValidRow = true;
        
        // Validate required fields if any field is filled
        if (!row.description.trim()) {
          newErrors[`${index}-description`] = "Description is required";
        }
        if (!row.value || parseFloat(row.value) <= 0) {
          newErrors[`${index}-value`] = "Value must be greater than 0";
        }
      }
    });

    if (!hasValidRow) {
      toast.error("At least one complete row is required");
      return false;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle save
  const handleSave = () => {
    if (!validateForm()) {
      return;
    }

    // Filter out empty rows and prepare data
    const validSubrows = subrows.filter(row => {
      return row.description && row.value && parseFloat(row.value) > 0;
    }).map(row => [
      row.description.trim(),
      row.note.trim(),
      parseFloat(row.value)
    ]);

    if (validSubrows.length === 0) {
      toast.error("No valid rows to save");
      return;
    }

    const total = validSubrows.reduce((sum, row) => sum + row[2], 0);
    
    onSave({
      subrows: validSubrows,
      total: total
    });
  };

  // Handle close
  const handleClose = () => {
    setSubrows([]);
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/65 flex items-center justify-center z-[70]">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            {columnName} - Product Details
          </h2>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mb-4 p-3 bg-orange-50 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Current Total:</span>
            <span className="text-lg font-semibold text-orange-600">
              {calculateTotal().toFixed(2)}
            </span>
          </div>
          {currentTotal > 0 && (
            <div className="text-xs text-gray-500 mt-1">
              Previous total: {currentTotal}
            </div>
          )}
        </div>

        {/* Table Header */}
        <div className="grid grid-cols-12 gap-2 mb-2 font-medium text-gray-700 text-sm">
          <div className="col-span-4">Description *</div>
          <div className="col-span-5">Note</div>
          <div className="col-span-2">Value *</div>
          <div className="col-span-1">Action</div>
        </div>

        {/* Subrows */}
        <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
          {subrows.map((row, index) => {
            // console.log(`Rendering closing stock row ${index}:`, row);
            
            return (
              <div key={`closing-subrow-${index}`} className="grid grid-cols-12 gap-2 items-start">
                <div className="col-span-4">
                  <input
                    type="text"
                    value={row.description || ''}
                    onChange={(e) => {
                    //   console.log(`Updating description for row ${index}:`, e.target.value);
                      updateRow(index, 'description', e.target.value);
                    }}
                    placeholder="Product description"
                    className={`w-full px-2 py-2 border rounded text-sm ${
                      errors[`${index}-description`] ? 'border-red-300' : 'border-gray-300'
                    } focus:outline-none focus:ring-1 focus:ring-orange-300`}
                  />
                  {errors[`${index}-description`] && (
                    <div className="text-xs text-red-500 mt-1">{errors[`${index}-description`]}</div>
                  )}
                </div>
                
                <div className="col-span-5">
                  <input
                    type="text"
                    value={row.note || ''}
                    onChange={(e) => {
                    //   console.log(`Updating note for row ${index}:`, e.target.value);
                      updateRow(index, 'note', e.target.value);
                    }}
                    placeholder="Additional notes (optional)"
                    className="w-full px-2 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-orange-300"
                  />
                </div>
                
                <div className="col-span-2">
                  <input
                    type="text"
                    value={row.value || ''}
                    onChange={(e) => {
                    //   console.log(`Updating value for row ${index}:`, e.target.value);
                      updateRow(index, 'value', e.target.value);
                    }}
                    placeholder="0.00"
                    className={`w-full px-2 py-2 border rounded text-sm ${
                      errors[`${index}-value`] ? 'border-red-300' : 'border-gray-300'
                    } focus:outline-none focus:ring-1 focus:ring-orange-300`}
                  />
                  {errors[`${index}-value`] && (
                    <div className="text-xs text-red-500 mt-1">{errors[`${index}-value`]}</div>
                  )}
                </div>
                
                <div className="col-span-1">
                  <button
                    onClick={() => removeRow(index)}
                    disabled={subrows.length === 1}
                    className="p-2 text-red-500 hover:bg-red-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Remove row"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Row Button */}
        <button
          onClick={addRow}
          className="flex items-center gap-2 px-3 py-2 text-orange-600 hover:bg-orange-50 rounded-md text-sm font-medium mb-4"
        >
          <Plus size={16} />
          Add Row
        </button>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            onClick={handleClose}
            className="px-4 py-2 border border-gray-300 text-gray-600 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export const DynamicSubRows = ({ 
  isOpen, 
  onClose, 
  onSave, 
  columnConfig, // The entire column metadata with subrowsConfig
  initialSubrows = [],
  currentTotal = 0 
}) => {
  const [subrows, setSubrows] = useState([]);
  const [errors, setErrors] = useState({});

  // Get subrow columns configuration
  const subrowColumns = columnConfig?.subrowsConfig?.subrowColumns || [];
  const aggregationType = columnConfig?.subrowsConfig?.aggregationType || 'sum';
  const aggregateField = columnConfig?.subrowsConfig?.aggregateField || 'value';

  // Initialize subrows when modal opens
  useEffect(() => {
    if (isOpen && subrowColumns.length > 0) {
      if (initialSubrows && initialSubrows.length > 0) {
        // Convert to form format - this should include ALL existing subrows
        const formattedSubrows = initialSubrows.map(row => {
          const formattedRow = {};
          subrowColumns.forEach((col) => {
            formattedRow[col.name] = row[col.name] || '';
          });
          return formattedRow;
        });
        setSubrows(formattedSubrows);
      } else {
        // Start with one empty row only if no existing data
        const emptyRow = {};
        subrowColumns.forEach(col => {
          if (col.autoIncrement && col.type === 'number') {
            emptyRow[col.name] = '1';
          } else {
            emptyRow[col.name] = '';
          }
        });
        setSubrows([emptyRow]);
      }
    }
  }, [isOpen, initialSubrows, columnConfig]);

  // Calculate aggregate value based on aggregationType
  const calculateAggregate = () => {
    const values = subrows
      .map(row => parseFloat(row[aggregateField]) || 0)
      .filter(val => val > 0);
    
    if (values.length === 0) return 0;
    
    switch (aggregationType) {
      case 'sum':
        return values.reduce((total, val) => total + val, 0);
      case 'average':
        return values.reduce((total, val) => total + val, 0) / values.length;
      case 'max':
        return Math.max(...values);
      case 'min':
        return Math.min(...values);
      default:
        return values.reduce((total, val) => total + val, 0);
    }
  };

  // Get next auto-increment value for a field
  const getNextAutoIncrementValue = (fieldName) => {
    const existingValues = subrows
      .map(row => parseInt(row[fieldName]) || 0)
      .filter(val => val > 0);
    
    if (existingValues.length === 0) return 1;
    return Math.max(...existingValues) + 1;
  };

  // Add new row
  const addRow = () => {
    const newRow = {};
    
    subrowColumns.forEach(col => {
      if (col.autoIncrement && col.type === 'number') {
        newRow[col.name] = getNextAutoIncrementValue(col.name).toString();
      } else {
        newRow[col.name] = '';
      }
    });
    
    setSubrows([...subrows, newRow]);
  };

  // Remove row
  const removeRow = (index) => {
    if (subrows.length > 1) {
      const newSubrows = subrows.filter((_, i) => i !== index);
      setSubrows(newSubrows);
    } else {
      toast.error("At least one row is required");
    }
  };

  // Update row field with validation
  const updateRow = (index, fieldName, value) => {
    const column = subrowColumns.find(col => col.name === fieldName);
    if (!column) return;

    const newSubrows = [...subrows];
    
    // Validation based on field type
    if (column.type === 'number') {
      const numberRegex = /^-?\d*\.?\d*$/;
      if (value === "" || numberRegex.test(value)) {
        newSubrows[index][fieldName] = value;
      }
    } else if (column.type === 'string') {
      // Allow letters, spaces, and common punctuation for text fields
      const stringRegex = /^[a-zA-Z0-9\s\-\.,']*$/;
      if (value === "" || stringRegex.test(value)) {
        newSubrows[index][fieldName] = value;
      }
    } else {
      // Default case - allow any value
      newSubrows[index][fieldName] = value;
    }
    
    setSubrows(newSubrows);
    
    // Clear errors for this field
    const errorKey = `${index}-${fieldName}`;
    if (errors[errorKey]) {
      const newErrors = { ...errors };
      delete newErrors[errorKey];
      setErrors(newErrors);
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    let hasValidRow = false;

    subrows.forEach((row, index) => {
      const hasAnyValue = Object.values(row).some(val => val && val.toString().trim());
      
      if (hasAnyValue) {
        hasValidRow = true;
        
        // Validate required fields
        subrowColumns.forEach(col => {
          if (col.required && (!row[col.name] || !row[col.name].toString().trim())) {
            newErrors[`${index}-${col.name}`] = `${col.name.replace(/_/g, ' ')} is required`;
          }
          
          // Additional validation for number fields
          // if (col.type === 'number' && row[col.name] && col.isAggregateField) {
          //   const numValue = parseFloat(row[col.name]);
          //   if (isNaN(numValue) || numValue === 0) {
          //     newErrors[`${index}-${col.name}`] = `${col.name.replace(/_/g, ' ')} should not be 0`;
          //   }
          // }
        });
      }
    });

    if (!hasValidRow) {
      toast.error("At least one complete row is required");
      return false;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle save
  const handleSave = () => {
    if (!validateForm()) {
      return;
    }

    // Filter out empty rows and prepare data
    const validSubrows = subrows.filter(row => {
      return Object.values(row).some(val => val && val.toString().trim());
    }).map(row => {
      const processedRow = {};
      subrowColumns.forEach(col => {
        if (col.type === 'number') {
          processedRow[col.name] = parseFloat(row[col.name]) || 0;
        } else {
          processedRow[col.name] = row[col.name]?.toString().trim() || '';
        }
      });
      return processedRow;
    });

    if (validSubrows.length === 0) {
      toast.error("No valid rows to save");
      return;
    }

    const aggregatedTotal = calculateAggregate();
    
    onSave({
      subrows: validSubrows,
      total: aggregatedTotal
    });
  };

  // Handle close
  const handleClose = () => {
    setSubrows([]);
    setErrors({});
    onClose();
  };

  // Render field based on column configuration
  const renderField = (row, column, index) => {
    const fieldName = column.name;
    const errorKey = `${index}-${fieldName}`;
    const hasError = !!errors[errorKey];
    
    const baseClasses = `w-full px-2 py-2 border rounded text-sm ${
      hasError ? 'border-red-300' : 'border-gray-300'
    } focus:outline-none focus:ring-1 focus:ring-blue-300`;

    // Render dropdown for fields with options
    if (column.options && column.options.length > 0) {
      return (
        <div>
          <select
            value={row[fieldName] || ''}
            onChange={(e) => updateRow(index, fieldName, e.target.value)}
            className={baseClasses}
          >
            <option value="">Select {column.name.replace(/_/g, ' ')}</option>
            {column.options.map((option, optIndex) => (
              <option key={optIndex} value={option}>{option}</option>
            ))}
          </select>
          {hasError && (
            <div className="text-xs text-red-500 mt-1">{errors[errorKey]}</div>
          )}
        </div>
      );
    }

    // Render regular input
    const inputType = column.type === 'number' ? 'text' : 'text';
    const placeholder = column.type === 'number' ? '0' : `Enter ${column.name.replace(/_/g, ' ')}`;

    return (
      <div>
        <input
          type={inputType}
          value={row[fieldName] || ''}
          onChange={(e) => updateRow(index, fieldName, e.target.value)}
          placeholder={placeholder}
          disabled={column.autoIncrement}
          className={`${baseClasses} ${column.autoIncrement ? 'bg-gray-100' : ''}`}
        />
        {hasError && (
          <div className="text-xs text-red-500 mt-1">{errors[errorKey]}</div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/65 flex items-center justify-center z-[70]">
      <div className="bg-white rounded-lg p-6 w-full max-w-6xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            {columnConfig?.name?.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())} - Entry Details
          </h2>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">
              Current {aggregationType.charAt(0).toUpperCase() + aggregationType.slice(1)}:
            </span>
            <span className="text-lg font-semibold text-blue-600">
              {calculateAggregate().toFixed(2)}
            </span>
          </div>
          {currentTotal > 0 && (
            <div className="text-xs text-gray-500 mt-1">
              Previous total: {currentTotal}
            </div>
          )}
        </div>

        {/* Dynamic Table Header */}
        <div className={`grid gap-2 mb-2 font-medium text-gray-700 text-sm`} 
             style={{ gridTemplateColumns: `repeat(${subrowColumns.length}, 1fr) 60px` }}>
          {subrowColumns.map((column) => (
            <div key={column.name}>
              {column.name.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
              {column.required && <span className="text-red-500 ml-1">*</span>}
              {column.isAggregateField && <span className="text-blue-500 ml-1">(Σ)</span>}
            </div>
          ))}
          <div>Action</div>
        </div>

        {/* Dynamic Subrows */}
        <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
          {subrows.map((row, index) => (
            <div key={`subrow-${index}`} 
                 className={`grid gap-2 items-start`}
                 style={{ gridTemplateColumns: `repeat(${subrowColumns.length}, 1fr) 60px` }}>
              
              {subrowColumns.map((column) => (
                <div key={column.name}>
                  {renderField(row, column, index)}
                </div>
              ))}
              
              <div>
                <button
                  onClick={() => removeRow(index)}
                  disabled={subrows.length === 1}
                  className="p-2 text-red-500 hover:bg-red-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Remove row"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add Row Button */}
        <button
          onClick={addRow}
          className="flex items-center gap-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-md text-sm font-medium mb-4"
        >
          <Plus size={16} />
          Add Row
        </button>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            onClick={handleClose}
            className="px-4 py-2 border border-gray-300 text-gray-600 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Save ({calculateAggregate().toFixed(2)})
          </button>
        </div>
      </div>
    </div>
  );
};