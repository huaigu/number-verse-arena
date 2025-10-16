import * as React from "react"
import { cn } from "@/lib/utils"

interface GameCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "selected" | "available" | "disabled" | "highlighted"
  children: React.ReactNode
}

const GameCard = React.forwardRef<HTMLDivElement, GameCardProps>(
  ({ className, variant = "default", children, ...props }, ref) => {
    const variants = {
      default: "number-card shadow-pixel-light dark:shadow-pixel-dark pixel-button",
      selected: "number-card selected",
      available: "number-card shadow-pixel-light dark:shadow-pixel-dark pixel-button hover:bg-[#FFCC88] dark:hover:bg-[#555]",
      disabled: "number-card opacity-60 cursor-not-allowed",
      highlighted: "number-card shadow-pixel-light dark:shadow-pixel-dark bg-accent text-accent-foreground"
    }

    return (
      <div
        className={cn(
          "relative flex items-center justify-center rounded-lg font-bold text-lg transition-all duration-150 cursor-pointer select-none",
          variants[variant],
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </div>
    )
  }
)
GameCard.displayName = "GameCard"

export { GameCard }