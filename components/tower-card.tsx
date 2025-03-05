"use client"

import type React from "react"

import { useState } from "react"
import type { Tower, PlacedTower } from "@/types/game-types"
import { Info } from "lucide-react"

// Update the interface to include new props
interface TowerCardProps {
  tower: Tower | PlacedTower
  isSelected?: boolean
  onClick?: () => void
  onRemove?: () => void
  style?: React.CSSProperties
}

// Update the component to handle selection
export default function TowerCard({ tower, isSelected = false, onClick, onRemove, style }: TowerCardProps) {
  const [showInfo, setShowInfo] = useState(false)

  const handleDragStart = (e: React.DragEvent) => {
    return
  }

  return (
    <div
      className={`relative flex flex-col items-center p-2 rounded-md border ${
        onClick ? "cursor-pointer hover:bg-muted/50" : ""
      } ${isSelected ? "ring-2 ring-primary" : ""}`}
      style={{
        backgroundColor: `${tower.color}20`, // Using tower color with transparency
        borderColor: tower.color,
        ...style,
      }}
      onClick={onClick}
    >
      <div
        className="absolute top-1 right-1 cursor-pointer"
        onClick={(e) => {
          e.stopPropagation()
          setShowInfo(!showInfo)
        }}
      >
        <Info size={16} />
      </div>

      {onRemove && (
        <button
          className="absolute top-1 left-1 w-5 h-5 flex items-center justify-center rounded-full bg-red-500 text-white text-xs"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
        >
          ×
        </button>
      )}

      <div
        className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white"
        style={{ backgroundColor: tower.color }}
      >
        {tower.symbol}
      </div>

      <div className="mt-1 text-xs font-medium text-center">{tower.name}</div>

      {showInfo && (
        <div className="absolute z-10 top-full mt-1 p-2 bg-background border border-border rounded-md shadow-lg w-48 text-xs">
          <p className="font-bold mb-1">{tower.name}</p>
          <p className="mb-1">{tower.description}</p>
          <p className="mb-1">
            <span className="font-semibold">Effectiveness:</span> {tower.effectiveness}
          </p>
          <p className="mb-1">
            <span className="font-semibold">Attack:</span> {tower.attackType}
          </p>
          <p className="font-semibold">Counters:</p>
          <ul className="list-disc pl-4">
            {tower.counters.map((counter) => (
              <li key={counter}>{counter}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

