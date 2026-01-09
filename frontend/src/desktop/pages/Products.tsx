import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TableViewer } from '../components/TableViewer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import { 
  Tag, 
  DollarSign, 
  Box, 
  Package, 
  Link, 
  Image as ImageIcon,
  TrendingUp,
  BarChart3,
} from 'lucide-react'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 100,
      damping: 12,
    },
  },
}

const tabs = [
  {
    id: 'inv_refitem',
    label: 'Product Catalog',
    icon: Tag,
    description: 'Complete product master list with details',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  {
    id: 'inv_refitemsrp',
    label: 'Pricing',
    icon: DollarSign,
    description: 'Suggested retail prices and price tiers',
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
  },
  {
    id: 'inv_refitemcost',
    label: 'Cost History',
    icon: TrendingUp,
    description: 'Historical cost records and trends',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
  },
  {
    id: 'inv_refitemunits',
    label: 'Units of Measure',
    icon: Box,
    description: 'Unit conversions and packaging',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
  {
    id: 'inv_refitempicture',
    label: 'Product Images',
    icon: ImageIcon,
    description: 'Product photos and media',
    color: 'text-pink-500',
    bgColor: 'bg-pink-500/10',
  },
  {
    id: 'inv_refitemsupplier',
    label: 'Vendor Links',
    icon: Link,
    description: 'Product-supplier relationships',
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-500/10',
  },
]

export default function Products() {
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
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/50 dark:via-indigo-950/50 dark:to-purple-950/50 overflow-hidden">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <Package className="h-7 w-7 text-white" />
                </div>
                <div>
                  <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Product Management
                  </CardTitle>
                  <CardDescription className="text-base mt-1">
                    Comprehensive catalog, pricing, and inventory information
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="px-3 py-1.5 bg-white/80 dark:bg-slate-800/80">
                  <BarChart3 className="h-3.5 w-3.5 mr-1.5 text-blue-500" />
                  2,644 Products
                </Badge>
              </div>
            </div>
          </CardHeader>
        </Card>
      </motion.div>

      {/* Tabs Navigation */}
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

          {/* Current Tab Info */}
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
              title="Product Catalog"
              description="Master list of all products with complete item details"
            />
          </TabsContent>

          <TabsContent value="inv_refitemsrp" className="mt-0">
            <TableViewer 
              tableName="inv_refitemsrp" 
              title="Product Pricing"
              description="Suggested retail prices and price configurations"
            />
          </TabsContent>

          <TabsContent value="inv_refitemcost" className="mt-0">
            <TableViewer 
              tableName="inv_refitemcost" 
              title="Cost History"
              description="Track cost changes over time for better purchasing decisions"
            />
          </TabsContent>

          <TabsContent value="inv_refitemunits" className="mt-0">
            <TableViewer 
              tableName="inv_refitemunits" 
              title="Units of Measure"
              description="Unit conversions and packaging configurations"
            />
          </TabsContent>

          <TabsContent value="inv_refitempicture" className="mt-0">
            <TableViewer 
              tableName="inv_refitempicture" 
              title="Product Images"
              description="Visual media and product photography"
            />
          </TabsContent>

          <TabsContent value="inv_refitemsupplier" className="mt-0">
            <TableViewer 
              tableName="inv_refitemsupplier" 
              title="Vendor Relationships"
              description="Product-supplier connections and sourcing information"
            />
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  )
}
