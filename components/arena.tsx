"use client"

import type React from "react"

import { useState, useEffect, useMemo, forwardRef } from "react"
import type { PlacedTower, Tower, SpawnedEnemy } from "@/types/game-types"
import TowerCard from "./tower-card"
import EnemyEntity from "./enemy-entity"
import TowerAttack from "./tower-attack"
import { isTowerEffectiveAgainstEnemy } from "@/lib/game-utils"
import { X } from "lucide-react"

// Update the ArenaProps interface to include the onEnemyPositionUpdate prop
interface ArenaProps {
  placedTowers: PlacedTower[]
  spawnedEnemies: SpawnedEnemy[]
  onPlaceTower: (x: number, y: number) => void
  onRemoveTower: (instanceId: number) => void
  selectedTower: Tower | null
  onDeselectTower: () => void
  dimensions: { width: number; height: number }
  onEnemyPositionUpdate?: (enemyId: number, position: { x: number; y: number }) => void
}

// Update the Arena component to pass the onEnemyPositionUpdate prop to EnemyEntity
const Arena = forwardRef<HTMLDivElement, ArenaProps>(
  (
    {
      placedTowers,
      spawnedEnemies,
      onPlaceTower,
      onRemoveTower,
      selectedTower,
      onDeselectTower,
      dimensions,
      onEnemyPositionUpdate,
    },
    ref,
  ) => {
    const [attacks, setAttacks] = useState<Map<string, any>>(new Map())
    const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 })

    // Visualize tower attacks
    useEffect(() => {
      // Find active attacks
      const newAttacks = new Map<string, any>()

      placedTowers.forEach((tower) => {
        // Skip if tower hasn't attacked recently
        const timeSinceLastAttack = Date.now() - tower.lastAttackTime
        if (timeSinceLastAttack > 500 || tower.lastAttackTime === 0) return

        // Find enemies in range
        spawnedEnemies.forEach((enemy) => {
          if (enemy.health <= 0) return

          // Check if enemy is in range
          const towerX = tower.position.x
          const towerY = tower.position.y
          const enemyXPixels = (enemy.position.x / 100) * dimensions.width
          const enemyYPixels = (enemy.position.y / 100) * dimensions.height

          const distance = Math.sqrt(Math.pow(towerX - enemyXPixels, 2) + Math.pow(towerY - enemyYPixels, 2))

          const inRange = distance <= tower.range

          // Check if tower is effective against this enemy
          const isEffective = isTowerEffectiveAgainstEnemy(tower, enemy)

          // Only show attack if tower is in range and effective
          if (inRange && isEffective) {
            const attackId = `${tower.instanceId}-${enemy.instanceId}-${Date.now()}`
            newAttacks.set(attackId, {
              id: attackId,
              tower,
              enemy,
              timestamp: Date.now(),
            })
          }
        })
      })

      // Add new attacks and clean up old ones
      setAttacks((prev) => {
        const updatedAttacks = new Map(prev)

        // Add new attacks
        newAttacks.forEach((attack, id) => {
          updatedAttacks.set(id, attack)
        })

        // Remove old attacks
        updatedAttacks.forEach((attack, id) => {
          if (Date.now() - attack.timestamp > 1000) {
            updatedAttacks.delete(id)
          }
        })

        return updatedAttacks
      })
    }, [placedTowers, spawnedEnemies, dimensions.width, dimensions.height])

    // Handle click to place tower
    const handleClick = (e: React.MouseEvent) => {
      if (!selectedTower || !ref || !("current" in ref) || !ref.current) return

      const arenaRect = ref.current.getBoundingClientRect()
      const x = e.clientX - arenaRect.left
      const y = e.clientY - arenaRect.top

      onPlaceTower(x, y)
    }

    // Add mousemove handler
    const handleMouseMove = (e: React.MouseEvent) => {
      setCursorPosition({ x: e.clientX, y: e.clientY })
    }

    // Memoize grid cells to avoid re-rendering
    const gridCells = useMemo(() => {
      return Array.from({ length: 100 }).map((_, i) => <div key={i} className="border border-gray-100/10" />)
    }, [])

    // Update the handleEnemyPositionUpdate function
    const handleEnemyPositionUpdate = (enemyId: number, position: { x: number; y: number }) => {
      if (onEnemyPositionUpdate) {
        onEnemyPositionUpdate(enemyId, position)
      }
    }

    return (
      <div
        ref={ref}
        className={`relative w-full h-[500px] border-2 rounded-lg ${
          selectedTower ? "border-primary bg-primary/10 cursor-crosshair" : "border-border bg-muted/30"
        } transition-colors overflow-hidden`}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
      >
        {/* Background grid for visual reference */}
        <div className="absolute inset-0 grid grid-cols-10 grid-rows-10">{gridCells}</div>

        {/* Danger zone indicator */}
        <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-red-500/10 border-t-2 border-red-500 pointer-events-none">
          <div className="flex items-center justify-center h-full">
            <div className="bg-red-500/80 text-white px-3 py-1 rounded-md text-sm font-medium shadow-md">
              Danger Zone - Network Breach Area
            </div>
          </div>
        </div>

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {placedTowers.length === 0 && spawnedEnemies.length === 0 && !selectedTower && (
            <p className="text-muted-foreground">Select a tower and click to place it</p>
          )}
          {selectedTower && (
            <p className="text-primary font-medium bg-background/80 px-3 py-1 rounded-md">
              Click to place {selectedTower.name}
            </p>
          )}
        </div>

        {/* Cancel button for deselecting tower */}
        {selectedTower && (
          <button
            className="absolute top-2 right-2 z-50 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
            onClick={(e) => {
              e.stopPropagation() // Prevent placing a tower
              onDeselectTower()
            }}
            title="Cancel tower placement"
          >
            <X size={20} />
          </button>
        )}

        {/* Render tower attack visualizations */}
        {Array.from(attacks.values()).map((attack) => (
          <TowerAttack key={attack.id} tower={attack.tower} enemy={attack.enemy} />
        ))}

        {/* Render tower range indicators */}
        {placedTowers.map((tower) => (
          <div
            key={`range-${tower.instanceId}`}
            className="absolute rounded-full border-2 opacity-20 pointer-events-none"
            style={{
              borderColor: tower.color,
              backgroundColor: `${tower.color}10`,
              width: tower.range * 2,
              height: tower.range * 2,
              left: tower.position.x - tower.range,
              top: tower.position.y - tower.range,
              zIndex: 5,
            }}
          />
        ))}

        {/* Update the EnemyEntity component call */}
        {spawnedEnemies.map((enemy) => (
          <EnemyEntity
            key={enemy.instanceId}
            enemy={enemy}
            arenaWidth={dimensions.width}
            arenaHeight={dimensions.height}
            onPositionUpdate={handleEnemyPositionUpdate}
          />
        ))}

        {/* Render towers */}
        {placedTowers.map((tower) => (
          <TowerCard
            key={tower.instanceId}
            tower={tower}
            onRemove={() => onRemoveTower(tower.instanceId)}
            style={{
              position: "absolute",
              left: `${tower.position.x - 25}px`, // Center the tower on the drop point
              top: `${tower.position.y - 25}px`,
              zIndex: 10,
            }}
          />
        ))}

        {/* Preview of selected tower following cursor */}
        {selectedTower && (
          <div
            className="fixed w-10 h-10 rounded-full opacity-70 pointer-events-none z-50 flex items-center justify-center text-white font-bold"
            style={{
              backgroundColor: selectedTower.color,
              left: cursorPosition.x,
              top: cursorPosition.y,
              transform: "translate(-50%, -50%)",
            }}
          >
            {selectedTower.symbol}
          </div>
        )}
      </div>
    )
  },
)

Arena.displayName = "Arena"

export default Arena

