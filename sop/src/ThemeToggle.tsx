import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

export default function ThemeToggle() {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark')
    setDark(isDark)
  }, [])

  const toggle = () => {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.theme = next ? 'dark' : 'light'
  }

  return (
    <motion.button
      onClick={toggle}
      whileTap={{ scale: 0.9 }}
      className="w-9 h-9 rounded-md border border-line flex items-center justify-center text-sm hover:border-accent transition-colors"
      aria-label="Toggle theme"
    >
      <motion.span
        key={dark ? 'moon' : 'sun'}
        initial={{ opacity: 0, rotate: -90 }}
        animate={{ opacity: 1, rotate: 0 }}
        transition={{ duration: 0.25 }}
      >
        {dark ? '🌙' : '☀️'}
      </motion.span>
    </motion.button>
  )
}