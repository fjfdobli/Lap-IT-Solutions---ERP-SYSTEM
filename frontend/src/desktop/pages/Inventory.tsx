import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TableViewer } from '../components/TableViewer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import { Package, DollarSign, Boxes, BarChart3, TrendingUp, Box } from 'lucide-react'

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
    id: 'inv_refitem',
    label: 'Stock Levels',
    icon: Package,
    description: 'Current inventory quantities',
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
  },
  {
    id: 'inv_refitemunits',
    label: 'Units of Measure',
    icon: Box,
    description: 'Unit conversions and packaging',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  {
    id: 'inv_refitemsrp',
    label: 'Pricing',
    icon: DollarSign,
    description: 'Retail price information',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
  },
  {
    id: 'inv_refitemcost',
    label: 'Cost History',
    icon: TrendingUp,
    description: 'Historical cost tracking',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
]

export default function Inventory() {
  const [activeTab, setActiveTab] = useState('inv_refitem')
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
        <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/50 dark:via-teal-950/50 dark:to-cyan-950/50 overflow-hidden">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <Boxes className="h-7 w-7 text-white" />
                </div>
                <div>
                  <CardTitle className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                    Inventory Management
                  </CardTitle>
                  <CardDescription className="text-base mt-1">
                    Monitor stock levels, track costs, and manage inventory
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="px-3 py-1.5 bg-white/80 dark:bg-slate-800/80">
                  <BarChart3 className="h-3.5 w-3.5 mr-1.5 text-emerald-500" />
                  Real-time Data
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

          <TabsContent value="inv_refitem" className="mt-0">
            <TableViewer 
              tableName="inv_refitem" 
              title="Stock Levels"
              description="Real-time inventory quantities across all products"
            />
          </TabsContent>

          <TabsContent value="inv_refitemunits" className="mt-0">
            <TableViewer 
              tableName="inv_refitemunits" 
              title="Units of Measure"
              description="Unit conversions and packaging configurations"
            />
          </TabsContent>

          <TabsContent value="inv_refitemsrp" className="mt-0">
            <TableViewer 
              tableName="inv_refitemsrp" 
              title="Product Pricing"
              description="Current retail prices and price structures"
            />
          </TabsContent>

          <TabsContent value="inv_refitemcost" className="mt-0">
            <TableViewer 
              tableName="inv_refitemcost" 
              title="Cost History"
              description="Track cost changes for informed purchasing decisions"
            />
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  )
}
