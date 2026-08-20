import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion'
import { useRef } from 'react'
import ThemeToggle from '../ThemeToggle'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
}

function TiltCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [8, -8]), { stiffness: 250, damping: 20 })
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-8, 8]), { stiffness: 250, damping: 20 })

  const handleMouse = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    x.set((e.clientX - rect.left) / rect.width - 0.5)
    y.set((e.clientY - rect.top) / rect.height - 0.5)
  }
  const reset = () => { x.set(0); y.set(0) }

  return (
    <motion.div
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      style={{ rotateX, rotateY, transformPerspective: 800 }}
      whileHover={{ scale: 1.02 }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

function Home() {
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const panelY = useTransform(scrollYProgress, [0, 1], [0, 90])
  const bgY = useTransform(scrollYProgress, [0, 1], [0, -60])
  const textY = useTransform(scrollYProgress, [0, 1], [0, 40])
  const textOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])

  return (
    <div className="min-h-screen bg-paper text-ink transition-colors duration-300">

      {/* Nav */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-paper/85 border-b border-line">
        <div className="h-16 px-[6%] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-md bg-accent text-white flex items-center justify-center text-xs font-bold">CC</span>
            <span className="font-black text-lg tracking-tight">CleanCity</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted">
            <a href="#how" className="hover:text-ink transition-colors">How it works</a>
            <a href="#streams" className="hover:text-ink transition-colors">Streams</a>
            <a href="#mission" className="hover:text-ink transition-colors">Mission</a>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link to="/login" className="text-sm font-medium border border-line px-4 py-2 rounded-md hover:border-accent transition-colors">
              Log in
            </Link>
            <Link to="/register" className="text-sm font-medium bg-ink text-paper px-4 py-2 rounded-md hover:bg-accent hover:text-white transition-colors inline-flex items-center gap-1.5">
              Start reporting <span>→</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section ref={heroRef} className="relative px-[6%] pt-20 pb-16 border-b border-line overflow-hidden">
        <motion.div
          style={{ y: bgY }}
          className="absolute -top-20 right-[10%] w-[420px] h-[420px] rounded-full bg-accent-soft blur-3xl opacity-60 pointer-events-none"
        />

        <div className="relative flex items-center justify-between mb-6">
          <span className="label text-accent flex items-center gap-1.5">
            <span className="text-line">›</span> Community Portal
          </span>
          <span className="label text-muted">[ 01 / 04 ]</span>
        </div>

        <motion.div style={{ y: textY, opacity: textOpacity }} className="relative">
          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.95] max-w-4xl mb-6"
          >
            Report waste. <span className="text-accent">We build</span> cleaner streets.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
            className="text-muted text-base leading-relaxed max-w-lg mb-10"
          >
            One photo, one pin, sorted automatically into the right stream.
            Track pickup in real time and see your impact add up.
          </motion.p>
        </motion.div>

        <motion.div
          style={{ y: panelY }}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
          className="relative grid md:grid-cols-2 gap-4"
        >
          <TiltCard className="bg-accent rounded-2xl p-8 flex flex-col justify-between min-h-[280px] text-white cursor-default [transform-style:preserve-3d]">
            <div>
              <span className="label text-white/60">For citizens</span>
              <h3 className="text-2xl font-black tracking-tight mt-2 mb-3">Report in 20 seconds</h3>
              <p className="text-sm text-white/75 leading-relaxed max-w-xs">
                Snap, pin, submit. No account setup, no forms to hunt for.
              </p>
            </div>
            <div className="flex gap-6 pt-6 border-t border-white/20 mt-6">
              <div>
                <p className="text-3xl font-black">&lt;20s</p>
                <p className="label text-white/60 mt-1">Avg. report time</p>
              </div>
              <div>
                <p className="text-3xl font-black">98%</p>
                <p className="label text-white/60 mt-1">Pickup within 48h</p>
              </div>
            </div>
          </TiltCard>

          <TiltCard className="bg-surface border border-line rounded-2xl p-6 min-h-[280px] cursor-default [transform-style:preserve-3d]">
            <div className="flex items-center justify-between mb-4">
              <span className="label text-muted">For everyone</span>
              <span className="w-2 h-2 rounded-full bg-organic" />
            </div>
            <p className="text-lg font-bold mb-4">Your Reports</p>

            <div className="space-y-2.5">
              {[
                { id: 'RPT-241', loc: 'Anna Nagar, 4th Ave', status: 'Collected', color: 'bg-organic' },
                { id: 'RPT-238', loc: 'Velachery Main Rd', status: 'Pending', color: 'bg-paper-stream' },
                { id: 'RPT-231', loc: 'T Nagar Bus Stand', status: 'Collected', color: 'bg-organic' },
              ].map((r) => (
                <motion.div
                  key={r.id}
                  whileHover={{ x: 4, borderColor: 'var(--color-accent)' }}
                  className="flex items-center justify-between bg-paper border border-line rounded-lg px-4 py-3 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-1.5 h-1.5 rounded-full ${r.color}`} />
                    <div>
                      <p className="text-xs font-mono text-muted">{r.id}</p>
                      <p className="text-sm font-medium">{r.loc}</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted">{r.status}</span>
                </motion.div>
              ))}
            </div>
          </TiltCard>
        </motion.div>
      </section>

      {/* Marquee */}
      <div className="border-b border-line bg-surface py-3 overflow-hidden">
        <motion.div className="flex gap-16 whitespace-nowrap text-sm font-mono text-muted" animate={{ x: ['0%', '-50%'] }} transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}>
          {Array(2).fill(0).map((_, i) => (
            <div key={i} className="flex gap-16">
              <span>12,400+ reports filed</span>
              <span>340 tons diverted from landfill</span>
              <span>12 cities live</span>
              <span>98% pickup rate within 48h</span>
              <span>4 streams tracked</span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* How it works */}
      <section id="how" className="px-[6%] py-24 border-b border-line">
        <div className="flex items-center justify-between mb-14">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}>
            <span className="label text-accent">How it works</span>
            <h2 className="text-3xl md:text-5xl tracking-tighter mt-2 max-w-lg">Three steps to sorted.</h2>
          </motion.div>
          <span className="label text-muted hidden md:block">[ 02 / 04 ]</span>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {[
            { n: '01', title: 'Report', desc: 'Snap a photo, drop a pin, submit in under 20 seconds.', mock: '📍' },
            { n: '02', title: 'Verify', desc: 'A cleaner confirms pickup and logs the waste stream.', mock: '✓' },
            { n: '03', title: 'Track', desc: 'Watch your impact accumulate by stream, in real time.', mock: '↗' },
          ].map((step, i) => (
            <motion.div
              key={step.n}
              initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp} transition={{ delay: i * 0.1 }}
              whileHover={{ y: -8, boxShadow: '0 20px 40px -12px var(--color-accent-soft)', borderColor: 'var(--color-accent)' }}
              className="border border-line rounded-2xl p-7 bg-paper transition-colors cursor-default"
            >
              <motion.div
                whileHover={{ scale: 1.1, rotate: 6 }}
                className="w-11 h-11 rounded-lg bg-accent-soft text-accent flex items-center justify-center text-lg font-bold mb-8"
              >
                {step.mock}
              </motion.div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold tracking-tight">{step.title}</h3>
                <span className="label text-muted">{step.n}</span>
              </div>
              <p className="text-sm text-muted leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Streams */}
      <section id="streams" className="px-[6%] py-24 border-b border-line bg-surface">
        <div className="flex items-center justify-between mb-14">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}>
            <span className="label text-accent">Streams</span>
            <h2 className="text-3xl md:text-5xl tracking-tighter mt-2 max-w-lg">Sorted into four categories.</h2>
          </motion.div>
          <span className="label text-muted hidden md:block">[ 03 / 04 ]</span>
        </div>

        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: 'Organic', color: 'bg-organic', pct: '38%' },
            { name: 'Plastic', color: 'bg-plastic', pct: '29%' },
            { name: 'Paper', color: 'bg-paper-stream', pct: '19%' },
            { name: 'Glass', color: 'bg-glass', pct: '14%' },
          ].map((s, i) => (
            <motion.div
              key={s.name}
              initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp} transition={{ delay: i * 0.08 }}
              whileHover={{ y: -6, scale: 1.02 }}
              className="bg-paper border border-line rounded-2xl p-6 cursor-default transition-colors hover:border-accent"
            >
              <motion.span
                whileHover={{ scale: 1.4 }}
                className={`inline-block w-3 h-3 rounded-full ${s.color} mb-8`}
              />
              <p className="text-3xl font-black tracking-tight mb-1">{s.pct}</p>
              <p className="text-sm text-muted">{s.name}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Mission */}
      <section id="mission" className="px-[6%] py-28">
        <div className="flex items-center justify-between mb-10">
          <span className="label text-muted">[ 04 / 04 ]</span>
        </div>
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp} className="max-w-2xl">
          <span className="label text-accent">Our mission</span>
          <h2 className="text-4xl md:text-6xl font-black tracking-tighter mt-3 mb-6 leading-[0.95]">
            Small reports create a big impact.
          </h2>
          <p className="text-muted text-base leading-relaxed mb-8">
            CleanCity connects citizens with their community to build cleaner
            streets, responsible waste management, and a healthier environment —
            one report at a time.
          </p>
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="inline-block">
            <Link to="/register" className="inline-flex items-center gap-2 bg-ink text-paper px-6 py-3.5 rounded-md text-sm font-medium hover:bg-accent hover:text-white transition-colors">
              Join CleanCity <span>→</span>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="px-[6%] py-8 border-t border-line flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-md bg-accent text-white flex items-center justify-center text-[10px] font-bold">CC</span>
          <span className="font-black text-sm">CleanCity</span>
        </div>
        <p className="text-muted text-xs">© 2026 CleanCity. Community Portal.</p>
      </footer>
    </div>
  )
}

export default Home