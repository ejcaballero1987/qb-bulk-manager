import axios, { AxiosResponse } from 'axios';

export interface QuickBooksConfig {
  accessToken: string;
  realmId: string;
  baseUrl: string;
}

export interface ThrottleConfig {
  requestsPerMinute: number;
  delayBetweenRequests: number;
}

export interface OperationLog {
  id: string;
  timestamp: Date;
  operation: 'READ' | 'CREATE' | 'UPDATE' | 'DELETE';
  entity: 'Bill' | 'BillPayment';
  txnId?: string;
  request: any;
  response: any;
  status: 'SUCCESS' | 'ERROR' | 'THROTTLED';
  error?: string;
  companyId: string;
}

class QuickBooksService {
  private config: QuickBooksConfig;
  private throttle: ThrottleConfig;
  private operationLogs: OperationLog[] = [];
  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessingQueue = false;

  constructor(config: QuickBooksConfig, throttle: ThrottleConfig = { requestsPerMinute: 450, delayBetweenRequests: 150 }) {
    this.config = config;
    this.throttle = throttle;
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.requestQueue.length === 0) return;
    
    this.isProcessingQueue = true;
    
    while (this.requestQueue.length > 0) {
      const request = this.requestQueue.shift();
      if (request) {
        try {
          await request();
          await this.delay(this.throttle.delayBetweenRequests);
        } catch (error) {
          console.error('Queue processing error:', error);
        }
      }
    }
    
