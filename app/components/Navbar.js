'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useSyncExternalStore } from 'react'
import { LuSun, LuMoon } from 'react-icons/lu'

// ── useSyncExternalStore untuk baca localStorage tanpa setState di effect ──
function subscribe(cb) {
  window.addEventListener('storage', cb)
  return () => window.removeEventListener('storage', cb)
}
function getThemeSnapshot() {
  return localStorage.getItem('syra-theme') || 'light'
}
function getThemeServerSnapshot() {
  return 'light' // selalu light di server (SSR) — identitas visual PNC itu cerah, bukan gelap
}

export default function Navbar() {
  const pathname = usePathname()

  // useSyncExternalStore: aman dari hydration mismatch, tanpa setState di effect
  const theme = useSyncExternalStore(
    subscribe,
    getThemeSnapshot,
    getThemeServerSnapshot,
  )

  // Sync atribut ke <html> setiap kali theme berubah — ini murni side-effect ke DOM
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark'
    localStorage.setItem('syra-theme', next)
    // Dispatch storage event agar useSyncExternalStore re-subscribe
    window.dispatchEvent(new StorageEvent('storage', { key: 'syra-theme', newValue: next }))
  }

  const isLight = theme === 'light'

  const links = [
    // { href: '/',          label: 'Katalog'   },
    // { href: '/dashboard', label: 'Dashboard' },
    // { href: '/admin',     label: 'Admin'     },
  ]

  return (
    <nav style={{
      background: 'var(--navbar-bg)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--navbar-border)',
      padding: '0 24px',
      height: '52px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      transition: 'background 0.3s ease, border-color 0.3s ease',
    }}>

      {/* ── Logo ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{
          width: '24px',
          height: '24px',
          background: 'var(--logo-bg)',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '10px',
          fontWeight: 700,
          color: 'var(--logo-color)',
          flexShrink: 0,
          transition: 'background 0.3s ease',
        }}>SR</div>
        <span style={{
          fontWeight: 600,
          fontSize: '14px',
          color: 'var(--text-primary)',
          transition: 'color 0.3s ease',
        }}>
          SyRa Store
        </span>
      </div>

      {/* ── Nav Links + Toggle ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>

        {links.map(link => (
          <Link key={link.href} href={link.href} style={{
            padding: '6px 14px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '13px',
            fontWeight: pathname === link.href ? 500 : 400,
            color: pathname === link.href ? 'var(--text-primary)' : 'var(--text-secondary)',
            background: pathname === link.href ? 'var(--bg-tertiary)' : 'transparent',
            border: pathname === link.href ? '1px solid var(--border)' : '1px solid transparent',
            textDecoration: 'none',
            transition: 'all 0.15s',
          }}>
            {link.label}
          </Link>
        ))}

        {/* ── Theme Toggle Button ── */}
        <button
          onClick={toggleTheme}
          title={isLight ? 'Ganti ke Dark Mode' : 'Ganti ke Light Mode'}
          style={{
            marginLeft: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 500,
            cursor: 'pointer',
            border: '1px solid',
            transition: 'all 0.25s ease',
            background: isLight
              ? 'rgba(74, 222, 128, 0.1)'
              : 'rgba(37, 99, 235, 0.12)',
            borderColor: isLight
              ? 'rgba(74, 222, 128, 0.4)'
              : 'rgba(96, 165, 250, 0.4)',
            color: isLight ? '#22c55e' : '#93c5fd',
          }}
        >
          {/* Pill track */}
          <span style={{
            position: 'relative',
            display: 'inline-flex',
            alignItems: 'center',
            width: '36px',
            height: '20px',
            borderRadius: '10px',
            background: isLight
              ? 'linear-gradient(135deg, #4ade80, #22c55e)'
              : 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
            transition: 'background 0.3s ease',
            flexShrink: 0,
          }}>
            {/* Thumb */}
            <span style={{
              position: 'absolute',
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              background: '#ffffff',
              boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
              transition: 'transform 0.25s ease',
              transform: isLight ? 'translateX(19px)' : 'translateX(3px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {isLight
                ? <LuSun  size={9} color="#d97706" aria-hidden />
                : <LuMoon size={9} color="#3b82f6" aria-hidden />
              }
            </span>
          </span>

          <span style={{ whiteSpace: 'nowrap' }}>
            {isLight ? 'Light' : 'Dark'}
          </span>
        </button>

      </div>
    </nav>
  )
}