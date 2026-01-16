# Bug Fix: Date Input Not Updating & Form Reset Issues

**Date:** 2025-11-23
**Status:** ✅ Fixed
**Severity:** Medium
**Component:** SingleCogsForm (COGS Assignment)

---

## 🐛 Problem Description

### Issue #1: Date Value Not Persisting After Save

**User Report:**
> "Если выбрать дату в прошлом (например, 4 дня назад), то нет ошибки и сохранение проходит, но значение не меняется даты в итоге"

**Reproduction Steps:**
1. Open COGS assignment form for Product A
2. Enter cost: 999.00 ₽
3. Change date from today to 4 days ago (e.g., 2025-11-19 instead of 2025-11-23)
4. Click "Назначить себестоимость"
5. ✅ Success toast appears
6. ❌ **BUG:** Form date resets to OLD value instead of showing the saved date

**Root Cause:** Form's `reset()` function called without parameters, reverting to `defaultValues` from initial render instead of using updated values from backend response.

### Issue #2: Date Validation Comparing Full Timestamps

**Technical Issue:**
Date validation was comparing dates with full timestamps (including hours/minutes/seconds) instead of comparing only the date part.

**Example:**
```typescript
// User selects: 2025-11-23
const inputDate = new Date("2025-11-23") // = 2025-11-23 00:00:00

// Comparison:
const today = new Date() // = 2025-11-23 14:30:45

// Result: inputDate < today (because of time difference!)
// This could cause inconsistent validation behavior
```

---

## 🔧 Fixes Applied

### Fix #1: Date Validation Using Midnight Timestamps

**Files Modified:**
- `src/components/custom/SingleCogsForm.tsx` (lines 207-223)
- `src/hooks/useSingleCogsAssignment.ts` (lines 158-176)

**Before:**
```typescript
validate: (value) => {
  const date = new Date(value)      // Includes timezone offset
  const today = new Date()           // Includes current time
  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(today.getFullYear() - 1)

  if (date > today) return 'Дата не может быть в будущем'
  if (date < oneYearAgo) return 'Дата не может быть более года назад'
}
```

**Problems:**
- `new Date(value)` from input[type="date"] creates midnight timestamp, but timezone may shift it
- `new Date()` for "today" includes current time (14:30:45), not midnight
- Comparison inconsistent due to time components

**After:**
```typescript
validate: (value) => {
  // Parse date string (YYYY-MM-DD format from input[type="date"])
  const inputDate = new Date(value + 'T00:00:00') // Add time to avoid timezone issues

  // Get today's date at midnight (ignore time)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Get one year ago at midnight
  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(today.getFullYear() - 1)
  oneYearAgo.setHours(0, 0, 0, 0)

  if (inputDate > today) return 'Дата не может быть в будущем'
  if (inputDate < oneYearAgo) return 'Дата не может быть более года назад'
}
```

**Benefits:**
- ✅ All dates normalized to midnight (00:00:00)
- ✅ Consistent comparison (no time component interference)
- ✅ Timezone issues prevented with explicit 'T00:00:00'
- ✅ Works correctly for today, past dates, and edge cases

### Fix #2: Form Reset with Updated Values

**File Modified:** `src/components/custom/SingleCogsForm.tsx` (lines 125-133)

**Before:**
```typescript
onSuccess: (response) => {
  toast.success('Себестоимость назначена успешно')

  // Reset form to defaultValues (OLD values from initial render!)
  reset()

  onSuccess?.()
}
```

**Problem:** `reset()` without parameters reverts form to `defaultValues`, which are set only once on component mount. If user changed the date to 4 days ago, after save the form would show TODAY's date again (the original default).

**After:**
```typescript
onSuccess: (response) => {
  toast.success('Себестоимость назначена успешно')

  // Reset form with UPDATED values from backend response
  // This ensures the form shows the newly assigned COGS instead of old values
  if (response.cogs) {
    reset({
      unit_cost_rub: response.cogs.unit_cost_rub,
      valid_from: response.cogs.valid_from.split('T')[0], // Extract date part
      notes: response.cogs.notes || '',
    })
  }

  onSuccess?.()
}
```

**Benefits:**
- ✅ Form displays ACTUAL saved values from backend
- ✅ User sees confirmation that their date choice was saved
- ✅ No confusion about "date not changing"
- ✅ Consistent with backend state

---

## 📋 Testing Scenarios

### Scenario 1: Save with Past Date

**Steps:**
1. Open COGS form for product "Краска для мебели" (nm_id: 321678606)
2. Enter cost: 999.00 ₽
3. Change date from "23.11.2025" to "19.11.2025" (4 days ago)
4. Click "Назначить себестоимость"

**Expected Result (BEFORE FIX):**
- ❌ Form date shows "23.11.2025" (today) after save
- ❌ User confused: "Did my date save?"

**Expected Result (AFTER FIX):**
- ✅ Form date shows "19.11.2025" (the date user selected)
- ✅ User confident: "My date was saved correctly"

### Scenario 2: Validation with Today's Date

**Steps:**
1. Open COGS form
2. Select today's date
3. Click "Назначить себестоимость"

**Expected Result (BEFORE & AFTER FIX):**
- ✅ Validation passes (today is allowed)
- ✅ Form saves successfully
- ✅ Form shows today's date after save

### Scenario 3: Validation with Future Date

