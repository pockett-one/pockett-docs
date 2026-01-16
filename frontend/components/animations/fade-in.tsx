"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface FadeInProps {
    children: React.ReactNode
    className?: string
    delay?: number
    direction?: "up" | "down" | "left" | "right"
}

export function FadeIn({ children, className, delay = 0, direction = "up" }: FadeInProps) {
    const directions = {
        up: { y: 20 },
        down: { y: -20 },
        left: { x: 20 },
        right: { x: -20 },
    }

    return (
        <motion.div
            initial={{ opacity: 0, ...directions[direction] }}
            whileInView={{ opacity: 1, x: 0, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: delay / 1000, ease: "easeOut" }}
            className={cn(className)}
        >
            {children}
        </motion.div>
    )
}
