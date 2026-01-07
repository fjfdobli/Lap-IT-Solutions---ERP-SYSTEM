import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RealTimeClockProps {
  showIcon?: boolean
  showDate?: boolean
  showSeconds?: boolean
  className?: string
  dateFormat?: string
  timeFormat?: string
}

export function RealTimeClock({
  showIcon = true,
  showDate = false,
  showSeconds = true,
  className,
  dateFormat = 'EEEE, MMMM d, yyyy',
  timeFormat = 'h:mm:ss a',
}: RealTimeClockProps) {
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    // Update every second for real-time display
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const formatTime = () => {
    if (showSeconds) {
      return format(currentTime, timeFormat)
    }
    return format(currentTime, 'h:mm a')
  }

  return (
    <div className={cn('flex items-center gap-2 text-muted-foreground', className)}>
      {showIcon && <Clock className="h-4 w-4" />}
      <div className="flex flex-col text-right">
        {showDate && (
          <span className="text-xs">{format(currentTime, dateFormat)}</span>
        )}
        <span className="font-mono text-sm tabular-nums">{formatTime()}</span>
      </div>
    </div>
  )
}

// Compact version for dashboard headers
export function CompactClock({ className }: { className?: string }) {
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className={cn('flex items-center gap-1.5 text-muted-foreground text-sm', className)}>
      <Clock className="h-3.5 w-3.5" />
      <span className="font-mono tabular-nums">
        {format(currentTime, 'h:mm:ss a')}
      </span>
    </div>
  )
}
