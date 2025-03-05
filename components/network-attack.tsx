"use client"

import { useEffect, useState } from "react"
import { AlertTriangle } from "lucide-react"
import type { Enemy } from "@/types/game-types"

interface NetworkAttackProps {
  enemy: Enemy
  severity: number // 1-10 scale
}

export default function NetworkAttack({ enemy, severity }: NetworkAttackProps) {
  const [visible, setVisible] = useState(true)

  // Fade out after a few seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center items-center pointer-events-none">
      <div
        className="bg-red-600 text-white px-4 py-2 rounded-t-lg shadow-lg flex items-center gap-2 animate-bounce"
        style={{
          animationDuration: `${0.5 - severity * 0.03}s`,
          opacity: 0.9,
        }}
      >
        <AlertTriangle className="animate-pulse" />
        <span className="font-bold">{enemy.name} attacking network!</span>
        <span className="ml-2 px-2 py-0.5 bg-white text-red-600 rounded-full text-xs font-bold">
          -{severity} damage
        </span>
      </div>
    </div>
  )
}

