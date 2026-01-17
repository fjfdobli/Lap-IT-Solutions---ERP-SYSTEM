import { useState } from 'react'
import { usePOS } from '../lib/pos-context'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { POSTableViewer } from '../components/POSTableViewer'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import { 
  Tag, 
  DollarSign, 
  Box, 
  Package, 
  Link2, 
  Image as ImageIcon,
  TrendingUp,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 100, damping: 15 },
  },
}

interface TabConfig {
  id: string
  label: string
  icon: any
  description: string
  shortLabel?: string
}

const tabs: TabConfig[] = [
  {
    id: 'inv_refitem',
    label: 'Product Catalog',
    shortLabel: 'Catalog',
    icon: Tag,
    description: 'Complete product master list with all item details',
  },
  {
    id: 'inv_refitemsrp',
    label: 'Pricing & SRP',
    shortLabel: 'Pricing',
    icon: DollarSign,
    description: 'Suggested retail prices and price tier configurations',
  },
  {
    id: 'inv_refitemcost',
    label: 'Cost History',
    shortLabel: 'Costs',
    icon: TrendingUp,
    description: 'Historical cost records and purchase price trends',
  },
  {
    id: 'inv_refitemunits',
    label: 'Units of Measure',
    shortLabel: 'Units',
    icon: Box,
    description: 'Unit conversions and packaging configurations',
  },
  {
    id: 'inv_refitempicture',
    label: 'Product Images',
    shortLabel: 'Images',
    icon: ImageIcon,
    description: 'Product photography and visual media assets',
  },
  {
    id: 'inv_refitemsupplier',
    label: 'Vendor Links',
    shortLabel: 'Vendors',
    icon: Link2,
    description: 'Product-supplier relationships and sourcing',
  },
]

