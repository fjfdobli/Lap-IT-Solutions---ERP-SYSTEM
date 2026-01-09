import { useState, useCallback } from 'react'
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
  Truck,
  BarChart3,
  AlertTriangle,
} from 'lucide-react'
import { format } from 'date-fns'
import jsPDF from 'jspdf'
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

interface ReportData {
  masterData: {
    products: number
    suppliers: number
    customers: number
    classes: number
    departments: number
    branches: number
    locations: number
  }
  sales: {
    total: { count: number; amount: number }
    today: { count: number; amount: number }
    thisWeek: { count: number; amount: number }
    thisMonth: { count: number; amount: number }
  }
  operations: {
    receiving: { total: number; totalValue: number; thisMonth: number; pending: number }
    transfers: { out: number; in: number }
    purchaseOrders: { total: number; totalValue: number; pending: number; pendingValue: number; thisMonth: number; thisMonthValue: number }
    physicalCount: number
    itemMovements: { total: number; today: number }
  }
  adjustments: {
    voids: { count: number; amount: number }
    returns: { count: number; amount: number }
  }
  topProducts: Array<{ ItemCode: string; productName: string; totalQty: number; totalAmount: number; transactionCount: number }>
  inventoryByClass: Array<{ className: string; productCount: number }>
  salesByPayment: Array<{ PaymentType: string; count: number; total: number }>
}

const reportTypes = [
  { value: 'executive', label: 'Executive Summary', icon: BarChart3, description: 'High-level overview of all business metrics' },
  { value: 'sales', label: 'Sales Report', icon: DollarSign, description: 'Detailed sales transactions and revenue' },
  { value: 'inventory', label: 'Inventory Report', icon: Package, description: 'Stock levels and product distribution' },
  { value: 'purchasing', label: 'Purchasing Report', icon: ShoppingCart, description: 'Purchase orders and receiving summary' },
  { value: 'operations', label: 'Operations Report', icon: TrendingUp, description: 'Transfers, counts, and movements' },
]

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format(value)
}

