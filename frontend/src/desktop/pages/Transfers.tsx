import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TableViewer } from '../components/TableViewer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import { ArrowDownToLine, ArrowUpFromLine, Package, ArrowLeftRight, Send, Download } from 'lucide-react'

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
  { id: 'mod_transferout_1', label: 'Outgoing Transfers', icon: ArrowUpFromLine, description: 'Stock sent to other locations', color: 'text-sky-500', bgColor: 'bg-sky-500/10' },
  { id: 'mod_transferout_2', label: 'Outgoing Items', icon: Send, description: 'Products being transferred out', color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  { id: 'mod_transferin_1', label: 'Incoming Transfers', icon: ArrowDownToLine, description: 'Stock received from other locations', color: 'text-green-500', bgColor: 'bg-green-500/10' },
  { id: 'mod_transferin_2', label: 'Incoming Items', icon: Download, description: 'Products received from transfers', color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
]

export default function TransfersPage() {
  const [activeTab, setActiveTab] = useState('mod_transferout_1')
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
        <Card className="border-0 shadow-lg bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 dark:from-sky-950/50 dark:via-blue-950/50 dark:to-indigo-950/50 overflow-hidden">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-500/30">
                  <ArrowLeftRight className="h-7 w-7 text-white" />
                </div>
                <div>
                  <CardTitle className="text-3xl font-bold bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent">
                    Stock Transfers
                  </CardTitle>
                  <CardDescription className="text-base mt-1">
                    Manage inventory movement between locations and branches
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="px-3 py-1.5 bg-white/80 dark:bg-slate-800/80">
                  <Package className="h-3.5 w-3.5 mr-1.5 text-sky-500" />
                  Inter-Branch
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

          <TabsContent value="mod_transferout_1" className="mt-0">
            <TableViewer tableName="mod_transferout_1" title="Outgoing Transfer Documents" description="Transfer orders sent to other branches" />
          </TabsContent>
          <TabsContent value="mod_transferout_2" className="mt-0">
            <TableViewer tableName="mod_transferout_2" title="Outgoing Transfer Items" description="Products included in outgoing transfers" />
          </TabsContent>
          <TabsContent value="mod_transferin_1" className="mt-0">
            <TableViewer tableName="mod_transferin_1" title="Incoming Transfer Documents" description="Transfer orders received from other branches" />
          </TabsContent>
          <TabsContent value="mod_transferin_2" className="mt-0">
            <TableViewer tableName="mod_transferin_2" title="Incoming Transfer Items" description="Products received from incoming transfers" />
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  )
}
