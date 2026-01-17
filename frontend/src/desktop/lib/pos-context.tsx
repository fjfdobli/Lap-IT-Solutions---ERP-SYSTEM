import { createContext, useContext, useState, ReactNode } from 'react'
import { Monitor, Store, UtensilsCrossed, LucideIcon } from 'lucide-react'

export type POSType = 'oasis' | 'r5' | 'mydiner'

export interface POSConfig {
  id: POSType
  name: string
  fullName: string
  description: string
  icon: LucideIcon
  color: string
  textColor: string
  bgColor: string
  lightBg: string
  borderColor: string
  database: string
}

export const POS_CONFIGS: Record<POSType, POSConfig> = {
  oasis: {
    id: 'oasis',
    name: 'IBS OASIS',
    fullName: 'IBS OASIS',
    description: 'PC Shop / Electronics',
    icon: Monitor,
    color: '#3b82f6',
    textColor: 'text-blue-600',
    bgColor: 'bg-blue-500',
    lightBg: 'bg-blue-50',
    borderColor: 'border-blue-500',
    database: 'ibs_pos_new'
  },
  r5: {
    id: 'r5',
    name: 'IBS R5',
    fullName: 'IBS R5',
    description: 'Convenience Store',
    icon: Store,
    color: '#10b981',
    textColor: 'text-emerald-600',
    bgColor: 'bg-emerald-500',
    lightBg: 'bg-emerald-50',
    borderColor: 'border-emerald-500',
    database: 'ibs_pos'
  },
  mydiner: {
    id: 'mydiner',
    name: 'IBS MyDiner',
    fullName: 'IBS MyDiner POS',
    description: 'Restaurant / Buffet',
    icon: UtensilsCrossed,
    color: '#f97316',
    textColor: 'text-orange-600',
    bgColor: 'bg-orange-500',
    lightBg: 'bg-orange-50',
    borderColor: 'border-orange-500',
    database: 'mydinein'
  }
}

// Modules available per POS
export const POS_MODULES: Record<POSType, string[]> = {
  oasis: [
    'dashboard', 'products', 'inventory', 'item-movement',
    'suppliers', 'purchase-orders', 'receiving',
    'transfers', 'physical-count',
    'customers', 'pos-transactions', 'voids-returns',
    'classifications', 'settings-ref', 'reports'
  ],
  r5: [
    'dashboard', 'products', 'inventory', 'item-movement',
    'customers', 'pos-transactions', 'voids-returns',
    'classifications', 'settings-ref', 'reports'
  ],
  mydiner: [
    'dashboard', 'products', 'inventory', 'item-movement',
    'customers', 'pos-transactions', 'voids-returns',
    'classifications', 'settings-ref', 'reports',
    // Restaurant-specific modules
    'tables', 'waiters', 'order-slips', 'expenses',
    'suspended-orders', 'audit-trail', 'user-logs',
    'operating-hours'
  ]
}

interface POSContextType {
  currentPOS: POSType | null
  posConfig: POSConfig | null
  setCurrentPOS: (pos: POSType | null) => void
  isModuleAvailable: (moduleId: string) => boolean
  allConfigs: typeof POS_CONFIGS
}

const POSContext = createContext<POSContextType | undefined>(undefined)

export function POSProvider({ children }: { children: ReactNode }) {
  const [currentPOS, setCurrentPOSState] = useState<POSType | null>(() => {
    const saved = localStorage.getItem('selectedPOS')
    return saved as POSType | null
  })

  const posConfig = currentPOS ? POS_CONFIGS[currentPOS] : null

  const setCurrentPOS = (pos: POSType | null) => {
    setCurrentPOSState(pos)
    if (pos) {
      localStorage.setItem('selectedPOS', pos)
    } else {
      localStorage.removeItem('selectedPOS')
    }
  }

  const isModuleAvailable = (moduleId: string): boolean => {
    if (!currentPOS) return false
    return POS_MODULES[currentPOS].includes(moduleId)
  }

  return (
    <POSContext.Provider value={{
      currentPOS,
      posConfig,
      setCurrentPOS,
      isModuleAvailable,
      allConfigs: POS_CONFIGS
    }}>
      {children}
    </POSContext.Provider>
  )
}

export function usePOS() {
  const context = useContext(POSContext)
  if (context === undefined) {
    throw new Error('usePOS must be used within a POSProvider')
  }
  return context
}