export default function Reports() {
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [data, setData] = useState<ReportData | null>(null)
  const [reportType, setReportType] = useState('executive')
  const [error, setError] = useState<string | null>(null)

  const fetchReportData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.get<ReportData>('/dashboard/stats')
      if (response.success && response.data) {
        setData(response.data)
      } else {
        setError('Failed to fetch report data')
      }
    } catch (err) {
      console.error('Failed to fetch report data:', err)
      setError('Failed to fetch report data')
    } finally {
      setLoading(false)
    }
  }, [])

  const generatePDF = async () => {
    let reportData = data
    if (!reportData) {
      setLoading(true)
      try {
        const response = await api.get<ReportData>('/dashboard/stats')
        if (response.success && response.data) {
          reportData = response.data
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
      
      // Colors
      const primaryColor: [number, number, number] = [30, 64, 175] // Blue
      const textColor: [number, number, number] = [30, 41, 59]
      const mutedColor: [number, number, number] = [100, 116, 139]
      
      // Header
      doc.setFontSize(24)
      doc.setTextColor(...primaryColor)
      doc.text('Lap IT Solutions ERP System', pageWidth / 2, yPos, { align: 'center' })
      
      yPos += 10
      doc.setFontSize(16)
      doc.setTextColor(...textColor)
      doc.text(selectedReport?.label || 'Business Report', pageWidth / 2, yPos, { align: 'center' })
      
      yPos += 8
      doc.setFontSize(10)
      doc.setTextColor(...mutedColor)
      doc.text(`Generated on ${reportDate}`, pageWidth / 2, yPos, { align: 'center' })
      
      // Divider line
      yPos += 8
      doc.setDrawColor(...primaryColor)
      doc.setLineWidth(0.5)
      doc.line(20, yPos, pageWidth - 20, yPos)
      yPos += 15
      
      // Helper function for section titles
      const addSectionTitle = (title: string) => {
        if (yPos > 260) {
          doc.addPage()
          yPos = 20
        }
        doc.setFontSize(14)
        doc.setTextColor(...primaryColor)
        doc.text(title, 20, yPos)
        yPos += 10
      }
      
      // Helper function to add stat boxes
      const addStatBox = (label: string, value: string, subValue?: string, x?: number, width?: number) => {
        const boxX = x ?? 20
        const boxWidth = width ?? 40
        
        doc.setFillColor(248, 250, 252)
        doc.roundedRect(boxX, yPos, boxWidth, subValue ? 22 : 18, 2, 2, 'F')
        
        doc.setFontSize(8)
        doc.setTextColor(...mutedColor)
        doc.text(label.toUpperCase(), boxX + 3, yPos + 5)
        
        doc.setFontSize(14)
        doc.setTextColor(...textColor)
        doc.text(value, boxX + 3, yPos + 13)
        
        if (subValue) {
          doc.setFontSize(8)
          doc.setTextColor(59, 130, 246)
          doc.text(subValue, boxX + 3, yPos + 19)
        }
      }
      
      // Sales Performance Section
      if (reportType === 'executive' || reportType === 'sales') {
        addSectionTitle('Sales Performance')
        
        const boxWidth = (pageWidth - 50) / 4
        addStatBox('Total Sales', reportData.sales.total.count.toLocaleString(), formatCurrency(reportData.sales.total.amount), 20, boxWidth)
        addStatBox("Today's Sales", reportData.sales.today.count.toLocaleString(), formatCurrency(reportData.sales.today.amount), 20 + boxWidth + 3, boxWidth)
        addStatBox('This Week', reportData.sales.thisWeek.count.toLocaleString(), formatCurrency(reportData.sales.thisWeek.amount), 20 + (boxWidth + 3) * 2, boxWidth)
        addStatBox('This Month', reportData.sales.thisMonth.count.toLocaleString(), formatCurrency(reportData.sales.thisMonth.amount), 20 + (boxWidth + 3) * 3, boxWidth)
        
        yPos += 30
      }
      
      // Top Products Table
      if ((reportType === 'executive' || reportType === 'sales') && reportData.topProducts.length > 0) {
        addSectionTitle('Top Selling Products')
        
        const tableData = reportData.topProducts.slice(0, 10).map((p, i) => [
          (i + 1).toString(),
          p.ItemCode,
          p.productName?.substring(0, 30) || 'N/A',
          Number(p.totalQty).toLocaleString(),
          formatCurrency(Number(p.totalAmount)),
          Number(p.transactionCount).toLocaleString()
        ])
        
        autoTable(doc, {
          startY: yPos,
          head: [['#', 'Code', 'Product Name', 'Qty Sold', 'Revenue', 'Transactions']],
          body: tableData,
          theme: 'striped',
          headStyles: { fillColor: [30, 64, 175], textColor: 255, fontSize: 9 },
          bodyStyles: { fontSize: 8 },
          columnStyles: {
            0: { cellWidth: 10 },
            1: { cellWidth: 25 },
            2: { cellWidth: 60 },
            3: { halign: 'right', cellWidth: 25 },
            4: { halign: 'right', cellWidth: 30 },
            5: { halign: 'center', cellWidth: 25 }
          },
          margin: { left: 20, right: 20 }
        })
        
        yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15
      }
      
      // Sales by Payment Type
      if ((reportType === 'executive' || reportType === 'sales') && reportData.salesByPayment.length > 0) {
        addSectionTitle('Sales by Payment Type')
        
        const paymentData = reportData.salesByPayment.map(p => [
          p.PaymentType || 'Unknown',
          Number(p.count).toLocaleString(),
          formatCurrency(Number(p.total))
        ])
        
        autoTable(doc, {
          startY: yPos,
          head: [['Payment Type', 'Transactions', 'Total Amount']],
          body: paymentData,
          theme: 'striped',
          headStyles: { fillColor: [30, 64, 175], textColor: 255, fontSize: 9 },
          bodyStyles: { fontSize: 8 },
          columnStyles: {
            0: { cellWidth: 60 },
            1: { halign: 'right', cellWidth: 40 },
            2: { halign: 'right', cellWidth: 50 }
          },
          margin: { left: 20, right: 20 }
        })
        
        yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15
      }
      
      // Master Data Summary
      if (reportType === 'executive' || reportType === 'inventory') {
        if (yPos > 240) {
          doc.addPage()
          yPos = 20
        }
        
        addSectionTitle('Master Data Summary')
        
        const boxWidth = (pageWidth - 50) / 4
        addStatBox('Total Products', reportData.masterData.products.toLocaleString(), undefined, 20, boxWidth)
        addStatBox('Suppliers', reportData.masterData.suppliers.toLocaleString(), undefined, 20 + boxWidth + 3, boxWidth)
        addStatBox('Customers', reportData.masterData.customers.toLocaleString(), undefined, 20 + (boxWidth + 3) * 2, boxWidth)
        addStatBox('Categories', reportData.masterData.classes.toLocaleString(), undefined, 20 + (boxWidth + 3) * 3, boxWidth)
        
        yPos += 25
      }
      
      // Inventory by Category
      if ((reportType === 'executive' || reportType === 'inventory') && reportData.inventoryByClass.length > 0) {
        addSectionTitle('Inventory by Category')
        
        const categoryData = reportData.inventoryByClass.map(c => [
          c.className || 'Uncategorized',
          Number(c.productCount).toLocaleString()
        ])
        
        autoTable(doc, {
          startY: yPos,
          head: [['Category', 'Product Count']],
          body: categoryData,
          theme: 'striped',
          headStyles: { fillColor: [30, 64, 175], textColor: 255, fontSize: 9 },
          bodyStyles: { fontSize: 8 },
          columnStyles: {
            0: { cellWidth: 100 },
            1: { halign: 'right', cellWidth: 50 }
          },
          margin: { left: 20, right: 20 }
        })
        
        yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15
      }
      
      // Purchase Orders Summary
      if (reportType === 'executive' || reportType === 'purchasing') {
        if (yPos > 240) {
          doc.addPage()
          yPos = 20
        }
        
        addSectionTitle('Purchase Orders Summary')
        
        const boxWidth = (pageWidth - 46) / 3
        addStatBox('Total POs', reportData.operations.purchaseOrders.total.toLocaleString(), formatCurrency(reportData.operations.purchaseOrders.totalValue), 20, boxWidth)
        addStatBox('Pending POs', reportData.operations.purchaseOrders.pending.toLocaleString(), formatCurrency(reportData.operations.purchaseOrders.pendingValue), 20 + boxWidth + 3, boxWidth)
        addStatBox('This Month', reportData.operations.purchaseOrders.thisMonth.toLocaleString(), formatCurrency(reportData.operations.purchaseOrders.thisMonthValue), 20 + (boxWidth + 3) * 2, boxWidth)
        
        yPos += 30
      }
      
      // Receiving Summary
      if (reportType === 'executive' || reportType === 'purchasing') {
        addSectionTitle('Receiving Summary')
        
        const boxWidth = (pageWidth - 46) / 3
        addStatBox('Total Receiving', reportData.operations.receiving.total.toLocaleString(), formatCurrency(reportData.operations.receiving.totalValue), 20, boxWidth)
        addStatBox('This Month', reportData.operations.receiving.thisMonth.toLocaleString(), undefined, 20 + boxWidth + 3, boxWidth)
        addStatBox('Pending', reportData.operations.receiving.pending.toLocaleString(), undefined, 20 + (boxWidth + 3) * 2, boxWidth)
        
        yPos += 25
      }
      
      // Operations Summary
      if (reportType === 'executive' || reportType === 'operations') {
        if (yPos > 240) {
          doc.addPage()
          yPos = 20
        }
        
        addSectionTitle('Operations Summary')
        
        const boxWidth = (pageWidth - 50) / 4
        addStatBox('Transfer Out', reportData.operations.transfers.out.toLocaleString(), undefined, 20, boxWidth)
        addStatBox('Transfer In', reportData.operations.transfers.in.toLocaleString(), undefined, 20 + boxWidth + 3, boxWidth)
        addStatBox('Physical Counts', reportData.operations.physicalCount.toLocaleString(), undefined, 20 + (boxWidth + 3) * 2, boxWidth)
        addStatBox('Item Movements', reportData.operations.itemMovements.total.toLocaleString(), `${reportData.operations.itemMovements.today} today`, 20 + (boxWidth + 3) * 3, boxWidth)
        
        yPos += 30
      }
      
      // Adjustments (Voids & Returns)
      if (reportType === 'executive' || reportType === 'operations') {
        addSectionTitle('Adjustments (Voids & Returns)')
        
        const boxWidth = (pageWidth - 43) / 2
        addStatBox('Voided Transactions', reportData.adjustments.voids.count.toLocaleString(), formatCurrency(reportData.adjustments.voids.amount), 20, boxWidth)
        addStatBox('Returns', reportData.adjustments.returns.count.toLocaleString(), formatCurrency(reportData.adjustments.returns.amount), 20 + boxWidth + 3, boxWidth)
        
        yPos += 30
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
      const fileName = `${selectedReport?.label.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd_HHmm')}.pdf`
      doc.save(fileName)
      
    } catch (err) {
      console.error('Failed to generate PDF:', err)
      setError('Failed to generate report')
    } finally {
      setGenerating(false)
    }
  }

  const selectedReportInfo = reportTypes.find(r => r.value === reportType)

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
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            Reports Center
          </h1>
          <p className="text-muted-foreground mt-1">
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
                <FileText className="h-5 w-5 text-primary" />
                Select Report Type
              </CardTitle>
              <CardDescription>Choose the type of report to generate</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {reportTypes.map((report) => (
                <div
                  key={report.value}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    reportType === report.value
                      ? 'border-primary bg-primary/5'
                      : 'border-transparent bg-muted/50 hover:bg-muted'
                  }`}
                  onClick={() => setReportType(report.value)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${reportType === report.value ? 'bg-primary text-white' : 'bg-background'}`}>
                      <report.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">{report.label}</p>
                      <p className="text-xs text-muted-foreground">{report.description}</p>
                    </div>
                  </div>
                </div>
              ))}

              <Separator className="my-4" />

              <Button 
                className="w-full gap-2" 
                size="lg"
                onClick={generatePDF}
                disabled={generating || loading}
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
                    {selectedReportInfo && <selectedReportInfo.icon className="h-5 w-5 text-primary" />}
                    {selectedReportInfo?.label} Preview
                  </CardTitle>
                  <CardDescription>
                    {data ? 'Live data preview' : 'Click "Refresh Data" to load report data'}
                  </CardDescription>
                </div>
                <Badge variant="outline" className="gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(), 'MMM d, yyyy')}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px] pr-4">
                {loading ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : data ? (
                  <div className="space-y-6">
                    {/* Sales Summary */}
                    {(reportType === 'executive' || reportType === 'sales') && (
                      <div>
                        <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          SALES PERFORMANCE
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30">
                            <p className="text-xs text-muted-foreground">Total Sales</p>
                            <p className="text-xl font-bold">{data.sales.total.count.toLocaleString()}</p>
                            <p className="text-xs text-blue-600">{formatCurrency(data.sales.total.amount)}</p>
                          </div>
                          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
                            <p className="text-xs text-muted-foreground">Today</p>
                            <p className="text-xl font-bold">{data.sales.today.count.toLocaleString()}</p>
                            <p className="text-xs text-emerald-600">{formatCurrency(data.sales.today.amount)}</p>
                          </div>
                          <div className="p-3 rounded-lg bg-violet-50 dark:bg-violet-950/30">
                            <p className="text-xs text-muted-foreground">This Week</p>
                            <p className="text-xl font-bold">{data.sales.thisWeek.count.toLocaleString()}</p>
                            <p className="text-xs text-violet-600">{formatCurrency(data.sales.thisWeek.amount)}</p>
                          </div>
                          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30">
                            <p className="text-xs text-muted-foreground">This Month</p>
                            <p className="text-xl font-bold">{data.sales.thisMonth.count.toLocaleString()}</p>
                            <p className="text-xs text-amber-600">{formatCurrency(data.sales.thisMonth.amount)}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Master Data */}
                    {(reportType === 'executive' || reportType === 'inventory') && (
                      <div>
                        <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          MASTER DATA
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="p-3 rounded-lg bg-muted/50">
                            <p className="text-xs text-muted-foreground">Products</p>
                            <p className="text-xl font-bold">{data.masterData.products.toLocaleString()}</p>
                          </div>
                          <div className="p-3 rounded-lg bg-muted/50">
                            <p className="text-xs text-muted-foreground">Suppliers</p>
                            <p className="text-xl font-bold">{data.masterData.suppliers.toLocaleString()}</p>
                          </div>
                          <div className="p-3 rounded-lg bg-muted/50">
                            <p className="text-xs text-muted-foreground">Customers</p>
                            <p className="text-xl font-bold">{data.masterData.customers.toLocaleString()}</p>
                          </div>
                          <div className="p-3 rounded-lg bg-muted/50">
                            <p className="text-xs text-muted-foreground">Categories</p>
                            <p className="text-xl font-bold">{data.masterData.classes.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Purchase Orders */}
                    {(reportType === 'executive' || reportType === 'purchasing') && (
                      <div>
                        <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                          <ShoppingCart className="h-4 w-4" />
                          PURCHASE ORDERS
                        </h3>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30">
                            <p className="text-xs text-muted-foreground">Total POs</p>
                            <p className="text-xl font-bold">{data.operations.purchaseOrders.total.toLocaleString()}</p>
                            <p className="text-xs text-blue-600">{formatCurrency(data.operations.purchaseOrders.totalValue)}</p>
                          </div>
                          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30">
                            <p className="text-xs text-muted-foreground">Pending</p>
                            <p className="text-xl font-bold text-amber-600">{data.operations.purchaseOrders.pending.toLocaleString()}</p>
                            <p className="text-xs text-amber-600">{formatCurrency(data.operations.purchaseOrders.pendingValue)}</p>
                          </div>
                          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
                            <p className="text-xs text-muted-foreground">This Month</p>
                            <p className="text-xl font-bold">{data.operations.purchaseOrders.thisMonth.toLocaleString()}</p>
                            <p className="text-xs text-emerald-600">{formatCurrency(data.operations.purchaseOrders.thisMonthValue)}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Receiving */}
                    {(reportType === 'executive' || reportType === 'purchasing') && (
                      <div>
                        <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                          <Truck className="h-4 w-4" />
                          RECEIVING
                        </h3>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="p-3 rounded-lg bg-muted/50">
                            <p className="text-xs text-muted-foreground">Total</p>
                            <p className="text-xl font-bold">{data.operations.receiving.total.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">{formatCurrency(data.operations.receiving.totalValue)}</p>
                          </div>
                          <div className="p-3 rounded-lg bg-muted/50">
                            <p className="text-xs text-muted-foreground">This Month</p>
                            <p className="text-xl font-bold">{data.operations.receiving.thisMonth.toLocaleString()}</p>
                          </div>
                          <div className="p-3 rounded-lg bg-muted/50">
                            <p className="text-xs text-muted-foreground">Pending</p>
                            <p className="text-xl font-bold text-amber-600">{data.operations.receiving.pending.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Operations */}
                    {(reportType === 'executive' || reportType === 'operations') && (
                      <div>
                        <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          OPERATIONS
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="p-3 rounded-lg bg-muted/50">
                            <p className="text-xs text-muted-foreground">Transfer Out</p>
                            <p className="text-xl font-bold">{data.operations.transfers.out.toLocaleString()}</p>
                          </div>
                          <div className="p-3 rounded-lg bg-muted/50">
                            <p className="text-xs text-muted-foreground">Transfer In</p>
                            <p className="text-xl font-bold">{data.operations.transfers.in.toLocaleString()}</p>
                          </div>
                          <div className="p-3 rounded-lg bg-muted/50">
                            <p className="text-xs text-muted-foreground">Physical Counts</p>
                            <p className="text-xl font-bold">{data.operations.physicalCount.toLocaleString()}</p>
                          </div>
                          <div className="p-3 rounded-lg bg-muted/50">
                            <p className="text-xs text-muted-foreground">Item Movements</p>
                            <p className="text-xl font-bold">{data.operations.itemMovements.total.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Adjustments */}
                    {(reportType === 'executive' || reportType === 'operations') && (
                      <div>
                        <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4" />
                          ADJUSTMENTS
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30">
                            <p className="text-xs text-muted-foreground">Voids</p>
                            <p className="text-xl font-bold text-red-600">{data.adjustments.voids.count.toLocaleString()}</p>
                            <p className="text-xs text-red-600">{formatCurrency(data.adjustments.voids.amount)}</p>
                          </div>
                          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30">
                            <p className="text-xs text-muted-foreground">Returns</p>
                            <p className="text-xl font-bold text-amber-600">{data.adjustments.returns.count.toLocaleString()}</p>
                            <p className="text-xs text-amber-600">{formatCurrency(data.adjustments.returns.amount)}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Top Products */}
                    {(reportType === 'executive' || reportType === 'sales') && data.topProducts.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                          <BarChart3 className="h-4 w-4" />
                          TOP SELLING PRODUCTS
                        </h3>
                        <div className="space-y-2">
                          {data.topProducts.slice(0, 5).map((product, index) => (
                            <div key={product.ItemCode} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                                index === 0 ? 'bg-amber-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-amber-700' : 'bg-gray-300'
                              }`}>
                                {index + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{product.productName}</p>
                                <p className="text-xs text-muted-foreground">{product.ItemCode}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-sm">{formatCurrency(Number(product.totalAmount))}</p>
                                <p className="text-xs text-muted-foreground">{Number(product.totalQty).toLocaleString()} sold</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                    <FileText className="h-12 w-12 opacity-50 mb-4" />
                    <p>No data loaded</p>
                    <Button variant="link" onClick={fetchReportData}>
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
