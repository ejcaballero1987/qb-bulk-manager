# QuickBooks Bulk Manager

Sistema completo para gestión masiva de entidades QuickBooks (Bills y BillPayments) con soporte multi-compañía.

## Características

✅ **Fuentes de datos múltiples**
- Consultas dinámicas a Azure SQL Database
- Carga desde archivos CSV
- Pegado desde Excel
- Entrada manual

✅ **Operaciones QuickBooks**
- DELETE masivo con sync tokens automático
- Control de throttling (evita "throttled exceeded")
- Logging completo de operaciones
- Soporte multi-compañía

✅ **Validaciones inteligentes**
- Detección de duplicados por TXN ID
- Validación de campos requeridos
- Mapeo flexible de campos
- Vista previa antes de operaciones

✅ **Interfaz intuitiva**
- Proceso paso a paso
- Selección manual de registros
- Vista previa y validación
- Exportación de resultados

## Configuración

1. **Instalar dependencias:**
```bash
npm install
```

2. **Configurar variables de entorno (.env.local):**
```env
# QuickBooks API
QUICKBOOKS_CLIENT_ID=your_client_id
QUICKBOOKS_CLIENT_SECRET=your_client_secret
QUICKBOOKS_BASE_URL=https://sandbox-quickbooks.api.intuit.com

# Azure SQL
AZURE_SQL_SERVER=your_server.database.windows.net
AZURE_SQL_DATABASE=your_database
AZURE_SQL_USERNAME=your_username
AZURE_SQL_PASSWORD=your_password
```

3. **Ejecutar en desarrollo:**
```bash
npm run dev
```

## Uso

### 1. Query de datos
- **Azure SQL**: Usa el query predefinido o personalizado
- **CSV**: Sube archivo CSV con headers
- **Excel**: Copia y pega datos desde Excel
- **Manual**: Entrada manual de datos

### 2. Mapeo de campos
- Selecciona el tipo de entidad (Bill/BillPayment)
- Mapea campos de origen a campos QuickBooks
- Selecciona registros específicos para procesar

### 3. Validación
- Revisa duplicados por TXN ID
- Valida campos requeridos
- Ve resumen de validaciones

### 4. Operaciones QuickBooks
- Ingresa credenciales QuickBooks (Access Token, Realm ID)
- Ejecuta operaciones masivas
- Monitorea progreso en tiempo real

### 5. Resultados y logs
- Ve resumen de operaciones
- Revisa logs detallados
- Exporta resultados en JSON/CSV

## Query SQL predefinido

El sistema incluye tu query de duplicados:

```sql
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
```

## Estructura del proyecto

```
├── lib/
│   ├── database.ts          # Conexión Azure SQL
│   ├── quickbooks.ts        # Servicio QuickBooks con throttling
│   ├── validation.ts        # Validaciones y duplicados
│   └── dataLoader.ts        # Carga de datos múltiples fuentes
├── pages/
│   ├── api/
│   │   ├── data/query.ts    # API para queries SQL
│   │   └── quickbooks/      # APIs QuickBooks operations
│   └── index.tsx            # Página principal
├── components/
│   ├── DataQueryComponent.tsx
│   ├── FieldMappingComponent.tsx
│   ├── ValidationComponent.tsx
│   ├── BulkOperationsComponent.tsx
│   └── OperationLogsComponent.tsx
└── README.md
```

## Próximas funcionalidades

- CREATE y UPDATE masivo
- Autenticación OAuth automática
- Programación de operaciones
- Dashboard de métricas
- Webhook notifications

## Seguridad

- Tokens de acceso cifrados
- Validación de permisos
- Logs de auditoría
- Rate limiting automático