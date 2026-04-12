"use client"

import type { ComponentType, ReactNode } from "react"
import { motion } from "framer-motion"
import { User, Globe, Server, Database, Layout, KeyRound } from "lucide-react"

import { BRAND_NAME } from "@/config/brand"
import { GoogleDriveProductMark } from "@/components/ui/google-drive-icon"
import { cn } from "@/lib/utils"

const headline = "[font-family:var(--font-kinetic-headline),system-ui,sans-serif]"
const body = "[font-family:var(--font-kinetic-body),system-ui,sans-serif]"

export function TrustDiagram() {
  const cardVariant = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  }

  const Connector = ({ height = "h-8", label = "" }: { height?: string; label?: string }) => (
    <div className={cn("relative flex w-[2px] shrink-0 items-center justify-center bg-[#c6c6cc]/80", height)}>
      <motion.div
        animate={{ y: [-10, 20], opacity: [0, 1, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        className="absolute top-0 h-1.5 w-1.5 rounded-full bg-[#22c55e]"
      />
      {label ? (
        <div
          className={cn(
            "absolute left-3 z-20 whitespace-nowrap rounded-sm border border-[#c6c6cc]/40 bg-white px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#45474c] shadow-sm",
            headline,
          )}
        >
          {label}
        </div>
      ) : null}
    </div>
  )

  const DiagramCard = ({
    icon: Icon,
    title,
    subtitle,
    badge,
    variant = "white",
    className,
  }: {
    icon: ComponentType<{ className?: string }>
    title: string
    subtitle: ReactNode
    badge?: string
    variant?: "white" | "dark" | "drive"
    className?: string
  }) => {
    const isDark = variant === "dark"
    const isDrive = variant === "drive"

    return (
      <div
        className={cn(
          "relative z-10 flex w-full items-center gap-3 rounded-sm border p-3 shadow-sm",
          isDark
            ? "border-[#2d3548] bg-[#141c2a] text-white"
            : "border-[#c6c6cc]/40 bg-white",
          isDrive && "border-[#c6c6cc]/50 shadow-md ring-2 ring-[#72ff70]/25",
          className,
        )}
      >
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-sm",
            isDark ? "bg-[#1a2233] text-[#72ff70]" : "bg-[#f6f3f4] text-[#45474c]",
            isDrive && "border border-[#dadce0] bg-white shadow-sm",
          )}
        >
          {isDrive ? (
            <GoogleDriveProductMark className="h-6 w-6 shrink-0 opacity-95" alt="" aria-hidden />
          ) : (
            <Icon className="h-5 w-5" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div
            className={cn(
              "truncate text-sm font-bold",
              isDark ? "text-white" : "text-[#1b1b1d]",
              headline,
            )}
          >
            {title}
          </div>
          <div
            className={cn(
              "truncate text-[10px]",
              isDark ? "text-[#94a3b8]" : "text-[#45474c]",
              body,
            )}
          >
            {subtitle}
          </div>
          {badge ? (
            <div className="mt-1">
              <span
                className={cn(
                  "rounded-sm border border-[#c6c6cc]/40 bg-[#f6f3f4] px-1.5 py-0.5 text-[9px] font-semibold text-[#45474c]",
                  headline,
                )}
              >
                {badge}
              </span>
            </div>
          ) : null}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-3xl p-4 md:p-8">
      <div className="relative flex flex-col items-center overflow-hidden rounded-none border border-[#c6c6cc]/30 bg-[#f9f9fb] p-8 shadow-sm md:p-12">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "linear-gradient(#cbd5e1 1px, transparent 1px), linear-gradient(90deg, #cbd5e1 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        <motion.div initial="hidden" whileInView="visible" variants={cardVariant} viewport={{ once: true }}>
          <DiagramCard
            icon={User}
            title="End user"
            subtitle="Device / human"
            className="w-auto rounded-full pr-8"
          />
        </motion.div>

        <Connector height="h-8" />

        <motion.div
          initial="hidden"
          whileInView="visible"
          variants={cardVariant}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
        >
          <DiagramCard icon={Globe} title="Browser" subtitle="Client-side app" className="min-w-[220px]" />
        </motion.div>

        <Connector height="h-12" label="HTTPS / TLS 1.3" />

        <div className="relative z-10 flex w-full max-w-lg flex-col items-center border-2 border-dashed border-[#5a78ff]/35 bg-white/80 p-6 pt-8 backdrop-blur-sm">
          <div
            className={cn(
              "absolute -top-3 left-1/2 z-20 -translate-x-1/2 rounded-full border border-[#5a78ff]/30 bg-[#f6f8ff] px-3 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[#001256]",
              headline,
            )}
          >
            {BRAND_NAME} infrastructure
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            variants={cardVariant}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="w-auto"
          >
            <DiagramCard
              icon={Layout}
              title="Web dashboard"
              subtitle="Client application"
              className="w-auto min-w-[280px] justify-center"
            />
          </motion.div>

          <Connector height="h-6" />

          <motion.div
            initial="hidden"
            whileInView="visible"
            variants={cardVariant}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="w-auto"
          >
            <DiagramCard
              icon={Server}
              title="Secure API gateway"
              subtitle="Business logic core"
              variant="dark"
              className="w-auto min-w-[280px] justify-center"
            />
          </motion.div>

          <div className="relative flex h-8 w-full shrink-0 justify-center">
            <div className="absolute top-0 left-1/2 h-4 w-[2px] -translate-x-1/2 bg-[#c6c6cc]" />
            <div className="absolute top-4 left-[25%] right-[25%] h-[2px] bg-[#c6c6cc]" />
            <div className="absolute top-4 left-[25%] h-4 w-[2px] bg-[#c6c6cc]" />
            <div className="absolute top-4 right-[25%] h-4 w-[2px] bg-[#c6c6cc]" />
          </div>

          <div className="grid w-full grid-cols-2 gap-6 md:gap-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              variants={cardVariant}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
            >
              <DiagramCard icon={KeyRound} title="Auth service" subtitle="" badge="OIDC protocol" className="h-full" />
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              variants={cardVariant}
              viewport={{ once: true }}
              transition={{ delay: 0.45 }}
            >
              <DiagramCard icon={Database} title="Metadata DB" subtitle="" badge="AES-256" className="h-full" />
            </motion.div>
          </div>
        </div>

        <Connector height="h-12" label="OAuth 2.0" />

        <motion.div
          initial="hidden"
          whileInView="visible"
          variants={cardVariant}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="w-full max-w-sm"
        >
          <DiagramCard
            icon={User}
            title="Google Drive"
            subtitle="Your Drive. Your asset. Your control."
            variant="drive"
          />
        </motion.div>
      </div>
    </div>
  )
}
