import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TableViewer } from '../components/TableViewer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import { Receipt, Package, CreditCard, Clock, ShoppingBag, BarChart3 } from 'lucide-react'

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
  {
    id: 'pos_trans_header',
    label: 'Sales Transactions',
    icon: Receipt,
    description: 'Complete sales transaction records',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
  },
  {
    id: 'pos_trans_details',
    label: 'Line Items',
    icon: Package,
    description: 'Individual items in each sale',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  {
    id: 'pos_trans_payment',
    label: 'Payments',
    icon: CreditCard,
    description: 'Payment methods and amounts',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
  {
    id: 'pos_close_shift',
    label: 'Shift Reports',
    icon: Clock,
    description: 'Cashier shift summaries',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
  },
]

export default function POSTransactionsPage() {
  const [activeTab, setActiveTab] = useState('pos_trans_header')
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
        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-950/50 dark:via-emerald-950/50 dark:to-teal-950/50 overflow-hidden">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/30">
                  <ShoppingBag className="h-7 w-7 text-white" />
                </div>
                <div>
                  <CardTitle className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    Sales Transactions
                  </CardTitle>
                  <CardDescription className="text-base mt-1">
                    Point of Sale transaction history and payment records
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="px-3 py-1.5 bg-white/80 dark:bg-slate-800/80">
                  <BarChart3 className="h-3.5 w-3.5 mr-1.5 text-green-500" />
                  Live Data
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
                      flex items-center gap-2 px-4 py-3 rounded-xl transition-all
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

          <TabsContent value="pos_trans_header" className="mt-0">
            <TableViewer 
              tableName="pos_trans_header" 
              title="Sales Transactions"
              description="Complete history of POS sales transactions"
            />
          </TabsContent>

          <TabsContent value="pos_trans_details" className="mt-0">
            <TableViewer 
              tableName="pos_trans_details" 
              title="Transaction Line Items"
              description="Individual items sold in each transaction"
            />
          </TabsContent>

          <TabsContent value="pos_trans_payment" className="mt-0">
            <TableViewer 
              tableName="pos_trans_payment" 
              title="Payment Records"
              description="Payment methods and amounts for each sale"
            />
          </TabsContent>

          <TabsContent value="pos_close_shift" className="mt-0">
            <TableViewer 
              tableName="pos_close_shift" 
              title="Shift Reports"
              description="Cashier shift summaries and cash reconciliation"
            />
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  )
}
