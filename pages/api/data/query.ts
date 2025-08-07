import { NextApiRequest, NextApiResponse } from 'next';
import { executeDynamicQuery, QueryResult } from '../../../lib/database';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query, companyId, filters } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'SQL query is required' });
    }

    const defaultQuery = `
      with duplicados as (
        select doc_num, tx_date
        from daily.generalledger a
        inner join accounts_production b 
          on a.account_id = b.account_id 
          and a.company_id = b.company_id
        inner join dates c 
          on a.tx_date = c.date_value
        where b.report_type = 'P&L'
          and c.periodo1 > 202505
          and b.company_state like '%PAN%'
          and a.company_id = @companyId
        group by doc_num, tx_date, a.account_id
        having count(*) > 1 and count(distinct a.subt_nat_amount) = 1
      )
      
      select 
          a.company_id,
          a.tx_date, 
          a.account_id,
          a.account_name, 
          a.txn_id, 
          a.txn_type, 
          a.vend_id,
          a.vend_name,   
          a.subt_nat_amount, 
          a.doc_num,
          bp.billpayment_id
      from daily.generalledger a
      inner join accounts_production b 
          on a.account_id = b.account_id 
          and a.company_id = b.company_id
      inner join dates c 
          on a.tx_date = c.date_value
      outer apply (
          select top 1 billpayment_id
          from daily.billpaymentlinelinkedtxn bp
          where bp.txn_id = a.txn_id
            and bp.txn_type = a.txn_type
            and bp.company_id = a.company_id
      ) bp
      where b.report_type = 'P&L'
        and b.company_state like '%PAN%'
        and c.periodo1 > 202501
        and a.company_id = @companyId
        and exists (
            select 1
            from duplicados d
            where d.doc_num = a.doc_num
              and d.tx_date = a.tx_date
        )
      order by a.txn_id, a.doc_num;
    `;

    const queryToExecute = query === 'default' ? defaultQuery : query;
    const result: QueryResult = await executeDynamicQuery(
      queryToExecute,
      companyId,
      filters
    );

    const response = {
      success: true,
      data: result.rows,
      columns: result.columns,
      totalRows: result.rows.length,
      metadata: {
        companyId,
        executedAt: new Date().toISOString(),
        queryType: query === 'default' ? 'predefined' : 'custom'
      }
    };

    res.status(200).json(response);

  } catch (error: any) {
    console.error('Query execution error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}