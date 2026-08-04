import { installOutboundNetworkGuard } from './outbound-network-guard'

// This file must remain the first ordered Vitest setup entry. Keep general
// setup and MSW imports out so transport guards exist before their evaluation.
installOutboundNetworkGuard()
