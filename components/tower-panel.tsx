"use client"

import type { Tower } from "@/types/game-types"
import TowerCard from "./tower-card"

interface TowerPanelProps {
  towers: Tower[]
  onSelectTower: (tower: Tower) => void
  selectedTowerId: string
}

export default function TowerPanel({ towers, onSelectTower, selectedTowerId }: TowerPanelProps) {
  const handleTowerClick = (tower: Tower) => {
    // If the tower is already selected, deselect it
    if (tower.id === selectedTowerId) {
      onSelectTower(null as any) // Deselect the tower
    } else {
      onSelectTower(tower) // Select the tower
    }
  }

  return (
    <div className="p-4 bg-card border border-border rounded-b-lg shadow-md h-[calc(50dvh-100px)] overflow-auto">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {towers.map((tower) => (
          <TowerCard
            key={tower.id}
            tower={tower}
            isSelected={tower.id === selectedTowerId}
            onClick={() => handleTowerClick(tower)}
          />
        ))}
      </div>
    </div>
  )
}

