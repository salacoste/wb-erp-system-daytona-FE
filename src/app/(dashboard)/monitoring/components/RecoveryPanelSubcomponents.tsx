/**
 * RecoveryPanel sub-components: Confirm dialog, Tip tooltip, Skel skeleton.
 * Extracted for file-size compliance (211 → ~140 lines).
 */
'use client'

import type React from 'react'
import { Loader2, HelpCircle } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { RecoveryTask } from '../types/monitoring'

export function Confirm({
  title,
  desc,
  act,
  danger,
  busy,
  onOk,
  children,
}: {
  title: string
  desc: string
  act: string
  danger: boolean
  busy: boolean
  onOk: () => void
  children: React.ReactNode
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{desc}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Отмена</AlertDialogCancel>
          <AlertDialogAction
            onClick={onOk}
            disabled={busy}
            className={cn(danger && 'bg-destructive hover:bg-destructive/90')}
          >
            {busy && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
            {act}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export function Tip({ task }: { task: RecoveryTask }) {
  // F-41: the backend omits maxWindowDays/maxRetries/cooldownMinutes (#187). Hide the
  // tooltip entirely rather than render "undefined дн." until the fields are provided.
  if (task.maxWindowDays == null && task.maxRetries == null && task.cooldownMinutes == null) {
    return null
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <HelpCircle className="h-3.5 w-3.5 shrink-0 cursor-help text-muted-foreground" />
      </TooltipTrigger>
      <TooltipContent size="md">
        <p>
          {task.maxWindowDays != null && `Макс. период: ${task.maxWindowDays} дн. `}
          {task.maxRetries != null && `Макс. попыток: ${task.maxRetries} `}
          {task.cooldownMinutes != null && `Пауза: ${task.cooldownMinutes} мин`}
        </p>
      </TooltipContent>
    </Tooltip>
  )
}

export function Skel() {
  return (
    <div className="space-y-2" aria-busy="true">
      <Skeleton className="h-10 w-full" />
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  )
}
