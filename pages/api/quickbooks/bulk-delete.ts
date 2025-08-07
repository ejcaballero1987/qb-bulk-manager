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
      entityType, 
      entityIds,
      baseUrl = process.env.QUICKBOOKS_BASE_URL 
    } = req.body;

    if (!accessToken || !realmId) {
      return res.status(400).json({ error: 'AccessToken and RealmId are required' });
    }

    if (!entityType || !['Bill', 'BillPayment'].includes(entityType)) {
      return res.status(400).json({ error: 'EntityType must be either "Bill" or "BillPayment"' });
    }

    if (!entityIds || !Array.isArray(entityIds) || entityIds.length === 0) {
      return res.status(400).json({ error: 'EntityIds array is required' });
    }

    const qbService = new QuickBooksService({
      accessToken,
      realmId,
      baseUrl
    });

    let results = [];

    if (entityType === 'Bill') {
      results = await qbService.bulkDeleteBills(entityIds);
    } else {
      results = await qbService.bulkDeleteBillPayments(entityIds);
    }

    const operationLogs = qbService.getOperationLogs();
    
    const summary = {
      totalRequested: entityIds.length,
      successful: results.filter(r => r.status === 'SUCCESS').length,
      failed: results.filter(r => r.status === 'ERROR').length,
      successRate: (results.filter(r => r.status === 'SUCCESS').length / entityIds.length * 100).toFixed(2)
    };

    res.status(200).json({
      success: true,
      results,
      summary,
      operationLogs,
      metadata: {
        entityType,
        executedAt: new Date().toISOString(),
        realmId
      }
    });

  } catch (error: any) {
    console.error('Bulk delete error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}