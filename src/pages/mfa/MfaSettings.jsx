import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getMfaStatus, generateMfaSecret, enableMfa,
  disableMfa, regenerateBackupCodes,
} from '../../api/mfa.api'
import Modal from '../../components/common/Modal'
import Spinner from '../../components/common/Spinner'
import toast from 'react-hot-toast'

const digitsOnly = (v) => v.replace(/\D/g, '').slice(0, 6)

// MfaController::generate() returns { secret, qr_code_url } (an otpauth:// URI).
function QrImg({ otpUrl }) {
  if (!otpUrl) return null
  const src = `https://api.qrserver.com/v1/api.php?size=200x200&data=${encodeURIComponent(otpUrl)}`
  return <img src={src} alt="Scan with your authenticator app" className="mx-auto rounded-lg" style={{ border: '1px solid var(--pb-border)' }} />
}

function SetupFlow({ secret, qrUrl, code, setCode, enabling, onVerify, canVerify }) {
  return (
    <div className="pt-4 space-y-4">
      <p className="text-sm" style={{ color: 'var(--pb-text-2)' }}>1. Scan the QR code below, or enter the secret manually.</p>
      <QrImg otpUrl={qrUrl} />
      {secret && <div className="font-mono text-center text-sm break-all" style={{ color: 'var(--pb-text-1)' }}>{secret}</div>}
      <p className="text-sm" style={{ color: 'var(--pb-text-2)' }}>2. Enter the 6-digit code from your app to enable.</p>
      <div className="flex items-center gap-2 justify-center">
        <input value={code} onChange={(e) => setCode(e.target.value)} type="text" inputMode="numeric" maxLength={6} className="input text-sm text-center w-32" placeholder="000000" />
        <button onClick={onVerify} disabled={enabling || !canVerify} className="px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ background: '#2563eb' }}>{enabling ? 'Verifying…' : 'Verify & Enable'}</button>
      </div>
    </div>
  )
}

