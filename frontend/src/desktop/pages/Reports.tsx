import { useState, useCallback, useEffect } from 'react'
import { api } from '@/lib/api'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  FileText,
  Download,
  Loader2,
  RefreshCw,
  ShoppingCart,
  Package,
  DollarSign,
  TrendingUp,
  BarChart3,
  AlertTriangle,
  Users,
  CreditCard,
  Store,
} from 'lucide-react'
import { format } from 'date-fns'
import { usePOS } from '../lib/pos-context'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import jsPDF from 'jspdf'
import type { jsPDF as JsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

// Report types for OASIS (existing)
const oasisReportTypes = [
  { value: 'executive', label: 'Executive Summary', icon: BarChart3, description: 'High-level overview of all business metrics' },
  { value: 'sales', label: 'Sales Report', icon: DollarSign, description: 'Detailed sales transactions and revenue' },
  { value: 'inventory', label: 'Inventory Report', icon: Package, description: 'Stock levels and product distribution' },
  { value: 'purchasing', label: 'Purchasing Report', icon: ShoppingCart, description: 'Purchase orders and receiving summary' },
  { value: 'operations', label: 'Operations Report', icon: TrendingUp, description: 'Transfers, counts, and movements' },
]

// Report types for R5 (retail-focused)
const r5ReportTypes = [
  { value: 'sales', label: 'Sales Report', icon: DollarSign, description: 'Daily/Weekly/Monthly sales and payment analysis' },
  { value: 'product-performance', label: 'Product Performance', icon: TrendingUp, description: 'Top sellers and slow-moving items' },
  { value: 'inventory', label: 'Inventory Report', icon: Package, description: 'Stock levels and inventory valuation' },
  { value: 'customer', label: 'Customer Analysis', icon: Users, description: 'Top customers and AR aging' },
  { value: 'daily-cash', label: 'Daily Cash Report', icon: CreditCard, description: 'Cash breakdown and payment summary' },
]

// Report types for MyDiner (restaurant-focused)
const mydinerReportTypes = [
  { value: 'sales', label: 'Sales Report', icon: DollarSign, description: 'Sales by server and table turnover' },
  { value: 'menu-performance', label: 'Menu Performance', icon: TrendingUp, description: 'Best-selling dishes and profitability' },
  { value: 'order-analysis', label: 'Order Analysis', icon: BarChart3, description: 'Order patterns and peak hours' },
  { value: 'expense', label: 'Expense Report', icon: AlertTriangle, description: 'Daily expenses and cost analysis' },
  { value: 'inventory', label: 'Inventory Report', icon: Package, description: 'Ingredient levels and wastage' },
  { value: 'server-performance', label: 'Server Performance', icon: Users, description: 'Sales and tips by server' },
  { value: 'customer', label: 'Customer Report', icon: Users, description: 'Regular customers and preferences' },
]



type ReportData = {
  items?: any[]
  totals?: {
    total_sales?: number
    total_transactions?: number
    total_items?: number
    average_sale?: number
    netOfVat?: number
    vat?: number
    grossSales?: number
  }
  stats?: Record<string, unknown>
  [key: string]: unknown
}

// Date filter presets
type DatePreset = 'specific' | 'monthly' | 'yearly'

export default function Reports() {
  const { currentPOS, posConfig } = usePOS()
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [data, setData] = useState<ReportData | null>(null)
  const [reportType, setReportType] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Date filter state
  const [datePreset, setDatePreset] = useState<DatePreset>('specific')
  const [specificDate, setSpecificDate] = useState<Date>(new Date())
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState<number>(2026)
  const [yearlyStartYear, setYearlyStartYear] = useState<number>(2020)
  const [yearlyEndYear, setYearlyEndYear] = useState<number>(2026)

  // Get report types based on current POS
  const getReportTypes = () => {
    if (!currentPOS) return []
    
    switch (currentPOS) {
      case 'oasis':
        return oasisReportTypes
      case 'r5':
        return r5ReportTypes
      case 'mydiner':
        return mydinerReportTypes
      default:
        return []
    }
  }

  const reportTypes = getReportTypes()

  // Set default report type when POS changes
    useEffect(() => {
      if (reportTypes.length > 0) {
        setReportType(reportTypes[0].value)
        setData(null) // Clear previous data when POS changes
      }
    }, [reportTypes])

  // Calculate date range based on preset
  const getDateRange = useCallback((): { from: string | null; to: string | null } => {
    switch (datePreset) {
      case 'specific':
        return {
          from: format(specificDate, 'yyyy-MM-dd'),
          to: format(specificDate, 'yyyy-MM-dd')
        }
      case 'monthly':
        const monthStart = new Date(selectedYear, selectedMonth, 1)
        const monthEnd = new Date(selectedYear, selectedMonth + 1, 0)
        return {
          from: format(monthStart, 'yyyy-MM-dd'),
          to: format(monthEnd, 'yyyy-MM-dd')
        }
      case 'yearly':
        const yearStart = new Date(yearlyStartYear, 0, 1)
        const yearEnd = new Date(yearlyEndYear, 11, 31)
        return {
          from: format(yearStart, 'yyyy-MM-dd'),
          to: format(yearEnd, 'yyyy-MM-dd')
        }
      default:
        return { from: null, to: null }
    }
  }, [datePreset, specificDate, selectedMonth, selectedYear, yearlyStartYear, yearlyEndYear])

  // Determine report type based on date range
  const getReportType = useCallback((): 'single' | 'range' | 'yearly' => {
    switch (datePreset) {
      case 'specific':
        return 'single'
      case 'monthly':
        return 'range'
      case 'yearly':
        return 'yearly'
      default:
        return 'single'
    }
  }, [datePreset])

  // Get API endpoint based on current POS and report type
  const getApiEndpoint = useCallback((reportType: string = ''): string | null => {
    if (!currentPOS) return null

    // For sales reports, use specific endpoints
    if (reportType === 'sales') {
      switch (currentPOS) {
        case 'oasis':
          return '/oasis-reports/sales'
        case 'r5':
          return '/r5-reports/sales'
        case 'mydiner':
          return '/mydiner-reports/sales' // Will be implemented later
        default:
          return null
      }
    }

    // For other reports, use existing endpoints
    switch (currentPOS) {
      case 'oasis':
        return '/dashboard/stats'
      case 'r5':
        return '/r5-reports/stats'
      case 'mydiner':
        return '/mydiner-reports/stats' // Will be implemented later
      default:
        return null
    }
  }, [currentPOS])

  const fetchReportData = useCallback(async () => {
    const endpoint = getApiEndpoint('sales')
    if (!endpoint) {
      setError('No API endpoint configured for this POS')
      return
    }

    setLoading(true)
    setError(null)

    // Get date range parameters
    const dateRange = getDateRange()
    const params = new URLSearchParams()

    if (dateRange.from) params.append('from', dateRange.from)
    if (dateRange.to) params.append('to', dateRange.to)

    const url = params.toString() ? `${endpoint}?${params.toString()}` : endpoint

    try {
      const response = await api.get<ReportData>(url)
      if (response.success && response.data) {
        setData(response.data ?? null)
      } else {
        setError('Failed to fetch report data')
      }
    } catch (err) {
      console.error('Failed to fetch report data:', err)
      setError('Failed to fetch report data')
    } finally {
      setLoading(false)
    }
  }, [getApiEndpoint, getDateRange])

  const generatePDF = async () => {
    if (!currentPOS || !posConfig) {
      setError('Please select a POS system first')
      return
    }

    let reportData = data
    if (!reportData) {
      setLoading(true)
      try {
        const endpoint = getApiEndpoint('sales')
        if (!endpoint) {
          setError('No API endpoint configured for this POS')
          setLoading(false)
          return
        }

        // Get date range parameters
        const dateRange = getDateRange()
        const params = new URLSearchParams()

        if (dateRange.from) params.append('from', dateRange.from)
        if (dateRange.to) params.append('to', dateRange.to)

        const url = params.toString() ? `${endpoint}?${params.toString()}` : endpoint

        const response = await api.get<ReportData>(url)
        if (response.success && response.data) {
          reportData = response.data ?? reportData
          setData(reportData)
        } else {
          setError('Failed to fetch report data')
          setLoading(false)
          return
        }
      } catch (err) {
        console.error('Failed to fetch report data:', err)
        setError('Failed to fetch report data')
        setLoading(false)
        return
      } finally {
        setLoading(false)
      }
    }
    
    if (!reportData) return
    
    setGenerating(true)
    
    try {
      const reportDate = format(new Date(), 'MMMM d, yyyy h:mm a')
      const selectedReport = reportTypes.find(r => r.value === reportType)
      
      // Create PDF document
      const doc = new jsPDF('p', 'mm', 'a4')
      const pageWidth = doc.internal.pageSize.getWidth()
      let yPos = 20
      
      // Colors based on POS
      const primaryColor: [number, number, number] = 
        currentPOS === 'oasis' ? [59, 130, 246] :  // Blue
        currentPOS === 'r5' ? [16, 185, 129] :      // Emerald
        [249, 115, 22]                               // Orange (MyDiner)
      
      const textColor: [number, number, number] = [30, 41, 59]
      const mutedColor: [number, number, number] = [100, 116, 139]
      
      // Header
      doc.setFontSize(24)
      doc.setTextColor(...primaryColor)
      doc.text('Lap IT Solutions ERP System', pageWidth / 2, yPos, { align: 'center' })
      
      yPos += 8
      doc.setFontSize(14)
      doc.setTextColor(...textColor)
      doc.text(posConfig.fullName, pageWidth / 2, yPos, { align: 'center' })
      
      yPos += 8
      doc.setFontSize(16)
      doc.text(selectedReport?.label || 'Business Report', pageWidth / 2, yPos, { align: 'center' })
      
      yPos += 6
      doc.setFontSize(10)
      doc.setTextColor(...mutedColor)
      doc.text(`Generated on ${reportDate}`, pageWidth / 2, yPos, { align: 'center' })
      
      // Divider line
      yPos += 8
      doc.setDrawColor(...primaryColor)
      doc.setLineWidth(0.5)
      doc.line(20, yPos, pageWidth - 20, yPos)
      yPos += 15
      
      // Add report content based on report type
      const reportType = getReportType()
      doc.setFontSize(12)
      doc.setTextColor(...textColor)

      if (reportType === 'single' && reportData.items && reportData.items.length > 0) {
        // Single date - detailed transactions
        doc.text('Transaction Details', 20, yPos)
        yPos += 10

        const tableData = reportData.items.map((item: any) => [
          item.receipt_no || item.receipt || '',
          item.date ? format(new Date(item.date), 'MMM d, yyyy') : '',
          item.item || item.product || '',
          item.customer || 'N/A',
          item.qty || item.quantity || 0,
          `$${(item.price || 0).toFixed(2)}`,
          `$${(item.total || 0).toFixed(2)}`
        ])

        try {
          autoTable(doc as JsPDF, {
            startY: yPos,
            head: [['Receipt No.', 'Date', 'Item', 'Customer', 'Qty', 'Price', 'Total']],
            body: tableData,
            theme: 'grid',
            styles: { fontSize: 8 },
            headStyles: { fillColor: primaryColor, textColor: [255, 255, 255] },
          })
        } catch (err) {
          console.warn('autoTable render failed:', err)
        }
      } else if (reportType === 'range' && reportData.items && reportData.items.length > 0) {
        // Date range - daily totals
        doc.text('Daily Sales Summary', 20, yPos)
        yPos += 10

        const tableData = reportData.items.map((item: any) => [
          item.date ? format(new Date(item.date), 'MMM d, yyyy') : '',
          `$${(item.total || item.amount || 0).toFixed(2)}`
        ])

        try {
          autoTable(doc as JsPDF, {
            startY: yPos,
            head: [['Date', 'Total Sales']],
            body: tableData,
            theme: 'grid',
            styles: { fontSize: 10 },
            headStyles: { fillColor: primaryColor, textColor: [255, 255, 255] },
          })
        } catch (err) {
          console.warn('autoTable render failed:', err)
        }
      } else if (reportType === 'yearly' && reportData.items && reportData.items.length > 0) {
        // Yearly - monthly totals
        doc.text('Monthly Sales Summary', 20, yPos)
        yPos += 10

        const tableData = reportData.items.map((item: any) => [
          item.month || item.period || '',
          `$${(item.total || item.amount || 0).toFixed(2)}`
        ])

        try {
          autoTable(doc as JsPDF, {
            startY: yPos,
            head: [['Month', 'Total Sales']],
            body: tableData,
            theme: 'grid',
            styles: { fontSize: 10 },
            headStyles: { fillColor: primaryColor, textColor: [255, 255, 255] },
          })
        } catch (err) {
          console.warn('autoTable render failed:', err)
        }
      }

      // Add totals section if available
      if (reportData.totals) {
        yPos += 20
        doc.setFontSize(14)
        doc.setTextColor(...primaryColor)
        doc.text('Report Totals', 20, yPos)
        yPos += 10

        doc.setFontSize(10)
        doc.setTextColor(...textColor)
        const totalsData = reportData.reportType === 'Daily Sales Report' ? [
          ['Net of VAT', `$${reportData.totals.netOfVat?.toFixed(2) || '0.00'}`],
          ['VAT (12%)', `$${reportData.totals.vat?.toFixed(2) || '0.00'}`],
          ['Gross Sales', `$${reportData.totals.grossSales?.toFixed(2) || '0.00'}`]
        ] : [
          ['Total Sales', `$${reportData.totals.total_sales?.toFixed(2) || '0.00'}`],
          ['Total Transactions', String(reportData.totals.total_transactions || 0)],
          ['Total Items Sold', String(reportData.totals.total_items || 0)],
          ['Average Sale', `$${reportData.totals.average_sale?.toFixed(2) || '0.00'}`]
        ]

        try {
          autoTable(doc as JsPDF, {
            startY: yPos,
            head: [['Metric', 'Value']],
            body: totalsData,
            theme: 'grid',
            styles: { fontSize: 9 },
            headStyles: { fillColor: primaryColor, textColor: [255, 255, 255] },
          })
        } catch (err) {
          console.warn('autoTable render failed:', err)
        }
      }
      
      // Footer on all pages
      const pageCount = doc.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(...mutedColor)
        doc.text(
          `This report was automatically generated by Lap IT Solutions ERP System | Page ${i} of ${pageCount}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        )
        doc.text(
          `© ${new Date().getFullYear()} Lap IT Solutions. All rights reserved.`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 6,
          { align: 'center' }
        )
      }
      
      // Save the PDF
      const fileName = `${posConfig.name}_${selectedReport?.label.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd_HHmm')}.pdf`
      doc.save(fileName)
      
    } catch (err) {
      console.error('Failed to generate PDF:', err)
      setError('Failed to generate report')
    } finally {
      setGenerating(false)
    }
  }

  const selectedReportInfo = reportTypes.find(r => r.value === reportType)

  // Show message if no POS is selected
  if (!currentPOS) {
    return (
      <motion.div
        className="p-6 space-y-6 max-w-[1400px] mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <Alert>
          <Store className="h-4 w-4" />
          <AlertDescription>
            Please select a POS system first to view reports.
          </AlertDescription>
        </Alert>
      </motion.div>
    )
  }

  return (
    <motion.div
      className="p-6 space-y-6 max-w-[1400px] mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: posConfig?.color }}>
            {posConfig?.fullName} - Reports Center
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Generate and download comprehensive business reports
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={fetchReportData}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Report Selection */}
        <motion.div variants={itemVariants} className="lg:col-span-1">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" style={{ color: posConfig?.color }} />
                Select Report Type
              </CardTitle>
              <CardDescription>Choose the type of report to generate</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {reportTypes.map((report) => {
                const Icon = report.icon
                return (
                  <div
                    key={report.value}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      reportType === report.value
                        ? 'border-primary bg-primary/5'
                        : 'border-transparent bg-muted/50 hover:bg-muted'
                    }`}
                    style={reportType === report.value ? { borderColor: posConfig?.color, backgroundColor: `${posConfig?.color}10` } : {}}
                    onClick={() => setReportType(report.value)}
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className={`p-2 rounded-lg ${reportType === report.value ? 'text-white' : 'bg-background'}`}
                        style={reportType === report.value ? { backgroundColor: posConfig?.color } : {}}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-800 dark:text-slate-200">{report.label}</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">{report.description}</p>
                      </div>
                    </div>
                  </div>
                )
              })}

              <Separator className="my-4" />

              <Button 
                className="w-full gap-2" 
                size="lg"
                onClick={generatePDF}
                disabled={generating || loading}
                style={{ backgroundColor: posConfig?.color, color: 'white' }}
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Generate & Download PDF
                  </>
                )}
              </Button>

              {error && (
                <div className="p-3 rounded-lg bg-red-100 text-red-700 text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  {error}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Report Preview */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card className="border-0 shadow-lg h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {selectedReportInfo && (() => {
                      const SelectedIcon = selectedReportInfo.icon
                      return <SelectedIcon className="h-5 w-5" style={{ color: posConfig?.color }} />
                    })()}
                    <span className="text-slate-800 dark:text-slate-200">{selectedReportInfo?.label} Preview</span>
                  </CardTitle>
                  <CardDescription>
                    {data ? 'Live data preview - Click "Generate & Download PDF" to create the full report' : 'Click "Refresh Data" to load report data'}
                  </CardDescription>
                </div>
              </div>

              {/* New Period Filter Section */}
              <div className="space-y-4 mt-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Period:</span>

                  {/* Period type buttons */}
                  {[
                    { key: 'specific', label: 'Specific Date' },
                    { key: 'monthly', label: 'Monthly' },
                    { key: 'yearly', label: 'Yearly' }
                  ].map(({ key, label }) => (
                    <Button
                      key={key}
                      variant={datePreset === key ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setDatePreset(key as DatePreset)
                        setLoading(true)
                        fetchReportData()
                      }}
                      style={datePreset === key ? { backgroundColor: posConfig?.color, borderColor: posConfig?.color } : {}}
                      className={cn(
                        "text-xs",
                        datePreset === key && "text-white hover:opacity-90"
                      )}
                    >
                      {label}
                    </Button>
                  ))}
                </div>

                {/* Period-specific controls */}
                <div className="flex items-center gap-4 flex-wrap">
                  {datePreset === 'specific' && (
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-medium text-slate-700">Date:</label>
                      <input
                        type="date"
                        value={format(specificDate, 'yyyy-MM-dd')}
                        onChange={(e) => {
                          const date = new Date(e.target.value)
                          setSpecificDate(date)
                          setLoading(true)
                          fetchReportData()
                        }}
                        max={format(new Date(), 'yyyy-MM-dd')}
                        className="px-3 py-1 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  )}

                  {datePreset === 'monthly' && (
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-medium text-slate-700">Month:</label>
                      <select
                        value={selectedMonth}
                        onChange={(e) => {
                          setSelectedMonth(parseInt(e.target.value))
                          setLoading(true)
                          fetchReportData()
                        }}
                        className="px-3 py-1 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {[
                          'January', 'February', 'March', 'April', 'May', 'June',
                          'July', 'August', 'September', 'October', 'November', 'December'
                        ].map((month, index) => (
                          <option key={index} value={index}>{month}</option>
                        ))}
                      </select>
                      <label className="text-xs font-medium text-slate-700">Year:</label>
                      <input
                        type="number"
                        value={selectedYear}
                        onChange={(e) => {
                          setSelectedYear(parseInt(e.target.value))
                          setLoading(true)
                          fetchReportData()
                        }}
                        min="2010"
                        max="2030"
                        className="w-20 px-3 py-1 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  )}

                  {datePreset === 'yearly' && (
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-medium text-slate-700">From:</label>
                      <select
                        value={yearlyStartYear}
                        onChange={(e) => {
                          setYearlyStartYear(parseInt(e.target.value))
                          setLoading(true)
                          fetchReportData()
                        }}
                        className="px-3 py-1 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {Array.from({ length: 17 }, (_, i) => 2010 + i).map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                      <label className="text-xs font-medium text-slate-700">To:</label>
                      <select
                        value={yearlyEndYear}
                        onChange={(e) => {
                          setYearlyEndYear(parseInt(e.target.value))
                          setLoading(true)
                          fetchReportData()
                        }}
                        className="px-3 py-1 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {Array.from({ length: 17 }, (_, i) => 2010 + i).map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Show selected period info */}
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  {datePreset === 'specific' && `Showing data for ${format(specificDate, 'MMM d, yyyy')}`}
                  {datePreset === 'monthly' && `Showing data for ${[
                    'January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'
                  ][selectedMonth]} ${selectedYear}`}
                  {datePreset === 'yearly' && `Showing data from ${yearlyStartYear} to ${yearlyEndYear}`}
                </div>
              </div>


            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px] pr-4">
                {loading ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin" style={{ color: posConfig?.color }} />
                  </div>
                ) : data ? (
                  <div className="space-y-6">
                    {/* Report Summary */}
                    <div className="p-4 rounded-lg" style={{ backgroundColor: `${posConfig?.color}15` }}>
                      <p className="font-medium text-slate-800 dark:text-slate-200">
                        ✅ {posConfig?.fullName} Sales Report Loaded
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        {getReportType() === 'single' && 'Detailed transaction data for selected date'}
                        {getReportType() === 'range' && 'Daily sales summary for selected period'}
                        {getReportType() === 'yearly' && 'Monthly sales summary for selected period'}
                      </p>
                    </div>

                    {/* Report Data Table */}
                    {getReportType() === 'single' && data.items && data.items.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Transaction Details</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Receipt No.</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Item</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead className="text-right">Qty</TableHead>
                                <TableHead className="text-right">Price</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {data.items.map((item: any, index: number) => (
                                <TableRow key={index}>
                                  <TableCell className="font-mono">{item.receipt_no || item.receipt}</TableCell>
                                  <TableCell>{item.date ? format(new Date(item.date), 'MMM d, yyyy') : item.date}</TableCell>
                                  <TableCell>{item.item || item.product}</TableCell>
                                  <TableCell>{item.customer || 'N/A'}</TableCell>
                                  <TableCell className="text-right">{item.qty || item.quantity}</TableCell>
                                  <TableCell className="text-right">${(item.price || 0).toFixed(2)}</TableCell>
                                  <TableCell className="text-right font-medium">${(item.total || 0).toFixed(2)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>
                    )}

                    {getReportType() === 'range' && data.items && data.items.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Daily Sales Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Total Sales</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {data.items.map((item: any, index: number) => (
                                <TableRow key={index}>
                                  <TableCell>{item.date ? format(new Date(item.date), 'MMM d, yyyy') : item.date}</TableCell>
                                  <TableCell className="text-right font-medium">${(item.total || item.amount || 0).toFixed(2)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>
                    )}

                    {getReportType() === 'yearly' && data.items && data.items.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Monthly Sales Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Month</TableHead>
                                <TableHead className="text-right">Total Sales</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {data.items.map((item: any, index: number) => (
                                <TableRow key={index}>
                                  <TableCell>{item.month || item.period}</TableCell>
                                  <TableCell className="text-right font-medium">${(item.total || item.amount || 0).toFixed(2)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>
                    )}

                    {/* Totals Section */}
                    {data.totals && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Report Totals</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {data.reportType === 'Daily Sales Report' ? (
                            // Single date report - show Net of VAT, VAT, Gross Sales
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="text-center p-4 rounded-lg bg-muted">
                                <p className="text-2xl font-bold" style={{ color: posConfig?.color }}>
                                  ${data.totals.netOfVat?.toFixed(2) || '0.00'}
                                </p>
                                <p className="text-sm text-muted-foreground">Net of VAT</p>
                              </div>
                              <div className="text-center p-4 rounded-lg bg-muted">
                                <p className="text-2xl font-bold" style={{ color: posConfig?.color }}>
                                  ${data.totals.vat?.toFixed(2) || '0.00'}
                                </p>
                                <p className="text-sm text-muted-foreground">VAT (12%)</p>
                              </div>
                              <div className="text-center p-4 rounded-lg bg-muted">
                                <p className="text-2xl font-bold" style={{ color: posConfig?.color }}>
                                  ${data.totals.grossSales?.toFixed(2) || '0.00'}
                                </p>
                                <p className="text-sm text-muted-foreground">Gross Sales</p>
                              </div>
                            </div>
                          ) : (
                            // Other reports - show standard totals
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div className="text-center p-4 rounded-lg bg-muted">
                                <p className="text-2xl font-bold" style={{ color: posConfig?.color }}>
                                  ${data.totals.total_sales?.toFixed(2) || '0.00'}
                                </p>
                                <p className="text-sm text-muted-foreground">Total Sales</p>
                              </div>
                              <div className="text-center p-4 rounded-lg bg-muted">
                                <p className="text-2xl font-bold" style={{ color: posConfig?.color }}>
                                  {data.totals.total_transactions || 0}
                                </p>
                                <p className="text-sm text-muted-foreground">Transactions</p>
                              </div>
                              <div className="text-center p-4 rounded-lg bg-muted">
                                <p className="text-2xl font-bold" style={{ color: posConfig?.color }}>
                                  {data.totals.total_items || 0}
                                </p>
                                <p className="text-sm text-muted-foreground">Items Sold</p>
                              </div>
                              <div className="text-center p-4 rounded-lg bg-muted">
                                <p className="text-2xl font-bold" style={{ color: posConfig?.color }}>
                                  ${data.totals.average_sale?.toFixed(2) || '0.00'}
                                </p>
                                <p className="text-sm text-muted-foreground">Avg Sale</p>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                    <FileText className="h-12 w-12 opacity-50 mb-4" />
                    <p className="text-slate-600 dark:text-slate-400">No data loaded</p>
                    <Button variant="link" onClick={fetchReportData} style={{ color: posConfig?.color }}>
                      Load Report Data
                    </Button>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}