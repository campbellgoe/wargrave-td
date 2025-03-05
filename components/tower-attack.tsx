"use client"

import type { PlacedTower, SpawnedEnemy } from "@/types/game-types"
import { Flame, Zap, Shield, Search, Lock, Eye, RefreshCw, Database } from "lucide-react"
import { isTowerEffectiveAgainstEnemy } from "@/lib/game-utils"

interface TowerAttackProps {
  tower: PlacedTower
  enemy: SpawnedEnemy
}

export default function TowerAttack({ tower, enemy }: TowerAttackProps) {
  // Check if this tower is effective against this enemy
  const isEffective = isTowerEffectiveAgainstEnemy(tower, enemy)

  // If tower is not effective, don't render the attack
  if (!isEffective) return null

  // Determine attack type based on tower effects and id
  const getAttackVisual = () => {
    if (tower.id === "firewall") {
      return (
        <div className="absolute z-15 animate-pulse">
          <Flame size={24} className="text-orange-500" />
        </div>
      )
    } else if (tower.id === "antivirus") {
      return (
        <div className="absolute z-15 animate-ping">
          <Search size={24} className="text-green-500" />
        </div>
      )
    } else if (tower.effects.includes("block")) {
      return (
        <div className="absolute z-15 animate-pulse">
          <Lock size={24} className="text-purple-500" />
        </div>
      )
    } else if (tower.effects.includes("protect") || tower.effects.includes("encrypt")) {
      return (
        <div className="absolute z-15 animate-pulse">
          <Shield size={24} className="text-blue-500" />
        </div>
      )
    } else if (tower.id === "ssl") {
      return (
        <div className="absolute z-15 animate-pulse">
          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
            🔒
          </div>
        </div>
      )
    } else if (tower.effects.includes("monitor")) {
      return (
        <div className="absolute z-15 animate-pulse">
          <Eye size={24} className="text-gray-600" />
        </div>
      )
    } else if (tower.effects.includes("patch")) {
      return (
        <div className="absolute z-15 animate-pulse">
          <RefreshCw size={24} className="text-teal-500" />
        </div>
      )
    } else if (tower.effects.includes("recover")) {
      return (
        <div className="absolute z-15 animate-pulse">
          <Database size={24} className="text-yellow-500" />
        </div>
      )
    } else {
      return (
        <div className="absolute z-15 animate-ping">
          <Zap size={24} className="text-yellow-500" />
        </div>
      )
    }
  }

  // Calculate line between tower and enemy
  const dx = enemy.position.x - tower.position.x
  const dy = enemy.position.y - tower.position.y
  const distance = Math.sqrt(dx * dx + dy * dy)
  const angle = Math.atan2(dy, dx) * (180 / Math.PI)

  // For area attacks, show a radial effect
  if (tower.attackType === "area") {
    return (
      <div
        className="absolute rounded-full animate-ping opacity-40"
        style={{
          backgroundColor: tower.color,
          width: tower.range * 2,
          height: tower.range * 2,
          left: tower.position.x - tower.range,
          top: tower.position.y - tower.range,
          zIndex: 5,
          animationDuration: "0.8s",
        }}
      />
    )
  }

  // For direct attacks, show a line or projectile
  return (
    <>
      {/* Line connecting tower to enemy */}
      <div
        className="absolute origin-left z-5"
        style={{
          backgroundColor: tower.color,
          height: "3px",
          width: `${distance}px`,
          left: `${tower.position.x}px`,
          top: `${tower.position.y}px`,
          transform: `rotate(${angle}deg)`,
          opacity: 0.8,
        }}
      />

      {/* Attack visual at enemy position */}
      <div
        style={{
          left: `${enemy.position.x - 12}px`,
          top: `${enemy.position.y - 12}px`,
        }}
      >
        {getAttackVisual()}
      </div>

      {/* Damage indicator for effective attacks */}
      <div
        className="absolute z-20 animate-bounce"
        style={{
          left: `${enemy.position.x}px`,
          top: `${enemy.position.y - 20}px`,
          color: tower.color,
          fontWeight: "bold",
          textShadow: "0 0 3px rgba(0,0,0,0.5)",
        }}
      >
        Critical!
      </div>
    </>
  )
}

