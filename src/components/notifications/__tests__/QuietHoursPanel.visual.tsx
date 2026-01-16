// ============================================================================
// QuietHoursPanel Visual Test
// Epic 34-FE: Story 34.4-FE
// ============================================================================

/**
 * This is a visual test component to verify QuietHoursPanel rendering
 * Run in Storybook or a test page to verify:
 *
 * AC#1: Native time pickers with 15-min intervals
 * AC#2: Grouped timezone dropdown
 * AC#3: Current time preview (updates every 60s)
 * AC#4: Overnight period hint (when from > to)
 * AC#5: Active quiet hours badge
 * AC#6: Accessibility (aria-labels, keyboard navigation)
 *
 * Test Scenarios:
 * 1. Default state (enabled=false, no time pickers shown)
 * 2. Enabled state (time pickers visible)
 * 3. Overnight period (23:00 - 07:00, hint visible)
 * 4. Active quiet hours (badge visible when current time in range)
 * 5. Timezone selection (grouped dropdown, time preview updates)
 * 6. Mobile responsive (full-width inputs <640px)
 *
 * Manual Verification Checklist:
 * [ ] Toggle switch changes state
 * [ ] Time pickers accept 24-hour HH:MM format
 * [ ] Time pickers increment by 15 minutes
 * [ ] Overnight hint appears when from > to
 * [ ] Current time preview updates every 60s
 * [ ] Active badge appears when in quiet hours
 * [ ] Timezone dropdown shows Europe/Asia groups
 * [ ] All elements have aria-labels
 * [ ] Keyboard navigation works
 * [ ] Mobile: inputs are full-width
 * [ ] Disabled state: all inputs disabled
 */

import { QuietHoursPanel } from '../QuietHoursPanel';

export function VisualTest() {
  return (
    <div className="p-8 space-y-8 bg-gray-50">
      <div>
        <h2 className="text-2xl font-bold mb-4">Quiet Hours Panel - Visual Test</h2>
        <p className="text-gray-600 mb-4">
          Test all acceptance criteria (AC#1-6) from Story 34.4-FE
        </p>
      </div>

      {/* Scenario 1: Default State (Disabled) */}
      <section>
        <h3 className="text-xl font-semibold mb-2">Scenario 1: Disabled Panel</h3>
        <p className="text-sm text-gray-600 mb-4">
          Panel should be grayed out with opacity-50 and pointer-events-none
        </p>
        <QuietHoursPanel disabled={true} />
      </section>

      {/* Scenario 2: Enabled State */}
      <section>
        <h3 className="text-xl font-semibold mb-2">Scenario 2: Enabled Panel</h3>
        <p className="text-sm text-gray-600 mb-4">
          Toggle on to show time pickers, timezone dropdown, and current time preview
        </p>
        <QuietHoursPanel />
      </section>

      {/* Manual Test Instructions */}
      <section className="bg-white p-6 rounded-lg border-2 border-blue-500">
        <h3 className="text-xl font-semibold mb-4">Manual Test Instructions</h3>

        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-blue-700 mb-2">Test Overnight Period (AC#4)</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Toggle quiet hours ON</li>
              <li>Set "С" (from) to <code>23:00</code></li>
              <li>Set "До" (to) to <code>07:00</code></li>
              <li>✅ Verify orange hint appears: "период через полночь"</li>
            </ol>
          </div>

          <div>
            <h4 className="font-medium text-blue-700 mb-2">Test Timezone Selection (AC#2)</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Click timezone dropdown</li>
              <li>✅ Verify "Европа" and "Азия" group headers</li>
              <li>✅ Verify 13 timezone options total</li>
              <li>Select "Владивосток (GMT+10)"</li>
              <li>✅ Verify current time preview updates</li>
            </ol>
          </div>

          <div>
            <h4 className="font-medium text-blue-700 mb-2">Test Active Badge (AC#5)</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Set quiet hours to include current time</li>
              <li>Example: If now is 14:00, set 13:00-15:00</li>
              <li>✅ Verify blue badge appears: "🌙 Сейчас активны тихие часы"</li>
              <li>Wait 60 seconds and verify badge updates if time changes</li>
            </ol>
          </div>

          <div>
            <h4 className="font-medium text-blue-700 mb-2">Test Time Preview Updates (AC#3)</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Note current time in preview (e.g., "Сейчас в Europe/Moscow: 14:32")</li>
              <li>Wait 60 seconds</li>
              <li>✅ Verify time updates automatically (should change to 14:33)</li>
            </ol>
          </div>

          <div>
            <h4 className="font-medium text-blue-700 mb-2">Test Accessibility (AC#6)</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Press Tab key to navigate between elements</li>
              <li>✅ Verify focus indicators on all interactive elements</li>
              <li>✅ Verify aria-labels on time pickers and switch</li>
              <li>Use screen reader to verify announcements</li>
            </ol>
          </div>

          <div>
            <h4 className="font-medium text-blue-700 mb-2">Test Mobile Responsive</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Resize browser to mobile width (&lt;640px)</li>
              <li>✅ Verify time pickers are full-width (not 120px)</li>
              <li>✅ Verify timezone dropdown is full-width (not 240px)</li>
              <li>✅ Verify time pickers stack vertically</li>
            </ol>
          </div>
        </div>
      </section>
    </div>
  );
}

export default VisualTest;
