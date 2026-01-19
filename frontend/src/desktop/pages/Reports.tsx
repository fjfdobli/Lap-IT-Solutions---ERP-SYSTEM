import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, Download } from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format } from 'date-fns'

// Types
interface Transaction {
  receiptNo: string
  date: string
  itemName: string
  customer: string
  qtySold: number
  price: number
  total: number
}

interface DailySales {
  transactions: Transaction[]
  net: number
  vat: number
  total: number
}

interface MonthlySales {
  date: string
  total: number
}

interface YearlySales {
  month: string
  total: number
}

interface SalesData {
  daily?: DailySales
  monthly?: MonthlySales[]
  yearly?: YearlySales[]
}

// Mock API for demonstration (replace with your real API call)
const fetchSalesData = async (range: 'daily' | 'monthly' | 'yearly'): Promise<SalesData> => {
  if (range === 'daily') {
    return {
      daily: {
        transactions: [
          { receiptNo: '123456', date: '2026-01-17', itemName: 'Lexar 240GB SSD', customer: 'Juan dela Cruz', qtySold: 1, price: 1000, total: 1000 },
          { receiptNo: '123457', date: '2026-01-17', itemName: 'Nvision 20" LED Monitor', customer: 'Jose Rizal', qtySold: 2, price: 2000, total: 4000 },
          { receiptNo: '123458', date: '2026-01-17', itemName: 'Cash Drawer', customer: 'Louie Cabigon', qtySold: 2, price: 3500, total: 7000 },
        ],
        net: 10714.28571,
        vat: 1285.714286,
        total: 12000,
      },
    }
  }
  if (range === 'monthly') {
    return {
      monthly: Array.from({ length: 31 }, (_, i) => ({
        date: `2026-01-${String(i + 1).padStart(2, '0')}`,
        total: Math.floor(Math.random() * 100000),
      })),
    }
  }
  if (range === 'yearly') {
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December']
    return {
      yearly: months.map(month => ({ month, total: Math.floor(Math.random() * 100000) })),
    }
  }
  return {}
}

