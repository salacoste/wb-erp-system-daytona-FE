export const STORY_174_3_MANUAL_EVIDENCE_DATE = '2026-09-01'

export const STORY_174_3_MANUAL_EVIDENCE_AUTHORITY = {
  acceptance:
    '_bmad-output/planning-artifacts/epics-166-174-fe-shadcn-migration.md#story-1743-complete-accessibility-responsive-theme-and-visual-verification',
  browserMatrix:
    '_bmad-output/planning-artifacts/ux-design-specification.md#assistive-technology-and-browser-matrix',
  privacySafeBaseline:
    '.omx/plans/174.3-complete-accessibility-responsive-theme-and-visual-verification.md#behavior-lock-before-presentation-changes',
} as const

export type Story1743ManualEvidenceOutcome = 'environment-gap' | 'passed'

export type Story1743ManualEvidence = {
  id: string
  riskGroup: 'assistive-technology' | 'data-meaning' | 'form-validation' | 'overlay-focus'
  route: string
  stateOrTask: string
  primaryKeyboardPath: string
  browser: string
  viewport: string
  theme: 'dark' | 'light' | 'not-applicable'
  focusLifecycleResult: string
  readingOrDataMeaningObservation: string
  operator: string
  date: string
  outcome: Story1743ManualEvidenceOutcome
  blockerOrGapReference: string
}

/**
 * Immutable operator-driven review notes. These entries record direct browser
 * interaction performed through Playwright CLI; they are not automated test
 * results and are never represented as real screen-reader sessions.
 */
