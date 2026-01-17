import { useState } from 'react'
import { usePOS } from '../lib/pos-context'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { POSTableViewer } from '../components/POSTableViewer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import { ArrowDownToLine, ArrowUpFromLine, Package, ArrowLeftRight, Send, Download, AlertCircle } from 'lucide-react'
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
  { id: 'mod_transferout_1', label: 'Outgoing Transfers', icon: ArrowUpFromLine, description: 'Stock sent to other locations' },
  { id: 'mod_transferout_2', label: 'Outgoing Items', icon: Send, description: 'Products being transferred out' },
  { id: 'mod_transferin_1', label: 'Incoming Transfers', icon: ArrowDownToLine, description: 'Stock received from other locations' },
  { id: 'mod_transferin_2', label: 'Incoming Items', icon: Download, description: 'Products received from transfers' },
]

export default function TransfersPage() {
  const { currentPOS, posConfig } = usePOS()
  const [activeTab, setActiveTab] = useState('mod_transferout_1')
  const currentTab = tabs.find(t => t.id === activeTab)

  // Transfers is available for OASIS only
  if (currentPOS && currentPOS !== 'oasis') {
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
              <ArrowLeftRight className="h-16 w-16 text-muted-foreground/30 mb-4" />
              <p className="text-lg font-medium">Stock Transfers Not Available</p>
              <p className="text-sm text-muted-foreground mt-1">
                This module is only available for IBS OASIS POS.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    )
  }

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

  const Icon = posConfig?.icon || ArrowLeftRight

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
                  <ArrowLeftRight className="h-7 w-7 text-white" />
                </div>
                <div>
                  <CardTitle className="text-3xl font-bold">
                    Stock Transfers
                  </CardTitle>
                  <CardDescription className="text-base mt-1 flex items-center gap-2">
                    Manage inventory movement between locations and branches
                    <Badge variant="outline" className={cn("ml-2", posConfig?.borderColor, posConfig?.textColor)}>
                      <Icon className="h-3 w-3 mr-1" />
                      {posConfig?.name}
                    </Badge>
                  </CardDescription>
                </div>
              </div>
              <Badge variant="secondary" className="px-3 py-1.5">
                <Package className={cn("h-3.5 w-3.5 mr-1.5", posConfig?.textColor)} />
                Inter-Branch
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
                      "flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all",
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

          <TabsContent value="mod_transferout_1" className="mt-0">
            <POSTableViewer 
              tableName="mod_transferout_1" 
              title="Outgoing Transfer Documents" 
              description="Transfer orders sent to other branches"
              icon={<ArrowUpFromLine className={cn("h-6 w-6", posConfig?.textColor)} />}
            />
          </TabsContent>
          <TabsContent value="mod_transferout_2" className="mt-0">
            <POSTableViewer 
              tableName="mod_transferout_2" 
              title="Outgoing Transfer Items" 
              description="Products included in outgoing transfers"
              icon={<Send className={cn("h-6 w-6", posConfig?.textColor)} />}
            />
          </TabsContent>
          <TabsContent value="mod_transferin_1" className="mt-0">
            <POSTableViewer 
              tableName="mod_transferin_1" 
              title="Incoming Transfer Documents" 
              description="Transfer orders received from other branches"
              icon={<ArrowDownToLine className={cn("h-6 w-6", posConfig?.textColor)} />}
            />
          </TabsContent>
          <TabsContent value="mod_transferin_2" className="mt-0">
            <POSTableViewer 
              tableName="mod_transferin_2" 
              title="Incoming Transfer Items" 
              description="Products received from incoming transfers"
              icon={<Download className={cn("h-6 w-6", posConfig?.textColor)} />}
            />
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  )
}
