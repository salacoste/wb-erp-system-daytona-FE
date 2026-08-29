import type { ReactNode } from 'react'
import { SettingsNav } from './components/SettingsNav'

export default function SettingsLayout({ children }: { children: ReactNode }): React.ReactElement {
  return (
    <div className="grid gap-6 lg:grid-cols-[14rem_minmax(0,1fr)] lg:items-start">
      <SettingsNav className="lg:sticky lg:top-6" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}
