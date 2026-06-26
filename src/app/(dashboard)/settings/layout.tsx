/**
 * Settings shared layout (TZ-13) — 2-col nav rail + content shell.
 * All /settings/* pages render inside this layout, providing a consistent
 * navigation rail with active-page highlighting.
 */

import type { ReactNode } from 'react'
import { SettingsNav } from './components/SettingsNav'

export default function SettingsLayout({ children }: { children: ReactNode }): React.ReactElement {
  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <SettingsNav className="lg:w-56 shrink-0" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}
