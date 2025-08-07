import Papa from 'papaparse';

export interface DataSource {
  type: 'sql' | 'csv' | 'excel' | 'manual';
  data: any[];
  columns: string[];
  fileName?: string;
  query?: string;
}

export interface LoaderOptions {
  delimiter?: string;
  header?: boolean;
  skipEmptyLines?: boolean;
  transformHeader?: (header: string) => string;
}

export class DataLoader {
  
  static async loadFromCSV(file: File, options: LoaderOptions = {}): Promise<DataSource> {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: options.header !== false,
        delimiter: options.delimiter || ',',
        skipEmptyLines: options.skipEmptyLines !== false,
        transformHeader: options.transformHeader,
        complete: (results) => {
          if (results.errors.length > 0) {
            console.warn('CSV parsing warnings:', results.errors);
          }
          
          const columns = results.meta.fields || [];
          
          resolve({
            type: 'csv',
            data: results.data,
            columns,
            fileName: file.name
          });
        },
        error: (error) => {
          reject(new Error(`CSV parsing error: ${error.message}`));
        }
      });
    });
  }
  
  static async loadFromText(text: string, options: LoaderOptions = {}): Promise<DataSource> {
    return new Promise((resolve, reject) => {
      Papa.parse(text, {
        header: options.header !== false,
        delimiter: options.delimiter || ',',
        skipEmptyLines: options.skipEmptyLines !== false,
        transformHeader: options.transformHeader,
        complete: (results) => {
          if (results.errors.length > 0) {
            console.warn('Text parsing warnings:', results.errors);
          }
          
          const columns = results.meta.fields || [];
          
          resolve({
            type: 'manual',
            data: results.data,
            columns
          });
        },
        error: (error) => {
          reject(new Error(`Text parsing error: ${error.message}`));
        }
      });
    });
  }
  
  static detectDelimiter(text: string): string {
    const sample = text.split('\n').slice(0, 5).join('\n');
    
    const delimiters = [',', ';', '\t', '|'];
    let bestDelimiter = ',';
    let maxColumns = 0;
    
    delimiters.forEach(delimiter => {
      const lines = sample.split('\n').filter(line => line.trim() !== '');
      if (lines.length === 0) return;
      
      const columnCounts = lines.map(line => line.split(delimiter).length);
      const avgColumns = columnCounts.reduce((a, b) => a + b, 0) / columnCounts.length;
      const consistency = columnCounts.every(count => count === columnCounts[0]);
      
      if (consistency && avgColumns > maxColumns) {
        maxColumns = avgColumns;
        bestDelimiter = delimiter;
      }
    });
    
    return bestDelimiter;
  }
  
  static async loadFromExcelPaste(pastedData: string): Promise<DataSource> {
    const delimiter = this.detectDelimiter(pastedData);
    
    return this.loadFromText(pastedData, {
      delimiter,
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim().toLowerCase().replace(/\s+/g, '_')
    });
  }
  
  static createManualDataSource(
    columns: string[], 
    initialData: any[] = []
  ): DataSource {
    return {
      type: 'manual',
      data: initialData,
      columns
    };
  }
  
  static validateDataStructure(dataSource: DataSource): {
    isValid: boolean;
    errors: string[];
    suggestions: string[];
  } {
    const errors: string[] = [];
    const suggestions: string[] = [];
    
    if (!dataSource.data || dataSource.data.length === 0) {
      errors.push('No data found in source');
      return { isValid: false, errors, suggestions };
    }
    
    if (!dataSource.columns || dataSource.columns.length === 0) {
      errors.push('No columns defined in data source');
      return { isValid: false, errors, suggestions };
    }
    
    const firstRow = dataSource.data[0];
    const availableFields = Object.keys(firstRow);
    
    const missingColumns = dataSource.columns.filter(col => !availableFields.includes(col));
    if (missingColumns.length > 0) {
      errors.push(`Missing columns in data: ${missingColumns.join(', ')}`);
    }
    
    const extraFields = availableFields.filter(field => !dataSource.columns.includes(field));
    if (extraFields.length > 0) {
      suggestions.push(`Additional fields available for mapping: ${extraFields.join(', ')}`);
    }
    
    const expectedFields = ['txn_id', 'company_id', 'vend_id', 'subt_nat_amount'];
    const availableExpected = expectedFields.filter(field => availableFields.includes(field));
    
    if (availableExpected.length < expectedFields.length) {
      const missing = expectedFields.filter(field => !availableFields.includes(field));
      suggestions.push(`Consider mapping these QuickBooks fields: ${missing.join(', ')}`);
    }
    
    const isValid = errors.length === 0;
    
    return {
      isValid,
      errors,
      suggestions
    };
  }
  
  static preprocessData(
    dataSource: DataSource,
    transformations?: Record<string, (value: any) => any>
  ): DataSource {
    if (!transformations) {
      return dataSource;
    }
    
    const transformedData = dataSource.data.map(row => {
      const newRow = { ...row };
      
      Object.entries(transformations).forEach(([field, transform]) => {
        if (newRow.hasOwnProperty(field)) {
          try {
            newRow[field] = transform(newRow[field]);
          } catch (error) {
            console.warn(`Transformation failed for field ${field}:`, error);
          }
        }
      });
      
      return newRow;
    });
    
    return {
      ...dataSource,
      data: transformedData
    };
  }
  
  static getPreviewData(dataSource: DataSource, limit: number = 10): any[] {
    return dataSource.data.slice(0, limit);
  }
  
  static getDataSummary(dataSource: DataSource): {
    totalRows: number;
    columns: string[];
    sampleData: any[];
    dataTypes: Record<string, string>;
  } {
    const totalRows = dataSource.data.length;
    const columns = dataSource.columns;
    const sampleData = this.getPreviewData(dataSource, 3);
    
    const dataTypes: Record<string, string> = {};
    
    if (sampleData.length > 0) {
      columns.forEach(column => {
        const values = sampleData
          .map(row => row[column])
          .filter(val => val !== null && val !== undefined && val !== '');
        
        if (values.length === 0) {
          dataTypes[column] = 'unknown';
          return;
        }
        
        const firstValue = values[0];
        
        if (!isNaN(Number(firstValue)) && !isNaN(parseFloat(firstValue))) {
          dataTypes[column] = 'number';
        } else if (!isNaN(Date.parse(firstValue))) {
          dataTypes[column] = 'date';
        } else if (typeof firstValue === 'boolean' || ['true', 'false'].includes(firstValue.toString().toLowerCase())) {
          dataTypes[column] = 'boolean';
        } else {
          dataTypes[column] = 'string';
        }
      });
    }
    
    return {
      totalRows,
      columns,
      sampleData,
      dataTypes
    };
  }
}