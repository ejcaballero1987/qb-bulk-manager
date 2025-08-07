import { useState, useEffect } from 'react';
import { DataSource } from '../lib/dataLoader';
import { DataValidator, FieldMapping } from '../lib/validation';

interface FieldMappingComponentProps {
  queryData: DataSource;
  onComplete: (data: any) => void;
  onBack: () => void;
}

export default function FieldMappingComponent({ queryData, onComplete, onBack }: FieldMappingComponentProps) {
  const [entityType, setEntityType] = useState<'Bill' | 'BillPayment'>('Bill');
  const [selectedRecords, setSelectedRecords] = useState<number[]>([]);
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([]);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [columnWidths, setColumnWidths] = useState<{[key: string]: number}>({});

  useEffect(() => {
    const defaultMappings = DataValidator.getEntityFieldMappings(entityType);
    setFieldMappings(defaultMappings);
    setPreviewData(queryData.data.slice(0, 5));
  }, [entityType, queryData]);

  const handleSelectAll = () => {
    if (selectedRecords.length === queryData.data.length) {
      setSelectedRecords([]);
    } else {
      setSelectedRecords(queryData.data.map((_, index) => index));
    }
  };

  const handleRecordSelect = (index: number) => {
    setSelectedRecords(prev => 
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const handleMappingChange = (mappingIndex: number, field: keyof FieldMapping, value: any) => {
    setFieldMappings(prev => 
      prev.map((mapping, index) => 
        index === mappingIndex 
          ? { ...mapping, [field]: value }
          : mapping
      )
    );
  };

  const handleContinue = () => {
    const selectedData = selectedRecords.map(index => queryData.data[index]);
    
    const mappedResult = {
      entityType,
      selectedRecords: selectedData,
      fieldMappings,
      originalData: queryData,
      totalSelected: selectedRecords.length,
      totalAvailable: queryData.data.length
    };

    onComplete(mappedResult);
  };

  const getColumnWidth = (column: string) => {
    return columnWidths[column] || 150;
  };

  const handleMouseDown = (column: string, e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = getColumnWidth(column);

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = Math.max(80, startWidth + (e.clientX - startX));
      setColumnWidths(prev => ({
        ...prev,
        [column]: newWidth
      }));
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-900">Field Mapping & Record Selection</h2>
        <button
          onClick={onBack}
          className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Back to Query
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex items-center text-sm text-blue-700">
          <span className="font-medium">Data Summary:</span>
          <span className="ml-2">{queryData.data.length} total records loaded</span>
          {selectedRecords.length > 0 && (
            <span className="ml-4 font-medium">{selectedRecords.length} selected for processing</span>
          )}
        </div>
      </div>

      {/* Configuration Section - Collapsed to save space */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Configuration</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Entity Type</label>
            <div className="flex space-x-4">
              {['Bill', 'BillPayment'].map((type) => (
                <button
                  key={type}
                  onClick={() => setEntityType(type as any)}
                  className={`px-6 py-3 text-sm font-medium rounded-md transition-colors ${
                    entityType === type
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Quick Field Mapping</label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {fieldMappings.slice(0, 6).map((mapping, index) => (
                <div key={index} className={`p-2 rounded ${mapping.sourceField ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  <span className="font-medium">{mapping.targetField}:</span>
                  <span className="ml-1">{mapping.sourceField || 'Not mapped'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Field Mappings - Compact */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Field Mappings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {fieldMappings.map((mapping, index) => (
            <div key={index} className="border border-gray-200 rounded-md p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  {mapping.targetField}
                </span>
                {mapping.required && (
                  <span className="text-xs text-red-600 font-medium px-2 py-1 bg-red-100 rounded">Required</span>
                )}
              </div>
              
              <select
                value={mapping.sourceField}
                onChange={(e) => handleMappingChange(index, 'sourceField', e.target.value)}
                className="w-full text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select field...</option>
                {queryData.columns.map(column => (
                  <option key={column} value={column}>{column}</option>
                ))}
              </select>
              
              <div className="mt-1 text-xs text-gray-500">
                Type: {mapping.type}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Data Table - Much Larger */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Record Selection</h3>
              <p className="text-sm text-gray-600 mt-1">
                {selectedRecords.length} of {queryData.data.length} records selected
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleSelectAll}
                  className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                >
                  {selectedRecords.length === queryData.data.length ? 'Deselect All' : 'Select All'}
                </button>
                
                <button 
                  onClick={() => {
                    const newWidths: {[key: string]: number} = {};
                    queryData.columns.forEach((column: string) => {
                      const headerLength = column.length * 10 + 60;
                      const minWidth = Math.max(150, headerLength);
                      newWidths[column] = Math.min(minWidth, 250);
                    });
                    setColumnWidths(newWidths);
                  }}
                  className="px-3 py-2 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                >
                  Auto-size
                </button>
                
                <button 
                  onClick={() => setColumnWidths({})}
                  className="px-3 py-2 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-auto" style={{ height: '70vh', maxHeight: '600px' }}>
          <table className="w-full divide-y divide-gray-200" style={{ minWidth: 'max-content' }}>
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 bg-gray-50 border-r border-gray-200 shadow-sm" style={{ minWidth: '60px', width: '60px' }}>
                  <input
                    type="checkbox"
                    checked={selectedRecords.length === queryData.data.length && queryData.data.length > 0}
                    onChange={handleSelectAll}
                    className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </th>
                {queryData.columns.map((column, index) => (
                  <th 
                    key={column} 
                    className="px-4 py-3 text-left text-sm font-semibold text-gray-900 bg-gray-50 border-r border-gray-200 relative shadow-sm"
                    style={{ 
                      width: getColumnWidth(column) || 180,
                      minWidth: '120px'
                    }}
                  >
                    <div className="flex items-center justify-between pr-3">
                      <span className="truncate font-medium" title={column}>
                        {column}
                      </span>
                    </div>
                    <div 
                      className="absolute right-0 top-0 w-2 h-full cursor-col-resize hover:bg-blue-500 bg-gray-400 opacity-30 hover:opacity-70 transition-opacity"
                      onMouseDown={(e) => handleMouseDown(column, e)}
                      title="Drag to resize column"
                    ></div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {queryData.data.map((record, index) => (
                <tr 
                  key={index} 
                  className={`transition-colors cursor-pointer ${
                    selectedRecords.includes(index) 
                      ? 'bg-blue-50 border-l-4 border-l-blue-500' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handleRecordSelect(index)}
                >
                  <td className="px-4 py-3 border-r border-gray-200" style={{ minWidth: '60px', width: '60px' }}>
                    <input
                      type="checkbox"
                      checked={selectedRecords.includes(index)}
                      onChange={() => handleRecordSelect(index)}
                      className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>
                  {queryData.columns.map((column) => (
                    <td 
                      key={column} 
                      className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200"
                      style={{ 
                        width: getColumnWidth(column) || 180,
                        minWidth: '120px',
                        maxWidth: getColumnWidth(column) || 180
                      }}
                    >
                      <div className="font-medium" title={String(record[column] || '')}>
                        {String(record[column] || '') || (
                          <span className="text-gray-400 italic">null</span>
                        )}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <span>
              Showing {queryData.data.length} records • {queryData.columns.length} columns • {selectedRecords.length} selected
            </span>
            <span className="flex items-center">
              <span className="mr-2">💡 Click rows to select, drag borders to resize</span>
            </span>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          onClick={onBack}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Back
        </button>
        <button
          onClick={handleContinue}
          disabled={selectedRecords.length === 0 || fieldMappings.some(m => m.required && !m.sourceField)}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue to Validation ({selectedRecords.length} selected)
        </button>
      </div>
    </div>
  );
}