    this.isProcessingQueue = false;
  }

  public async queueRequest<T>(requestFunc: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          const result = await requestFunc();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      
      this.processQueue();
    });
  }

  private logOperation(
    operation: OperationLog['operation'],
    entity: OperationLog['entity'],
    request: any,
    response: any,
    status: OperationLog['status'],
    txnId?: string,
    error?: string
  ): void {
    const log: OperationLog = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      operation,
      entity,
      txnId,
      request,
      response,
      status,
      error,
      companyId: this.config.realmId
    };
    
    this.operationLogs.push(log);
  }

  async readBill(billId: string): Promise<any> {
    return this.queueRequest(async () => {
      try {
        const response = await axios.get(
          `${this.config.baseUrl}/v3/company/${this.config.realmId}/bill/${billId}`,
          {
            headers: {
              'Authorization': `Bearer ${this.config.accessToken}`,
              'Accept': 'application/json'
            }
          }
        );

        this.logOperation('READ', 'Bill', { billId }, response.data, 'SUCCESS', billId);
        return response.data;
      } catch (error: any) {
        this.logOperation('READ', 'Bill', { billId }, null, 'ERROR', billId, error.message);
        throw error;
      }
    });
  }

  async readBillPayment(billPaymentId: string): Promise<any> {
    return this.queueRequest(async () => {
      try {
        const response = await axios.get(
          `${this.config.baseUrl}/v3/company/${this.config.realmId}/billpayment/${billPaymentId}`,
          {
            headers: {
              'Authorization': `Bearer ${this.config.accessToken}`,
              'Accept': 'application/json'
            }
          }
        );

        this.logOperation('READ', 'BillPayment', { billPaymentId }, response.data, 'SUCCESS', billPaymentId);
        return response.data;
      } catch (error: any) {
        this.logOperation('READ', 'BillPayment', { billPaymentId }, null, 'ERROR', billPaymentId, error.message);
        throw error;
      }
    });
  }

  async deleteBill(billId: string, syncToken: string): Promise<any> {
    return this.queueRequest(async () => {
      try {
        const response = await axios.post(
          `${this.config.baseUrl}/v3/company/${this.config.realmId}/bill?operation=delete`,
          {
            Id: billId,
            SyncToken: syncToken
          },
          {
            headers: {
              'Authorization': `Bearer ${this.config.accessToken}`,
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          }
        );

        this.logOperation('DELETE', 'Bill', { billId, syncToken }, response.data, 'SUCCESS', billId);
        return response.data;
      } catch (error: any) {
        this.logOperation('DELETE', 'Bill', { billId, syncToken }, null, 'ERROR', billId, error.message);
        throw error;
      }
    });
  }

  async deleteBillPayment(billPaymentId: string, syncToken: string): Promise<any> {
    return this.queueRequest(async () => {
      try {
        const response = await axios.post(
          `${this.config.baseUrl}/v3/company/${this.config.realmId}/billpayment?operation=delete`,
          {
            Id: billPaymentId,
            SyncToken: syncToken
          },
          {
            headers: {
              'Authorization': `Bearer ${this.config.accessToken}`,
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          }
        );

        this.logOperation('DELETE', 'BillPayment', { billPaymentId, syncToken }, response.data, 'SUCCESS', billPaymentId);
        return response.data;
      } catch (error: any) {
        this.logOperation('DELETE', 'BillPayment', { billPaymentId, syncToken }, null, 'ERROR', billPaymentId, error.message);
        throw error;
      }
    });
  }

  async bulkDeleteBills(billIds: string[]): Promise<any[]> {
    const results = [];
    
    for (const billId of billIds) {
      try {
        const billData = await this.readBill(billId);
        const syncToken = billData.QueryResponse.Bill[0].SyncToken;
        const deleteResult = await this.deleteBill(billId, syncToken);
        results.push({ billId, status: 'SUCCESS', result: deleteResult });
      } catch (error: any) {
        results.push({ billId, status: 'ERROR', error: error.message });
      }
    }
    
    return results;
  }

  async bulkDeleteBillPayments(billPaymentIds: string[]): Promise<any[]> {
    const results = [];
    
    for (const billPaymentId of billPaymentIds) {
      try {
        const billPaymentData = await this.readBillPayment(billPaymentId);
        const syncToken = billPaymentData.QueryResponse.BillPayment[0].SyncToken;
        const deleteResult = await this.deleteBillPayment(billPaymentId, syncToken);
        results.push({ billPaymentId, status: 'SUCCESS', result: deleteResult });
      } catch (error: any) {
        results.push({ billPaymentId, status: 'ERROR', error: error.message });
      }
    }
    
    return results;
  }

  async bulkDeleteWithRelatedRecords(
    records: Array<{
      txn_id?: string;
      billpayment_id?: string;
      txn_type?: string;
      doc_num?: string;
      deleteStrategy: 'bill_only' | 'both' | 'payment_only';
    }>
  ): Promise<any[]> {
    const results = [];
    
    for (const record of records) {
      try {
        const recordResult = {
          record,
          operations: [] as any[],
          status: 'SUCCESS' as 'SUCCESS' | 'PARTIAL' | 'ERROR',
          errors: [] as string[]
        };

        // Strategy 1: Delete BillPayment first (if exists and requested)
        if (record.billpayment_id && (record.deleteStrategy === 'both' || record.deleteStrategy === 'payment_only')) {
          try {
            const billPaymentData = await this.readBillPayment(record.billpayment_id);
            const syncToken = billPaymentData.QueryResponse.BillPayment[0].SyncToken;
            const deleteResult = await this.deleteBillPayment(record.billpayment_id, syncToken);
            
            recordResult.operations.push({
              type: 'DELETE_BILLPAYMENT',
              id: record.billpayment_id,
              result: deleteResult,
              status: 'SUCCESS'
            });
          } catch (error: any) {
            recordResult.errors.push(`BillPayment deletion failed: ${error.message}`);
            recordResult.status = 'PARTIAL';
            
            recordResult.operations.push({
              type: 'DELETE_BILLPAYMENT',
              id: record.billpayment_id,
              error: error.message,
              status: 'ERROR'
            });
          }
        }

        // Strategy 2: Delete Bill (if requested)
        if (record.txn_id && (record.deleteStrategy === 'both' || record.deleteStrategy === 'bill_only')) {
          try {
            const billData = await this.readBill(record.txn_id);
            const syncToken = billData.QueryResponse.Bill[0].SyncToken;
            const deleteResult = await this.deleteBill(record.txn_id, syncToken);
            
            recordResult.operations.push({
              type: 'DELETE_BILL',
              id: record.txn_id,
              result: deleteResult,
              status: 'SUCCESS'
            });
          } catch (error: any) {
            recordResult.errors.push(`Bill deletion failed: ${error.message}`);
            recordResult.status = recordResult.status === 'SUCCESS' ? 'PARTIAL' : 'ERROR';
            
            recordResult.operations.push({
              type: 'DELETE_BILL',
              id: record.txn_id,
              error: error.message,
              status: 'ERROR'
            });
          }
        }

        // Determine final status
        if (recordResult.operations.length === 0) {
          recordResult.status = 'ERROR';
          recordResult.errors.push('No operations performed - invalid strategy or missing IDs');
        } else if (recordResult.errors.length === 0) {
          recordResult.status = 'SUCCESS';
        }

        results.push(recordResult);

      } catch (error: any) {
        results.push({
          record,
          operations: [],
          status: 'ERROR' as const,
          errors: [`Unexpected error: ${error.message}`]
        });
      }
    }
    
    return results;
  }

  getOperationLogs(): OperationLog[] {
    return this.operationLogs;
  }

  clearLogs(): void {
    this.operationLogs = [];
  }
}

export default QuickBooksService;