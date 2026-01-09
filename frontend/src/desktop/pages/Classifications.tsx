import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TableViewer } from '../components/TableViewer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import { Layers, Building2, MapPin, Palette, Ruler, Users2, Calendar, FolderTree, Settings } from 'lucide-react'

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
  { id: 'inv_refclass', label: 'Categories', icon: Layers, description: 'Product classification hierarchy', color: 'text-indigo-500', bgColor: 'bg-indigo-500/10' },
  { id: 'inv_refdepartment', label: 'Departments', icon: Building2, description: 'Business departments', color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  { id: 'inv_reflocation', label: 'Locations', icon: MapPin, description: 'Physical locations', color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
  { id: 'inv_refbranch', label: 'Branches', icon: Building2, description: 'Store branches', color: 'text-violet-500', bgColor: 'bg-violet-500/10' },
  { id: 'inv_refcolour', label: 'Colors', icon: Palette, description: 'Product color options', color: 'text-pink-500', bgColor: 'bg-pink-500/10' },
  { id: 'inv_refsize', label: 'Sizes', icon: Ruler, description: 'Size specifications', color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
  { id: 'inv_refgender', label: 'Demographics', icon: Users2, description: 'Customer segments', color: 'text-cyan-500', bgColor: 'bg-cyan-500/10' },
  { id: 'inv_refseason', label: 'Seasons', icon: Calendar, description: 'Seasonal collections', color: 'text-amber-500', bgColor: 'bg-amber-500/10' },
]

export default function ClassificationsPage() {
  const [activeTab, setActiveTab] = useState('inv_refclass')
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
        <Card className="border-0 shadow-lg bg-gradient-to-br from-indigo-50 via-violet-50 to-purple-50 dark:from-indigo-950/50 dark:via-violet-950/50 dark:to-purple-950/50 overflow-hidden">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                  <FolderTree className="h-7 w-7 text-white" />
                </div>
                <div>
                  <CardTitle className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                    Classifications & Categories
                  </CardTitle>
                  <CardDescription className="text-base mt-1">
                    Organize products by category, department, location, and more
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="px-3 py-1.5 bg-white/80 dark:bg-slate-800/80">
                  <Settings className="h-3.5 w-3.5 mr-1.5 text-indigo-500" />
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

          <TabsContent value="inv_refclass" className="mt-0">
            <TableViewer tableName="inv_refclass" title="Product Categories" description="Main product classification hierarchy" />
          </TabsContent>
          <TabsContent value="inv_refdepartment" className="mt-0">
            <TableViewer tableName="inv_refdepartment" title="Departments" description="Business departments and divisions" />
          </TabsContent>
          <TabsContent value="inv_reflocation" className="mt-0">
            <TableViewer tableName="inv_reflocation" title="Locations" description="Physical store and warehouse locations" />
          </TabsContent>
          <TabsContent value="inv_refbranch" className="mt-0">
            <TableViewer tableName="inv_refbranch" title="Branch Offices" description="Store branches and outlets" />
          </TabsContent>
          <TabsContent value="inv_refcolour" className="mt-0">
            <TableViewer tableName="inv_refcolour" title="Color Options" description="Available product colors" />
          </TabsContent>
          <TabsContent value="inv_refsize" className="mt-0">
            <TableViewer tableName="inv_refsize" title="Size Specifications" description="Product size configurations" />
          </TabsContent>
          <TabsContent value="inv_refgender" className="mt-0">
            <TableViewer tableName="inv_refgender" title="Customer Demographics" description="Target customer segments" />
          </TabsContent>
          <TabsContent value="inv_refseason" className="mt-0">
            <TableViewer tableName="inv_refseason" title="Seasonal Collections" description="Season and collection periods" />
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  )
}
