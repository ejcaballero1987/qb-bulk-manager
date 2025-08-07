import sql from 'mssql';

const config: sql.config = {
  server: process.env.AZURE_SQL_SERVER!,
  database: process.env.AZURE_SQL_DATABASE!,
  user: process.env.AZURE_SQL_USERNAME!,
  password: process.env.AZURE_SQL_PASSWORD!,
  options: {
    encrypt: true,
    trustServerCertificate: false,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

let pool: sql.ConnectionPool | null = null;

export async function getConnection() {
  try {
    if (!pool) {
      pool = new sql.ConnectionPool(config);
      await pool.connect();
      console.log('Connected to Azure SQL Database');
    }
    return pool;
  } catch (err) {
    console.error('Database connection error:', err);
    throw err;
  }
}

export interface QueryResult {
  columns: string[];
  rows: Record<string, any>[];
  recordset: sql.IRecordSet<any>;
}

export async function executeQuery(query: string, params?: Record<string, any>): Promise<QueryResult> {
  try {
    const connection = await getConnection();
    const request = connection.request();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        request.input(key, value);
      });
    }
    
    const result = await request.query(query);
    
    return {
      columns: result.recordset.columns ? Object.keys(result.recordset.columns) : [],
      rows: result.recordset,
      recordset: result.recordset
    };
  } catch (err) {
    console.error('Query execution error:', err);
    throw err;
  }
}

export async function executeDynamicQuery(
  baseQuery: string, 
  companyId?: string,
  customFilters?: Record<string, any>
): Promise<QueryResult> {
  let query = baseQuery;
  const params: Record<string, any> = {};
  
  if (companyId) {
    query = query.replace(/'9130350759506416'/g, '@companyId');
    params.companyId = companyId;
  }
  
  if (customFilters) {
    Object.entries(customFilters).forEach(([key, value]) => {
      params[key] = value;
    });
  }
  
  return executeQuery(query, params);
}