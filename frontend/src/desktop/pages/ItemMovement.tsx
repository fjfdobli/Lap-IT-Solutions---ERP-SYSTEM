import { usePOS } from '../lib/pos-context'
import { POSTableViewer } from '../components/POSTableViewer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import { Activity, GitBranch, AlertCircle } from 'lucide-react'
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

export default function ItemMovementPage() {
  const { currentPOS, posConfig } = usePOS()

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

  const Icon = posConfig?.icon || Activity

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
                  <Activity className="h-7 w-7 text-white" />
                </div>
                <div>
                  <CardTitle className="text-3xl font-bold">
                    Stock Movement History
                  </CardTitle>
                  <CardDescription className="text-base mt-1 flex items-center gap-2">
                    Complete audit trail of all inventory transactions and adjustments
                    <Badge variant="outline" className={cn("ml-2", posConfig?.borderColor, posConfig?.textColor)}>
                      <Icon className="h-3 w-3 mr-1" />
                      {posConfig?.name}
                    </Badge>
                  </CardDescription>
                </div>
              </div>
              <Badge variant="secondary" className="px-3 py-1.5">
                <GitBranch className={cn("h-3.5 w-3.5 mr-1.5", posConfig?.textColor)} />
                Audit Trail
              </Badge>
            </div>
          </CardHeader>
        </Card>
      </motion.div>

      {/* Table */}
      <motion.div variants={itemVariants}>
        <POSTableViewer 
          tableName="pro_itemmovement" 
          title="Item Movement Records"
          description="Track all stock movements including sales, purchases, transfers, and adjustments"
          icon={<Activity className={cn("h-6 w-6", posConfig?.textColor)} />}
        />
      </motion.div>
    </motion.div>
  )
}
