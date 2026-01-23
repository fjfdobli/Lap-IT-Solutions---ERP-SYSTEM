import { Router, Request, Response } from 'express'
import { posPool } from '../database/database'
import { authenticateToken } from '../middleware/auth'

const router = Router()

// Helper function for safe queries
async function safeQuery(
  query: string,
  params: any[] = [],
  fallback: any = []
) {
  try {
    const [rows] = await posPool.query(query, params)
    return rows || fallback
  } catch (error) {
    console.error(`Query error:`, error)
    return fallback
  }
}

// =======================
// GET SALES REPORT
// =======================
router.get('/sales', async (req: Request, res: Response) => {
  try {
    console.log('[Oasis Reports] Starting sales report request')
    console.log('[Oasis Reports] Query params:', req.query)

    const { from, to, reportType } = req.query

    console.log('[Oasis Reports] Destructured params:', { from, to, reportType })

    // Validate date parameters
    if (!from || !to) {
      return res.status(400).json({
        success: false,
        message: 'Date range parameters are required (from and to in YYYY-MM-DD format)',
      })
    }

    const fromDate = from as string
    const toDate = to as string
    const isSingleDate = fromDate === toDate

    let data: any = {}

    console.log('[Oasis Reports] About to check if single date:', isSingleDate)

    if (isSingleDate) {
      console.log('[Oasis Reports] Single date report, fromDate:', fromDate)
      // ===== SINGLE DATE REPORT =====
      // ===== 1. ITEM DETAILS =====
      const itemsQuery = `
        SELECT
          d.TRNo_D          AS receiptNo,
          d.DateTrans       AS date,
          d.ItemName        AS itemName,
          d.CustName        AS custName,
          d.Qty             AS qty,
          d.Price           AS price,
          d.Total           AS total
        FROM pos_trans_details_main d
        WHERE DATE(d.DateTrans) = ?
        ORDER BY d.TRNo_D;
      `

      const totalsQuery = `
        SELECT
          SUM(SubTotal) AS netOfVat,
          SUM(Tax) AS vat,
          SUM(TotalSales) AS grossSales
        FROM pos_trans_header_main
        WHERE DATE(DateTrans) = ?;
      `

      const [itemsResult, totalsResult] = await Promise.all([
        safeQuery(itemsQuery, [fromDate]),
        safeQuery(totalsQuery, [fromDate], []),
      ])

      const items = itemsResult
      const totals = totalsResult[0]

      data = {
        reportType: 'Daily Sales Report',
        dateRange: { from: fromDate, to: toDate },
        columns: ['Receipt No.', 'Date', 'Item', 'Customer', 'Qty Sold', 'Price', 'Total'],
        items: items.map((item: any) => ({
          receipt_no: item.receiptNo,
          date: item.date,
          item: item.itemName,
          customer: item.custName || 'Walk-in',
          qty: Number(item.qty) || 0,
          price: Number(item.price) || 0,
          total: Number(item.total) || 0,
        })),
        totals: {
          netOfVat: Number(totals.netOfVat) || 0,
          vat: Number(totals.vat) || 0,
          grossSales: Number(totals.grossSales) || 0,
        },
      }
    } else {
      // ===== DATE RANGE REPORT =====
      const dateRangeQuery = `
        SELECT
          DATE(d.DateTrans) AS date,
          SUM(d.Total)      AS total
        FROM pos_trans_details_main d
        WHERE DATE(d.DateTrans) BETWEEN ? AND ?
        GROUP BY DATE(d.DateTrans)
        ORDER BY DATE(d.DateTrans);
      `

      const dateRangeData = await safeQuery(dateRangeQuery, [fromDate, toDate])

      data = {
        reportType: 'Sales Report',
        dateRange: { from: fromDate, to: toDate },
        columns: ['Date', 'Total'],
        items: dateRangeData.map((item: any) => ({
          date: item.date,
          total: Number(item.total) || 0,
        })),
        totals: {
          totalSales: dateRangeData.reduce((sum: number, item: any) => sum + Number(item.total || 0), 0),
        },
      }
    }

    res.json({
      success: true,
      data,
    })
  } catch (error: any) {
    console.error('[Oasis Reports] Error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch Oasis sales report data',
      details: error?.message,
    })
  }
})

// =======================
// GET MONTHLY SALES REPORT
// =======================
// =======================
// GET MONTHLY SALES REPORT
// =======================
router.get('/sales/monthly', async (req: Request, res: Response) => {
  console.log('[Oasis Reports] Fetching monthly sales report data...')

  const { year } = req.query

  if (!year) {
    return res.status(400).json({
      success: false,
      message: 'Year parameter is required (YYYY format)',
    })
  }

  try {
    const monthlyQuery = `
      SELECT
        YEAR(DateTrans)  AS salesYear,
        MONTH(DateTrans) AS salesMonth,
        DATE_FORMAT(DateTrans, '%Y-%m') AS monthLabel,
        SUM(TotalSales)  AS monthlyTotal
      FROM pos_trans_header_main
      WHERE YEAR(DateTrans) = ?
      GROUP BY YEAR(DateTrans), MONTH(DateTrans)
      ORDER BY YEAR(DateTrans), MONTH(DateTrans);
    `

    const monthlyData = await safeQuery(monthlyQuery, [year])

    const data = {
      reportType: 'Monthly Sales Report',
      year,
      columns: ['Month', 'Total'],
      items: monthlyData.map((item: any) => ({
        month: item.monthLabel || `Month ${item.salesMonth}`,
        total: Number(item.monthlyTotal) || 0,
      })),
      totals: {
        totalSales: monthlyData.reduce((sum: number, item: any) => sum + Number(item.monthlyTotal || 0), 0),
      },
    }

    res.json({
      success: true,
      data,
    })
  } catch (error: any) {
    console.error('[Oasis Reports] Error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch Oasis monthly sales report data',
      details: error?.message,
    })
  }
})

export default router
