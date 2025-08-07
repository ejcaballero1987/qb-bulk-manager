import { useState } from 'react';

interface OperationLogsComponentProps {
  operationResults: any;
  onBack: () => void;
  onReset: () => void;
}

export default function OperationLogsComponent({ operationResults, onBack, onReset }: OperationLogsComponentProps) {
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');

  const handleExportResults = () => {
    const dataToExport = {
      summary: operationResults.summary,
      results: operationResults.results,
      operationLogs: operationResults.operationLogs,
      metadata: operationResults.metadata,
      exportedAt: new Date().toISOString()
    };

    if (exportFormat === 'json') {
      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qb-operation-results-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const csvContent = convertToCSV(operationResults.results);
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qb-operation-results-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const convertToCSV = (data: any[]): string => {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];
    
    data.forEach(row => {
      const values = headers.map(header => {
        const value = row[header];
        if (typeof value === 'object') {
          return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        }
        return `"${String(value).replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(','));
    });
    
    return csvRows.join('\n');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return 'text-green-600 bg-green-100';
      case 'ERROR':
        return 'text-red-600 bg-red-100';
      case 'THROTTLED':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-900">Operation Results & Logs</h2>
        <div className="flex space-x-2">
          <button
            onClick={onBack}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Back to Operations
          </button>
          <button
            onClick={onReset}
            className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 border border-blue-300 rounded-md hover:bg-blue-50"
          >
            Start New Process
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg border-2 border-blue-200 bg-blue-50">
          <div className="font-medium text-gray-900">Total Processed</div>
          <p className="mt-1 text-2xl font-bold text-blue-600">
            {operationResults.summary?.totalRequested || 0}
          </p>
        </div>

        <div className="p-4 rounded-lg border-2 border-green-200 bg-green-50">
          <div className="font-medium text-gray-900">Successful</div>
          <p className="mt-1 text-2xl font-bold text-green-600">
            {operationResults.summary?.successful || 0}
          </p>
        </div>

        <div className="p-4 rounded-lg border-2 border-red-200 bg-red-50">
          <div className="font-medium text-gray-900">Failed</div>
          <p className="mt-1 text-2xl font-bold text-red-600">
            {operationResults.summary?.failed || 0}
          </p>
        </div>

        <div className="p-4 rounded-lg border-2 border-purple-200 bg-purple-50">
          <div className="font-medium text-gray-900">Success Rate</div>
          <p className="mt-1 text-2xl font-bold text-purple-600">
            {operationResults.summary?.successRate || 0}%
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">Operation Results</h3>
            <div className="flex items-center space-x-2">
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value as any)}
                className="text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="json">JSON</option>
                <option value="csv">CSV</option>
              </select>
              <button
                onClick={handleExportResults}
                className="px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-800 border border-blue-300 rounded-md hover:bg-blue-50"
              >
                Export
              </button>
            </div>
          </div>

          <div className="border border-gray-200 rounded-md">
            <div className="max-h-96 overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Entity ID</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {operationResults.results?.map((result: any, index: number) => (
                    <tr key={index} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedLog(result)}>
                      <td className="px-3 py-2 text-sm text-gray-900 font-mono">
                        {result.billId || result.billPaymentId || 'N/A'}
                      </td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          getStatusColor(result.status)
                        }`}>
                          {result.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-500">
                        {result.error ? result.error.substring(0, 50) + '...' : 'Success'}
                      </td>
                    </tr>
                  )) || []}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-900">Detailed Logs</h3>
          
          {selectedLog ? (
            <div className="border border-gray-200 rounded-md bg-gray-50 p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-900">
                  {selectedLog.billId || selectedLog.billPaymentId || 'Log Details'}
                </h4>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`font-medium ${
                    selectedLog.status === 'SUCCESS' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {selectedLog.status}
                  </span>
                </div>
                
                {selectedLog.error && (
                  <div>
                    <span className="text-gray-600">Error:</span>
                    <div className="mt-1 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-xs">
                      {selectedLog.error}
                    </div>
                  </div>
                )}
                
                {selectedLog.result && (
                  <div>
                    <span className="text-gray-600">Response:</span>
                    <div className="mt-1 p-2 bg-green-50 border border-green-200 rounded text-green-700 text-xs font-mono max-h-32 overflow-y-auto">
                      {JSON.stringify(selectedLog.result, null, 2)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-md p-8 text-center text-gray-500">
              Click on a result row to view detailed logs
            </div>
          )}

          {operationResults.operationLogs && operationResults.operationLogs.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">API Operation Logs</h4>
              <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-md">
                {operationResults.operationLogs.map((log: any, index: number) => (
                  <div key={index} className="p-2 border-b border-gray-100 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">
                        {log.operation} {log.entity}
                      </span>
                      <span className={`px-1 py-0.5 rounded text-xs ${
                        getStatusColor(log.status)
                      }`}>
                        {log.status}
                      </span>
                    </div>
                    <div className="text-gray-500 mt-1">
                      {new Date(log.timestamp).toLocaleString()}
                    </div>
                    {log.error && (
                      <div className="text-red-600 mt-1">{log.error}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-md bg-gray-50 border border-gray-200 p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Operation Metadata</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Entity Type:</span>
            <span className="text-gray-900">{operationResults.metadata?.entityType}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Executed At:</span>
            <span className="text-gray-900">
              {operationResults.metadata?.executedAt ? 
                new Date(operationResults.metadata.executedAt).toLocaleString() : 'N/A'
              }
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Company ID:</span>
            <span className="text-gray-900 font-mono">{operationResults.metadata?.realmId}</span>
          </div>
        </div>
      </div>
    </div>
  );
}