export default function SalesReport() {
  const [reportRange, setReportRange] = useState<'daily' | 'monthly' | 'yearly'>('daily')
  const [salesData, setSalesData] = useState<SalesData>({})
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    loadData()
  }, [reportRange])

  const loadData = async () => {
    setLoading(true)
    const data = await fetchSalesData(reportRange)
    setSalesData(data)
    setLoading(false)
  }

  const formatCurrency = (value: number) =>
    `₱${value.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const generatePDF = () => {
    if (!salesData) return

    const doc = new jsPDF('p', 'mm', 'a4')
    const pageWidth = doc.internal.pageSize.getWidth()
    let yPos = 20

    doc.setFontSize(16)
    doc.text('Lap IT Solutions ERP System', pageWidth / 2, yPos, { align: 'center' })
    yPos += 8
    doc.setFontSize(14)
    doc.text('Sales Report', pageWidth / 2, yPos, { align: 'center' })
    yPos += 6
    doc.setFontSize(10)
    doc.text(`Generated: ${format(new Date(), 'MMMM d, yyyy HH:mm')}`, pageWidth / 2, yPos, { align: 'center' })
    yPos += 10

    if (reportRange === 'daily' && salesData.daily) {
      doc.setFontSize(12)
      doc.text('Daily Sales', 20, yPos)
      yPos += 6

      autoTable(doc, {
        startY: yPos,
        head: [['Receipt No.', 'Date', 'Item', 'Customer', 'Qty Sold', 'Price', 'Total']],
        body: salesData.daily.transactions.map(t => [
          t.receiptNo,
          format(new Date(t.date), 'MM/dd/yyyy'),
          t.itemName,
          t.customer,
          t.qtySold.toString(),
          formatCurrency(t.price),
          formatCurrency(t.total),
        ]),
        theme: 'grid',
        headStyles: { fillColor: [30, 64, 175], textColor: 255, fontSize: 9 },
        bodyStyles: { fontSize: 8 },
        margin: { left: 20, right: 20 },
      })

      const finalY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6
      doc.text(`Net of VAT: ${formatCurrency(salesData.daily.net)}`, 140, finalY)
      doc.text(`VAT (12%): ${formatCurrency(salesData.daily.vat)}`, 140, finalY + 6)
      doc.text(`GROSS SALES: ${formatCurrency(salesData.daily.total)}`, 140, finalY + 12)
    }

    if (reportRange === 'monthly' && salesData.monthly) {
      doc.setFontSize(12)
      doc.text('Monthly Sales', 20, yPos)
      yPos += 6
      autoTable(doc, {
        startY: yPos,
        head: [['Date', 'Total']],
        body: salesData.monthly.map(m => [format(new Date(m.date), 'MM/dd/yyyy'), formatCurrency(m.total)]),
        theme: 'grid',
        headStyles: { fillColor: [30, 64, 175], textColor: 255, fontSize: 9 },
        bodyStyles: { fontSize: 8 },
        margin: { left: 20, right: 20 },
      })
    }

    if (reportRange === 'yearly' && salesData.yearly) {
      doc.setFontSize(12)
      doc.text('Yearly Sales', 20, yPos)
      yPos += 6
      autoTable(doc, {
        startY: yPos,
        head: [['Month', 'Total']],
        body: salesData.yearly.map(m => [m.month, formatCurrency(m.total)]),
        theme: 'grid',
        headStyles: { fillColor: [30, 64, 175], textColor: 255, fontSize: 9 },
        bodyStyles: { fontSize: 8 },
        margin: { left: 20, right: 20 },
      })
    }

    doc.save(`Sales_Report_${reportRange}_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`)
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        {(['daily','monthly','yearly'] as const).map(range => (
          <Button
            key={range}
            variant={reportRange === range ? 'default' : 'outline'}
            onClick={() => setReportRange(range)}
          >
            {range.charAt(0).toUpperCase() + range.slice(1)}
          </Button>
        ))}
        <Button onClick={generatePDF} disabled={generating || loading} className="ml-auto gap-2">
          {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Generate PDF
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="table-auto border-collapse border border-slate-300 w-full text-sm">
            <thead className="bg-primary text-white">
              {reportRange === 'daily' && (
                <tr>
                  <th className="border px-2 py-1">Receipt No.</th>
                  <th className="border px-2 py-1">Date</th>
                  <th className="border px-2 py-1">Item</th>
                  <th className="border px-2 py-1">Customer</th>
                  <th className="border px-2 py-1">Qty Sold</th>
                  <th className="border px-2 py-1">Price</th>
                  <th className="border px-2 py-1">Total</th>
                </tr>
              )}
              {reportRange === 'monthly' && (
                <tr>
                  <th className="border px-2 py-1">Date</th>
                  <th className="border px-2 py-1">Total</th>
                </tr>
              )}
              {reportRange === 'yearly' && (
                <tr>
                  <th className="border px-2 py-1">Month</th>
                  <th className="border px-2 py-1">Total</th>
                </tr>
              )}
            </thead>
            <tbody>
              {reportRange === 'daily' &&
                salesData.daily?.transactions.map(t => (
                  <tr key={t.receiptNo}>
                    <td className="border px-2 py-1">{t.receiptNo}</td>
                    <td className="border px-2 py-1">{format(new Date(t.date), 'MM/dd/yyyy')}</td>
                    <td className="border px-2 py-1">{t.itemName}</td>
                    <td className="border px-2 py-1">{t.customer}</td>
                    <td className="border px-2 py-1">{t.qtySold}</td>
                    <td className="border px-2 py-1">{formatCurrency(t.price)}</td>
                    <td className="border px-2 py-1">{formatCurrency(t.total)}</td>
                  </tr>
                ))}
              {reportRange === 'monthly' &&
                salesData.monthly?.map(m => (
                  <tr key={m.date}>
                    <td className="border px-2 py-1">{format(new Date(m.date), 'MM/dd/yyyy')}</td>
                    <td className="border px-2 py-1">{formatCurrency(m.total)}</td>
                  </tr>
                ))}
              {reportRange === 'yearly' &&
                salesData.yearly?.map(m => (
                  <tr key={m.month}>
                    <td className="border px-2 py-1">{m.month}</td>
                    <td className="border px-2 py-1">{formatCurrency(m.total)}</td>
                  </tr>
                ))}
            </tbody>
            {reportRange === 'daily' && salesData.daily && (
              <tfoot>
                <tr>
                  <td colSpan={6} className="border px-2 py-1 font-bold text-right">Net of VAT</td>
                  <td className="border px-2 py-1 font-bold">{formatCurrency(salesData.daily.net)}</td>
                </tr>
                <tr>
                  <td colSpan={6} className="border px-2 py-1 font-bold text-right">VAT (12%)</td>
                  <td className="border px-2 py-1 font-bold">{formatCurrency(salesData.daily.vat)}</td>
                </tr>
                <tr>
                  <td colSpan={6} className="border px-2 py-1 font-bold text-right">GROSS SALES</td>
                  <td className="border px-2 py-1 font-bold">{formatCurrency(salesData.daily.total)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}
    </div>
  )
}
