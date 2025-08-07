import { NextApiRequest, NextApiResponse } from 'next';
import QuickBooksService from '../../../lib/quickbooks';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      accessToken, 
      realmId, 
      records,
      baseUrl = process.env.QUICKBOOKS_BASE_URL 
    } = req.body;

    if (!accessToken || !realmId) {
      return res.status(400).json({ error: 'AccessToken and RealmId are required' });
    }

    if (!records || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ error: 'Records array is required' });
    }

    const qbService = new QuickBooksService({
      accessToken,
      realmId,
      baseUrl
    });

    // Process records with the advanced deletion logic
    const results = await qbService.bulkDeleteWithRelatedRecords(records);

    const operationLogs = qbService.getOperationLogs();
    
    // Calculate summary statistics
    const summary = {
      totalRequested: records.length,
      successful: results.filter(r => r.status === 'SUCCESS').length,
      partial: results.filter(r => r.status === 'PARTIAL').length,
      failed: results.filter(r => r.status === 'ERROR').length,
      totalOperations: results.reduce((sum, r) => sum + r.operations.length, 0),
      successfulOperations: results.reduce((sum, r) => sum + r.operations.filter(op => op.status === 'SUCCESS').length, 0),
      failedOperations: results.reduce((sum, r) => sum + r.operations.filter(op => op.status === 'ERROR').length, 0),
    };

    summary['successRate'] = ((summary.successful / records.length) * 100).toFixed(2);
    summary['operationSuccessRate'] = summary.totalOperations > 0 
      ? ((summary.successfulOperations / summary.totalOperations) * 100).toFixed(2)
      : '0';

    res.status(200).json({
      success: true,
      results,
      summary,
      operationLogs,
      metadata: {
        operation: 'BULK_DELETE_ADVANCED',
        executedAt: new Date().toISOString(),
        realmId,
        strategiesUsed: {
          billOnly: records.filter(r => r.deleteStrategy === 'bill_only').length,
          both: records.filter(r => r.deleteStrategy === 'both').length,
          paymentOnly: records.filter(r => r.deleteStrategy === 'payment_only').length
        }
      }
    });

  } catch (error: any) {
    console.error('Advanced bulk delete error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}