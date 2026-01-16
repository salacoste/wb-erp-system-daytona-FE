# Changelog: WB API Token Key Name Fix

**Date:** 2025-11-21  
**Issue:** Frontend and backend were using different key names for WB API token storage

## Problem

- **Backend** expected key name: `'wb_api_token'`
- **Frontend** was using key name: `'wb_standard_token'`
- **Result:** Backend couldn't find the token → 401 Unauthorized errors

## Root Cause

Backend services (`wb-products.service.ts`, `wb-finances.service.ts`) use `getDecryptedToken()` with default parameter `'wb_api_token'`, but frontend components were saving tokens with key name `'wb_standard_token'`.

## Solution

Updated all frontend code to use `'wb_api_token'` consistently:

### Files Changed

1. **Components:**
   - `src/components/custom/WbTokenForm.tsx` - Changed from `'wb_standard_token'` to `'wb_api_token'`
   - `src/components/custom/UpdateWbTokenForm.tsx` - Updated default keyName parameter

2. **API:**
   - `src/lib/api.ts` - Updated JSDoc comment

3. **Tests:**
   - `src/components/custom/WbTokenForm.test.tsx` - Updated all test assertions
   - `src/components/custom/UpdateWbTokenForm.test.tsx` - Updated test constants
   - `src/lib/api.test.ts` - Updated test constants

4. **Documentation:**
   - `docs/request-backend/02-update-wb-api-token-in-cabinet.md` - Updated all examples

## Verification

- ✅ Build passes successfully
- ✅ All `'wb_standard_token'` references removed from `src/` directory
- ✅ Dashboard correctly shows "WB API токен не настроен" message when token is missing
- ✅ Error handling improved (no console.error for expected 401 errors)

## Impact

**Before:** Users couldn't access product data even after saving WB API token  
**After:** After saving WB API token with correct key name, backend can find and use it

## Migration Notes

If you have existing tokens saved with `'wb_standard_token'`:
1. They will not be found by backend services
2. Users need to re-save their WB API token through the onboarding form
3. New tokens will be saved with correct key name `'wb_api_token'`

## Related Files

- Backend: `src/shared/wb-api/wb-products.service.ts` (line 78)
- Backend: `src/shared/wb-api/wb-finances.service.ts` (line ~similar)
- Frontend: All token save/update operations now use `'wb_api_token'`

