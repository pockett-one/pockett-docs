"use client"

import { motion } from "framer-motion"
import { User, Globe, Server, Database, Layout, KeyRound } from "lucide-react"
import { GoogleDriveIcon } from "@/components/ui/google-drive-icon"
import { cn } from "@/lib/utils"

export function TrustDiagram() {
    // Animation variants for standard vertical entry
    const cardVariant = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 }
    }

    // --- REUSABLE COMPONENTS ---

    const Connector = ({ height = "h-8", label = "" }: { height?: string, label?: string }) => (
        <div className={`w-[2px] ${height} bg-slate-200 relative flex items-center justify-center shrink-0`}>
            <motion.div
                animate={{ y: [-10, 20], opacity: [0, 1, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="absolute top-0 w-1.5 h-1.5 bg-purple-500 rounded-full"
            />
            {label && (
                <div className="absolute left-3 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 text-[9px] font-bold text-slate-500 whitespace-nowrap shadow-sm z-20">
                    {label}
                </div>
            )}
        </div>
    )

    const DiagramCard = ({
        icon: Icon,
        title,
        subtitle,
        badge,
        variant = "white",
        className
    }: {
        icon: any,
        title: string,
        subtitle: React.ReactNode,
        badge?: string,
        variant?: "white" | "dark" | "drive",
        className?: string
    }) => {
        const isDark = variant === "dark"
        const isDrive = variant === "drive"

        return (
            <div className={cn(
                "p-3 rounded-xl shadow-sm border flex items-center gap-3 w-full relative z-10",
                isDark ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-200",
                isDrive && "shadow-lg border-purple-100 ring-4 ring-purple-50",
                className
            )}>
                <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                    isDark ? "bg-slate-800 text-purple-400" : "bg-slate-50 text-slate-600",
                    isDrive && "bg-white border border-slate-100 shadow-sm"
                )}>
                    {isDrive ? <GoogleDriveIcon size={24} /> : <Icon className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                    <div className={cn("text-sm font-bold truncate", isDark ? "text-white" : "text-slate-900")}>
                        {title}
                    </div>
                    <div className={cn("text-[10px] truncate", isDark ? "text-slate-400" : "text-slate-500")}>
                        {subtitle}
                    </div>
                    {badge && (
                        <div className="mt-1">
                            <span className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-medium border border-slate-200">
                                {badge}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className="w-full max-w-3xl mx-auto p-4 md:p-8">
            <div className="bg-slate-50/30 rounded-3xl border border-slate-200 p-8 md:p-12 relative overflow-hidden flex flex-col items-center">

                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-[0.4]"
                    style={{ backgroundImage: 'linear-gradient(#e2e8f0 1px, transparent 1px), linear-gradient(90deg, #e2e8f0 1px, transparent 1px)', backgroundSize: '32px 32px' }}>
                </div>

                {/* --- LEVEL 1: END USER --- */}
                <motion.div initial="hidden" whileInView="visible" variants={cardVariant} viewport={{ once: true }}>
                    <DiagramCard
                        icon={User}
                        title="End User"
                        subtitle="Device / Human"
                        className="w-auto pr-8 rounded-full"
                    />
                </motion.div>

                <Connector height="h-8" />

                {/* --- LEVEL 2: BROWSER --- */}
                <motion.div initial="hidden" whileInView="visible" variants={cardVariant} viewport={{ once: true }} transition={{ delay: 0.1 }}>
                    <DiagramCard
                        icon={Globe}
                        title="Browser"
                        subtitle="Client Side App"
                        className="min-w-[220px]"
                    />
                </motion.div>

                <Connector height="h-12" label="HTTPS / TLS 1.3" />

                {/* --- POCKETT CLOUD BOUNDARY --- */}
                <div className="relative z-10 w-full max-w-lg p-6 pt-8 rounded-2xl border-2 border-dashed border-purple-200 bg-white/50 backdrop-blur-sm flex flex-col items-center">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-50 px-3 py-0.5 rounded-full border border-purple-100 text-[10px] font-bold text-purple-700 uppercase tracking-widest z-20">
                        Pockett Infrastructure
                    </div>

                    {/* --- LEVEL 3: WEB APP --- */}
                    <motion.div initial="hidden" whileInView="visible" variants={cardVariant} viewport={{ once: true }} transition={{ delay: 0.2 }} className="w-auto">
                        <DiagramCard
                            icon={Layout}
                            title="Web Dashboard"
                            subtitle="Client Application"
                            className="justify-center w-auto min-w-[280px]"
                        />
                    </motion.div>

                    <Connector height="h-6" />

                    {/* --- LEVEL 4: WEB API --- */}
                    <motion.div initial="hidden" whileInView="visible" variants={cardVariant} viewport={{ once: true }} transition={{ delay: 0.3 }} className="w-auto">
                        <DiagramCard
                            icon={Server}
                            title="Secure API Gateway"
                            subtitle="Business Logic Core"
                            variant="dark"
                            className="justify-center w-auto min-w-[280px]"
                        />
                    </motion.div>

                    {/* Split Connector */}
                    <div className="w-full flex justify-center relative h-8 shrink-0">
                        {/* Vertical Stem from API */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-4 w-[2px] bg-slate-300" />
                        {/* Horizontal Branch */}
                        <div className="absolute top-4 left-[25%] right-[25%] h-[2px] bg-slate-300 border-t border-slate-300" />
                        {/* Left Drop */}
                        <div className="absolute top-4 left-[25%] h-4 w-[2px] bg-slate-300" />
                        {/* Right Drop */}
                        <div className="absolute top-4 right-[25%] h-4 w-[2px] bg-slate-300" />
                    </div>

                    {/* --- LEVEL 5: AUTH & DB --- */}
                    <div className="grid grid-cols-2 gap-8 w-full">
                        {/* AUTH */}
                        <motion.div initial="hidden" whileInView="visible" variants={cardVariant} viewport={{ once: true }} transition={{ delay: 0.4 }}>
                            <DiagramCard
                                icon={KeyRound}
                                title="Auth Service"
                                subtitle=""
                                badge="OIDC Protocol"
                                className="h-full"
                            />
                        </motion.div>

                        {/* DB */}
                        <motion.div initial="hidden" whileInView="visible" variants={cardVariant} viewport={{ once: true }} transition={{ delay: 0.45 }}>
                            <DiagramCard
                                icon={Database}
                                title="Metadata DB"
                                subtitle=""
                                badge="AES-256"
                                className="h-full"
                            />
                        </motion.div>
                    </div>
                </div>

                <Connector height="h-12" label="OAuth 2.0" />

                {/* --- LEVEL 6: EXTERNAL (DRIVE) --- */}
                <motion.div initial="hidden" whileInView="visible" variants={cardVariant} viewport={{ once: true }} transition={{ delay: 0.5 }} className="w-full max-w-sm">
                    <DiagramCard
                        icon={GoogleDriveIcon}
                        title="Google Drive"
                        subtitle="Your Drive. Your Asset. Your Control."
                        variant="drive"
                    />
                </motion.div>

            </div>
        </div>
    )
}
