import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Gift, Star, ArrowUpRight, ArrowDownRight, Plus } from 'lucide-react'
import { getClientLoyalty, adjustPoints, getLoyaltyLeaders } from '../../api/loyalty.api'
import { getClients } from '../../api/clients.api'
import Modal from '../../components/common/Modal'
import toast from 'react-hot-toast'

export default function LoyaltyPoints() {
  const [selectedClient, setSelectedClient] = useState(null)
  const [showAdjust, setShowAdjust] = useState(false)
  const [adjForm, setAdjForm] = useState({ points: '', reason: '' })
  const qc = useQueryClient()

  const { data: leaders = [] } = useQuery({
    queryKey: ['loyalty-leaderboard'],
    queryFn: () => getLoyaltyLeaders().then(r => r.data.data),
  })

  const { data: clientsData } = useQuery({
    queryKey: ['clients-list'],
    queryFn: () => getClients({ per_page: 100 }).then(r => r.data.data?.data),
  })

  const { data: loyaltyData } = useQuery({
    queryKey: ['client-loyalty', selectedClient],
    queryFn: () => getClientLoyalty(selectedClient).then(r => r.data.data),
    enabled: !!selectedClient,
  })

  const adjustMutation = useMutation({
    mutationFn: () => adjustPoints(selectedClient, adjForm),
    onSuccess: () => {
      toast.success('Points adjusted')
      setShowAdjust(false)
      setAdjForm({ points: '', reason: '' })
      qc.invalidateQueries(['client-loyalty', selectedClient])
      qc.invalidateQueries(['loyalty-leaderboard'])
    },
    onError: e => toast.error(e.response?.data?.message || 'Failed'),
  })

  const TYPE_ICON = {
    earned:     <ArrowUpRight size={14} style={{ color: '#34d399' }} />,
    redeemed:   <ArrowDownRight size={14} style={{ color: '#f87171' }} />,
    adjustment: <Star size={14} style={{ color: '#fbbf24' }} />,
    expired:    <ArrowDownRight size={14} style={{ color: '#94a3b8' }} />,
  }

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Loyalty Points</h1>
          <p className="page-subtitle">Reward clients and track referrals</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Leaderboard */}
        <div className="card">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Star size={16} style={{ color: '#fbbf24' }} /> Top Clients
          </h3>
          <div className="space-y-3">
            {leaders.map((c, i) => (
              <div key={c.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: i === 0 ? '#fbbf24' : i === 1 ? '#94a3b8' : '#cd7c2f', color: '#fff' }}>
                    {i + 1}
                  </span>
                  <span className="text-sm">{c.first_name} {c.last_name}</span>
                </div>
                <span className="text-sm font-bold" style={{ color: '#60a5fa' }}>
                  {c.loyalty_points_balance.toLocaleString()} pts
                </span>
              </div>
            ))}
            {leaders.length === 0 && (
              <p className="text-sm text-center py-4" style={{ color: 'var(--pb-text-3)' }}>No data yet</p>
            )}
          </div>
        </div>

        {/* Client selector + history */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <select
                value={selectedClient || ''}
                onChange={e => setSelectedClient(e.target.value || null)}
                className="input flex-1"
              >
                <option value="">Select a client to view points…</option>
                {clientsData?.map(c => (
                  <option key={c.id} value={c.id}>{c.first_name} {c.last_name} — {c.phone}</option>
                ))}
              </select>
              {selectedClient && (
                <button onClick={() => setShowAdjust(true)} className="btn-primary whitespace-nowrap">
                  <Plus size={15} /> Adjust Points
                </button>
              )}
            </div>

            {loyaltyData && (
              <>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="rounded-xl p-4 text-center stat-accent-blue card">
                    <p className="text-3xl font-black" style={{ color: '#60a5fa' }}>
                      {loyaltyData.balance?.toLocaleString()}
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'var(--pb-text-2)' }}>Current Balance</p>
                  </div>
                  <div className="rounded-xl p-4 text-center stat-accent-green card">
                    <p className="text-lg font-bold font-mono" style={{ color: '#34d399' }}>
                      {loyaltyData.referral_code || '—'}
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'var(--pb-text-2)' }}>Referral Code</p>
                  </div>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {loyaltyData.history?.data?.map(h => (
                    <div key={h.id} className="flex items-center justify-between py-2 border-b"
                      style={{ borderColor: 'var(--pb-border)' }}>
                      <div className="flex items-center gap-2">
                        {TYPE_ICON[h.type]}
                        <div>
                          <p className="text-sm">{h.reason}</p>
                          <p className="text-xs" style={{ color: 'var(--pb-text-3)' }}>
                            {new Date(h.created_at).toLocaleDateString('en-KE')}
                          </p>
                        </div>
                      </div>
                      <span className={`text-sm font-bold ${h.points > 0 ? 'text-green-500' : 'text-red-400'}`}>
                        {h.points > 0 ? '+' : ''}{h.points}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {!selectedClient && (
              <div className="py-10 text-center" style={{ color: 'var(--pb-text-3)' }}>
                <Gift size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Select a client to view their loyalty history</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal isOpen={showAdjust} onClose={() => setShowAdjust(false)} title="Adjust Points" size="sm">
        <div className="space-y-4">
          <div>
            <label className="label">Points (negative to deduct)</label>
            <input type="number" value={adjForm.points} className="input"
              placeholder="e.g. 100 or -50"
              onChange={e => setAdjForm({...adjForm, points: e.target.value})} />
          </div>
          <div>
            <label className="label">Reason</label>
            <input value={adjForm.reason} className="input" placeholder="e.g. Manual bonus for loyalty"
              onChange={e => setAdjForm({...adjForm, reason: e.target.value})} />
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowAdjust(false)} className="btn-secondary">Cancel</button>
            <button onClick={() => adjustMutation.mutate()} disabled={adjustMutation.isPending} className="btn-primary">
              {adjustMutation.isPending ? 'Saving…' : 'Apply Adjustment'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}