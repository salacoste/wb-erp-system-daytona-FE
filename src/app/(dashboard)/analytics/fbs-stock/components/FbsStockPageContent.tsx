/**
 * FBS Stock Page Orchestrator
 * Epic 96-FE Story 96.11: groups / sizes / regions breakdown views
 *
 * Tabs layout (3 tabs) per Pattern 1 (CLAUDE.md § Multi-Source Orchestration):
 * each tab hosts an independent state machine — failure in one does NOT blank others.
 * Tab lazy-loading ensures hooks only fire when the tab is active.
 */

'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FbsStockGroupsSection } from './FbsStockGroupsSection'
import { FbsStockSizesSection } from './FbsStockSizesSection'
import { FbsStockRegionsSection } from './FbsStockRegionsSection'
import { FbsExportButton } from './FbsExportButton'

type Tab = 'groups' | 'sizes' | 'regions'

export function FbsStockPageContent() {
  // M-2: track active tab so only the active section mounts its hook.
  // Conditional render inside each TabsContent prevents the other 2 hooks
  // from firing on initial paint (Pattern 1 isolation — hook level, not just render level).
  const [activeTab, setActiveTab] = useState<Tab>('groups')

  return (
    <div className="space-y-6" data-testid="fbs-stock-page">
      {/* Page header — export button right-aligned beside title (Option A, Story 96.12-FE) */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Складские остатки FBS</h1>
          <p className="text-muted-foreground mt-1">
            Распределение остатков по товарным группам, размерам и регионам
          </p>
        </div>
        <FbsExportButton />
      </div>

      {/* 3-tab layout — each tab is an independent state machine (Pattern 1) */}
      <Tabs value={activeTab} onValueChange={v => setActiveTab(v as Tab)} className="w-full">
        <TabsList>
          <TabsTrigger value="groups">По товарным группам</TabsTrigger>
          <TabsTrigger value="sizes">По размерам</TabsTrigger>
          <TabsTrigger value="regions">По регионам</TabsTrigger>
        </TabsList>

        <TabsContent value="groups" className="mt-4">
          {activeTab === 'groups' && <FbsStockGroupsSection />}
        </TabsContent>

        <TabsContent value="sizes" className="mt-4">
          {activeTab === 'sizes' && <FbsStockSizesSection />}
        </TabsContent>

        <TabsContent value="regions" className="mt-4">
          {activeTab === 'regions' && <FbsStockRegionsSection />}
        </TabsContent>
      </Tabs>
    </div>
  )
}
