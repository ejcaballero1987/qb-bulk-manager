import { useState, useEffect } from 'react';
import { DataValidator, ValidationResult } from '../lib/validation';

interface ValidationComponentProps {
  mappedData: any;
  onComplete: (validationResults: any) => void;
  onBack: () => void;
}

export default function ValidationComponent({ mappedData, onComplete, onBack }: ValidationComponentProps) {
  const [validationResults, setValidationResults] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    performValidation();
  }, [mappedData]);

  const performValidation = async () => {
    setIsValidating(true);
    
    try {
      const results = DataValidator.validateQuickBooksEntities(
        mappedData.selectedRecords,
        mappedData.entityType
      );
      
      setValidationResults(results);
    } catch (error) {
      console.error('Validation error:', error);
    } finally {
      setIsValidating(false);
    }
  };

  const handleContinue = () => {
    if (validationResults) {
      onComplete({
        ...validationResults,
        mappedData
      });
    }
  };

  if (isValidating) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Validating data...</p>
        </div>
      </div>
    );
  }

  if (!validationResults) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-900">Data Validation Results</h2>
        <button
          onClick={onBack}
          className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Back to Mapping
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`p-4 rounded-lg border-2 ${
          validationResults.isValid 
            ? 'border-green-200 bg-green-50' 
            : 'border-red-200 bg-red-50'
        }`}>
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${
              validationResults.isValid ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            <span className="font-medium text-gray-900">
              Validation Status
            </span>
          </div>
          <p className={`mt-1 text-sm ${
            validationResults.isValid ? 'text-green-700' : 'text-red-700'
          }`}>
            {validationResults.isValid ? 'All validations passed' : 'Validation issues found'}
          </p>
        </div>

        <div className="p-4 rounded-lg border-2 border-blue-200 bg-blue-50">
          <div className="font-medium text-gray-900">Total Records</div>
          <p className="mt-1 text-2xl font-bold text-blue-600">
            {mappedData.selectedRecords.length}
          </p>
        </div>

        <div className="p-4 rounded-lg border-2 border-yellow-200 bg-yellow-50">
          <div className="font-medium text-gray-900">Duplicates Found</div>
          <p className="mt-1 text-2xl font-bold text-yellow-600">
            {validationResults.duplicates.length}
          </p>
        </div>
      </div>

      {validationResults.errors.length > 0 && (
        <div className="rounded-md bg-red-50 border border-red-200 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Validation Errors</h3>
              <div className="mt-2 text-sm text-red-700">
                <ul className="list-disc list-inside space-y-1">
                  {validationResults.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {validationResults.warnings.length > 0 && (
        <div className="rounded-md bg-yellow-50 border border-yellow-200 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Warnings</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <ul className="list-disc list-inside space-y-1">
                  {validationResults.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {validationResults.duplicates.length > 0 && (
        <div className="rounded-md bg-yellow-50 border border-yellow-200 p-4">
          <h3 className="text-sm font-medium text-yellow-800 mb-3">Duplicate TXN IDs Details</h3>
          <div className="max-h-64 overflow-y-auto">
            <table className="min-w-full divide-y divide-yellow-200">
              <thead className="bg-yellow-100">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-yellow-800 uppercase">TXN ID</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-yellow-800 uppercase">Count</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-yellow-800 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-yellow-200">
                {validationResults.duplicates.map((duplicate, index) => (
                  <tr key={index}>
                    <td className="px-3 py-2 text-sm text-yellow-900 font-mono">{duplicate.txnId}</td>
                    <td className="px-3 py-2 text-sm text-yellow-900">{duplicate.count}</td>
                    <td className="px-3 py-2 text-sm text-yellow-900">Will use first occurrence</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="rounded-md bg-gray-50 border border-gray-200 p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Field Mapping Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mappedData.fieldMappings
            .filter((mapping: any) => mapping.sourceField)
            .map((mapping: any, index: number) => (
              <div key={index} className="flex justify-between text-sm">
                <span className="text-gray-600">{mapping.targetField}:</span>
                <span className="text-gray-900 font-medium">{mapping.sourceField}</span>
              </div>
            ))
          }
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
          onClick={performValidation}
          className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100"
        >
          Re-validate
        </button>
        <button
          onClick={handleContinue}
          className={`px-4 py-2 text-sm font-medium rounded-md ${
            validationResults.isValid
              ? 'text-white bg-green-600 hover:bg-green-700 border border-transparent'
              : 'text-white bg-yellow-600 hover:bg-yellow-700 border border-transparent'
          }`}
        >
          {validationResults.isValid ? 'Proceed to Operations' : 'Continue with Warnings'}
        </button>
      </div>
    </div>
  );
}