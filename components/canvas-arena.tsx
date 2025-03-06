"use client"

import React from "react"

import { useRef, useEffect, useState, forwardRef, useCallback } from "react"
import type { PlacedTower, Tower, SpawnedEnemy } from "@/types/game-types"
import { isTowerEffectiveAgainstEnemy } from "@/lib/game-utils"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface CanvasArenaProps {
  placedTowers: PlacedTower[]
  spawnedEnemies: SpawnedEnemy[]
  onPlaceTower: (x: number, y: number) => void
  onRemoveTower: (instanceId: number) => void
  selectedTower: Tower | null
  onDeselectTower: () => void
  dimensions: { width: number; height: number }
  onEnemyPositionUpdate?: (enemyId: number, position: { x: number; y: number }) => void
}

const CanvasArena = forwardRef<HTMLDivElement, CanvasArenaProps>(
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
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 })
    const [hoveredTower, setHoveredTower] = useState<PlacedTower | null>(null)
    const animationFrameRef = useRef<number>(0)
    const lastRenderTimeRef = useRef<number>(0)

    // Add drag and drop functionality for towers
    // Add these state variables at the top of the component
    const [isDragging, setIsDragging] = useState(false)
    const [draggedTower, setDraggedTower] = useState<PlacedTower | null>(null)

    // Handle click to place tower
    const handleClick = (e: React.MouseEvent) => {
      if (!selectedTower || !ref || !("current" in ref) || !ref.current) return

      const arenaRect = ref.current.getBoundingClientRect()
      const x = e.clientX - arenaRect.left
      const y = e.clientY - arenaRect.top

      // Check if we clicked on an existing tower
      const clickedTower = placedTowers.find((tower) => {
        const dx = tower.position.x - x
        const dy = tower.position.y - y
        return Math.sqrt(dx * dx + dy * dy) < 25 // 25px radius for tower hitbox
      })

      if (clickedTower) {
        // If we clicked on a tower, don't place a new one
        return
      }

      onPlaceTower(x, y)
    }

    // Add these handlers for drag and drop
    const handleTowerDragStart = (isTouch: boolean)=>(e: React.MouseEvent | React.TouchEvent, tower: PlacedTower) => {
      if (selectedTower) return // Don't allow dragging while placing a tower

      e.stopPropagation()
      setIsDragging(true)
      setDraggedTower(tower)
      setHoveredTower(null)
    }

    // Update the handleTowerDragEnd function to not remove towers when repositioning
    const handleTowerDragEnd = (isTouch: boolean) => (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDragging || !draggedTower || !ref || !("current" in ref) || !ref.current) {
        setIsDragging(false)
        setDraggedTower(null)
        return
      }

      e.stopPropagation()

      const arenaRect = ref.current.getBoundingClientRect()
      let x = 0;
      let y = 0;
      if(isTouch){
        x = ((e as unknown as TouchEvent).changedTouches?.[0].clientX || 0 ) - arenaRect.left;
        y = ((e as unknown as TouchEvent).changedTouches?.[0].clientY || 0 ) - arenaRect.top;
      } else {
        x = (e as unknown as MouseEvent).clientX - arenaRect.left
        y = (e as unknown as MouseEvent).clientY - arenaRect.top
      }

      // Update the tower position without removing it
      placedTowers.forEach((tower) => {
        if (tower.instanceId === draggedTower.instanceId) {
          tower.position = { x, y }
        }
      })

      setIsDragging(false)
      setDraggedTower(null)
    }

    // Handle mouse move for cursor position and tower hover
    const handleMouseMove = (isTouch: boolean) => (e: React.MouseEvent | React.TouchEvent) => {
      if (!ref || !("current" in ref) || !ref.current) return

      const arenaRect = ref.current.getBoundingClientRect()
      let x = 0;
      let y = 0;
      if(isTouch){
        x = ((e as unknown as TouchEvent).touches?.[0].clientX || 0 ) - arenaRect.left;
        y = ((e as unknown as TouchEvent).touches?.[0].clientY || 0 ) - arenaRect.top;
      } else {
        x = (e as unknown as MouseEvent).clientX - arenaRect.left
        y = (e as unknown as MouseEvent).clientY - arenaRect.top
      }

      setCursorPosition({ x, y })

      // If dragging, update the dragged tower position
      if (isDragging && draggedTower) {
        setDraggedTower({
          ...draggedTower,
          position: { x, y },
        })
        return
      }

      // Check if we're hovering over a tower
      const tower = placedTowers.find((t) => {
        const dx = t.position.x - x
        const dy = t.position.y - y
        return Math.sqrt(dx * dx + dy * dy) < 25 // 25px radius for tower hitbox
      })

      setHoveredTower(tower || null)
    }

    // Handle tower removal
    const handleTowerRemove = (e: React.MouseEvent, towerId: number) => {
      e.stopPropagation() // Prevent placing a tower
      onRemoveTower(towerId)
    }

    // Wrap drawCanvas in useCallback to prevent recreation on each render
    const drawCanvasCallback = useCallback(
      (timestamp: number) => {
        if (!canvasRef.current) return

        const ctx = canvasRef.current.getContext("2d")
        if (!ctx) return

        // Calculate delta time for smooth animations
        const deltaTime = timestamp - (lastRenderTimeRef.current || timestamp)
        lastRenderTimeRef.current = timestamp

        // Clear canvas
        ctx.clearRect(0, 0, dimensions.width, dimensions.height)

        // Draw grid
        drawGrid(ctx)

        // Draw danger zone
        drawDangerZone(ctx)

        // Draw tower range indicators
        placedTowers.forEach((tower) => {
          // Skip the dragged tower
          if (isDragging && draggedTower && tower.instanceId === draggedTower.instanceId) return
          drawTowerRange(ctx, tower)
        })

        // Draw tower attacks
        placedTowers.forEach((tower) => {
          // Skip the dragged tower
          if (isDragging && draggedTower && tower.instanceId === draggedTower.instanceId) return

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
            if (inRange && isEffective && Date.now() - tower.lastAttackTime < 500) {
              drawTowerAttack(ctx, tower, enemy, enemyXPixels, enemyYPixels)
            }
          })
        })

        // Draw enemies
        spawnedEnemies.forEach((enemy) => {
          if (enemy.health <= 0) return
          drawEnemy(ctx, enemy, deltaTime)
        })

        // Draw towers
        placedTowers.forEach((tower) => {
          // Skip the dragged tower
          if (isDragging && draggedTower && tower.instanceId === draggedTower.instanceId) return
          drawTower(ctx, tower, tower === hoveredTower)
        })

        // Draw the dragged tower last (on top)
        if (isDragging && draggedTower) {
          drawTowerRange(ctx, draggedTower)
          drawTower(ctx, draggedTower, true)
        }

        // Request next frame
        animationFrameRef.current = requestAnimationFrame(drawCanvasCallback)
      },
      [dimensions, placedTowers, spawnedEnemies, hoveredTower, isDragging, draggedTower],
    )

    // Draw grid
    const drawGrid = (ctx: CanvasRenderingContext2D) => {
      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)"
      ctx.lineWidth = 1

      // Draw vertical lines
      for (let i = 0; i <= 10; i++) {
        const x = (i / 10) * dimensions.width
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, dimensions.height)
        ctx.stroke()
      }

      // Draw horizontal lines
      for (let i = 0; i <= 10; i++) {
        const y = (i / 10) * dimensions.height
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(dimensions.width, y)
        ctx.stroke()
      }
    }

    // Draw danger zone
    const drawDangerZone = (ctx: CanvasRenderingContext2D) => {
      const dangerZoneHeight = dimensions.height * 0.25
      const y = dimensions.height - dangerZoneHeight

      // Draw danger zone background
      ctx.fillStyle = "rgba(239, 68, 68, 0.1)" // red-500 with 10% opacity
      ctx.fillRect(0, y, dimensions.width, dangerZoneHeight)

      // Draw danger zone border
      ctx.strokeStyle = "rgba(239, 68, 68, 0.8)" // red-500 with 80% opacity
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(dimensions.width, y)
      ctx.stroke()

      // Draw danger zone text
      ctx.fillStyle = "rgba(239, 68, 68, 0.8)" // red-500 with 80% opacity
      ctx.font = "bold 14px sans-serif"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText("Danger Zone - Network Breach Area", dimensions.width / 2, y + dangerZoneHeight / 2)
    }

    // Draw tower range
    const drawTowerRange = (ctx: CanvasRenderingContext2D, tower: PlacedTower) => {
      ctx.strokeStyle = tower.color
      ctx.fillStyle = `${tower.color}20` // 20% opacity
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.arc(tower.position.x, tower.position.y, tower.range, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
    }

    // Update the drawTowerAttack function to add black background to text
    const drawTowerAttack = (
      ctx: CanvasRenderingContext2D,
      tower: PlacedTower,
      enemy: SpawnedEnemy,
      enemyX: number,
      enemyY: number,
    ) => {
      // Draw line from tower to enemy
      ctx.strokeStyle = tower.color
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(tower.position.x, tower.position.y)
      ctx.lineTo(enemyX, enemyY)
      ctx.stroke()

      // Draw attack effect at enemy position
      ctx.fillStyle = tower.color
      ctx.beginPath()
      ctx.arc(enemyX, enemyY, 5, 0, Math.PI * 2)
      ctx.fill()

      // Draw "Critical!" text with black background
      const criticalText = "Critical!"
      ctx.font = "bold 12px sans-serif"
      const textWidth = ctx.measureText(criticalText).width

      // Draw black background
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
      ctx.fillRect(enemyX - textWidth / 2 - 4, enemyY - 28, textWidth + 8, 18)

      // Draw text
      ctx.fillStyle = tower.color
      ctx.textAlign = "center"
      ctx.textBaseline = "bottom"
      ctx.fillText(criticalText, enemyX, enemyY - 15)
    }

    // Update the drawEnemy function to add black backgrounds to text
    const drawEnemy = (ctx: CanvasRenderingContext2D, enemy: SpawnedEnemy, deltaTime: number) => {
      const x = (enemy.position.x / 100) * dimensions.width
      const y = (enemy.position.y / 100) * dimensions.height
      const inDangerZone = enemy.position.y >= 75

      // Draw enemy circle
      ctx.fillStyle = enemy.color
      ctx.beginPath()
      ctx.arc(x, y, 16, 0, Math.PI * 2)
      ctx.fill()

      // Add glow effect for enemies in danger zone
      if (inDangerZone) {
        ctx.shadowColor = "red"
        ctx.shadowBlur = 10
        ctx.beginPath()
        ctx.arc(x, y, 16, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0
      }

      // Draw enemy ID with black background
      const idText = enemy.id
      ctx.font = "bold 10px sans-serif"
      const textWidth = ctx.measureText(idText).width

      // Draw black background for ID
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
      ctx.fillRect(x - textWidth / 2 - 4, y - 5, textWidth + 8, 10)

      // Draw ID text
      ctx.fillStyle = "white"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText(idText, x, y)

      // Draw health bar
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
      ctx.fillRect(x - 16, y - 20, 32, 4)
      ctx.fillStyle = "rgb(34, 197, 94)" // green-500
      ctx.fillRect(x - 16, y - 20, (32 * enemy.health) / 100, 4)

      // Draw effect indicators
      const hasBurnEffect = enemy.effects?.some((effect) => effect.type === "burn")
      const hasSlowEffect = enemy.effects?.some((effect) => effect.type === "slow")

      if (hasBurnEffect) {
        ctx.fillStyle = "rgb(249, 115, 22)" // orange-500
        ctx.beginPath()
        ctx.arc(x - 8, y + 20, 4, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = "white"
        ctx.font = "8px sans-serif"
        ctx.fillText("🔥", x - 8, y + 20)
      }

      if (hasSlowEffect) {
        ctx.fillStyle = "rgb(59, 130, 246)" // blue-500
        ctx.beginPath()
        ctx.arc(x + 8, y + 20, 4, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = "white"
        ctx.font = "8px sans-serif"
        ctx.fillText("❄️", x + 8, y + 20)
      }

      // Draw breach indicator for enemies in danger zone
      if (inDangerZone) {
        ctx.fillStyle = "black"
        ctx.fillRect(x - 25, y - 35, 50, 15)
        ctx.fillStyle = "red"
        ctx.font = "bold 10px sans-serif"
        ctx.fillText("BREACH!", x, y - 28)
      }
    }

    // Update the drawTower function to add black backgrounds to text
    const drawTower = (ctx: CanvasRenderingContext2D, tower: PlacedTower, isHovered: boolean) => {
      // Draw tower background
      ctx.fillStyle = `${tower.color}20` // 20% opacity
      ctx.strokeStyle = tower.color
      ctx.lineWidth = isHovered ? 2 : 1
      ctx.beginPath()
      const x = tower.position.x - 25
      const y = tower.position.y - 25
      const width = 50
      const height = 50
      const radius = 5
      ctx.moveTo(x + radius, y)
      ctx.lineTo(x + width - radius, y)
      ctx.arcTo(x + width, y, x + width, y + radius, radius)
      ctx.lineTo(x + width, y + height - radius)
      ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius)
      ctx.lineTo(x + radius, y + height)
      ctx.arcTo(x, y + height, x, y + height - radius, radius)
      ctx.lineTo(x, y + radius)
      ctx.arcTo(x, y, x + radius, y, radius)
      ctx.fill()
      ctx.stroke()

      // Draw tower circle
      ctx.fillStyle = tower.color
      ctx.beginPath()
      ctx.arc(tower.position.x, tower.position.y - 10, 15, 0, Math.PI * 2)
      ctx.fill()

      // Draw tower symbol with black background
      const symbolText = tower.symbol
      ctx.font = "bold 12px sans-serif"
      const symbolWidth = ctx.measureText(symbolText).width

      // Draw black background for symbol
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)"
      ctx.beginPath()
      ctx.arc(tower.position.x, tower.position.y - 10, 10, 0, Math.PI * 2)
      ctx.fill()

      // Draw symbol text
      ctx.fillStyle = "white"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText(symbolText, tower.position.x, tower.position.y - 10)

      // Draw tower name with black background
      const nameText = tower.name
      ctx.font = "10px sans-serif"
      const nameWidth = ctx.measureText(nameText).width

      // Draw black background for name
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
      ctx.fillRect(tower.position.x - nameWidth / 2 - 4, tower.position.y + 10, nameWidth + 8, 12)

      // Draw name text
      ctx.fillStyle = "white"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText(nameText, tower.position.x, tower.position.y + 15)
    }

    // Set up canvas and start animation loop
    useEffect(() => {
      if (!canvasRef.current) return

      // Ensure dimensions are valid
      if (dimensions.width <= 0 || dimensions.height <= 0) {
        console.log("Invalid dimensions, skipping canvas setup", dimensions)
        return
      }

      // Set canvas dimensions
      canvasRef.current.width = dimensions.width
      canvasRef.current.height = dimensions.height

      // Start animation loop
      animationFrameRef.current = requestAnimationFrame(drawCanvasCallback)

      return () => {
        // Clean up animation loop
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
        }
      }
    }, [dimensions, drawCanvasCallback])

    // Update the return JSX to handle drag events
    return (
      <div
        ref={ref}
        className={cn(`sticky bottom-0 max-h-[60vh] bg-linear-to-t from-white to-transparent backdrop-blur-[2px] w-full h-[500px] border-2 rounded-lg`,
          selectedTower ? "border-primary cursor-crosshair" : "border-border"
        ,`transition-colors overflow-hidden`)}
        onClick={handleClick}
        onMouseMove={(e) => handleMouseMove(false)(e)}
        onTouchMove={(e) => handleMouseMove(true)(e)}
        onMouseUp={(e) => handleTowerDragEnd(false)(e)}
        onTouchEnd={(e) => handleTowerDragEnd(true)(e)}
        onMouseLeave={() => {
          if (isDragging) {
            setIsDragging(false)
            setDraggedTower(null)
          }
        }}
        // style={{
        //   position: sticky;
        //   bottom: 0;
        //   max-height: 60vh;
        //   background: repeating-linear-gradient(0deg, #ffffff, transparent 100%);
        //   backdrop-filter: blur(2px);
        // }}
      >
        <canvas ref={canvasRef} className="absolute inset-0" />

        {/* Instructions */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {placedTowers.length === 0 && spawnedEnemies.length === 0 && !selectedTower && (
            <p className="text-muted-foreground bg-background/80 px-3 py-1 rounded-md">
              Select a tower and click to place it
            </p>
          )}
          {selectedTower && (
            <p className="text-primary font-medium bg-background/80 px-3 py-1 rounded-md">
              Click to place {selectedTower.name}
            </p>
          )}
          {!selectedTower && placedTowers.length > 0 && (
            <p className="text-muted-foreground bg-background/80 px-3 py-1 rounded-md absolute bottom-4">
              Drag towers to reposition them
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

        {/* Tower removal buttons */}
        {hoveredTower && !selectedTower && !isDragging && (
          <div
            className="absolute z-50"
            style={{
              left: hoveredTower.position.x - 25,
              top: hoveredTower.position.y - 25,
            }}
          >
            <div
              className="w-50 h-50 cursor-move"
              style={{ width: "50px", height: "50px" }}
              onMouseDown={(e) => handleTowerDragStart(false)(e, hoveredTower)}
              onTouchStart={(e) => handleTowerDragStart(true)(e, hoveredTower)}
            />
          </div>
        )}

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

CanvasArena.displayName = "CanvasArena"

export default CanvasArena

