"use client"

import { useMemo } from "react"
import type { ComponentType } from "react"
import { motion } from "framer-motion"
import {
  ArrowLeftRight,
  ClipboardList,
  Copy,
  File,
  FileText,
  Folder,
  Image as ImageIcon,
  Link2,
  Paperclip,
  User,
} from "lucide-react"
import { BRAND_NAME } from "@/config/brand"
import { cn } from "@/lib/utils"

const SHELL = "max-w-[min(100%,92rem)] mx-auto px-3 sm:px-4 md:px-5 lg:px-6 xl:px-10"

const PRO = {
  role: "Service Professional",
  name: "Jordan Lee, Fractional CFO",
  /** Label on dotted firm frame */
  firm: "NorthStar Advisory",
}

const CLIENT = {
  role: "Client Contact",
  name: "Avery Stone, Ops Director",
  firm: "Acme Industrial Group",
}

function PersonaCard({
  kind,
  tone,
}: {
  kind: "pro" | "client"
  tone: "before" | "after"
}) {
  const p = kind === "pro" ? PRO : CLIENT
  const after = tone === "after"
  return (
    <div
      className={cn(
        "relative w-full max-w-[168px] border border-dashed border-[#94a3b8] bg-white/90 px-3 pb-3 pt-5 text-center shadow-sm sm:max-w-[184px]",
        after && "border-[#001256]/35 bg-white"
      )}
    >
      <div
        className={cn(
          "absolute -top-2.5 left-1/2 z-[1] max-w-[calc(100%-8px)] -translate-x-1/2 px-2 text-[9px] font-bold leading-tight tracking-tight [font-family:var(--font-kinetic-headline),system-ui,sans-serif]",
          after ? "bg-[#f6f3f4] text-[#001256]" : "bg-[#f1f5f9] text-[#475569]"
        )}
      >
        <span className="line-clamp-2">{p.firm}</span>
      </div>
      <div className="flex flex-col items-center gap-2 pt-0.5">
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-full border-2 bg-white shadow-sm sm:h-14 sm:w-14",
            after ? "border-[#001256]/25" : "border-[#c6c6cc]"
          )}
        >
          <User
            className={cn(
              "h-6 w-6 sm:h-7 sm:w-7 stroke-[1.5]",
              after ? "text-[#001256]" : "text-[#64748b]"
            )}
            aria-hidden
          />
        </div>
        <span
          className={cn(
            "text-[9px] font-bold uppercase tracking-widest [font-family:var(--font-kinetic-headline),system-ui,sans-serif]",
            after ? "text-[#001256]" : "text-[#64748b]"
          )}
        >
          {p.role}
        </span>
        <span className="text-[10px] leading-snug text-[#45474c] [font-family:var(--font-kinetic-body),system-ui,sans-serif]">
          {p.name}
        </span>
      </div>
    </div>
  )
}

const DOC_STYLES: {
  icon: ComponentType<{ className?: string }>
  border: string
  iconClass: string
}[] = [
  { icon: FileText, border: "border-red-500/35", iconClass: "text-red-600" },
  { icon: Paperclip, border: "border-[#64748b]/40", iconClass: "text-[#64748b]" },
  { icon: File, border: "border-[#001256]/30", iconClass: "text-[#001256]" },
  { icon: Copy, border: "border-amber-500/35", iconClass: "text-amber-700" },
  { icon: Link2, border: "border-[#64748b]/40", iconClass: "text-[#64748b]" },
  { icon: ImageIcon, border: "border-[#001256]/25", iconClass: "text-[#001256]" },
  { icon: FileText, border: "border-red-500/30", iconClass: "text-red-600" },
  { icon: Paperclip, border: "border-amber-500/30", iconClass: "text-amber-800" },
]

