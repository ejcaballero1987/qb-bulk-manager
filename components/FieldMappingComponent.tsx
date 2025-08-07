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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Entity Type
            </label>
            <div className="flex space-x-4">
              {['Bill', 'BillPayment'].map((type) => (
                <button
                  key={type}
                  onClick={() => setEntityType(type as any)}
                  className={`px-4 py-2 text-sm font-medium rounded-md ${
                    entityType === type
                      ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">Field Mappings</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {fieldMappings.map((mapping, index) => (
                <div key={index} className="border border-gray-200 rounded-md p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      {mapping.targetField}
                    </span>
                    {mapping.required && (
                      <span className="text-xs text-red-600 font-medium">Required</span>
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
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">Record Selection</h3>
            <button
              onClick={handleSelectAll}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              {selectedRecords.length === queryData.data.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          <div className="border border-gray-200 rounded-md">
            <div className="max-h-96 overflow-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="w-8 px-2 py-2 sticky left-0 bg-gray-50 border-r border-gray-200 z-10">
                      <input
                        type="checkbox"
                        checked={selectedRecords.length === queryData.data.length && queryData.data.length > 0}
                        onChange={handleSelectAll}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </th>
                    {queryData.columns.map((column, index) => (
                      <th key={column} className={`px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap ${
                        index < 3 ? 'sticky bg-gray-50 z-10' : ''
                      }`} style={index === 0 ? { left: '32px' } : index === 1 ? { left: '140px' } : index === 2 ? { left: '250px' } : {}}>
                        <div className="truncate max-w-[100px]" title={column}>
                          {column}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {queryData.data.map((record, index) => (
                    <tr key={index} className={selectedRecords.includes(index) ? 'bg-blue-50' : 'hover:bg-gray-50'}>
                      <td className="px-2 py-2 sticky left-0 bg-inherit border-r border-gray-200 z-10">
                        <input
                          type="checkbox"
                          checked={selectedRecords.includes(index)}
                          onChange={() => handleRecordSelect(index)}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </td>
                      {queryData.columns.map((column, colIndex) => (
                        <td key={column} className={`px-2 py-2 text-sm text-gray-900 whitespace-nowrap ${
                          colIndex < 3 ? 'sticky bg-inherit z-10' : ''
                        }`} style={colIndex === 0 ? { left: '32px' } : colIndex === 1 ? { left: '140px' } : colIndex === 2 ? { left: '250px' } : {}}>
                          <div className="max-w-[100px] truncate" title={String(record[column] || '')}>
                            {String(record[column] || '')}
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-3 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
              <div className="flex justify-between">
                <span>Showing {queryData.data.length} records with {queryData.columns.length} columns</span>
                <span>💡 Scroll horizontally to see all columns</span>
              </div>
            </div>
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