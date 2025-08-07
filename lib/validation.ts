export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  duplicates: DuplicateInfo[];
}

export interface DuplicateInfo {
  txnId: string;
  count: number;
  records: any[];
}

export interface FieldMapping {
  sourceField: string;
  targetField: string;
  required: boolean;
  type: 'string' | 'number' | 'date' | 'boolean';
  validation?: (value: any) => boolean;
}

export class DataValidator {
  
  static validateTxnIds(records: any[], txnIdField: string = 'txn_id'): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const duplicates: DuplicateInfo[] = [];
    
    if (!records || records.length === 0) {
      errors.push('No records provided for validation');
      return { isValid: false, errors, warnings, duplicates };
    }

    const txnIdCounts = new Map<string, any[]>();
    const missingTxnIds: number[] = [];

    records.forEach((record, index) => {
      const txnId = record[txnIdField];
      
      if (!txnId || txnId.toString().trim() === '') {
        missingTxnIds.push(index + 1);
        return;
      }

      const txnIdStr = txnId.toString().trim();
      
      if (!txnIdCounts.has(txnIdStr)) {
        txnIdCounts.set(txnIdStr, []);
      }
      
      txnIdCounts.get(txnIdStr)!.push({ ...record, _originalIndex: index });
    });

    if (missingTxnIds.length > 0) {
      errors.push(`Missing TXN IDs in rows: ${missingTxnIds.join(', ')}`);
    }

    txnIdCounts.forEach((records, txnId) => {
      if (records.length > 1) {
        duplicates.push({
          txnId,
          count: records.length,
          records
        });
        warnings.push(`Duplicate TXN ID "${txnId}" found ${records.length} times`);
      }
    });

    const isValid = errors.length === 0;
    
    return {
      isValid,
      errors,
      warnings,
      duplicates
    };
  }

  static validateFieldMappings(
    records: any[], 
    mappings: FieldMapping[]
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const duplicates: DuplicateInfo[] = [];

    if (!records || records.length === 0) {
      errors.push('No records provided for field mapping validation');
      return { isValid: false, errors, warnings, duplicates };
    }

    const availableFields = records.length > 0 ? Object.keys(records[0]) : [];
    
    mappings.forEach(mapping => {
      if (!availableFields.includes(mapping.sourceField)) {
        errors.push(`Source field "${mapping.sourceField}" not found in data`);
      }
    });

    const requiredMappings = mappings.filter(m => m.required);
    
    records.forEach((record, index) => {
      requiredMappings.forEach(mapping => {
        const value = record[mapping.sourceField];
        
        if (value === null || value === undefined || value === '') {
          errors.push(`Required field "${mapping.sourceField}" is empty in row ${index + 1}`);
          return;
        }

        if (mapping.validation && !mapping.validation(value)) {
          errors.push(`Invalid value for field "${mapping.sourceField}" in row ${index + 1}: ${value}`);
        }

        switch (mapping.type) {
          case 'number':
            if (isNaN(Number(value))) {
              errors.push(`Field "${mapping.sourceField}" must be a number in row ${index + 1}: ${value}`);
            }
            break;
          case 'date':
            if (isNaN(Date.parse(value))) {
              errors.push(`Field "${mapping.sourceField}" must be a valid date in row ${index + 1}: ${value}`);
            }
            break;
          case 'boolean':
            if (typeof value !== 'boolean' && !['true', 'false', '1', '0'].includes(value.toString().toLowerCase())) {
              errors.push(`Field "${mapping.sourceField}" must be a boolean in row ${index + 1}: ${value}`);
            }
            break;
        }
      });
    });

    const isValid = errors.length === 0;
    
    return {
      isValid,
      errors,
      warnings,
      duplicates
    };
  }

  static validateQuickBooksEntities(
    records: any[], 
    entityType: 'Bill' | 'BillPayment'
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const duplicates: DuplicateInfo[] = [];

    const requiredFieldsBill: FieldMapping[] = [
      { sourceField: 'txn_id', targetField: 'Id', required: true, type: 'string' },
      { sourceField: 'vend_id', targetField: 'VendorRef', required: true, type: 'string' },
      { sourceField: 'subt_nat_amount', targetField: 'TotalAmt', required: true, type: 'number' },
      { sourceField: 'tx_date', targetField: 'TxnDate', required: true, type: 'date' }
    ];

    const requiredFieldsBillPayment: FieldMapping[] = [
      { sourceField: 'billpayment_id', targetField: 'Id', required: true, type: 'string' },
      { sourceField: 'vend_id', targetField: 'VendorRef', required: true, type: 'string' },
      { sourceField: 'subt_nat_amount', targetField: 'TotalAmt', required: true, type: 'number' }
    ];

    const fieldsToValidate = entityType === 'Bill' ? requiredFieldsBill : requiredFieldsBillPayment;
    
    const fieldValidation = this.validateFieldMappings(records, fieldsToValidate);
    errors.push(...fieldValidation.errors);
    warnings.push(...fieldValidation.warnings);

    const txnIdField = entityType === 'Bill' ? 'txn_id' : 'billpayment_id';
    const txnValidation = this.validateTxnIds(records, txnIdField);
    duplicates.push(...txnValidation.duplicates);
    
    if (txnValidation.warnings.length > 0) {
      warnings.push(...txnValidation.warnings);
    }

    const isValid = errors.length === 0;
    
    return {
      isValid,
      errors,
      warnings,
      duplicates
    };
  }

  static getEntityFieldMappings(entityType: 'Bill' | 'BillPayment'): FieldMapping[] {
    if (entityType === 'Bill') {
      return [
        { sourceField: 'txn_id', targetField: 'Id', required: true, type: 'string' },
        { sourceField: 'vend_id', targetField: 'VendorRef', required: true, type: 'string' },
        { sourceField: 'vend_name', targetField: 'VendorName', required: false, type: 'string' },
        { sourceField: 'subt_nat_amount', targetField: 'TotalAmt', required: true, type: 'number' },
        { sourceField: 'tx_date', targetField: 'TxnDate', required: true, type: 'date' },
        { sourceField: 'doc_num', targetField: 'DocNumber', required: false, type: 'string' },
        { sourceField: 'account_id', targetField: 'APAccountRef', required: false, type: 'string' },
        { sourceField: 'company_id', targetField: 'CompanyId', required: true, type: 'string' }
      ];
    } else {
      return [
        { sourceField: 'billpayment_id', targetField: 'Id', required: true, type: 'string' },
        { sourceField: 'vend_id', targetField: 'VendorRef', required: true, type: 'string' },
        { sourceField: 'vend_name', targetField: 'VendorName', required: false, type: 'string' },
        { sourceField: 'subt_nat_amount', targetField: 'TotalAmt', required: true, type: 'number' },
        { sourceField: 'tx_date', targetField: 'TxnDate', required: false, type: 'date' },
        { sourceField: 'txn_id', targetField: 'LinkedBillId', required: false, type: 'string' },
        { sourceField: 'company_id', targetField: 'CompanyId', required: true, type: 'string' }
      ];
    }
  }
}