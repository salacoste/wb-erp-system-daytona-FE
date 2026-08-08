'use client'

/**
 * Communications page — NEW-2 read-only PR1.
 *
 * WB seller communications: feedbacks, questions, chats, claims, pinned reviews.
 * Each section is an INDEPENDENT state machine (AC4) — one failing never blanks
 * the others. The header carries a live UnreadBadge (its own query).
 *
 * Both the badge and the sections are gated on `cabinetReady` (cabinet selected)
 * so they don't fire before a cabinet is available. The gated write-side
 * (reply/answer/send/pin) is PR2 — this page is read-only.
 */

import { useAuthStore } from '@/stores/authStore'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { UnreadBadge } from './components/UnreadBadge'
import { FeedbacksSection } from './components/FeedbacksSection'
import { QuestionsSection } from './components/QuestionsSection'
import { ChatsSection } from './components/ChatsSection'
import { ClaimsSection } from './components/ClaimsSection'
import { PinnedReviewsSection } from './components/PinnedReviewsSection'

export default function CommunicationsPage() {
  // Gate hooks on cabinet selection — apiClient injects X-Cabinet-Id at request
  // time; we avoid firing before a cabinet is chosen (would 403).
  const cabinetId = useAuthStore(s => s.cabinetId)
  const cabinetReady = !!cabinetId

  return (
    <div className="space-y-6">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          Сообщения
          {/* AC4: independent query — badge failure never blanks the page. */}
          <UnreadBadge enabled={cabinetReady} />
        </h1>
        <p className="text-sm text-muted-foreground">
          Отзывы, вопросы, чаты и претензии Wildberries
        </p>
      </header>

      <Tabs defaultValue="feedbacks" className="w-full">
        <TabsList className="flex-wrap">
          <TabsTrigger value="feedbacks">Отзывы</TabsTrigger>
          <TabsTrigger value="questions">Вопросы</TabsTrigger>
          <TabsTrigger value="chats">Чаты</TabsTrigger>
          <TabsTrigger value="claims">Претензии</TabsTrigger>
          <TabsTrigger value="pinned">Закреплённые</TabsTrigger>
        </TabsList>
        <TabsContent value="feedbacks" className="mt-4">
          <FeedbacksSection enabled={cabinetReady} />
        </TabsContent>
        <TabsContent value="questions" className="mt-4">
          <QuestionsSection enabled={cabinetReady} />
        </TabsContent>
        <TabsContent value="chats" className="mt-4">
          <ChatsSection enabled={cabinetReady} />
        </TabsContent>
        <TabsContent value="claims" className="mt-4">
          <ClaimsSection enabled={cabinetReady} />
        </TabsContent>
        <TabsContent value="pinned" className="mt-4">
          <PinnedReviewsSection enabled={cabinetReady} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
