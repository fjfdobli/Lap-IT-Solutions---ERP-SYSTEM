import { useState } from 'react'
import { usePOS } from '../lib/pos-context'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { POSTableViewer } from '../components/POSTableViewer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import { Package, FileText, ClipboardCheck, Truck, AlertCircle } from 'lucide-react'
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
  { id: 'mod_rr_1', label: 'Receiving Reports', icon: FileText, description: 'Goods receipt documents' },
  { id: 'mod_rr_2', label: 'Received Items', icon: Package, description: 'Products received from suppliers' },
]

export default function ReceivingPage() {
  const { currentPOS, posConfig } = usePOS()
  const [activeTab, setActiveTab] = useState('mod_rr_1')
  const currentTab = tabs.find(t => t.id === activeTab)

  // Receiving is available for OASIS only (or can be shown for all with proper backend support)
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
              <Truck className="h-16 w-16 text-muted-foreground/30 mb-4" />
              <p className="text-lg font-medium">Receiving Not Available</p>
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

  const Icon = posConfig?.icon || Truck

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
                  <Truck className="h-7 w-7 text-white" />
                </div>
                <div>
                  <CardTitle className="text-3xl font-bold">
                    Goods Receiving
                  </CardTitle>
                  <CardDescription className="text-base mt-1 flex items-center gap-2">
                    Track incoming merchandise and supplier deliveries
                    <Badge variant="outline" className={cn("ml-2", posConfig?.borderColor, posConfig?.textColor)}>
                      <Icon className="h-3 w-3 mr-1" />
                      {posConfig?.name}
                    </Badge>
                  </CardDescription>
                </div>
              </div>
              <Badge variant="secondary" className="px-3 py-1.5">
                <ClipboardCheck className={cn("h-3.5 w-3.5 mr-1.5", posConfig?.textColor)} />
                Inbound
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

          <TabsContent value="mod_rr_1" className="mt-0">
            <POSTableViewer 
              tableName="mod_rr_1" 
              title="Receiving Reports" 
              description="Goods receipt header documents"
              icon={<FileText className={cn("h-6 w-6", posConfig?.textColor)} />}
            />
          </TabsContent>
          <TabsContent value="mod_rr_2" className="mt-0">
            <POSTableViewer 
              tableName="mod_rr_2" 
              title="Received Items" 
              description="Products received in each delivery"
              icon={<Package className={cn("h-6 w-6", posConfig?.textColor)} />}
            />
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  )
}
