import Link from "next/link"
import { Bug } from "lucide-react"

export function MainNav() {
  return (
    <div className="flex items-center gap-2">
      <Link href="/" className="flex items-center gap-2">
        <Bug className="h-6 w-6" />
        <span className="font-bold text-xl">BugTracker</span>
      </Link>
    </div>
  )
}
