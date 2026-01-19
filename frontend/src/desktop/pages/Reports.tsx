import { useState, useCallback, useEffect } from 'react'
import { api } from '@/lib/api'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  FileText,
  Download,
  Loader2,
  RefreshCw,
  Calendar,
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
import jsPDF from 'jspdf'
import type { jsPDF as JsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { usePOS } from '../lib/pos-context'
import { Alert, AlertDescription } from '@/components/ui/alert'

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
  stats?: Record<string, unknown>
  [key: string]: unknown
}

export default function Reports() {
  const { currentPOS, posConfig } = usePOS()
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [data, setData] = useState<ReportData | null>(null)
  const [reportType, setReportType] = useState('')
  const [error, setError] = useState<string | null>(null)

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

  // Get API endpoint based on current POS
  const getApiEndpoint = useCallback((): string | null => {
    if (!currentPOS) return null
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
    const endpoint = getApiEndpoint()
    if (!endpoint) {
      setError('No API endpoint configured for this POS')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const response = await api.get<ReportData>(endpoint)
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
  }, [getApiEndpoint])

  const generatePDF = async () => {
    if (!currentPOS || !posConfig) {
      setError('Please select a POS system first')
      return
    }

    let reportData = data
    if (!reportData) {
      setLoading(true)
      try {
        const endpoint = getApiEndpoint()
        if (!endpoint) {
          setError('No API endpoint configured for this POS')
          setLoading(false)
          return
        }

        const response = await api.get<ReportData>(endpoint)
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
      
      // Add report content
      doc.setFontSize(12)
      doc.setTextColor(...textColor)
      doc.text(`Report for ${posConfig.fullName} - ${selectedReport?.label}`, 20, yPos)
      yPos += 10
      doc.text('Full report content will be available soon.', 20, yPos)
      yPos += 8

      // If report data includes `stats`, render a simple key/value table using autoTable
      const stats = (reportData as Record<string, unknown>)?.stats as Record<string, unknown> | undefined
      if (stats) {
        const rows = Object.entries(stats).map(([k, v]) => [k, String(v)])
        try {
          autoTable(doc as JsPDF, {
            startY: yPos,
            head: [['Metric', 'Value']],
            body: rows,
            theme: 'grid',
          })
          yPos += 8
        } catch (err) {
          // fall back silently if autoTable fails
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
                <Badge variant="outline" className="gap-1" style={{ borderColor: posConfig?.color, color: posConfig?.color }}>
                  <Calendar className="h-3 w-3" />
                  {format(new Date(), 'MMM d, yyyy')}
                </Badge>
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
                    <div className="p-4 rounded-lg" style={{ backgroundColor: `${posConfig?.color}15` }}>
                      <p className="font-medium text-slate-800 dark:text-slate-200">
                        ✅ {posConfig?.fullName} Report Data Loaded
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        {currentPOS === 'r5' && `${reportTypes.length} R5 retail-focused reports available`}
                        {currentPOS === 'oasis' && `${reportTypes.length} OASIS reports available`}
                        {currentPOS === 'mydiner' && `${reportTypes.length} MyDiner restaurant reports available`}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                        Click "Generate & Download PDF" to create the full report with detailed data.
                      </p>
                    </div>
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
