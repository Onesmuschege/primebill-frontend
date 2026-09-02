import ActionRail from '../../components/ops/ActionRail'
import { Pause, Play, WifiOff, Gauge, RefreshCw } from 'lucide-react'

/**
 * ServiceActionsRail — state-aware action rail for the Service 360 workspace.
 * Gating mirrors the REAL backend transitions (ClientAccount::allowedTransitions)
 * and session presence: no action is offered that the backend would reject.
 * All actions are additionally gated on 'view network' — the actual Laravel
 * middleware permission on the /network/services/* route group.
 */
export default function ServiceActionsRail({
  canSuspend,
  canRestore,
  isTerminal,
  hasSession,
  stateLabel,
  username,
  sessionCount,
  suspend,
  restore,
  disconnect,
  onCoa,
  onRefresh,
  isFetching,
}) {
  const notAvailable = (why) => `Suspend not available from ${why}`
  return (
    <ActionRail
      orientation="horizontal"
      title="Service actions"
      actions={[
        {
          key: 'suspend',
          label: 'Suspend',
          icon: <Pause size={13} />,
          permission: 'view network',
          danger: true,
          disabled: !canSuspend,
          disabledReason: isTerminal ? 'Terminated service — terminal state' : notAvailable(stateLabel),
          confirm: {
            title: 'Suspend service',
            message: `Place an administrative hold on ${username ?? 'this service'}? RADIUS access will be denied until restored.`,
            confirmLabel: 'Suspend',
          },
          pending: suspend.isPending,
          onClick: () => suspend.mutate(),
        },
        {
          key: 'restore',
          label: 'Restore',
          icon: <Play size={13} />,
          permission: 'view network',
          disabled: !canRestore,
          disabledReason: `Restore not available from ${stateLabel}`,
          confirm: {
            title: 'Restore service',
            message: `Lift the administrative hold on ${username ?? 'this service'} and re-activate?`,
            confirmLabel: 'Restore',
          },
          pending: restore.isPending,
          onClick: () => restore.mutate(),
        },
        {
          key: 'disconnect',
          label: 'Disconnect',
          icon: <WifiOff size={13} />,
          permission: 'view network',
          danger: true,
          disabled: !hasSession,
          disabledReason: hasSession ? undefined : 'No active session to disconnect',
          confirm: {
            title: 'Disconnect session',
            message: `Send a disconnect to ${sessionCount} active session(s)?`,
            confirmLabel: 'Disconnect',
          },
          pending: disconnect.isPending,
          onClick: () => disconnect.mutate(),
        },
        {
          key: 'coa',
          label: 'CoA',
          icon: <Gauge size={13} />,
          permission: 'view network',
          disabled: !hasSession,
          disabledReason: hasSession ? undefined : 'CoA requires an active session',
          onClick: onCoa,
        },
        {
          key: 'refresh',
          label: 'Refresh',
          icon: <RefreshCw size={13} />,
          onClick: onRefresh,
          pending: isFetching,
        },
      ]}
    />
  )
}
