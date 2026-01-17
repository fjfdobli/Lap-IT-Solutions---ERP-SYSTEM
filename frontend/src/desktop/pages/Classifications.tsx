import { useState } from 'react'
import { usePOS } from '../lib/pos-context'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { POSTableViewer } from '../components/POSTableViewer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import { Layers, Building2, MapPin, Palette, Ruler, Users2, Calendar, FolderTree, Settings, AlertCircle } from 'lucide-react'
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
  { id: 'inv_refclass', label: 'Categories', icon: Layers, description: 'Product classification hierarchy' },
  { id: 'inv_refdepartment', label: 'Departments', icon: Building2, description: 'Business departments' },
  { id: 'inv_reflocation', label: 'Locations', icon: MapPin, description: 'Physical locations' },
  { id: 'inv_refbranch', label: 'Branches', icon: Building2, description: 'Store branches' },
  { id: 'inv_refcolour', label: 'Colors', icon: Palette, description: 'Product color options' },
  { id: 'inv_refsize', label: 'Sizes', icon: Ruler, description: 'Size specifications' },
  { id: 'inv_refgender', label: 'Demographics', icon: Users2, description: 'Customer segments' },
  { id: 'inv_refseason', label: 'Seasons', icon: Calendar, description: 'Seasonal collections' },
]

export default function ClassificationsPage() {
  const { currentPOS, posConfig } = usePOS()
  const [activeTab, setActiveTab] = useState('inv_refclass')
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

  const Icon = posConfig?.icon || FolderTree

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
                  <FolderTree className="h-7 w-7 text-white" />
                </div>
                <div>
                  <CardTitle className="text-3xl font-bold">
                    Classifications & Categories
                  </CardTitle>
                  <CardDescription className="text-base mt-1 flex items-center gap-2">
                    Organize products by category, department, location, and more
                    <Badge variant="outline" className={cn("ml-2", posConfig?.borderColor, posConfig?.textColor)}>
                      <Icon className="h-3 w-3 mr-1" />
                      {posConfig?.name}
                    </Badge>
                  </CardDescription>
                </div>
              </div>
              <Badge variant="secondary" className="px-3 py-1.5">
                <Settings className={cn("h-3.5 w-3.5 mr-1.5", posConfig?.textColor)} />
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

          <TabsContent value="inv_refclass" className="mt-0">
            <POSTableViewer 
              tableName="inv_refclass" 
              title="Product Categories" 
              description="Main product classification hierarchy"
              icon={<Layers className={cn("h-6 w-6", posConfig?.textColor)} />}
            />
          </TabsContent>
          <TabsContent value="inv_refdepartment" className="mt-0">
            <POSTableViewer 
              tableName="inv_refdepartment" 
              title="Departments" 
              description="Business departments and divisions"
              icon={<Building2 className={cn("h-6 w-6", posConfig?.textColor)} />}
            />
          </TabsContent>
          <TabsContent value="inv_reflocation" className="mt-0">
            <POSTableViewer 
              tableName="inv_reflocation" 
              title="Locations" 
              description="Physical store and warehouse locations"
              icon={<MapPin className={cn("h-6 w-6", posConfig?.textColor)} />}
            />
          </TabsContent>
          <TabsContent value="inv_refbranch" className="mt-0">
            <POSTableViewer 
              tableName="inv_refbranch" 
              title="Branch Offices" 
              description="Store branches and outlets"
              icon={<Building2 className={cn("h-6 w-6", posConfig?.textColor)} />}
            />
          </TabsContent>
          <TabsContent value="inv_refcolour" className="mt-0">
            <POSTableViewer 
              tableName="inv_refcolour" 
              title="Color Options" 
              description="Available product colors"
              icon={<Palette className={cn("h-6 w-6", posConfig?.textColor)} />}
            />
          </TabsContent>
          <TabsContent value="inv_refsize" className="mt-0">
            <POSTableViewer 
              tableName="inv_refsize" 
              title="Size Specifications" 
              description="Product size configurations"
              icon={<Ruler className={cn("h-6 w-6", posConfig?.textColor)} />}
            />
          </TabsContent>
          <TabsContent value="inv_refgender" className="mt-0">
            <POSTableViewer 
              tableName="inv_refgender" 
              title="Customer Demographics" 
              description="Target customer segments"
              icon={<Users2 className={cn("h-6 w-6", posConfig?.textColor)} />}
            />
          </TabsContent>
          <TabsContent value="inv_refseason" className="mt-0">
            <POSTableViewer 
              tableName="inv_refseason" 
              title="Seasonal Collections" 
              description="Season and collection periods"
              icon={<Calendar className={cn("h-6 w-6", posConfig?.textColor)} />}
            />
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  )
}
