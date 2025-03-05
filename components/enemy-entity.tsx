"use client"

import { useEffect, useState, useRef } from "react"
import type { SpawnedEnemy, Position } from "@/types/game-types"

interface EnemyEntityProps {
  enemy: SpawnedEnemy
  arenaWidth: number
  arenaHeight: number
  onPositionUpdate?: (enemyId: number, position: { x: number; y: number }) => void
}

export default function EnemyEntity({ enemy, arenaWidth, arenaHeight, onPositionUpdate }: EnemyEntityProps) {
  // Use refs instead of state for position to avoid unnecessary re-renders
  const positionRef = useRef<Position>({ x: 0, y: 0 })
  const [currentPathIndex, setCurrentPathIndex] = useState(0)
  const moveIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const enemyRef = useRef(enemy)
  const domRef = useRef<HTMLDivElement>(null)

  // Update the ref when enemy changes
  useEffect(() => {
    enemyRef.current = enemy
  }, [enemy])

  // Set initial position
  useEffect(() => {
    if (arenaWidth && arenaHeight) {
      const pixelX = (enemy.position.x / 100) * arenaWidth
      const pixelY = (enemy.position.y / 100) * arenaHeight

      positionRef.current = { x: pixelX, y: pixelY }

      // Update DOM directly
      if (domRef.current) {
        domRef.current.style.left = `${pixelX - 16}px`
        domRef.current.style.top = `${pixelY - 16}px`
      }
    }
  }, [arenaWidth, arenaHeight, enemy.position.x, enemy.position.y])

  // Handle movement along the path
  useEffect(() => {
    if (!arenaWidth || !arenaHeight || currentPathIndex >= enemy.path.length) return

    // Convert path coordinates from percentages to actual pixels
    const targetX = (enemy.path[currentPathIndex].x / 100) * arenaWidth
    const targetY = (enemy.path[currentPathIndex].y / 100) * arenaHeight

    // Clear any existing interval
    if (moveIntervalRef.current) {
      clearInterval(moveIntervalRef.current)
    }

    // Simple animation to move toward the next path point
    moveIntervalRef.current = setInterval(() => {
      // Calculate direction vector
      const dx = targetX - positionRef.current.x
      const dy = targetY - positionRef.current.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      // If we're close enough to the target, move to the next path point
      if (distance < 5) {
        if (moveIntervalRef.current) {
          clearInterval(moveIntervalRef.current)
          moveIntervalRef.current = null
        }

        setCurrentPathIndex((i) => i + 1)

        // Update enemy position in the parent component
        // Convert from pixels back to percentages for consistent storage
        const newPosition = {
          x: (positionRef.current.x / arenaWidth) * 100,
          y: (positionRef.current.y / arenaHeight) * 100,
        }

        if (onPositionUpdate) {
          onPositionUpdate(enemy.instanceId, newPosition)
        } else {
          // Fallback to direct mutation if no callback provided
          enemy.position = newPosition
        }

        return
      }

      // Move in the direction of the target
      let speed = 3.5 // Increased speed from 0.5 to 3.5

      // Apply slow effect if present
      const slowEffect = enemyRef.current.effects?.find((effect) => effect.type === "slow")
      if (slowEffect) {
        speed *= slowEffect.factor || 0.5
      }

      // Calculate movement based on speed and direction
      const normalizedDx = dx / distance
      const normalizedDy = dy / distance

      const newX = positionRef.current.x + normalizedDx * speed
      const newY = positionRef.current.y + normalizedDy * speed

      // Update position ref
      positionRef.current = { x: newX, y: newY }

      // Update DOM directly for better performance
      if (domRef.current) {
        domRef.current.style.left = `${newX - 16}px`
        domRef.current.style.top = `${newY - 16}px`
      }

      // Update the enemy position in the parent component
      // Convert from pixels back to percentages for consistent storage
      const newPosition = {
        x: (newX / arenaWidth) * 100,
        y: (newY / arenaHeight) * 100,
      }

      // Update the enemy position more frequently to ensure accurate position tracking
      // Increase from 0.3 to 1.0 to update on every frame
      if (onPositionUpdate) {
        onPositionUpdate(enemy.instanceId, newPosition)
      } else {
        // Fallback to direct mutation if no callback provided
        enemy.position = newPosition
      }
    }, 16) // ~60fps

    return () => {
      if (moveIntervalRef.current) {
        clearInterval(moveIntervalRef.current)
        moveIntervalRef.current = null
      }
    }
  }, [currentPathIndex, arenaWidth, arenaHeight, enemy.path, enemy, onPositionUpdate])

  // Determine if enemy has any active effects
  const hasBurnEffect = enemy.effects?.some((effect) => effect.type === "burn")
  const hasSlowEffect = enemy.effects?.some((effect) => effect.type === "slow")

  return (
    <div
      ref={domRef}
      className={`absolute flex items-center justify-center w-8 h-8 rounded-full transition-none z-20 ${
        hasSlowEffect ? "opacity-70" : "opacity-100"
      }`}
      style={{
        backgroundColor: enemy.color,
        boxShadow: hasBurnEffect ? `0 0 10px #f97316` : `0 0 10px ${enemy.color}`,
        // Initial position set by ref in useEffect
      }}
    >
      <span className="rounded-sm bg-black text-white font-bold text-xs">{enemy.id}</span>

      {/* Health bar */}
      <div className="absolute -top-3 left-0 w-full h-1 bg-gray-800 rounded-full overflow-hidden">
        <div className="h-full bg-green-500" style={{ width: `${enemy.health}%` }} />
      </div>

      {/* Effect indicators */}
      {hasBurnEffect && (
        <div className="absolute -bottom-3 left-0 w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center">
          <span className="text-white text-[8px]">🔥</span>
        </div>
      )}

      {hasSlowEffect && (
        <div className="absolute -bottom-3 right-0 w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
          <span className="text-white text-[8px]">❄️</span>
        </div>
      )}
    </div>
  )
}

