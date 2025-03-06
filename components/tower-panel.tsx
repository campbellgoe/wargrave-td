"use client"

import { useState, useEffect, useMemo } from "react"
import type { Tower } from "@/types/game-types"
import TowerCard from "./tower-card"
import { Search } from "lucide-react"
import Fuse from "fuse.js"

interface TowerPanelProps {
  towers: Tower[]
  onSelectTower: (tower: Tower) => void
  selectedTowerId: string
  budget: number
}

export default function TowerPanel({ towers, onSelectTower, selectedTowerId, budget }: TowerPanelProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredTowers, setFilteredTowers] = useState<Tower[]>(towers)

  // Create a Fuse instance for fuzzy search using useMemo to prevent recreation on every render
  const fuse = useMemo(
    () =>
      new Fuse(towers, {
        keys: ["name", "id", "description", "effects", "counters"],
        threshold: 0.4,
        ignoreLocation: true,
      }),
    [towers],
  )

  // Filter towers based on search query
  useEffect(() => {
    if (searchQuery.trim()) {
      const searchResults = fuse.search(searchQuery)
      setFilteredTowers(searchResults.map((result) => result.item))
    } else {
      setFilteredTowers(towers)
    }
  }, [searchQuery, towers, fuse])

  const handleTowerClick = (tower: Tower) => {
    // If the tower is already selected, deselect it
    if (tower.id === selectedTowerId) {
      onSelectTower(null as any) // Deselect the tower
    } else {
      onSelectTower(tower) // Select the tower
    }
  }

  // Format currency for display
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="p-4 bg-card border border-border rounded-b-lg shadow-md h-[calc(50dvh-100px)] overflow-auto">
      {/* Search bar */}
      <div className="mb-4 relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={16} className="text-muted-foreground" />
        </div>
        <input
          type="text"
          placeholder="Search towers..."
          className="w-full pl-10 pr-4 py-2 border border-border rounded-md bg-background"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Search results info */}
      {searchQuery && (
        <div className="mb-4 flex justify-between items-center">
          <div className="text-sm font-medium bg-primary/20 text-primary px-3 py-1 rounded-full">
            Search Results: {filteredTowers.length}
          </div>
          {filteredTowers.length === 0 && (
            <button onClick={() => setSearchQuery("")} className="text-sm text-blue-500 hover:text-blue-700">
              Clear search
            </button>
          )}
        </div>
      )}

      {/* No results message */}
      {filteredTowers.length === 0 && (
        <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
          <div className="text-lg mb-2">No matching towers</div>
          <div className="text-sm">Try a different search term</div>
        </div>
      )}

      {/* Tower grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {filteredTowers.map((tower) => {
          const canAfford = budget >= tower.cost

          return (
            <div key={tower.id} className="flex flex-col">
              <TowerCard
                tower={tower}
                isSelected={tower.id === selectedTowerId}
                onClick={() => canAfford && handleTowerClick(tower)}
                disabled={!canAfford}
              />
              <div className={`text-xs mt-1 text-center ${canAfford ? "text-green-600" : "text-red-500"}`}>
                {formatCurrency(tower.cost)}/year
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

