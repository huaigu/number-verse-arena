import * as React from "react"
import { cn } from "@/lib/utils"

interface GameCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "selected" | "available" | "disabled"
  children: React.ReactNode
}

const GameCard = React.forwardRef<HTMLDivElement, GameCardProps>(
  ({ className, variant = "default", children, ...props }, ref) => {
    const variants = {
      default: "bg-game-grid text-primary-foreground hover:bg-primary-hover shadow-game",
      selected: "bg-game-selected text-primary-foreground ring-2 ring-accent shadow-float",
      available: "bg-game-available text-foreground hover:bg-game-grid shadow-card",
      disabled: "bg-game-disabled text-muted-foreground cursor-not-allowed opacity-60"
    }

    return (
      <div
        className={cn(
          "relative flex items-center justify-center rounded-xl font-bold text-lg transition-all duration-300 cursor-pointer select-none",
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