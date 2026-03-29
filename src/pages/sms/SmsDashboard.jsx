import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { sendSms } from '../../api/sms.api'
import toast from 'react-hot-toast'
import { Send } from 'lucide-react'

export default function SmsDashboard() {
  const [form, setForm] = useState({ phone: '', message: '' })

  const sendMutation = useMutation({
    mutationFn: sendSms,
    onSuccess: () => {
      toast.success('SMS queued successfully!')
      setForm({ phone: '', message: '' })
    },
    onError: () => toast.error('Failed to send SMS'),
  })

  return (
    <div className="max-w-lg space-y-6">
      <div className="card">
        <h3 className="font-semibold mb-4">Send SMS</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="input"
              placeholder="0712345678"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              rows={4}
              className="input resize-none"
              placeholder="Type your message..."
            />
            <p className="text-xs text-gray-400 mt-1">{form.message.length} characters</p>
          </div>
          <button
            onClick={() => sendMutation.mutate(form)}
            disabled={!form.phone || !form.message || sendMutation.isPending}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            <Send size={16} />
            {sendMutation.isPending ? 'Sending...' : 'Send SMS'}
          </button>
        </div>
      </div>
    </div>
  )
}