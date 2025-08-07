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
      bills,
      baseUrl = process.env.QUICKBOOKS_BASE_URL 
    } = req.body;

    if (!accessToken || !realmId) {
      return res.status(400).json({ error: 'AccessToken and RealmId are required' });
    }

    if (!bills || !Array.isArray(bills) || bills.length === 0) {
      return res.status(400).json({ error: 'Bills array is required' });
    }

    const qbService = new QuickBooksService({
      accessToken,
      realmId,
      baseUrl
    });

    const results = [];

    for (const billData of bills) {
      try {
        const response = await qbService.queueRequest(async () => {
          const result = await fetch(
            `${baseUrl}/v3/company/${realmId}/bill`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(billData)
            }
          );

          if (!result.ok) {
            throw new Error(`HTTP ${result.status}: ${result.statusText}`);
          }

          return await result.json();
        });

        results.push({
          billData,
          status: 'SUCCESS',
          result: response
        });

      } catch (error: any) {
        results.push({
          billData,
          status: 'ERROR',
          error: error.message
        });
      }
    }

    const operationLogs = qbService.getOperationLogs();
    
    const summary = {
      totalRequested: bills.length,
      successful: results.filter(r => r.status === 'SUCCESS').length,
      failed: results.filter(r => r.status === 'ERROR').length,
      successRate: (results.filter(r => r.status === 'SUCCESS').length / bills.length * 100).toFixed(2)
    };

    res.status(200).json({
      success: true,
      results,
      summary,
      operationLogs,
      metadata: {
        entityType: 'Bill',
        operation: 'CREATE',
        executedAt: new Date().toISOString(),
        realmId
      }
    });

  } catch (error: any) {
    console.error('Bulk create error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}