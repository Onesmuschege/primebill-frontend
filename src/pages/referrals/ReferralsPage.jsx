import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getReferralCode, joinReferral, getReferralStats,
} from '../../api/referrals.api'
import Modal from '../../components/common/Modal'
import Spinner from '../../components/common/Spinner'
import toast from 'react-hot-toast'

const EMPTY = { referral_code: '' }

const StatCard = ({ label, value, color = '#2563eb' }) => (
  <div className="card p-4">
    <div className="text-2xl font-bold" style={{ color }}>{value ?? '—'}</div>
    <div className="text-xs mt-1" style={{ color: 'var(--pb-text-3)' }}>{label}</div>
  </div>
)

export default function ReferralsPage() {
  const qc = useQueryClient()
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(EMPTY)

  const codeQuery = useQuery({
    queryKey: ['referral-code'],
    queryFn: async () => {
      const res = await getReferralCode()
      return res.data?.data ?? res.data
    },
  })
  const statsQuery = useQuery({
    queryKey: ['referral-stats'],
    queryFn: async () => {
      const res = await getReferralStats({ period: 'all' })
      return res.data?.data ?? res.data
    },
  })

  const join = useMutation({
    mutationFn: (data) => joinReferral(data),
    onSuccess: () => {
      toast.success('Referral code applied to your account')
      setModal(false)
      setForm(EMPTY)
      qc.invalidateQueries(['referral-code', 'referral-stats'])
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Join failed'),
  })

  const codeData = codeQuery.data || {}
  const statsData = statsQuery.data || {}
  const referralLink = codeData.code
    ? `${window.location.origin}/referral/${codeData.code}`
    : ''

  const copy = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => toast.success('Copied'))
      .catch(() => toast.error('Copy failed'))
  }

  return (
    <div className="space-y-5">
      <div className="card flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Referrals</h2>
          <p className="text-sm" style={{ color: 'var(--pb-text-3)' }}>Your referral code and performance</p>
        </div>
        {!codeData.code && (
          <button
            onClick={() => setModal(true)}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white"
            style={{ background: '#2563eb' }}
          >+ Use a Referral Code</button>
        )}
      </div>

      {codeQuery.isLoading && <Spinner />}

      {!codeQuery.isLoading && codeData && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Referrals" value={codeData.referral_count} />
          <StatCard
            label="Bonus Earned"
            value={codeData.referral_bonus != null
              ? `KSh ${Number(codeData.referral_bonus).toLocaleString()}`
              : '—'}
          />
          <StatCard
            label="Referred By"
            value={statsData.referred_by || '—'}
            color={statsData.referred_by ? '#10b981' : undefined}
          />
        </div>
      )}

      {!codeData.code && (
        <div className="card p-4">
          <p className="text-sm" style={{ color: 'var(--pb-text-2)' }}>
            You haven't joined the referral programme yet. Enter a referral code
            from a referrer to link your account.
          </p>
        </div>
      )}

      {codeData.code && (
        <div className="card p-4">
          <p className="text-xs font-medium mb-1" style={{ color: 'var(--pb-text-2)' }}>Your referral code</p>
          <div className="font-mono text-2xl font-bold break-all" style={{ color: 'var(--pb-text-1)' }}>{codeData.code}</div>
          {referralLink && (
            <div className="mt-3 flex items-center gap-2">
              <input
                readOnly
                value={referralLink}
                onDoubleClick={() => copy(referralLink)}
                className="input text-xs flex-1"
              />
              <button
                onClick={() => copy(referralLink)}
                className="px-3 py-2 rounded-lg text-sm text-white"
                style={{ background: '#2563eb' }}
              >Copy</button>
            </div>
          )}
          <p className="mt-2 text-xs" style={{ color: 'var(--pb-text-3)' }}>
            Share your link — sign-ups using it are attributed to you and earn
            KSh 500 per verified conversion.
          </p>
        </div>
      )}

      <Modal isOpen={modal} onClose={() => setModal(false)} title="Use a Referral Code" size="md">
        <form
          onSubmit={(e) => { e.preventDefault(); join.mutate(form) }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--pb-text-2)' }}>Referral code *</label>
            <input
              value={form.referral_code}
              onChange={(e) => setForm({ referral_code: e.target.value.toUpperCase() })}
              className="input text-sm uppercase"
              placeholder="e.g. ABC123"
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setModal(false)}
              className="px-4 py-2 rounded-lg text-sm"
              style={{ background: 'var(--pb-raised)' }}
            >Cancel</button>
            <button
              type="submit"
              disabled={join.isPending}
              className="px-4 py-2 rounded-lg text-sm text-white"
              style={{ background: '#2563eb' }}
            >{join.isPending ? 'Applying…' : 'Apply'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
