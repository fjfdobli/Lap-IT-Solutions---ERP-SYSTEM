import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TableViewer } from '../components/TableViewer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import { Percent, Receipt, CreditCard, Wallet, Users, Cog, Settings2, Database } from 'lucide-react'

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
  { id: 'inv_refdiscount', label: 'Discounts', icon: Percent, description: 'Discount types and rates', color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
  { id: 'inv_reftax', label: 'Tax Rates', icon: Receipt, description: 'Tax configurations', color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  { id: 'inv_refpayment', label: 'Payments', icon: Wallet, description: 'Payment methods', color: 'text-violet-500', bgColor: 'bg-violet-500/10' },
  { id: 'inv_refcreditcard', label: 'Credit Cards', icon: CreditCard, description: 'Accepted card types', color: 'text-amber-500', bgColor: 'bg-amber-500/10' },
  { id: 'inv_refexpense', label: 'Expenses', icon: Receipt, description: 'Expense categories', color: 'text-red-500', bgColor: 'bg-red-500/10' },
  { id: 'inv_refsalesman', label: 'Sales Team', icon: Users, description: 'Sales representatives', color: 'text-cyan-500', bgColor: 'bg-cyan-500/10' },
  { id: 'sys_setup', label: 'System Config', icon: Cog, description: 'System-wide settings', color: 'text-slate-500', bgColor: 'bg-slate-500/10' },
]

export default function SettingsRefPage() {
  const [activeTab, setActiveTab] = useState('inv_refdiscount')
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
        <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50 dark:from-slate-950/50 dark:via-gray-950/50 dark:to-zinc-950/50 overflow-hidden">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-slate-500 to-gray-700 flex items-center justify-center shadow-lg shadow-slate-500/30">
                  <Settings2 className="h-7 w-7 text-white" />
                </div>
                <div>
                  <CardTitle className="text-3xl font-bold bg-gradient-to-r from-slate-600 to-gray-700 bg-clip-text text-transparent">
                    Reference Data & Settings
                  </CardTitle>
                  <CardDescription className="text-base mt-1">
                    Configure discounts, taxes, payments, and system preferences
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="px-3 py-1.5 bg-white/80 dark:bg-slate-800/80">
                  <Database className="h-3.5 w-3.5 mr-1.5 text-slate-500" />
                  Master Data
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
                      flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all text-sm
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

          <TabsContent value="inv_refdiscount" className="mt-0">
            <TableViewer tableName="inv_refdiscount" title="Discount Types" description="Configure discount rates and categories" />
          </TabsContent>
          <TabsContent value="inv_reftax" className="mt-0">
            <TableViewer tableName="inv_reftax" title="Tax Rates" description="Tax configurations and percentages" />
          </TabsContent>
          <TabsContent value="inv_refpayment" className="mt-0">
            <TableViewer tableName="inv_refpayment" title="Payment Methods" description="Accepted payment types" />
          </TabsContent>
          <TabsContent value="inv_refcreditcard" className="mt-0">
            <TableViewer tableName="inv_refcreditcard" title="Credit Card Types" description="Accepted credit and debit cards" />
          </TabsContent>
          <TabsContent value="inv_refexpense" className="mt-0">
            <TableViewer tableName="inv_refexpense" title="Expense Categories" description="Expense types for accounting" />
          </TabsContent>
          <TabsContent value="inv_refsalesman" className="mt-0">
            <TableViewer tableName="inv_refsalesman" title="Sales Team" description="Sales representatives and agents" />
          </TabsContent>
          <TabsContent value="sys_setup" className="mt-0">
            <TableViewer tableName="sys_setup" title="System Configuration" description="System-wide settings and preferences" />
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  )
}
