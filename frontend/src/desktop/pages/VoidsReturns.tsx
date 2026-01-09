import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TableViewer } from '../components/TableViewer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import { RotateCcw, XCircle, Package, AlertTriangle, FileX } from 'lucide-react'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 100, damping: 12 },
  },
}

const tabs = [
  { id: 'pos_void_header', label: 'Voided Sales', icon: XCircle, description: 'Cancelled transaction records', color: 'text-red-500', bgColor: 'bg-red-500/10' },
  { id: 'pos_void_details', label: 'Voided Items', icon: FileX, description: 'Items from voided transactions', color: 'text-rose-500', bgColor: 'bg-rose-500/10' },
  { id: 'pos_return_header', label: 'Sales Returns', icon: RotateCcw, description: 'Customer return transactions', color: 'text-amber-500', bgColor: 'bg-amber-500/10' },
  { id: 'pos_return_details', label: 'Return Items', icon: Package, description: 'Products returned by customers', color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
]

export default function VoidsReturnsPage() {
  const [activeTab, setActiveTab] = useState('pos_void_header')
  const currentTab = tabs.find(t => t.id === activeTab)

  return (
    <motion.div
      className="p-8 space-y-8 max-w-[1800px] mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 via-rose-50 to-orange-50 dark:from-red-950/50 dark:via-rose-950/50 dark:to-orange-950/50 overflow-hidden">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-500/30">
                  <AlertTriangle className="h-7 w-7 text-white" />
                </div>
                <div>
                  <CardTitle className="text-3xl font-bold bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">
                    Voids & Returns
                  </CardTitle>
                  <CardDescription className="text-base mt-1">
                    Track voided transactions and customer returns
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="px-3 py-1.5 bg-white/80 dark:bg-slate-800/80">
                  <RotateCcw className="h-3.5 w-3.5 mr-1.5 text-red-500" />
                  Adjustments
                </Badge>
              </div>
            </div>
          </CardHeader>
        </Card>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={itemVariants}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <Card className="border-0 shadow-md mb-6">
            <CardContent className="p-2">
              <TabsList className="w-full h-auto flex-wrap gap-2 bg-transparent p-0">
                {tabs.map((tab) => (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className={`
                      flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all
                      data-[state=active]:shadow-md
                      data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80
                      data-[state=active]:text-primary-foreground
                    `}
                  >
                    <tab.icon className="h-4 w-4" />
                    <span className="font-medium">{tab.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </CardContent>
          </Card>

          {currentTab && (
            <motion.div 
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 mb-6"
            >
              <div className={`h-10 w-10 rounded-xl ${currentTab.bgColor} flex items-center justify-center`}>
                <currentTab.icon className={`h-5 w-5 ${currentTab.color}`} />
              </div>
              <div>
                <h2 className="font-semibold">{currentTab.label}</h2>
                <p className="text-sm text-muted-foreground">{currentTab.description}</p>
              </div>
            </motion.div>
          )}

          <TabsContent value="pos_void_header" className="mt-0">
            <TableViewer tableName="pos_void_header" title="Voided Transactions" description="Cancelled sales transaction records" />
          </TabsContent>
          <TabsContent value="pos_void_details" className="mt-0">
            <TableViewer tableName="pos_void_details" title="Voided Line Items" description="Items from voided transactions" />
          </TabsContent>
          <TabsContent value="pos_return_header" className="mt-0">
            <TableViewer tableName="pos_return_header" title="Sales Returns" description="Customer return transaction records" />
          </TabsContent>
          <TabsContent value="pos_return_details" className="mt-0">
            <TableViewer tableName="pos_return_details" title="Return Line Items" description="Products returned by customers" />
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  )
}
