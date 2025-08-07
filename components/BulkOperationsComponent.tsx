import { useState } from 'react';

interface BulkOperationsComponentProps {
  validationResults: any;
  mappedData: any;
  onComplete: (results: any) => void;
  onBack: () => void;
}

export default function BulkOperationsComponent({ validationResults, mappedData, onComplete, onBack }: BulkOperationsComponentProps) {
  const [operation, setOperation] = useState<'DELETE' | 'CREATE' | 'UPDATE'>('DELETE');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentItem, setCurrentItem] = useState('');
  const [deleteStrategies, setDeleteStrategies] = useState<{[key: string]: 'bill_only' | 'both' | 'payment_only'}>({});
  const [qbCredentials, setQbCredentials] = useState({
    accessToken: '',
    realmId: '',
    baseUrl: 'https://sandbox-quickbooks.api.intuit.com'
  });

  const handleStartOperation = async () => {
    if (!qbCredentials.accessToken || !qbCredentials.realmId) {
      alert('Please provide QuickBooks credentials');
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      // Prepare records with their deletion strategies
      const records = mappedData.selectedRecords.map((record: any) => {
        const hasPayment = Boolean(record.billpayment_id);
        const strategy = hasPayment 
          ? (deleteStrategies[record.txn_id] || 'both')
          : 'bill_only';

        return {
          txn_id: record.txn_id,
          billpayment_id: record.billpayment_id,
          txn_type: record.txn_type,
          doc_num: record.doc_num,
          deleteStrategy: strategy
        };
      });

      setCurrentItem(`Processing ${records.length} records with advanced deletion logic...`);

      const response = await fetch('/api/quickbooks/bulk-delete-advanced', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accessToken: qbCredentials.accessToken,
          realmId: qbCredentials.realmId,
          baseUrl: qbCredentials.baseUrl,
          records
        }),
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Operation failed');
      }

      setProgress(100);
      setCurrentItem('Advanced deletion completed');
      
      onComplete({
        ...result,
        validationResults,
        mappedData
      });

    } catch (error: any) {
      console.error('Operation error:', error);
      alert(`Operation failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-900">QuickBooks Operations</h2>
        <button
          onClick={onBack}
          className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Back to Validation
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="text-sm text-blue-700">
          <span className="font-medium">Ready to process:</span>
          <span className="ml-2">{mappedData.selectedRecords.length} records</span>
          <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
            <span>Bills only: {mappedData.selectedRecords.filter((r: any) => !r.billpayment_id).length}</span>
            <span>Bills + Payments: {mappedData.selectedRecords.filter((r: any) => r.billpayment_id).length}</span>
            <span>Strategies configured: {Object.keys(deleteStrategies).length}</span>
          </div>
        </div>
      </div>

      {/* Delete Strategy Configuration */}
      {mappedData.selectedRecords.filter((r: any) => r.billpayment_id).length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <h3 className="text-sm font-medium text-yellow-800 mb-3">
            Deletion Strategy for Records with BillPayments ({mappedData.selectedRecords.filter((r: any) => r.billpayment_id).length} records)
          </h3>
          
          <div className="space-y-3 max-h-48 overflow-y-auto">
            {mappedData.selectedRecords
              .filter((record: any) => record.billpayment_id)
              .map((record: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      Doc: {record.doc_num || 'N/A'}
                    </div>
                    <div className="text-xs text-gray-500">
                      Bill ID: {record.txn_id} • Payment ID: {record.billpayment_id}
                    </div>
                  </div>
                  
                  <select
                    value={deleteStrategies[record.txn_id] || 'both'}
                    onChange={(e) => setDeleteStrategies(prev => ({
                      ...prev,
                      [record.txn_id]: e.target.value as 'bill_only' | 'both' | 'payment_only'
                    }))}
                    className="ml-3 text-xs border-gray-300 rounded focus:ring-yellow-500 focus:border-yellow-500"
                  >
                    <option value="both">Delete Both</option>
                    <option value="bill_only">Bill Only</option>
                    <option value="payment_only">Payment Only</option>
                  </select>
                </div>
              ))}
          </div>

          <div className="mt-3 flex space-x-2">
            <button
              onClick={() => {
                const strategies: {[key: string]: 'bill_only' | 'both' | 'payment_only'} = {};
                mappedData.selectedRecords
                  .filter((r: any) => r.billpayment_id)
                  .forEach((r: any) => {
                    strategies[r.txn_id] = 'both';
                  });
                setDeleteStrategies(strategies);
              }}
              className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
            >
              Set All: Delete Both
            </button>
            <button
              onClick={() => {
                const strategies: {[key: string]: 'bill_only' | 'both' | 'payment_only'} = {};
                mappedData.selectedRecords
                  .filter((r: any) => r.billpayment_id)
                  .forEach((r: any) => {
                    strategies[r.txn_id] = 'bill_only';
                  });
                setDeleteStrategies(strategies);
              }}
              className="px-3 py-1 text-xs bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
            >
              Set All: Bills Only
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">QuickBooks Credentials</h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Access Token</label>
                <input
                  type="password"
                  value={qbCredentials.accessToken}
                  onChange={(e) => setQbCredentials(prev => ({ ...prev, accessToken: e.target.value }))}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Enter QuickBooks access token"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Company ID (Realm ID)</label>
                <input
                  type="text"
                  value={qbCredentials.realmId}
                  onChange={(e) => setQbCredentials(prev => ({ ...prev, realmId: e.target.value }))}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Enter QuickBooks company ID"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Base URL</label>
                <select
                  value={qbCredentials.baseUrl}
                  onChange={(e) => setQbCredentials(prev => ({ ...prev, baseUrl: e.target.value }))}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="https://sandbox-quickbooks.api.intuit.com">Sandbox</option>
                  <option value="https://quickbooks.api.intuit.com">Production</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">Operation Type</h3>
            <div className="space-y-2">
              {['DELETE', 'CREATE', 'UPDATE'].map((op) => (
                <label key={op} className="flex items-center">
                  <input
                    type="radio"
                    checked={operation === op}
                    onChange={() => setOperation(op as any)}
                    disabled={op !== 'DELETE'}
                    className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className={`ml-2 text-sm ${
                    op === 'DELETE' ? 'text-gray-900' : 'text-gray-400'
                  }`}>
                    {op} {mappedData.entityType}s
                    {op !== 'DELETE' && ' (Coming soon)'}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">Operation Preview</h3>
            
            <div className="border border-gray-200 rounded-md">
              <div className="p-3 bg-gray-50 border-b border-gray-200">
                <div className="text-sm font-medium text-gray-900">
                  {operation} Operation Summary
                </div>
              </div>
              <div className="p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Entity Type:</span>
                  <span className="text-gray-900">{mappedData.entityType}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Records:</span>
                  <span className="text-gray-900">{mappedData.selectedRecords.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Validation Status:</span>
                  <span className={validationResults.isValid ? 'text-green-600' : 'text-yellow-600'}>
                    {validationResults.isValid ? 'Passed' : 'Has Warnings'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Duplicates:</span>
                  <span className="text-gray-900">{validationResults.duplicates?.length || 0}</span>
                </div>
              </div>
            </div>
          </div>

          {isProcessing && (
            <div className="border border-blue-200 rounded-md bg-blue-50 p-4">
              <div className="text-sm font-medium text-blue-900 mb-2">Processing...</div>
              <div className="w-full bg-blue-200 rounded-full h-2 mb-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <div className="text-xs text-blue-700">{currentItem}</div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">Important Notice</h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>This operation will make permanent changes to your QuickBooks data. Please ensure:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>You have proper backups</li>
                <li>You're using the correct QuickBooks company</li>
                <li>The access token has appropriate permissions</li>
                <li>You've reviewed all validation results</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          onClick={onBack}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          disabled={isProcessing}
        >
          Back
        </button>
        <button
          onClick={handleStartOperation}
          disabled={isProcessing || !qbCredentials.accessToken || !qbCredentials.realmId}
          className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? 'Processing...' : `${operation} ${mappedData.selectedRecords.length} Records`}
        </button>
      </div>
    </div>
  );
}