/**
 * Installed-rule editor route (Story 163.3-FE).
 * Route: /automation/installed-rules/[id] → GET/PATCH /v1/automation/rules/:id
 *
 * Server component. Next.js 16 passes `params` as a Promise (see supplies/[id]);
 * awaited here and handed to the client InstalledRuleEditor, which owns the
 * independent load/error/validation/save states. Run `npm run check:next-params`
 * after editing — this page relies on the Promise<...> params signature.
 *
 * Reference: docs/request-backend/224-automation-canned-rules-backend-contract.md
 */
import { InstalledRuleEditor } from '../editor/InstalledRuleEditor'

interface InstalledRuleEditorPageProps {
  params: Promise<{ id: string }>
}

export default async function InstalledRuleEditorPage({ params }: InstalledRuleEditorPageProps) {
  const { id } = await params
  return <InstalledRuleEditor ruleId={id} />
}
