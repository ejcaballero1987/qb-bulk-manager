import { useState } from 'react';
import { DataLoader, DataSource } from '../lib/dataLoader';

interface DataQueryComponentProps {
  onComplete: (data: any) => void;
}

export default function DataQueryComponent({ onComplete }: DataQueryComponentProps) {
  const [selectedSource, setSelectedSource] = useState<'sql' | 'csv' | 'excel' | 'manual'>('sql');
  const [companyId, setCompanyId] = useState('9130350759506416');
  const [customQuery, setCustomQuery] = useState('');
  const [useDefaultQuery, setUseDefaultQuery] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pastedData, setPastedData] = useState('');
  const [fileData, setFileData] = useState<File | null>(null);

  const handleSQLQuery = async () => {
    if (!companyId.trim()) {
      setError('Company ID is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/data/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: useDefaultQuery ? 'default' : customQuery,
          companyId: companyId.trim(),
          filters: {}
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Query failed');
      }

      const dataSource: DataSource = {
        type: 'sql',
        data: result.data,
        columns: result.columns,
        query: useDefaultQuery ? 'default' : customQuery
      };

      onComplete(dataSource);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileData(file);
    setLoading(true);
    setError('');

    try {
      const dataSource = await DataLoader.loadFromCSV(file);
      onComplete(dataSource);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePastedData = async () => {
    if (!pastedData.trim()) {
      setError('No data pasted');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const dataSource = await DataLoader.loadFromExcelPaste(pastedData);
      onComplete(dataSource);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleManualData = () => {
    const columns = ['txn_id', 'company_id', 'vend_id', 'vend_name', 'subt_nat_amount', 'tx_date', 'doc_num', 'billpayment_id'];
    const dataSource = DataLoader.createManualDataSource(columns);
    onComplete(dataSource);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Data Source Selection</h2>
        
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          {[
            { id: 'sql', name: 'Azure SQL Query', icon: '🗃️' },
            { id: 'csv', name: 'CSV Upload', icon: '📄' },
            { id: 'excel', name: 'Excel Paste', icon: '📊' },
            { id: 'manual', name: 'Manual Entry', icon: '✏️' }
          ].map((source) => (
            <button
              key={source.id}
              onClick={() => setSelectedSource(source.id as any)}
              className={`p-4 text-left border rounded-lg transition-colors ${
                selectedSource === source.id
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-2xl mb-2">{source.icon}</div>
              <div className="font-medium">{source.name}</div>
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      {selectedSource === 'sql' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Company ID</label>
            <input
              type="text"
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter Company ID"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center">
              <input
                type="radio"
                id="default-query"
                checked={useDefaultQuery}
                onChange={() => setUseDefaultQuery(true)}
                className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <label htmlFor="default-query" className="ml-2 block text-sm text-gray-900">
                Use default duplicates query
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="radio"
                id="custom-query"
                checked={!useDefaultQuery}
                onChange={() => setUseDefaultQuery(false)}
                className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <label htmlFor="custom-query" className="ml-2 block text-sm text-gray-900">
                Custom SQL query
              </label>
            </div>
          </div>

          {!useDefaultQuery && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Custom SQL Query</label>
              <textarea
                value={customQuery}
                onChange={(e) => setCustomQuery(e.target.value)}
                rows={10}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                placeholder="Enter your SQL query here..."
              />
            </div>
          )}

          <button
            onClick={handleSQLQuery}
            disabled={loading || (!useDefaultQuery && !customQuery.trim())}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Executing...' : 'Execute Query'}
          </button>
        </div>
      )}

      {selectedSource === 'csv' && (
        <div>
          <label className="block text-sm font-medium text-gray-700">Upload CSV File</label>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>
      )}

      {selectedSource === 'excel' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Paste Excel Data (Copy from Excel and paste here)
            </label>
            <textarea
              value={pastedData}
              onChange={(e) => setPastedData(e.target.value)}
              rows={10}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
              placeholder="Paste your Excel data here..."
            />
          </div>
          
          <button
            onClick={handlePastedData}
            disabled={loading || !pastedData.trim()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Process Data'}
          </button>
        </div>
      )}

      {selectedSource === 'manual' && (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">Manual data entry will be available in the next step</p>
          <button
            onClick={handleManualData}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Continue to Manual Entry
          </button>
        </div>
      )}
    </div>
  );
}