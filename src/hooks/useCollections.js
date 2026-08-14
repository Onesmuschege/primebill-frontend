import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { unwrapList } from '../api/axiosInstance'
import {
  getAging,
  getDunningSteps,
  deleteDunningStep,
  reorderDunningSteps,
  updateDunningStep,
  runDunningNow,
  getDunningRuns,
} from '../api/collections.api'

const STEPS_KEY = ['collections-steps']
const RUNS_KEY = ['collections-runs']

/**
 * Data layer for the Collections & Dunning cockpit.
 *
 * Backend surface (routes/api.php → Route::prefix('collections'), auth:sanctum +
 * tenant + permission gates; reads = `view collections`, mutations = `manage
 * dunning`):
 *   GET  /collections/aging               → aging summary
 *   GET  /collections/dunning-steps       → [DunningStep]
 *   POST /collections/dunning-steps       → store step
 *   PUT  /collections/dunning-steps/{s}   → update step
 *   DEL  /collections/dunning-steps/{s}   → delete step
 *   POST /collections/dunning-steps/reorder
 *   POST /collections/run                 → {email,sms,suspend,escalate,skipped}
 *   GET  /collections/dunning-runs        → paginator[DunningRun]
 *
 * Each mutation invalidates the relevant query and shows a toast, mirroring the
 * UX of the existing Tickets / Payments pages.
 */
export default function useCollections() {
  const { hasPermission } = useAuth()
  const canManage = hasPermission('manage dunning')
  const qc = useQueryClient()

  // runs history pagination + status filter (lives here so refetches stay in sync)
  const [runStatusFilter, setRunStatusFilter] = useState('')
  const [runPage, setRunPage] = useState(1)

  const aging = useQuery({
    queryKey: ['collections-aging'],
    queryFn: () => getAging().then((r) => r.data.data),
  })

  const stepsQ = useQuery({
    queryKey: STEPS_KEY,
    queryFn: () => getDunningSteps().then((r) => r.data.data),
  })
  const steps = stepsQ.data ?? []

  const runs = useQuery({
    queryKey: [...RUNS_KEY, { status: runStatusFilter, page: runPage }],
    queryFn: () =>
      unwrapList(
        getDunningRuns({
          status: runStatusFilter || undefined,
          per_page: 25,
          page: runPage,
        })
      ),
    placeholderData: (prev) => prev,
  })
  const runsList = runs.data?.data ?? []
  const runsMeta = runs.data?.meta ?? {}

  // mutations
  const deleteStep = useMutation({
    mutationFn: (id) => deleteDunningStep(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: STEPS_KEY })
      toast.success('Dunning step removed')
    },
    onError: () => toast.error('Could not remove step'),
  })

  const reorderSteps = useMutation({
    mutationFn: (ordered) => reorderDunningSteps(ordered),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: STEPS_KEY })
      toast.success('Dunning ladder reordered')
    },
    onError: () => toast.error('Could not reorder ladder'),
  })

  const toggleStep = useMutation({
    mutationFn: ({ id, is_active }) => updateDunningStep(id, { is_active: !is_active }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: STEPS_KEY })
      toast.success('Step status updated')
    },
    onError: () => toast.error('Could not update step'),
  })

  const runNow = useMutation({
    mutationFn: () => runDunningNow(200),
    onSuccess: (res) => {
      const s = res?.data?.data ?? {}
      qc.invalidateQueries({ queryKey: ['collections-aging'] })
      qc.invalidateQueries({ queryKey: RUNS_KEY })
      toast.success(
        `Dunning run complete — ${s.email ?? 0} email, ${s.sms ?? 0} SMS, ${s.suspend ?? 0} suspensions`
      )
    },
    onError: () => toast.error('Dunning run failed'),
  })

  return {
    canManage,
    aging: aging.data,
    agingLoading: aging.isLoading,
    refetchAging: aging.refetch,
    steps,
    stepsLoading: stepsQ.isLoading,
    runs: runsList,
    runsMeta,
    runsLoading: runs.isPending,
    refetchRuns: runs.refetch,
    runStatusFilter,
    setRunStatusFilter,
    runPage,
    setRunPage,
    deleteStep,
    reorderSteps,
    toggleStep,
    runNow,
  }
}