export const STORY_174_3_MANUAL_EVIDENCE: readonly Story1743ManualEvidence[] = [
  {
    id: 'manual-register-chromium-mobile',
    riskGroup: 'form-validation',
    route: '/register',
    stateOrTask: 'empty submission and validation recovery entry point',
    primaryKeyboardPath: 'Tab to email, Tab to password, Tab to submit, Enter',
    browser: 'Chromium (Google Chrome channel via Playwright CLI)',
    viewport: '390x900',
    theme: 'light',
    focusLifecycleResult:
      'PASS: submission returned focus to the invalid email field; both invalid fields remained keyboard reachable.',
    readingOrDataMeaningObservation:
      'PASS: one h1, a named registration form, a form-level alert, field-level Russian errors, and invalid state were exposed in document order.',
    operator: 'Codex App operator (non-human, operator-driven browser session)',
    date: STORY_174_3_MANUAL_EVIDENCE_DATE,
    outcome: 'passed',
    blockerOrGapReference: 'none',
  },
  {
    id: 'manual-register-firefox-desktop',
    riskGroup: 'form-validation',
    route: '/register',
    stateOrTask: 'desktop empty submission and validation recovery entry point',
    primaryKeyboardPath: 'Tab to email, Tab to password, Tab to submit, Enter',
    browser: 'Firefox via Playwright CLI',
    viewport: '1280x900',
    theme: 'light',
    focusLifecycleResult:
      'PASS: submission returned focus to the invalid email field without losing the submit control from the tab sequence.',
    readingOrDataMeaningObservation:
      'PASS: form alert preceded the labelled invalid controls and exact Russian error text remained associated and visible.',
    operator: 'Codex App operator (non-human, operator-driven browser session)',
    date: STORY_174_3_MANUAL_EVIDENCE_DATE,
    outcome: 'passed',
    blockerOrGapReference: 'none',
  },
  {
    id: 'manual-dashboard-chromium-mobile-overlay',
    riskGroup: 'overlay-focus',
    route: '/dashboard',
    stateOrTask: 'mobile navigation dialog open, traversal, and dismissal',
    primaryKeyboardPath: 'body focus boundary, 2x Tab to Open menu, Enter, Tab, Escape',
    browser: 'Chromium (Google Chrome channel via Playwright CLI)',
    viewport: '390x900',
    theme: 'light',
    focusLifecycleResult:
      'PASS: keyboard traversal reached Open menu; Enter placed focus on Close inside the dialog; Tab stayed inside; Escape returned focus to Open menu after close animation.',
    readingOrDataMeaningObservation:
      'PASS: the mobile shell retained one main landmark, one route h1, named regions, labelled controls, and the dialog boundary.',
    operator: 'Codex App operator (non-human, operator-driven browser session)',
    date: STORY_174_3_MANUAL_EVIDENCE_DATE,
    outcome: 'passed',
    blockerOrGapReference: 'none',
  },
  {
    id: 'manual-dashboard-firefox-mobile-overlay',
    riskGroup: 'overlay-focus',
    route: '/dashboard',
    stateOrTask: 'mobile navigation dialog open, traversal, and dismissal',
    primaryKeyboardPath: 'body focus boundary, 2x Tab to Open menu, Enter, Tab, Escape',
    browser: 'Firefox via Playwright CLI',
    viewport: '390x900',
    theme: 'light',
    focusLifecycleResult:
      'PASS: keyboard traversal reached Open menu; focus entered and remained in the dialog; asynchronous close restored focus to Open menu.',
    readingOrDataMeaningObservation:
      'PASS: dialog and trigger names were preserved and route content remained outside the active focus scope while open.',
    operator: 'Codex App operator (non-human, operator-driven browser session)',
    date: STORY_174_3_MANUAL_EVIDENCE_DATE,
    outcome: 'passed',
    blockerOrGapReference: 'none',
  },
  {
    id: 'manual-dashboard-chromium-dark-data-meaning',
    riskGroup: 'data-meaning',
    route: '/dashboard',
    stateOrTask: 'dark-theme chart alternative and responsive financial meaning',
    primaryKeyboardPath: 'reload in persisted dark theme; inspect the route heading and semantic data table',
    browser: 'Chromium (Google Chrome channel via Playwright CLI)',
    viewport: '390x900',
    theme: 'dark',
    focusLifecycleResult:
      'PASS: 26 visible native or explicitly focusable targets remained available at the reviewed point.',
    readingOrDataMeaningObservation:
      'PASS: the route exposed h1 "Главная страница" and a table named "Данные графика детализации по дням за неделю; единицы: рубли" with Date, Orders ₽, Buyouts ₽, Advertising ₽, and Theoretical profit ₽ headers.',
    operator: 'Codex App operator (non-human, operator-driven browser session)',
    date: STORY_174_3_MANUAL_EVIDENCE_DATE,
    outcome: 'passed',
    blockerOrGapReference: 'none',
  },
  {
    id: 'manual-dashboard-webkit-semantic-focus',
    riskGroup: 'overlay-focus',
    route: '/dashboard',
    stateOrTask: 'Safari-engine semantic and mobile overlay lifecycle proxy',
    primaryKeyboardPath:
      'programmatically seed focus on Open menu, then Enter, Tab, Escape; separately attempt 160 native Tab presses from the body boundary',
    browser: 'WebKit via Playwright CLI (Safari-engine proxy, not Safari or VoiceOver)',
    viewport: '390x900',
    theme: 'light',
    focusLifecycleResult:
      'PARTIAL: seeded focus followed the correct Enter/dialog/Tab/Escape/return lifecycle, but the local headless WebKit daemon skipped the header trigger during 160 native Tab presses.',
    readingOrDataMeaningObservation:
      'PASS for semantics: route h1, named regions, radio groups, chart description, and a complete rouble-denominated data table were present in the accessibility snapshot.',
    operator: 'Codex App operator (non-human, operator-driven browser session)',
    date: STORY_174_3_MANUAL_EVIDENCE_DATE,
    outcome: 'environment-gap',
    blockerOrGapReference:
      'ENV-WEBKIT-TAB: local macOS/WebKit daemon keyboard-preference behavior prevents a truthful native Safari Tab-reachability claim; Chromium and Firefox prove the product path.',
  },
  {
    id: 'manual-at-voiceover-safari',
    riskGroup: 'assistive-technology',
    route: 'representative high-risk routes',
    stateOrTask: 'real VoiceOver with Safari semantic, rotor, and focus review',
    primaryKeyboardPath: 'not executed',
    browser: 'Safari with VoiceOver on macOS',
    viewport: 'not executed',
    theme: 'not-applicable',
    focusLifecycleResult: 'NOT EXECUTED: Playwright WebKit is not Safari and cannot operate VoiceOver.',
    readingOrDataMeaningObservation:
      'No real screen-reader observation is claimed; WebKit semantics and automated accessibility evidence are only substitutes.',
    operator: 'Codex App operator (environment capability record)',
    date: STORY_174_3_MANUAL_EVIDENCE_DATE,
    outcome: 'environment-gap',
    blockerOrGapReference:
      'ENV-AT-VOICEOVER: GUI VoiceOver/Safari operation is unavailable to the current automation surface.',
  },
  {
    id: 'manual-at-windows-mobile',
    riskGroup: 'assistive-technology',
    route: 'representative high-risk routes',
    stateOrTask: 'real NVDA, JAWS, and TalkBack review',
    primaryKeyboardPath: 'not executed',
    browser: 'Windows NVDA/JAWS and Android TalkBack environments',
    viewport: 'not executed',
    theme: 'not-applicable',
    focusLifecycleResult:
      'NOT EXECUTED: Windows screen-reader and Android device environments are not present on this macOS host.',
    readingOrDataMeaningObservation:
      'No NVDA, JAWS, or TalkBack observation is claimed.',
    operator: 'Codex App operator (environment capability record)',
    date: STORY_174_3_MANUAL_EVIDENCE_DATE,
    outcome: 'environment-gap',
    blockerOrGapReference:
      'ENV-AT-WINDOWS-MOBILE: required operating systems and physical/mobile AT environments are unavailable.',
  },
] as const

export const STORY_174_3_MANUAL_EVIDENCE_DISPOSITION = {
  productDefects: 'none-observed',
  unavailableEnvironments: 'recorded-non-product-gaps',
  rationale:
    'Story 174.3 acceptance and the UX browser matrix explicitly require unavailable environments to be recorded rather than claimed as passed. The privacy-safe DOM/accessibility/geometry baseline is the approved substitute for prohibited persisted screenshots; it does not substitute for real AT.',
} as const
