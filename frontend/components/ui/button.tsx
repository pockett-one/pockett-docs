import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-[color,transform,box-shadow,background-color,border-color] duration-200 ease-out focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none disabled:translate-y-0",
  {
    variants: {
      variant: {
        default:
          "bg-blue-600 text-white ring-1 ring-inset ring-white/10 shadow-[0_1px_0_0_rgba(255,255,255,0.12)_inset,0_1px_2px_rgba(15,23,42,0.06),0_4px_12px_-4px_rgba(37,99,235,0.16)] hover:bg-blue-700 hover:-translate-y-px hover:shadow-[0_1px_0_0_rgba(255,255,255,0.16)_inset,0_2px_4px_rgba(15,23,42,0.05),0_6px_16px_-6px_rgba(37,99,235,0.2)] active:translate-y-0 active:scale-[0.995] active:shadow-[inset_0_2px_5px_rgba(0,0,0,0.1)]",
        blackCta:
          "border border-transparent bg-slate-800 text-white shadow-[0_1px_2px_rgba(15,23,42,0.08),0_3px_10px_-4px_rgba(15,23,42,0.12)] hover:-translate-y-px hover:border-slate-200 hover:bg-white hover:text-slate-800 hover:shadow-[0_2px_8px_-2px_rgba(15,23,42,0.07),0_1px_3px_rgba(15,23,42,0.05)] focus-visible:border-slate-200 focus-visible:bg-white focus-visible:text-slate-800 focus-visible:shadow-[0_2px_8px_-2px_rgba(15,23,42,0.07),0_1px_3px_rgba(15,23,42,0.05)] focus-visible:ring-2 focus-visible:ring-slate-400/45 focus-visible:ring-offset-2 hover:active:bg-slate-50 active:translate-y-0 active:scale-[0.995] active:shadow-[inset_0_2px_4px_rgba(15,23,42,0.08)]",
        /** Secondary vs solid-black checkout — slate (billing / checkout pages) */
        manageBillingCta:
          "group relative overflow-hidden border border-slate-300/80 bg-slate-50 text-slate-900 shadow-[0_1px_2px_rgba(15,23,42,0.06)] hover:-translate-y-px hover:border-slate-400/80 hover:bg-slate-100 hover:text-slate-900 hover:shadow-[0_2px_12px_-4px_rgba(15,23,42,0.1)] focus-visible:ring-2 focus-visible:ring-slate-400/45 focus-visible:ring-offset-2 active:translate-y-0 active:scale-[0.995] active:shadow-[inset_0_2px_4px_rgba(15,23,42,0.1)] before:absolute before:inset-0 before:rounded-[inherit] before:bg-slate-200/85 before:content-[\"\"] before:[clip-path:circle(0%_at_85%_50%)] before:transition-[clip-path] before:duration-300 before:ease-out hover:before:[clip-path:circle(150%_at_85%_50%)]",
        destructive:
          "bg-red-500 text-white ring-1 ring-inset ring-white/10 shadow-[0_1px_0_0_rgba(255,255,255,0.1)_inset,0_1px_2px_rgba(15,23,42,0.06),0_4px_12px_-4px_rgba(220,38,38,0.14)] hover:bg-red-600 hover:-translate-y-px hover:shadow-[0_1px_0_0_rgba(255,255,255,0.14)_inset,0_2px_4px_rgba(15,23,42,0.05),0_6px_16px_-6px_rgba(220,38,38,0.18)] active:translate-y-0 active:scale-[0.995] active:shadow-[inset_0_2px_5px_rgba(0,0,0,0.12)]",
        outline: "border border-gray-300 bg-white shadow-sm hover:bg-gray-50",
        secondary: "bg-gray-100 text-gray-900 shadow-sm hover:bg-gray-200",
        ghost: "hover:bg-gray-100",
        link: "text-blue-600 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }