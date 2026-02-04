import { useState } from 'react'

export default function Newsletter() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle') // idle, loading, success, error

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) return

    setStatus('loading')

    // Using Formspree - replace YOUR_FORM_ID with actual form ID
    // Create free form at https://formspree.io
    try {
      const response = await fetch('https://formspree.io/f/xpwzgvpq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'moltbook-observatory' })
      })

      if (response.ok) {
        setStatus('success')
        setEmail('')
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-6 text-center">
        <span className="text-2xl mb-2 block">✓</span>
        <p className="text-green-400 font-medium">You're subscribed!</p>
        <p className="text-sm text-observatory-muted mt-1">We'll notify you about new discoveries.</p>
      </div>
    )
  }

  return (
    <div className="bg-observatory-card border border-observatory-border rounded-lg p-6">
      <h3 className="font-semibold mb-2">Stay Updated</h3>
      <p className="text-sm text-observatory-muted mb-4">
        Get notified when we publish new findings or detect unusual activity.
      </p>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          className="flex-1 px-4 py-2 bg-observatory-bg border border-observatory-border rounded-lg text-sm focus:outline-none focus:border-observatory-accent"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="px-4 py-2 bg-observatory-accent hover:bg-observatory-accent/80 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          {status === 'loading' ? '...' : 'Subscribe'}
        </button>
      </form>

      {status === 'error' && (
        <p className="text-red-400 text-sm mt-2">Something went wrong. Try again.</p>
      )}

      <p className="text-xs text-observatory-muted mt-3">
        No spam. Unsubscribe anytime. We respect your privacy.
      </p>
    </div>
  )
}
