"use client"

import { ShieldCheck, UserCheck, Lock } from "lucide-react"
import { FadeIn } from "@/components/animations/fade-in"

export function TrustCards() {
    return (
        <div className="grid md:grid-cols-3 gap-8">
            {/* 1. You Own The Asset */}
            <FadeIn delay={100} className="h-full">
                <div className="bg-white p-8 rounded-2xl h-full border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-500 group relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-700">
                        <UserCheck className="w-32 h-32 text-purple-600" />
                    </div>
                    <div className="w-14 h-14 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center mb-6 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors duration-300 shadow-sm">
                        <UserCheck className="w-7 h-7" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">You Own The Asset</h3>
                    <p className="text-slate-600 leading-relaxed font-medium">
                        We assume a <strong className="text-slate-900">Non-Custodial</strong> role.
                        Files stay in your Google Drive. If you leave, you keep everything exactly as is.
                    </p>
                </div>
            </FadeIn>

            {/* 2. Enterprise Image */}
            <FadeIn delay={200} className="h-full">
                <div className="bg-white p-8 rounded-2xl h-full border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-500 group relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-700">
                        <Lock className="w-32 h-32 text-slate-600" />
                    </div>
                    <div className="w-14 h-14 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-6 text-slate-600 group-hover:bg-slate-800 group-hover:text-white transition-colors duration-300 shadow-sm">
                        <Lock className="w-7 h-7" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">Enterprise-Grade Image</h3>
                    <p className="text-slate-600 leading-relaxed font-medium">
                        Look like a major firm with secure, managed data practices.
                        No more "oops, wrong file" moments. <strong className="text-slate-900">Impress enterprise clients.</strong>
                    </p>
                </div>
            </FadeIn>

            {/* 3. ND/Confidentiality Ready */}
            <FadeIn delay={300} className="h-full">
                <div className="bg-white p-8 rounded-2xl h-full border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-500 group relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-700">
                        <ShieldCheck className="w-32 h-32 text-indigo-600" />
                    </div>
                    <div className="w-14 h-14 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-6 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300 shadow-sm">
                        <ShieldCheck className="w-7 h-7" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">NDA-Ready Security</h3>
                    <p className="text-slate-600 leading-relaxed font-medium">
                        Confidentiality is your currency. Use a system that separates
                        <strong className="text-slate-900"> Metadata</strong> (structure) from <strong className="text-slate-900">Data</strong> (content) for maximum IP protection.
                    </p>
                </div>
            </FadeIn>
        </div>
    )
}