export default function Products() {
  const { currentPOS, posConfig } = usePOS()
  const [activeTab, setActiveTab] = useState('inv_refitem')
  const currentTab = tabs.find(t => t.id === activeTab)

  if (!currentPOS) {
    return (
      <motion.div
        className="p-6 max-w-[1800px] mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants}>
          <Card className="border border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-20">
              <div className="h-16 w-16 rounded-2xl bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center mb-4">
                <AlertCircle className="h-8 w-8 text-amber-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-1">No POS System Selected</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 text-center max-w-md">
                Please select a POS system from the sidebar to view product data
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    )
  }

  const Icon = posConfig?.icon || Package

  return (
    <motion.div
      className="p-6 space-y-6 max-w-[1800px] mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Page Header */}
      <motion.div variants={itemVariants} className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className={cn(
            "h-12 w-12 rounded-xl flex items-center justify-center shadow-sm",
            currentPOS === 'oasis' && "bg-blue-500",
            currentPOS === 'r5' && "bg-emerald-500",
            currentPOS === 'mydiner' && "bg-orange-500"
          )}>
            <Package className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">Product Management</h1>
              <Badge 
                variant="outline" 
                className={cn(
                  "text-xs font-semibold border-0",
                  currentPOS === 'oasis' && "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
                  currentPOS === 'r5' && "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
                  currentPOS === 'mydiner' && "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400"
                )}
              >
                <Icon className="h-3 w-3 mr-1" />
                {posConfig?.name}
              </Badge>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Comprehensive catalog, pricing, and inventory information
            </p>
          </div>
        </div>
      </motion.div>

      {/* Tab Navigation Cards */}
      <motion.div variants={itemVariants}>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-6">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <Card
                key={tab.id}
                className={cn(
                  "border cursor-pointer transition-all hover:shadow-md group",
                  isActive && "ring-2 shadow-md",
                  isActive && currentPOS === 'oasis' && "ring-blue-500 border-blue-200",
                  isActive && currentPOS === 'r5' && "ring-emerald-500 border-emerald-200",
                  isActive && currentPOS === 'mydiner' && "ring-orange-500 border-orange-200",
                  !isActive && "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                )}
                onClick={() => setActiveTab(tab.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "h-10 w-10 rounded-lg flex items-center justify-center transition-colors",
                      isActive && currentPOS === 'oasis' && "bg-blue-500 text-white",
                      isActive && currentPOS === 'r5' && "bg-emerald-500 text-white",
                      isActive && currentPOS === 'mydiner' && "bg-orange-500 text-white",
                      !isActive && "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-700"
                    )}>
                      <tab.icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={cn(
                        "text-sm font-semibold truncate",
                        isActive && currentPOS === 'oasis' && "text-blue-700 dark:text-blue-400",
                        isActive && currentPOS === 'r5' && "text-emerald-700 dark:text-emerald-400",
                        isActive && currentPOS === 'mydiner' && "text-orange-700 dark:text-orange-400",
                        !isActive && "text-slate-700 dark:text-slate-200"
                      )}>
                        {tab.shortLabel || tab.label}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{tab.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </motion.div>

      {/* Active Tab Content */}
      <motion.div variants={itemVariants}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Tab Description Header */}
          {currentTab && (
            <Card className={cn(
              "border-0 shadow-sm",
              currentPOS === 'oasis' && "bg-blue-50/50 dark:bg-blue-950/20",
              currentPOS === 'r5' && "bg-emerald-50/50 dark:bg-emerald-950/20",
              currentPOS === 'mydiner' && "bg-orange-50/50 dark:bg-orange-950/20"
            )}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "h-12 w-12 rounded-xl flex items-center justify-center",
                    currentPOS === 'oasis' && "bg-blue-100 dark:bg-blue-900/50",
                    currentPOS === 'r5' && "bg-emerald-100 dark:bg-emerald-900/50",
                    currentPOS === 'mydiner' && "bg-orange-100 dark:bg-orange-900/50"
                  )}>
                    <currentTab.icon className={cn(
                      "h-6 w-6",
                      currentPOS === 'oasis' && "text-blue-600",
                      currentPOS === 'r5' && "text-emerald-600",
                      currentPOS === 'mydiner' && "text-orange-600"
                    )} />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{currentTab.label}</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{currentTab.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tab Content */}
          <TabsContent value="inv_refitem" className="mt-0">
            <POSTableViewer 
              tableName="inv_refitem" 
              title="Product Catalog"
              description="Master list of all products with complete item details"
              icon={<Tag className="h-5 w-5" />}
            />
          </TabsContent>

          <TabsContent value="inv_refitemsrp" className="mt-0">
            <POSTableViewer 
              tableName="inv_refitemsrp" 
              title="Product Pricing"
              description="Suggested retail prices and price configurations"
              icon={<DollarSign className="h-5 w-5" />}
            />
          </TabsContent>

          <TabsContent value="inv_refitemcost" className="mt-0">
            <POSTableViewer 
              tableName="inv_refitemcost" 
              title="Cost History"
              description="Track cost changes over time for better purchasing decisions"
              icon={<TrendingUp className="h-5 w-5" />}
            />
          </TabsContent>

          <TabsContent value="inv_refitemunits" className="mt-0">
            <POSTableViewer 
              tableName="inv_refitemunits" 
              title="Units of Measure"
              description="Unit conversions and packaging configurations"
              icon={<Box className="h-5 w-5" />}
            />
          </TabsContent>

          <TabsContent value="inv_refitempicture" className="mt-0">
            <POSTableViewer 
              tableName="inv_refitempicture" 
              title="Product Images"
              description="Visual media and product photography"
              icon={<ImageIcon className="h-5 w-5" />}
            />
          </TabsContent>

          <TabsContent value="inv_refitemsupplier" className="mt-0">
            <POSTableViewer 
              tableName="inv_refitemsupplier" 
              title="Vendor Relationships"
              description="Product-supplier connections and sourcing information"
              icon={<Link2 className="h-5 w-5" />}
            />
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  )
}
