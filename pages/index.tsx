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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          
          <div className="border-b border-gray-200 pb-5 mb-8">
            <h1 className="text-3xl font-bold leading-6 text-gray-900">
              QuickBooks Bulk Manager
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Gestión masiva de entidades Bills y BillPayments con soporte multi-compañía
            </p>
          </div>

          <nav className="flex space-x-8 mb-8" aria-label="Progress">
            {steps.map((step, index) => (
              <button
                key={step.id}
                onClick={() => {
                  if (step.completed || index === 0) {
                    setCurrentStep(step.id as any);
                  }
                }}
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  step.active
                    ? 'bg-blue-100 text-blue-700'
                    : step.completed
                    ? 'bg-green-100 text-green-700 cursor-pointer hover:bg-green-200'
                    : 'bg-gray-100 text-gray-500 cursor-not-allowed'
                }`}
                disabled={!step.completed && !step.active && index !== 0}
              >
                <span className={`w-2 h-2 rounded-full mr-2 ${
                  step.active ? 'bg-blue-600' : step.completed ? 'bg-green-600' : 'bg-gray-400'
                }`} />
                {step.name}
              </button>
            ))}
            
            <button
              onClick={resetProcess}
              className="ml-auto px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Reset Process
            </button>
          </nav>

          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              
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