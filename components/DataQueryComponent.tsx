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
    <div className="space-y-8">
      {/* Modern Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
          Select Data Source
        </h2>
        <p className="text-gray-600 text-lg">Choose how you want to load your QuickBooks data</p>
      </div>
      
      {/* Modern Source Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { 
            id: 'sql', 
            name: 'Azure SQL Database', 
            description: 'Dynamic queries with company filtering',
            icon: (
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
              </svg>
            ),
            gradient: 'from-blue-500 to-cyan-600',
            recommended: true
          },
          { 
            id: 'csv', 
            name: 'CSV Upload', 
            description: 'Import data from CSV files',
            icon: (
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            ),
            gradient: 'from-green-500 to-emerald-600'
          },
          { 
            id: 'excel', 
            name: 'Excel Paste', 
            description: 'Copy & paste from Excel sheets',
            icon: (
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 0v10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
            ),
            gradient: 'from-purple-500 to-pink-600'
          },
          { 
            id: 'manual', 
            name: 'Manual Entry', 
            description: 'Create records manually',
            icon: (
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            ),
            gradient: 'from-orange-500 to-red-600'
          }
        ].map((source) => (
          <button
            key={source.id}
            onClick={() => setSelectedSource(source.id as any)}
            className={`group relative p-8 text-left border-2 rounded-2xl transition-all duration-300 hover:scale-105 ${
              selectedSource === source.id
                ? 'border-transparent bg-gradient-to-br ' + source.gradient + ' text-white shadow-2xl'
                : 'border-gray-200 hover:border-gray-300 bg-white hover:shadow-xl'
            }`}
          >
            {source.recommended && (
              <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                Recommended
              </div>
            )}
            
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 transition-all ${
              selectedSource === source.id 
                ? 'bg-white/20 text-white' 
                : 'bg-gradient-to-br ' + source.gradient + ' text-white group-hover:scale-110'
            }`}>
              {source.icon}
            </div>
            
            <h3 className={`text-xl font-bold mb-3 ${
              selectedSource === source.id ? 'text-white' : 'text-gray-900'
            }`}>
              {source.name}
            </h3>
            
            <p className={`text-sm ${
              selectedSource === source.id ? 'text-white/90' : 'text-gray-600'
            }`}>
              {source.description}
            </p>
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      {selectedSource === 'sql' && (
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-3xl p-8 border border-blue-200">
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-blue-900 mb-2">Azure SQL Configuration</h3>
              <p className="text-blue-700">Configure your database query parameters</p>
            </div>

            <div className="bg-white/80 rounded-2xl p-6 backdrop-blur-sm">
              <label className="block text-sm font-semibold text-blue-900 mb-3">Company ID</label>
              <div className="relative">
                <input
                  type="text"
                  value={companyId}
                  onChange={(e) => setCompanyId(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 text-lg border-2 border-blue-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/90 backdrop-blur-sm transition-all"
                  placeholder="e.g., 9130350759506416"
                />
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center">
                  <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white/80 rounded-2xl p-6 backdrop-blur-sm">
              <label className="block text-sm font-semibold text-blue-900 mb-4">Query Type</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => setUseDefaultQuery(true)}
                  className={`p-6 rounded-xl border-2 text-left transition-all duration-300 ${
                    useDefaultQuery 
                      ? 'border-blue-500 bg-blue-100 shadow-lg' 
                      : 'border-gray-300 bg-white hover:border-blue-300 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center mb-3">
                    <div className={`w-6 h-6 rounded-full mr-3 flex items-center justify-center ${
                      useDefaultQuery ? 'bg-blue-500' : 'bg-gray-300'
                    }`}>
                      {useDefaultQuery && <div className="w-3 h-3 bg-white rounded-full"></div>}
                    </div>
                    <h4 className="font-bold text-gray-900">Smart Duplicates Query</h4>
                  </div>
                  <p className="text-sm text-gray-600">Pre-built query to find duplicate bills with matching payments</p>
                  <div className="mt-3 inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                    ✨ Recommended
                  </div>
                </button>

                <button
                  onClick={() => setUseDefaultQuery(false)}
                  className={`p-6 rounded-xl border-2 text-left transition-all duration-300 ${
                    !useDefaultQuery 
                      ? 'border-blue-500 bg-blue-100 shadow-lg' 
                      : 'border-gray-300 bg-white hover:border-blue-300 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center mb-3">
                    <div className={`w-6 h-6 rounded-full mr-3 flex items-center justify-center ${
                      !useDefaultQuery ? 'bg-blue-500' : 'bg-gray-300'
                    }`}>
                      {!useDefaultQuery && <div className="w-3 h-3 bg-white rounded-full"></div>}
                    </div>
                    <h4 className="font-bold text-gray-900">Custom Query</h4>
                  </div>
                  <p className="text-sm text-gray-600">Write your own SQL query for specific data needs</p>
                </button>
              </div>
            </div>

            {!useDefaultQuery && (
              <div className="bg-white/80 rounded-2xl p-6 backdrop-blur-sm">
                <label className="block text-sm font-semibold text-blue-900 mb-3">Custom SQL Query</label>
                <div className="relative">
                  <textarea
                    value={customQuery}
                    onChange={(e) => setCustomQuery(e.target.value)}
                    rows={12}
                    className="w-full p-4 border-2 border-blue-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm bg-gray-50 resize-none"
                    placeholder="SELECT a.company_id, a.tx_date, a.txn_id...
FROM daily.generalledger a
WHERE a.company_id = @companyId..."
                  />
                  <div className="absolute top-3 right-3">
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">SQL</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-center">
              <button
                onClick={handleSQLQuery}
                disabled={loading || (!useDefaultQuery && !customQuery.trim())}
                className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105"
              >
                <div className="flex items-center space-x-3">
                  {loading ? (
                    <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  )}
                  <span className="text-lg">{loading ? 'Executing Query...' : 'Execute Query'}</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedSource === 'csv' && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-3xl p-8 border border-green-200">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-green-900 mb-2">CSV File Upload</h3>
            <p className="text-green-700">Upload a CSV file with your QuickBooks data</p>
          </div>

          <div className="bg-white/80 rounded-2xl p-8 backdrop-blur-sm text-center">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full mb-4">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">Drop your CSV file here</h4>
              <p className="text-gray-600 mb-6">or click to browse from your computer</p>
            </div>

            <label className="relative cursor-pointer">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="sr-only"
              />
              <div className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                Choose CSV File
              </div>
            </label>
            
            <div className="mt-6 text-sm text-gray-500">
              <p>Supported formats: .csv with headers</p>
              <p>Max file size: 10MB</p>
            </div>
          </div>
        </div>
      )}

      {selectedSource === 'excel' && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-3xl p-8 border border-purple-200">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-purple-900 mb-2">Excel Data Paste</h3>
            <p className="text-purple-700">Copy data from Excel and paste it here</p>
          </div>

          <div className="bg-white/80 rounded-2xl p-6 backdrop-blur-sm">
            <div className="mb-4 p-4 bg-purple-100 rounded-xl border border-purple-200">
              <h4 className="font-bold text-purple-900 mb-2">📋 How to copy from Excel:</h4>
              <ol className="text-sm text-purple-800 space-y-1">
                <li>1. Select your data range in Excel (including headers)</li>
                <li>2. Press Ctrl+C (or Cmd+C on Mac) to copy</li>
                <li>3. Paste in the text area below</li>
              </ol>
            </div>

            <label className="block text-sm font-semibold text-purple-900 mb-3">Paste Excel Data</label>
            <div className="relative">
              <textarea
                value={pastedData}
                onChange={(e) => setPastedData(e.target.value)}
                rows={12}
                className="w-full p-4 border-2 border-purple-200 rounded-xl shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-mono text-sm bg-gray-50 resize-none"
                placeholder="Paste your Excel data here...
Example:
company_id	tx_date	txn_id	doc_num
123456	2024-01-01	TXN001	INV001
123456	2024-01-02	TXN002	INV002"
              />
              <div className="absolute top-3 right-3">
                <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">Excel</span>
              </div>
            </div>

            <div className="flex justify-center mt-6">
              <button
                onClick={handlePastedData}
                disabled={loading || !pastedData.trim()}
                className="group relative px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105"
              >
                <div className="flex items-center space-x-3">
                  {loading ? (
                    <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  <span className="text-lg">{loading ? 'Processing Data...' : 'Process Excel Data'}</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedSource === 'manual' && (
        <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-3xl p-8 border border-orange-200">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-400 to-red-600 rounded-full mb-6">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            
            <h3 className="text-2xl font-bold text-orange-900 mb-4">Manual Data Entry</h3>
            <p className="text-orange-700 text-lg mb-8">Create and edit records manually in the next step</p>
            
            <div className="bg-white/80 rounded-2xl p-6 backdrop-blur-sm mb-8">
              <h4 className="font-bold text-orange-900 mb-4">You'll be able to:</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-orange-800">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span>Add individual records</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span>Edit field values</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span>Validate data inline</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleManualData}
              className="group relative px-8 py-4 bg-gradient-to-r from-orange-600 to-red-600 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <div className="flex items-center space-x-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span className="text-lg">Continue to Manual Entry</span>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}