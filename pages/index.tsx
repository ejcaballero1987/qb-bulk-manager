import { useState } from 'react';
import DataQueryComponent from '../components/DataQueryComponent';
import BulkOperationsComponent from '../components/BulkOperationsComponent';
import FieldMappingComponent from '../components/FieldMappingComponent';
import ValidationComponent from '../components/ValidationComponent';
import OperationLogsComponent from '../components/OperationLogsComponent';

export default function Home() {
  const [currentStep, setCurrentStep] = useState<'query' | 'mapping' | 'validation' | 'operation' | 'logs'>('query');
  const [queryData, setQueryData] = useState<any>(null);
  const [mappedData, setMappedData] = useState<any>(null);
  const [validationResults, setValidationResults] = useState<any>(null);
  const [operationResults, setOperationResults] = useState<any>(null);

  const handleQueryComplete = (data: any) => {
    setQueryData(data);
    setCurrentStep('mapping');
  };

  const handleMappingComplete = (data: any) => {
    setMappedData(data);
    setCurrentStep('validation');
  };

  const handleValidationComplete = (results: any) => {
    setValidationResults(results);
    setCurrentStep('operation');
  };

  const handleOperationComplete = (results: any) => {
    setOperationResults(results);
    setCurrentStep('logs');
  };

  const resetProcess = () => {
    setCurrentStep('query');
    setQueryData(null);
    setMappedData(null);
    setValidationResults(null);
    setOperationResults(null);
  };

  const steps = [
    { id: 'query', name: 'Query Data', active: currentStep === 'query', completed: !!queryData },
    { id: 'mapping', name: 'Field Mapping', active: currentStep === 'mapping', completed: !!mappedData },
    { id: 'validation', name: 'Validation', active: currentStep === 'validation', completed: !!validationResults },
    { id: 'operation', name: 'QB Operations', active: currentStep === 'operation', completed: !!operationResults },
    { id: 'logs', name: 'Review Logs', active: currentStep === 'logs', completed: false }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        
        {/* Modern Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl mb-6 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-4">
            QuickBooks Bulk Manager
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Gestión inteligente y masiva de Bills y BillPayments con control avanzado de relaciones
          </p>
        </div>

        {/* Modern Progress Steps */}
        <div className="flex justify-center mb-12">
          <div className="flex items-center space-x-4 bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => {
                    if (step.completed || index === 0) {
                      setCurrentStep(step.id as any);
                    }
                  }}
                  disabled={!step.completed && !step.active && index !== 0}
                  className={`group flex items-center px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                    step.active
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg scale-105'
                      : step.completed
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:scale-105 cursor-pointer shadow-md'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full mr-3 flex items-center justify-center text-sm font-bold ${
                    step.active ? 'bg-white/20' : step.completed ? 'bg-white/20' : 'bg-gray-300'
                  }`}>
                    {step.completed ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span className={step.active ? 'text-white' : 'text-gray-600'}>{index + 1}</span>
                    )}
                  </div>
                  <span className="text-sm font-semibold">{step.name}</span>
                </button>
                
                {index < steps.length - 1 && (
                  <div className={`w-8 h-0.5 mx-2 ${
                    steps[index + 1].completed || steps[index + 1].active
                      ? 'bg-gradient-to-r from-green-500 to-blue-500'
                      : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
            
            <button
              onClick={resetProcess}
              className="ml-6 px-4 py-2 text-sm font-medium text-gray-600 hover:text-red-600 border-2 border-gray-300 hover:border-red-300 rounded-lg hover:bg-red-50 transition-all duration-200"
            >
              🔄 Reset
            </button>
          </div>
        </div>

        {/* Modern Content Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          <div className="p-8">
              
              {currentStep === 'query' && (
                <DataQueryComponent
                  onComplete={handleQueryComplete}
                />
              )}

              {currentStep === 'mapping' && queryData && (
                <FieldMappingComponent
                  queryData={queryData}
                  onComplete={handleMappingComplete}
                  onBack={() => setCurrentStep('query')}
                />
              )}

              {currentStep === 'validation' && mappedData && (
                <ValidationComponent
                  mappedData={mappedData}
                  onComplete={handleValidationComplete}
                  onBack={() => setCurrentStep('mapping')}
                />
              )}

              {currentStep === 'operation' && validationResults && (
                <BulkOperationsComponent
                  validationResults={validationResults}
                  mappedData={mappedData}
                  onComplete={handleOperationComplete}
                  onBack={() => setCurrentStep('validation')}
                />
              )}

              {currentStep === 'logs' && operationResults && (
                <OperationLogsComponent
                  operationResults={operationResults}
                  onBack={() => setCurrentStep('operation')}
                  onReset={resetProcess}
                />
              )}

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}