function ChaosCenter() {
  /**
   * Moving documents are the hero. Framer must NOT set `rotate` on the same node as
   * Tailwind translate centering (`-translate-x-1/2 -translate-y-1/2`) — it overwrites
   * `transform` and stacks every chip in one spot. Outer motion = position only; inner = rotate.
   */
  const streams = useMemo(() => {
    const count = 30
    return Array.from({ length: count }, (_, i) => {
      const t = i / Math.max(1, count - 1)
      const lane = 6 + t * 82 + (i % 7) * 0.35
      const dir: "lr" | "rl" = i % 2 === 0 ? "lr" : "rl"
      const duration = 2.4 + (i % 19) * 0.12
      const delay = ((i * 0.18) % duration) * 0.9
      const waveDur = 0.42 + (i % 8) * 0.055
      const ampPct = 1.2 + (i % 9) * 0.42
      const rotBase = -14 + (i % 15) * 2.2
      const style = DOC_STYLES[i % DOC_STYLES.length]
      const topWave = [
        lane,
        lane + ampPct,
        lane - ampPct * 0.7,
        lane + ampPct * 0.82,
        lane - ampPct * 0.48,
        lane,
      ].map((v) => `${Math.min(93, Math.max(7, v)).toFixed(2)}%`)
      const rotWave = [rotBase, rotBase + 9, rotBase - 6, rotBase + 8, rotBase - 5, rotBase]
      return { lane, dir, duration, delay, waveDur, topWave, rotWave, style, i }
    })
  }, [])

  return (
    <div className="relative flex min-h-[260px] flex-1 items-center justify-center overflow-hidden bg-[#f1f5f9]/40 sm:min-h-[300px] md:min-h-[320px]">
      <div className="relative mx-auto h-[min(20rem,52vh)] w-full min-h-[220px] max-w-[min(100%,28rem)] sm:h-64 md:h-72">
        {streams.map((s) => {
          const Icon = s.style.icon
          return (
            <motion.div
              key={s.i}
              className="absolute z-[25] -translate-x-1/2 -translate-y-1/2 will-change-[left,top]"
              initial={false}
              animate={{
                left: s.dir === "lr" ? ["-8%", "108%"] : ["108%", "-8%"],
                top: s.topWave,
              }}
              transition={{
                left: {
                  duration: s.duration,
                  repeat: Infinity,
                  ease: "linear",
                  delay: s.delay,
                },
                top: {
                  duration: s.waveDur,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: s.delay,
                },
              }}
            >
              <motion.div
                className={cn(
                  "flex items-center justify-center rounded-none border bg-white p-2 shadow-md sm:p-2.5",
                  s.style.border
                )}
                animate={{ rotate: s.rotWave }}
                transition={{
                  duration: s.waveDur * 1.05,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: s.delay,
                }}
              >
                <Icon className={cn("h-4 w-4 sm:h-[18px] sm:w-[18px] shrink-0", s.style.iconClass)} />
              </motion.div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

function AfterVault() {
  const cells = [
    { icon: FileText, label: "doc" },
    { icon: ImageIcon, label: "img" },
    { icon: ClipboardList, label: "list" },
    { icon: Folder, label: "folder" },
  ]

  return (
    <div className="relative flex min-h-[200px] flex-1 flex-col items-center justify-center gap-4 sm:min-h-[240px] md:min-h-[260px]">
      {/* Calm flow lines */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-between px-2 md:px-4">
        <motion.div
          className="h-px flex-1 bg-gradient-to-r from-transparent via-[#22c55e]/50 to-[#22c55e]"
          animate={{ opacity: [0.45, 1, 0.45] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="w-36 shrink-0 md:w-40" />
        <motion.div
          className="h-px flex-1 bg-gradient-to-l from-transparent via-[#22c55e]/50 to-[#22c55e]"
          animate={{ opacity: [0.45, 1, 0.45] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
        />
      </div>

      {/* Traveling info pulses */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={`r-${i}`}
          className="absolute left-[8%] top-1/2 z-20 h-1.5 w-1.5 rounded-full bg-[#22c55e] shadow-[0_0_10px_rgba(34,197,94,0.7)]"
          animate={{ x: [0, 120, 240], opacity: [0, 1, 0] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "linear", delay: i * 0.55 }}
        />
      ))}
      {[0, 1].map((i) => (
        <motion.div
          key={`l-${i}`}
          className="absolute right-[8%] top-[58%] z-20 h-1.5 w-1.5 rounded-full bg-[#5a78ff] shadow-[0_0_10px_rgba(90,120,255,0.45)]"
          animate={{ x: [0, -120, -240], opacity: [0, 1, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "linear", delay: 0.3 + i * 0.6 }}
        />
      ))}

      <div className="relative z-10 flex h-48 w-40 flex-col gap-3 border border-[#c6c6cc] bg-white p-4 shadow-2xl sm:h-52 sm:w-44">
        <div className="flex h-4 items-center gap-1 border-b border-black/[0.06] pb-2">
          <div className="h-1.5 w-1.5 rounded-full bg-[#22c55e]/40" />
          <div className="h-1.5 w-1.5 rounded-full bg-[#22c55e]/40" />
          <span className="ml-auto font-mono text-[7px] tracking-tighter text-[#45474c]/50">SECURE_VAULT</span>
        </div>
        <div className="grid flex-1 grid-cols-2 gap-2">
          {cells.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center justify-center border border-black/[0.06] bg-[#f6f3f4]"
            >
              <Icon className="h-4 w-4 text-[#64748b]" />
            </div>
          ))}
        </div>
        <div className="text-center text-[9px] font-bold tracking-tighter text-[#001256] [font-family:var(--font-kinetic-headline),system-ui,sans-serif]">
          {BRAND_NAME} platform
        </div>
      </div>
    </div>
  )
}

export function FirmTransformationSection() {
  return (
    <section className="relative overflow-hidden border-y border-black/[0.06] bg-white py-16 lg:py-24">
      <div className={cn(SHELL, "relative z-10")}>
        <motion.div
          className="mb-12 text-center md:mb-16"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-none bg-[#22c55e]/10 px-3 py-1 text-[10px] font-bold tracking-widest text-[#15803d] [font-family:var(--font-kinetic-headline),system-ui,sans-serif]">
            <ArrowLeftRight className="h-3.5 w-3.5" />
            INFRASTRUCTURE EVOLUTION
          </div>
          <h2 className="text-4xl font-bold tracking-tighter text-[#1b1b1d] md:text-5xl lg:text-6xl [font-family:var(--font-kinetic-headline),system-ui,sans-serif]">
            The <span className="text-[#001256]">{BRAND_NAME}</span> Transformation
          </h2>
        </motion.div>

        <div className="space-y-10 md:space-y-16">
          {/* BEFORE */}
          <motion.div
            className="group overflow-hidden rounded-none border border-[#c6c6cc]/30 bg-[#f9f9fb] shadow-sm transition-shadow duration-500 hover:shadow-md"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.45 }}
          >
            <div className="grid grid-cols-1 items-stretch md:grid-cols-12">
              <div className="relative flex min-h-[320px] items-center border-b border-[#c6c6cc]/15 bg-[#f1f5f9] p-6 md:col-span-8 md:min-h-[400px] md:border-b-0 md:border-r">
                <div
                  className="pointer-events-none absolute inset-0 opacity-30"
                  style={{
                    backgroundImage: "radial-gradient(#cbd5e1 0.75px, transparent 0.75px)",
                    backgroundSize: "16px 16px",
                  }}
                />
                <div className="relative z-10 flex w-full flex-col items-stretch justify-center gap-8 md:flex-row md:items-center md:gap-6 lg:gap-10">
                  <PersonaCard kind="pro" tone="before" />
                  <ChaosCenter />
                  <PersonaCard kind="client" tone="before" />
                </div>
              </div>
              <div className="flex flex-col justify-center p-8 md:col-span-4 md:p-10 lg:p-12">
                <div className="mb-6 flex items-center gap-2">
                  <motion.div
                    className="h-2 w-2 rounded-full bg-[#ba1a1a]"
                    animate={{ opacity: [1, 0.4, 1] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                  />
                  <span className="text-xs font-bold tracking-[0.2em] text-[#64748b] [font-family:var(--font-kinetic-headline),system-ui,sans-serif]">
                    BEFORE
                  </span>
                </div>
                <h3 className="mb-4 text-2xl font-bold tracking-tight text-[#1b1b1d] md:text-3xl [font-family:var(--font-kinetic-headline),system-ui,sans-serif]">
                  Document Chaos
                </h3>
                <p className="text-[#45474c] leading-relaxed [font-family:var(--font-kinetic-body),system-ui,sans-serif]">
                  Inefficient, manual document sharing creates security gaps and friction.
                </p>
              </div>
            </div>
          </motion.div>

          {/* AFTER — design3: visual first in DOM; on md text left (order-1), visual right (order-2) */}
          <motion.div
            className="group overflow-hidden rounded-none border border-[#c6c6cc]/30 bg-white shadow-sm transition-shadow duration-500 hover:shadow-xl"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.45, delay: 0.05 }}
          >
            <div className="grid grid-cols-1 items-stretch md:grid-cols-12">
              <div className="relative order-1 flex min-h-[320px] items-center border-b border-[#c6c6cc]/15 bg-[#f6f3f4] p-6 md:order-2 md:col-span-8 md:min-h-[400px] md:border-b-0 md:border-l md:border-[#c6c6cc]/15">
                <div
                  className="pointer-events-none absolute inset-0 opacity-40"
                  style={{
                    backgroundImage: "radial-gradient(#cbd5e1 0.75px, transparent 0.75px)",
                    backgroundSize: "16px 16px",
                  }}
                />
                <div className="relative z-10 flex w-full flex-col items-stretch justify-center gap-8 md:flex-row md:items-center md:gap-6 lg:gap-10">
                  <PersonaCard kind="pro" tone="after" />
                  <AfterVault />
                  <PersonaCard kind="client" tone="after" />
                </div>
              </div>
              <div className="order-2 flex flex-col justify-center border-b border-[#c6c6cc]/15 p-8 md:order-1 md:col-span-4 md:border-b-0 md:border-r md:border-[#c6c6cc]/15 md:p-10 lg:p-12">
                <div className="mb-6 flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-[#22c55e] shadow-[0_0_8px_rgba(34,197,94,0.55)]" />
                  <span className="text-xs font-bold tracking-[0.2em] text-[#001256] [font-family:var(--font-kinetic-headline),system-ui,sans-serif]">
                    AFTER
                  </span>
                </div>
                <h3 className="mb-4 text-2xl font-bold tracking-tight text-[#1b1b1d] md:text-3xl [font-family:var(--font-kinetic-headline),system-ui,sans-serif]">
                  The {BRAND_NAME} Calm
                </h3>
                <p className="text-[#45474c] leading-relaxed [font-family:var(--font-kinetic-body),system-ui,sans-serif]">
                  {BRAND_NAME} centralizes document management, allowing information to flow securely and seamlessly.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
