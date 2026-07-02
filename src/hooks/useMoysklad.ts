/**
 * МойСклад hooks barrel (Phase 1 MVP).
 * Contract: docs/request-backend/221-moysklad-integration-backend-contract.md
 *
 * Split for the 200-line cap:
 *   - useMoyskladQueries — health / organizations / mappings / link
 *   - useMoyskladSync — sync trigger + list-diff polling + rate-limit
 */

export {
  useMoyskladHealth,
  useMoyskladOrganizations,
  useMoyskladMappings,
  useLinkMapping,
  moyskladQueryKeys,
} from './useMoyskladQueries'
export { useMoyskladSync, type UseMoyskladSyncResult } from './useMoyskladSync'
