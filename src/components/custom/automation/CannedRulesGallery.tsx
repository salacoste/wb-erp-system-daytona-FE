'use client'

/**
 * CannedRulesGallery — AT1 canned-rules gallery (one-click install).
 *
 * Renders GET /v1/automation/canned-rules as cards grouped by `category`
 * (notify / audit / price / task). Each card has: name, description,
 * trigger→action summary, install Button. `price` cards additionally show a
 * destructive Badge "Требует arm write-back" (inert until the cabinet arms
 * PRICE_WRITEBACK_ENABLED — see contract § Safety).
 *
 * On 409 (duplicate name), a Dialog prompts for a custom name override and
 * retries the install. 404 surfaces via the hook's toast.
 *
 * Reference: docs/request-backend/224-automation-canned-rules-backend-contract.md
 */
import { useState } from 'react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  CANNED_RULE_CATEGORIES,
  CANNED_RULE_CATEGORY_LABELS,
  type CannedRuleCategory,
  type CannedRuleTemplate,
} from '@/types/automation'
import { useInstallCannedRule } from '@/hooks/useAutomation'
import { ApiError } from '@/types/api'
import { PostInstallBanner } from './PostInstallBanner'

interface CannedRulesGalleryProps {
  /** The full gallery (already fetched by the page). */
  templates: CannedRuleTemplate[]
}

/** Summarize a trigger's params (e.g. `<10`, `>10%`) — defensive read. */
function summarizeThreshold(params: unknown): string {
  if (params === null || typeof params !== 'object' || Array.isArray(params)) return ''
  const p = params as Record<string, unknown>
  const op = typeof p.operator === 'string' ? p.operator : ''
  const th = p.threshold
  if (th === undefined || th === null) return op ? ` ${op}` : ''
  return ` (${op} ${String(th)})`
}

/** One gallery card. */
function CannedRuleCard({
  template,
  onInstall,
  isPending,
}: {
  template: CannedRuleTemplate
  onInstall: (key: string, name?: string) => void
  isPending: boolean
}) {
  const isPrice = template.category === 'price'
  const summary = `${template.trigger}${summarizeThreshold(template.triggerParams)} → ${template.action}`
  return (
    <Card data-testid={`canned-rule-card-${template.key}`} className="flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">{template.name}</CardTitle>
          {isPrice && (
            <Badge variant="destructive" data-testid={`price-badge-${template.key}`}>
              Требует arm write-back
            </Badge>
          )}
        </div>
        <CardDescription>{template.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <p className="text-sm text-muted-foreground" data-testid={`trigger-action-${template.key}`}>
          {summary}
        </p>
      </CardContent>
      <CardFooter>
        <Button
          size="sm"
          onClick={() => onInstall(template.key)}
          disabled={isPending}
          data-testid={`install-btn-${template.key}`}
        >
          {isPending ? 'Установка…' : 'Установить'}
        </Button>
      </CardFooter>
    </Card>
  )
}

/** Gallery grouped by category (notify / audit / price / task). */
export function CannedRulesGallery({ templates }: CannedRulesGalleryProps) {
  const installMutation = useInstallCannedRule()
  const [renameFor, setRenameFor] = useState<string | null>(null)
  const [customName, setCustomName] = useState('')
  // Story 163.2: id of the most-recently-installed rule (for the deep-link).
  const [installedId, setInstalledId] = useState<string | null>(null)

  const handleInstall = (key: string, name?: string) => {
    installMutation.mutate(
      { key, body: name ? { name } : undefined },
      {
        onSuccess: data => {
          // Capture the created rule id for the post-install deep-link.
          if (data && typeof data.id === 'string') setInstalledId(data.id)
        },
        onError: error => {
          // 409 → open the rename dialog so the operator can resolve the dup.
          if (error instanceof ApiError && error.status === 409) {
            setCustomName('')
            setRenameFor(key)
          }
        },
      }
    )
  }

  const submitRename = () => {
    if (!renameFor) return
    const name = customName.trim()
    if (!name) return
    handleInstall(renameFor, name)
    setRenameFor(null)
    setCustomName('')
  }

  const byCategory = (cat: CannedRuleCategory): CannedRuleTemplate[] =>
    templates.filter(t => t.category === cat)

  return (
    <div className="space-y-8">
      {installedId && <PostInstallBanner ruleId={installedId} />}
      {CANNED_RULE_CATEGORIES.map(cat => {
        const group = byCategory(cat)
        if (group.length === 0) return null
        return (
          <section key={cat} data-testid={`category-section-${cat}`}>
            <h2 className="mb-4 text-lg font-semibold">{CANNED_RULE_CATEGORY_LABELS[cat]}</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {group.map(t => (
                <CannedRuleCard
                  key={t.key}
                  template={t}
                  onInstall={handleInstall}
                  isPending={installMutation.isPending && installMutation.variables?.key === t.key}
                />
              ))}
            </div>
          </section>
        )
      })}

      <Dialog open={renameFor !== null} onOpenChange={open => !open && setRenameFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Правило с таким именем уже существует</DialogTitle>
            <DialogDescription>
              Введите другое имя, чтобы установить этот шаблон ещё раз.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="canned-rename">Имя правила</Label>
            <Input
              id="canned-rename"
              value={customName}
              onChange={e => setCustomName(e.target.value)}
              placeholder="Например: Низкий остаток (копия)"
              data-testid="canned-rename-input"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameFor(null)}>
              Отмена
            </Button>
            <Button onClick={submitRename} data-testid="canned-rename-submit">
              Установить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
