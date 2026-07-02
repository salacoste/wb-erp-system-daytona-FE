'use client'

/**
 * МойСклад page (read-only FE, Phase 1 MVP).
 * Contract: docs/request-backend/221-moysklad-integration-backend-contract.md
 *
 * Tabs: «Обзор» / «Товары и привязки» / «Сток» (Phase-2 placeholder).
 * FE-5: sr-only <h2> per tab for the page outline (WCAG 1.3.1).
 *
 * Bootstrap-cabinet note: X-Cabinet-Id is IGNORED for МС (token is
 * MOYSKLAD_TOKEN for MOYSKLAD_CABINET_ID) — surfaced in the header.
 */

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MoyskladHealthBadge } from './components/MoyskladHealthBadge'
import { MoyskladOverview } from './components/MoyskladOverview'
import { MoyskladMappingsTable } from './components/MoyskladMappingsTable'

export default function MoyskladPage() {
  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">МойСклад</h1>
          <MoyskladHealthBadge />
        </div>
        <p className="text-sm text-muted-foreground">
          Данные МойСклад для подключённого кабинета (не зависят от выбранного кабинета WB).
        </p>
      </header>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Обзор</TabsTrigger>
          <TabsTrigger value="mappings">Товары и привязки</TabsTrigger>
          <TabsTrigger value="stock">Сток</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" role="tabpanel">
          <h2 className="sr-only">Обзор МойСклад</h2>
          <MoyskladOverview />
        </TabsContent>

        <TabsContent value="mappings" role="tabpanel">
          <h2 className="sr-only">Товары и привязки МойСклад</h2>
          <MoyskladMappingsTable />
        </TabsContent>

        <TabsContent value="stock" role="tabpanel">
          <h2 className="sr-only">Сток МойСклад</h2>
          <p className="text-muted-foreground py-8 text-center">Раздел стока — скоро</p>
        </TabsContent>
      </Tabs>
    </div>
  )
}