function CodesSection({ codes, onRegenerate, regenPending, code, setCode, canRegen }) {
  return (
    <div className="pt-4 space-y-4">
      <p className="text-sm" style={{ color: 'var(--pb-text-2)' }}>Recovery codes let you sign in if you lose your phone.</p>
      {!codes.length && <p className="text-xs" style={{ color: 'var(--pb-text-3)' }}>You have no current recovery codes. Generate a new set below (current codes will be invalidated).</p>}
      {codes.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {codes.map((c, i) => (
            <div key={i} className="font-mono text-sm p-2 rounded-lg break-all" style={{ background: 'var(--pb-raised)', border: '1px solid var(--pb-border)' }}>{c}</div>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2">
        <input value={code} onChange={(e) => setCode(e.target.value)} type="text" inputMode="numeric" maxLength={6} className="input text-sm text-center w-32" placeholder="TOTP code" />
        <button onClick={onRegenerate} disabled={regenPending || !canRegen} className="px-4 py-2 rounded-lg text-sm text-white" style={{ background: '#2563eb' }}>{regenPending ? 'Regenerating…' : 'Regenerate'}</button>
      </div>
    </div>
  )
}

export default function MfaSettings() {
  const qc = useQueryClient()
  const [stage, setStage] = useState('view') // 'view' | 'setup' | 'codes'
  const [secret, setSecret] = useState('')
  const [qrUrl, setQrUrl] = useState('')
  const [code, setCode] = useState('')
  const [codes, setCodes] = useState([])
  const [pw, setPw] = useState('')

  const status = useQuery({
    queryKey: ['mfa-status'],
    queryFn: async () => {
      const res = await getMfaStatus()
      return res.data?.data ?? res.data
    },
  })

  const gen = useMutation({
    mutationFn: () => generateMfaSecret(),
    onSuccess: (res) => {
      const d = res.data?.data ?? res.data
      setSecret(d.secret || '')
      setQrUrl(d.qr_code_url || '')
      setStage('setup')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to start setup'),
  })

  const enable = useMutation({
    mutationFn: () => enableMfa(code),
    onSuccess: (res) => {
      const received = res.data?.backup_codes || res.data?.data?.backup_codes
      if (received) { setCodes(received); setStage('codes') } else { setStage('view') }
      toast.success('MFA enabled')
      qc.invalidateQueries(['mfa-status'])
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Verification failed'),
  })

  const disable = useMutation({
    mutationFn: () => disableMfa(pw),
    onSuccess: () => { setPw(''); setStage('view'); toast.success('MFA disabled'); qc.invalidateQueries(['mfa-status']) },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to disable'),
  })

  const regen = useMutation({
    mutationFn: () => regenerateBackupCodes(code),
    onSuccess: (res) => {
      const received = res.data?.backup_codes || res.data?.data?.backup_codes
      if (received) { setCodes(received); setStage('codes') }
      toast.success('Backup codes regenerated')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  })

  const enabled = status.data?.enabled

  return (
        <div className="space-y-5">
      <div className="card">
        <h2 className="text-lg font-semibold">Multi-Factor Authentication</h2>
        <p className="text-sm" style={{ color: 'var(--pb-text-3)' }}>TOTP via authenticator app plus recovery codes.</p>

        {status.isLoading && <div className="pt-4"><Spinner /></div>}

        {!status.isLoading && !enabled && (
          <div className="pt-4">
            <p className="text-sm" style={{ color: 'var(--pb-text-2)' }}>MFA is not enabled.</p>
            <button
              onClick={() => gen.mutate()}
              disabled={gen.isPending}
              className="mt-3 px-4 py-2 rounded-lg text-sm font-medium text-white"
              style={{ background: '#2563eb' }}
            >{gen.isPending ? 'Generating…' : '+ Set Up MFA'}</button>
          </div>
        )}

        {!status.isLoading && enabled && (
          <div className="pt-4 flex flex-col sm:flex-row sm:justify-between gap-3">
            <div>
              <p className="text-sm">
                <span style={{ color: 'var(--pb-text-3)' }}>Status:</span>{' '}
                <span style={{ color: '#10b981', fontWeight: 600 }}>Enabled</span>
              </p>
              {status.data?.enabled_at && (
                <p className="text-xs" style={{ color: 'var(--pb-text-3)' }}>
                  Since {new Date(status.data.enabled_at).toLocaleDateString()}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setCode(''); setStage('codes') }}
                className="px-3 py-2 rounded-lg text-sm"
                style={{ background: 'var(--pb-raised)' }}
              >Recovery Codes</button>
              <button
                onClick={() => { setPw(''); setStage('view') }}
                className="px-3 py-2 rounded-lg text-sm text-red-300"
                style={{ background: 'rgba(220,38,38,0.1)' }}
              >Disable MFA</button>
            </div>
          </div>
        )}

        {stage === 'setup' && (
          <SetupFlow
            secret={secret} qrUrl={qrUrl} code={code}
            setCode={(v) => setCode(digitsOnly(v))}
            enabling={enable.isPending}
            onVerify={() => enable.mutate()}
            canVerify={code.length === 6}
          />
        )}

        {(stage === 'codes' || stage === 'view') && enabled && (
          <CodesSection
            codes={codes}
            onRegenerate={() => regen.mutate()}
            regenPending={regen.isPending}
            code={code}
            setCode={(v) => setCode(digitsOnly(v))}
            canRegen={code.length === 6}
          />
        )}
      </div>

      <Modal
        isOpen={stage === 'view' && enabled}
        onClose={() => setStage('view')}
        title="Disable MFA"
        size="md"
      >
        {stage === 'view' && enabled && (
          <form
            onSubmit={(e) => { e.preventDefault(); disable.mutate() }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--pb-text-2)' }}>Password *</label>
              <input
                type="password"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                className="input text-sm"
                required
              />
            </div>
            <p className="text-xs" style={{ color: 'var(--pb-text-3)' }}>Disabling MFA reduces your account security.</p>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setStage('view')} className="px-4 py-2 rounded-lg text-sm" style={{ background: 'var(--pb-raised)' }}>Cancel</button>
              <button type="submit" disabled={disable.isPending} className="px-4 py-2 rounded-lg text-sm text-white" style={{ background: '#dc2626' }}>{disable.isPending ? 'Disabling…' : 'Disable MFA'}</button>
            </div>
          </form>
        )}
            </Modal>
    </div>
  )
}