**Steps:**
1. Open COGS form
2. Select tomorrow's date (2025-11-24)
3. Try to submit

**Expected Result (BEFORE & AFTER FIX):**
- ❌ Validation error: "Дата не может быть в будущем"
- ❌ Form does not submit
- ✅ User sees error message

### Scenario 4: Validation with Date >1 Year Ago

**Steps:**
1. Open COGS form
2. Select date: 2024-01-01 (more than 1 year ago)
3. Try to submit

**Expected Result (BEFORE & AFTER FIX):**
- ❌ Validation error: "Дата не может быть более года назад"
- ❌ Form does not submit
- ✅ User sees error message

### Scenario 5: Switching Between Products

**Steps:**
1. Assign COGS to Product A with date 2025-11-19
2. Click "Вперёд" to navigate to Product B
3. Product B has existing COGS with date 2025-11-20

**Expected Result (BEFORE FIX - Issue from previous bug):**
- ❌ Form shows date 2025-11-19 (from Product A)

**Expected Result (AFTER FIX):**
- ✅ Form shows date 2025-11-20 (from Product B)
- ✅ useEffect properly resets form when nmId changes

---

## 🔍 Technical Details

### Date Handling Best Practices

**Problem with Timezones:**
```typescript
// User in Moscow (UTC+3) selects: 2025-11-20
new Date("2025-11-20")
// Browser interprets as: 2025-11-20 00:00:00 UTC
// Converts to local time: 2025-11-20 03:00:00 MSK (Moscow)
// Date component might shift unexpectedly!
```

**Solution:**
```typescript
// Explicitly specify midnight in LOCAL timezone
new Date("2025-11-20T00:00:00")
// Browser interprets as: 2025-11-20 00:00:00 MSK (Moscow)
// No timezone conversion issues
```

### Input[type="date"] Behavior

**Input Format:** `YYYY-MM-DD` (ISO 8601 date-only format)

**Browser Display:**
- Chrome/Edge: Shows date in system locale (e.g., "20.11.2025" in Russia, "11/20/2025" in USA)
- Firefox/Safari: Same localized display

**Value Property:** Always returns `YYYY-MM-DD` regardless of display format

**Example:**
```html
<input type="date" value="2025-11-20">
<!-- Displays: 20.11.2025 (in Russia) -->
<!-- .value returns: "2025-11-20" -->
```

### React Hook Form Reset Behavior

**`reset()` with no parameters:**
```typescript
reset() // Resets to defaultValues from useForm initialization
```

**`reset(values)` with parameters:**
```typescript
reset({ field1: 'new value' }) // Resets to specified values
```

**Best Practice:**
- After API call success, use `reset(responseData)` to sync form with server state
- Prevents confusion when server returns different values (e.g., formatted/normalized)

---

## 📊 Impact Analysis

### Before Fix

**User Experience:**
- 🔴 Confusing behavior: date appears to not save
- 🔴 User might re-submit multiple times thinking it failed
- 🔴 Lost trust in form reliability

**Data Integrity:**
- ✅ Data saved correctly on backend (no data loss)
- 🟡 UI inconsistency with backend state

### After Fix

**User Experience:**
- ✅ Clear confirmation: saved date displayed
- ✅ Predictable behavior: form shows what was saved
- ✅ Increased trust in form reliability

**Data Integrity:**
- ✅ Data saved correctly on backend
- ✅ UI consistent with backend state

---

## 🔗 Related Files

**Frontend:**
- `src/components/custom/SingleCogsForm.tsx` - Form component
- `src/hooks/useSingleCogsAssignment.ts` - Mutation hook with validation

**Backend:**
- `src/cogs/cogs.controller.ts` - COGS API endpoints
- `prisma/schema.prisma:387-419` - COGS table schema

**Documentation:**
- `docs/COGS-HISTORY-AND-NOTES-EXPLANATION.md` - Temporal versioning explanation
- `docs/stories/4.1.single-product-cogs-assignment.md` - Story 4.1 spec

---

## ✅ Verification Checklist

- [x] Date validation normalized to midnight timestamps
- [x] Form resets with backend response values after save
- [x] Past dates (within 1 year) save correctly
- [x] Future dates blocked with error message
- [x] Dates >1 year ago blocked with error message
- [x] Today's date works correctly
- [x] Form updates when switching between products (from previous fix)
- [x] Code comments added explaining date handling
- [x] Both SingleCogsForm and validation hook updated consistently

---

## 📝 Commit Message

```
fix(cogs): Date input reset and validation issues

Fixed two date-related bugs in COGS assignment form:

1. Date validation now compares midnight timestamps instead of full timestamps
   - Prevents timezone issues with input[type="date"]
   - Consistent comparison (no time component interference)

2. Form reset after save now uses backend response values
   - User sees ACTUAL saved date, not default value
   - Fixes confusion when date appears to "not change"

Files modified:
- src/components/custom/SingleCogsForm.tsx (date validation, form reset)
- src/hooks/useSingleCogsAssignment.ts (date validation)

Testing:
- ✅ Past dates (within 1 year) save and display correctly
- ✅ Future dates rejected with error message
- ✅ Dates >1 year rejected with error message
- ✅ Form shows saved values after submission

Closes: Internal bug report from 2025-11-23
```

---

**Document Version:** 1.0
**Last Updated:** 2025-11-23
**Status:** ✅ Fixed and Tested
**Severity:** Medium → Resolved
