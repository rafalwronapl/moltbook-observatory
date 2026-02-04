import { useState } from 'react'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import Methodology from './pages/Methodology'
import Daily from './pages/Daily'
import Accounts from './pages/Accounts'
import Discoveries from './pages/Discoveries'

function Nav() {
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const links = [
    { to: '/', label: 'Overview' },
    { to: '/accounts', label: 'Accounts' },
    { to: '/discoveries', label: 'Discoveries' },
    { to: '/daily', label: 'Daily Data' },
    { to: '/methodology', label: 'Methodology' },
  ]

  return (
    <nav className="border-b border-observatory-border bg-observatory-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl">🔭</span>
            <span className="font-semibold text-lg hidden sm:inline">Moltbook Observatory</span>
            <span className="font-semibold text-lg sm:hidden">Observatory</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {links.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                  location.pathname === link.to
                    ? 'bg-observatory-accent/20 text-observatory-accent'
                    : 'text-observatory-muted hover:text-observatory-text hover:bg-observatory-card'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 text-observatory-muted hover:text-observatory-text"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>

        {/* Mobile nav */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 border-t border-observatory-border pt-2 space-y-1">
            {links.map(link => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-3 rounded-lg text-base transition-colors ${
                  location.pathname === link.to
                    ? 'bg-observatory-accent/20 text-observatory-accent font-medium'
                    : 'text-observatory-muted hover:text-observatory-text hover:bg-observatory-card'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  )
}

function Footer() {
  return (
    <footer className="border-t border-observatory-border py-8 mt-16">
      <div className="max-w-6xl mx-auto px-4 text-center text-observatory-muted text-sm">
        <p>Moltbook Observatory - Open Research on Automation Patterns</p>
        <p className="mt-4 text-xs">
          We detect automation patterns, not "AI vs human".
          <Link to="/methodology" className="text-observatory-accent hover:underline ml-1">Read our methodology</Link>
        </p>
        <div className="mt-4 flex justify-center gap-4">
          <a
            href="mailto:contact@moltbook-observatory.com"
            className="text-observatory-muted hover:text-observatory-accent transition-colors"
          >
            Contact
          </a>
          <a
            href="https://twitter.com/NoosphereProj"
            target="_blank"
            rel="noopener noreferrer"
            className="text-observatory-muted hover:text-[#1da1f2] transition-colors"
          >
            X/Twitter
          </a>
          <a
            href="https://github.com/rafalwronapl/moltbook-observatory"
            target="_blank"
            rel="noopener noreferrer"
            className="text-observatory-muted hover:text-white transition-colors"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  )
}

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/accounts" element={<Accounts />} />
          <Route path="/accounts/:category" element={<Accounts />} />
          <Route path="/discoveries" element={<Discoveries />} />
          <Route path="/daily" element={<Daily />} />
          <Route path="/daily/:date" element={<Daily />} />
          <Route path="/methodology" element={<Methodology />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
