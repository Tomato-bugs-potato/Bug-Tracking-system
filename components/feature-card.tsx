import type React from "react"
import { cn } from "@/lib/utils"

interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
  iconBackground?: string
  iconColor?: string
}

export function FeatureCard({
  icon,
  title,
  description,
  iconBackground = "bg-primary/10",
  iconColor = "text-primary",
}: FeatureCardProps) {
  return (
    <div className="flex flex-col items-start gap-2 rounded-lg border p-6 shadow-sm">
      <div className={cn("rounded-full p-2", iconBackground)}>
        <div className={iconColor}>{icon}</div>
      </div>
      <h3 className="text-xl font-bold">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  )
}
