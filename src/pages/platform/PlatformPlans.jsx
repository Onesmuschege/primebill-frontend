import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { getPlatformPlans, createPlatformPlan, updatePlatformPlan, deletePlatformPlan } from '../../api/platform.api'
import Table from '../../components/common/Table'
import Modal from '../../components/common/Modal'
import Spinner from '../../components/common/Spinner'
import { formatKES } from '../../utils/formatCurrency'
import { Plus, Edit3, Trash2, Package } from 'lucide-react'

const EMPTY = { slug:'', name:'', description:'', billing_cycle:'monthly', price:'', annual_price:'', is_active:true, is_trial_available:true, trial_days:14, grace_days:7, features:'', max_clients:'', max_users:'', max_routers:'', storage_quota_gb:'', api_calls_per_month:'', sort_order:'' }

export default function PlatformPlans() {
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [delTarget, setDelTarget] = useState(null)

  const { data, isLoading } = useQuery({ queryKey:['platform-plans-crud'], queryFn: () => getPlatformPlans() })
  const plans = Array.isArray(data?.data) ? data.data : []
  const refresh = () => { qc.invalidateQueries({ queryKey:['platform-plans-crud'] }); qc.invalidateQueries({ queryKey:['platform-plans'] }) }

  const createMut = useMutation({ mutationFn: createPlatformPlan, onSuccess: () => { toast.success('Plan created'); refresh(); closeModal() }, onError: (e) => toast.error(e?.response?.data?.message || 'Failed to create plan') })
  const updateMut = useMutation({ mutationFn: ({ id, payload }) => updatePlatformPlan(id, payload), onSuccess: () => { toast.success('Plan updated'); refresh(); closeModal() }, onError: (e) => toast.error(e?.response?.data?.message || 'Failed to update plan') })
  const deleteMut = useMutation({ mutationFn: deletePlatformPlan, onSuccess: () => { toast.success('Plan deleted'); refresh(); setDelTarget(null) }, onError: (e) => toast.error(e?.response?.data?.message || 'Failed to delete plan') })

  const openCreate = () => { setEditing(null); setForm(EMPTY); setModalOpen(true) }
  const openEdit = (p) => { setEditing(p); setForm({ slug:p.slug||'', name:p.name||'', description:p.description||'', billing_cycle:p.billing_cycle||'monthly', price:p.price??'', annual_price:p.annual_price??'', is_active:p.is_active??true, is_trial_available:p.is_trial_available??true, trial_days:p.trial_days??14, grace_days:p.grace_days??7, features:(p.features||[]).join(', '), max_clients:p.max_clients??'', max_users:p.max_users??'', max_routers:p.max_routers??'', storage_quota_gb:p.storage_quota_gb??'', api_calls_per_month:p.api_calls_per_month??'', sort_order:p.sort_order??'' }); setModalOpen(true) }
  const closeModal = () => { setModalOpen(false); setEditing(null); setForm(EMPTY) }
  const submit = () => { const pl = { slug:form.slug.trim(), name:form.name.trim(), description:form.description.trim()||null, billing_cycle:form.billing_cycle, price:Number(form.price)||0, annual_price:form.annual_price?Number(form.annual_price):null, is_active:!!form.is_active, is_trial_available:!!form.is_trial_available, trial_days:Number(form.trial_days)||0, grace_days:Number(form.grace_days)||0, features:form.features?form.features.split(',').map(f=>f.trim()).filter(Boolean):[], max_clients:Number(form.max_clients)||0, max_users:Number(form.max_users)||0, max_routers:Number(form.max_routers)||0, storage_quota_gb:Number(form.storage_quota_gb)||0, api_calls_per_month:Number(form.api_calls_per_month)||0, sort_order:Number(form.sort_order)||0 }; editing ? updateMut.mutate({ id:editing.id, payload:pl }) : createMut.mutate(pl) }
  const busy = createMut.isPending || updateMut.isPending
  const cols = [
    { key:'name', label:'Plan', render:(p) => (<div className="flex items-center gap-2"><Package size={16} style={{color:"var(--pb-primary)"}} /><div><p className="font-medium" style={{color:"var(--pb-text-1)"}}>{p.name}</p><p className="text-xs" style={{color:"var(--pb-text-3)"}}>{p.slug}</p></div></div>) },
    { key:'price', label:'Monthly', render:(p) => (<span className="font-medium" style={{color:"var(--pb-text-1)"}}>{formatKES(p.price_monthly)}</span>) },
    { key:'limits', label:'Limits', render:(p) => (<span className="text-xs" style={{color:"var(--pb-text-3)"}}>{p.max_clients} clients · {p.max_users} users</span>) },
    { key:'status', label:'Status', render:(p) => (<span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" style={{color:p.is_active?"#34d399":"#94a3b8",background:p.is_active?"rgba(16,185,129,0.12)":"rgba(148,163,184,0.12)"}}>{p.is_active?"Active":"Inactive"}</span>) },
    { key:'actions', label:'', render:(p) => (<div className="flex items-center gap-1 justify-end"><button onClick={()=>openEdit(p)} className="p-1.5 rounded-lg hover:bg-black/5"><Edit3 size={14} style={{color:"var(--pb-text-2)"}} /></button><button onClick={()=>setDelTarget(p)} className="p-1.5 rounded-lg hover:bg-black/5"><Trash2 size={14} style={{color:"#f87171"}} /></button></div>) },
  ]
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold" style={{color:"var(--pb-text-1)"}}>Plan Catalog</h1><p className="text-sm mt-0.5" style={{color:"var(--pb-text-2)"}}>Manage the subscription plans offered to tenant ISPs.</p></div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-1.5 text-sm py-2"><Plus size={16} /> New Plan</button>
      </div>
      {isLoading ? (<div className="flex justify-center py-16"><Spinner size="lg" /></div>) : plans.length === 0 ? (
        <div className="card text-center py-16"><Package size={40} style={{color:"var(--pb-text-3)"}} className="mx-auto mb-3" /><p className="font-medium" style={{color:"var(--pb-text-2)"}}>No plans yet</p><p className="text-sm mt-1" style={{color:"var(--pb-text-3)"}}>Create your first subscription plan to get started.</p><button onClick={openCreate} className="btn-primary mt-4 flex items-center gap-1.5 mx-auto text-sm py-2"><Plus size={16} /> New Plan</button></div>
      ) : (<Table columns={cols} data={plans} />)}
      <Modal isOpen={modalOpen} onClose={() => !busy && closeModal} title={editing ? 'Edit Plan' : 'New Plan'} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium mb-1" style={{color:"var(--pb-text-2)"}}>Name *</label><input value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})} className="input w-full text-sm" placeholder="e.g. Professional" /></div>
            <div><label className="block text-xs font-medium mb-1" style={{color:"var(--pb-text-2)"}}>Slug *</label><input value={form.slug} onChange={(e)=>setForm({...form,slug:e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,"")})} className="input w-full text-sm" placeholder="e.g. professional" /></div>
          </div>
          <div><label className="block text-xs font-medium mb-1" style={{color:"var(--pb-text-2)"}}>Description</label><textarea value={form.description} onChange={(e)=>setForm({...form,description:e.target.value})} className="input w-full text-sm" rows={2} /></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><label className="block text-xs font-medium mb-1" style={{color:"var(--pb-text-2)"}}>Billing Cycle</label><select value={form.billing_cycle} onChange={(e)=>setForm({...form,billing_cycle:e.target.value})} className="input w-full text-sm"><option value="monthly">Monthly</option><option value="annual">Annual</option></select></div>
            <div><label className="block text-xs font-medium mb-1" style={{color:"var(--pb-text-2)"}}>Monthly Price (KES) *</label><input type="number" min="0" value={form.price} onChange={(e)=>setForm({...form,price:e.target.value})} className="input w-full text-sm" /></div>
            <div><label className="block text-xs font-medium mb-1" style={{color:"var(--pb-text-2)"}}>Annual Price (KES)</label><input type="number" min="0" value={form.annual_price} onChange={(e)=>setForm({...form,annual_price:e.target.value})} className="input w-full text-sm" /></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div><label className="block text-xs font-medium mb-1" style={{color:"var(--pb-text-2)"}}>Max Clients</label><input type="number" min="0" value={form.max_clients} onChange={(e)=>setForm({...form,max_clients:e.target.value})} className="input w-full text-sm" /></div>
            <div><label className="block text-xs font-medium mb-1" style={{color:"var(--pb-text-2)"}}>Max Users</label><input type="number" min="0" value={form.max_users} onChange={(e)=>setForm({...form,max_users:e.target.value})} className="input w-full text-sm" /></div>
            <div><label className="block text-xs font-medium mb-1" style={{color:"var(--pb-text-2)"}}>Max Routers</label><input type="number" min="0" value={form.max_routers} onChange={(e)=>setForm({...form,max_routers:e.target.value})} className="input w-full text-sm" /></div>
            <div><label className="block text-xs font-medium mb-1" style={{color:"var(--pb-text-2)"}}>Storage (GB)</label><input type="number" min="0" value={form.storage_quota_gb} onChange={(e)=>setForm({...form,storage_quota_gb:e.target.value})} className="input w-full text-sm" /></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div><label className="block text-xs font-medium mb-1" style={{color:"var(--pb-text-2)"}}>API Calls/Month</label><input type="number" min="0" value={form.api_calls_per_month} onChange={(e)=>setForm({...form,api_calls_per_month:e.target.value})} className="input w-full text-sm" /></div>
            <div><label className="block text-xs font-medium mb-1" style={{color:"var(--pb-text-2)"}}>Trial Days</label><input type="number" min="0" value={form.trial_days} onChange={(e)=>setForm({...form,trial_days:e.target.value})} className="input w-full text-sm" /></div>
            <div><label className="block text-xs font-medium mb-1" style={{color:"var(--pb-text-2)"}}>Grace Days</label><input type="number" min="0" value={form.grace_days} onChange={(e)=>setForm({...form,grace_days:e.target.value})} className="input w-full text-sm" /></div>
            <div><label className="block text-xs font-medium mb-1" style={{color:"var(--pb-text-2)"}}>Sort Order</label><input type="number" min="0" value={form.sort_order} onChange={(e)=>setForm({...form,sort_order:e.target.value})} className="input w-full text-sm" /></div>
          </div>
          <div><label className="block text-xs font-medium mb-1" style={{color:"var(--pb-text-2)"}}>Features (comma-separated)</label><input value={form.features} onChange={(e)=>setForm({...form,features:e.target.value})} className="input w-full text-sm" placeholder="basic_billing, api_access" /></div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_active} onChange={(e)=>setForm({...form,is_active:e.target.checked})} className="rounded" /><span style={{color:"var(--pb-text-2)"}}>Active</span></label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_trial_available} onChange={(e)=>setForm({...form,is_trial_available:e.target.checked})} className="rounded" /><span style={{color:"var(--pb-text-2)"}}>Trial Available</span></label>
          </div>
          <div className="flex justify-end gap-2 pt-3" style={{borderTop:"1px solid var(--pb-border)"}}>
            <button onClick={closeModal} disabled={busy} className="btn-secondary text-sm py-1.5">Cancel</button>
            <button onClick={submit} disabled={busy || !form.name.trim() || !form.slug.trim()} className="btn-primary text-sm py-1.5">{busy ? 'Saving…' : editing ? 'Update Plan' : 'Create Plan'}</button>
          </div>
        </div>
      </Modal>
      <Modal isOpen={!!delTarget} onClose={() => !deleteMut.isPending && setDelTarget(null)} title="Delete Plan" size="sm">
        {delTarget && (
          <div className="space-y-4">
            <p className="text-sm" style={{color:"var(--pb-text-2)"}}>Are you sure you want to delete <strong style={{color:"var(--pb-text-1)"}}>{delTarget.name}</strong>?</p>
            <div className="flex justify-end gap-2">
              <button onClick={()=>setDelTarget(null)} disabled={deleteMut.isPending} className="btn-secondary text-sm py-1.5">Cancel</button>
              <button onClick={()=>deleteMut.mutate(delTarget.id)} disabled={deleteMut.isPending} className="btn-danger text-sm py-1.5">{deleteMut.isPending ? 'Deleting…' : 'Delete'}</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
