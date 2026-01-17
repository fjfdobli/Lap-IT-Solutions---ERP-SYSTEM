import { useState } from 'react'
import { usePOS } from '../lib/pos-context'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { POSTableViewer } from '../components/POSTableViewer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import { Percent, Receipt, CreditCard, Wallet, Users, Cog, Settings2, Database, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

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
  { id: 'inv_refdiscount', label: 'Discounts', icon: Percent, description: 'Discount types and rates' },
  { id: 'inv_reftax', label: 'Tax Rates', icon: Receipt, description: 'Tax configurations' },
  { id: 'inv_refpayment', label: 'Payments', icon: Wallet, description: 'Payment methods' },
  { id: 'inv_refcreditcard', label: 'Credit Cards', icon: CreditCard, description: 'Accepted card types' },
  { id: 'inv_refexpense', label: 'Expenses', icon: Receipt, description: 'Expense categories' },
  { id: 'inv_refsalesman', label: 'Sales Team', icon: Users, description: 'Sales representatives' },
  { id: 'sys_setup', label: 'System Config', icon: Cog, description: 'System-wide settings' },
]

export default function SettingsRefPage() {
  const { currentPOS, posConfig } = usePOS()
  const [activeTab, setActiveTab] = useState('inv_refdiscount')
  const currentTab = tabs.find(t => t.id === activeTab)

  if (!currentPOS) {
    return (
      <motion.div
        className="p-8 space-y-8 max-w-[1800px] mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants}>
          <Card className="border-0 shadow-lg">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <AlertCircle className="h-16 w-16 text-amber-500 mb-4" />
              <p className="text-lg font-medium">No POS System Selected</p>
              <p className="text-sm text-muted-foreground mt-1">
                Please select a POS system from the sidebar
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    )
  }

  const Icon = posConfig?.icon || Settings2

  return (
    <motion.div
      className="p-8 space-y-8 max-w-[1800px] mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <Card className={cn(
          "border-0 shadow-lg overflow-hidden",
          posConfig?.lightBg
        )}>
          <div className={cn("h-1", posConfig?.bgColor)} />
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "h-14 w-14 rounded-2xl flex items-center justify-center shadow-lg",
                  posConfig?.bgColor
                )}>
                  <Settings2 className="h-7 w-7 text-white" />
                </div>
                <div>
                  <CardTitle className="text-3xl font-bold">
                    Reference Data & Settings
                  </CardTitle>
                  <CardDescription className="text-base mt-1 flex items-center gap-2">
                    Configure discounts, taxes, payments, and system preferences
                    <Badge variant="outline" className={cn("ml-2", posConfig?.borderColor, posConfig?.textColor)}>
                      <Icon className="h-3 w-3 mr-1" />
                      {posConfig?.name}
                    </Badge>
                  </CardDescription>
                </div>
              </div>
              <Badge variant="secondary" className="px-3 py-1.5">
                <Database className={cn("h-3.5 w-3.5 mr-1.5", posConfig?.textColor)} />
                Master Data
              </Badge>
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
                    className={cn(
                      "flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all text-sm",
                      "data-[state=active]:shadow-md",
                      `data-[state=active]:${posConfig?.bgColor} data-[state=active]:text-white`
                    )}
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
              <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", posConfig?.lightBg)}>
                <currentTab.icon className={cn("h-5 w-5", posConfig?.textColor)} />
              </div>
              <div>
                <h2 className="font-semibold">{currentTab.label}</h2>
                <p className="text-sm text-muted-foreground">{currentTab.description}</p>
              </div>
            </motion.div>
          )}

          <TabsContent value="inv_refdiscount" className="mt-0">
            <POSTableViewer 
              tableName="inv_refdiscount" 
              title="Discount Types" 
              description="Configure discount rates and categories"
              icon={<Percent className={cn("h-6 w-6", posConfig?.textColor)} />}
            />
          </TabsContent>
          <TabsContent value="inv_reftax" className="mt-0">
            <POSTableViewer 
              tableName="inv_reftax" 
              title="Tax Rates" 
              description="Tax configurations and percentages"
              icon={<Receipt className={cn("h-6 w-6", posConfig?.textColor)} />}
            />
          </TabsContent>
          <TabsContent value="inv_refpayment" className="mt-0">
            <POSTableViewer 
              tableName="inv_refpayment" 
              title="Payment Methods" 
              description="Accepted payment types"
              icon={<Wallet className={cn("h-6 w-6", posConfig?.textColor)} />}
            />
          </TabsContent>
          <TabsContent value="inv_refcreditcard" className="mt-0">
            <POSTableViewer 
              tableName="inv_refcreditcard" 
              title="Credit Card Types" 
              description="Accepted credit and debit cards"
              icon={<CreditCard className={cn("h-6 w-6", posConfig?.textColor)} />}
            />
          </TabsContent>
          <TabsContent value="inv_refexpense" className="mt-0">
            <POSTableViewer 
              tableName="inv_refexpense" 
              title="Expense Categories" 
              description="Expense types for accounting"
              icon={<Receipt className={cn("h-6 w-6", posConfig?.textColor)} />}
            />
          </TabsContent>
          <TabsContent value="inv_refsalesman" className="mt-0">
            <POSTableViewer 
              tableName="inv_refsalesman" 
              title="Sales Team" 
              description="Sales representatives and agents"
              icon={<Users className={cn("h-6 w-6", posConfig?.textColor)} />}
            />
          </TabsContent>
          <TabsContent value="sys_setup" className="mt-0">
            <POSTableViewer 
              tableName="sys_setup" 
              title="System Configuration" 
              description="System-wide settings and preferences"
              icon={<Cog className={cn("h-6 w-6", posConfig?.textColor)} />}
            />
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  )
}
