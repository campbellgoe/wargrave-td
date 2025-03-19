"use client"

import { useState, useEffect, useMemo } from "react"
import type { Enemy } from "@/types/game-types"
import { towerData } from "@/data/game-data"
import { Search } from "lucide-react"
import Fuse from "fuse.js"

// Update the interface to include encounteredThreats
interface ThreatInfoProps {
  threats: Enemy[]
  activeThreats: string[] // IDs of enemies currently in the arena
  encounteredThreats: string[] // IDs of all enemies encountered during the game
}

export default function ThreatInfo({ threats, activeThreats, encounteredThreats }: ThreatInfoProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredThreats, setFilteredThreats] = useState<Enemy[]>([])
  // Add a state for the view mode
  const [viewMode, setViewMode] = useState<"active" | "encountered" | "all">("active")

  // Create a Fuse instance for fuzzy search using useMemo to prevent recreation on every render
  const fuse = useMemo(
    () =>
      new Fuse(threats, {
        keys: ["name", "id", "description", "attackType"],
        threshold: 0.4,
        ignoreLocation: true,
      }),
    [threats],
  )

  // Update the useEffect to filter threats based on the view mode
  useEffect(() => {
    // First filter by the selected view mode
    let filteredByMode: Enemy[] = []

    if (viewMode === "active") {
      filteredByMode = threats.filter((threat) => activeThreats.includes(threat.id))
    } else if (viewMode === "encountered") {
      filteredByMode = threats.filter((threat) => encounteredThreats.includes(threat.id))
    } else {
      filteredByMode = threats
    }

    // Then apply search if there's a query
    if (searchQuery.trim()) {
      const searchResults = fuse.search(searchQuery)
      const searchResultIds = new Set(searchResults.map((result) => result.item.id))
      setFilteredThreats(filteredByMode.filter((threat) => searchResultIds.has(threat.id)))
    } else {
      setFilteredThreats(filteredByMode)
    }
  }, [threats, activeThreats, encounteredThreats, searchQuery, fuse, viewMode])

  // Helper function to find towers that counter a specific threat
  const getCounterTowers = (threat: Enemy) => {
    return Object.values(towerData).filter(
      (tower) =>
        // Check if tower explicitly counters this threat
        tower.counters.includes(threat.id) ||
        // Check if threat is weak to this tower
        threat.weaknesses.includes(threat.id),
    )
  }

  return (
    <div className="p-4 bg-card h-full overflow-auto">
      {/* Add view mode toggle buttons after the search bar */}
      <div className="mb-4 flex flex-col gap-2">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-muted-foreground" />
          </div>
          <input
            type="text"
            placeholder="Search threats..."
            className="w-full pl-10 pr-4 py-2 border border-border rounded-md bg-background"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setViewMode("active")}
            className={`px-3 py-1 text-sm rounded-md ${
              viewMode === "active"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            Active Threats
          </button>
          <button
            onClick={() => setViewMode("encountered")}
            className={`px-3 py-1 text-sm rounded-md ${
              viewMode === "encountered"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            Collected Threats
          </button>
          <button
            onClick={() => setViewMode("all")}
            className={`px-3 py-1 text-sm rounded-md ${
              viewMode === "all"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            All Threats
          </button>
        </div>
      </div>

      {/* Update the threat count display */}
      <div className="mb-4 flex justify-between items-center">
        <div className="flex gap-2">
          {viewMode === "active" && (
            <div className="text-sm font-medium bg-black/70 text-white px-3 py-1 rounded-full">
              Active: {activeThreats.length}
            </div>
          )}
          {viewMode === "encountered" && (
            <div className="text-sm font-medium bg-green-600/70 text-white px-3 py-1 rounded-full">
              Collected: {encounteredThreats.length}
            </div>
          )}
          {viewMode === "all" && (
            <div className="text-sm font-medium bg-blue-600/70 text-white px-3 py-1 rounded-full">
              Total: {threats.length}
            </div>
          )}
        </div>
        {searchQuery && (
          <div className="text-sm font-medium bg-primary/20 text-primary px-3 py-1 rounded-full">
            Search Results: {filteredThreats.length}
          </div>
        )}
      </div>

      {/* Update the no results message */}
      {filteredThreats.length === 0 && (
        <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
          {viewMode === "active" && activeThreats.length === 0 ? (
            <>
              <div className="text-lg mb-2">No active threats</div>
              <div className="text-sm">Start the attack to spawn enemies</div>
            </>
          ) : viewMode === "encountered" && encounteredThreats.length === 0 ? (
            <>
              <div className="text-lg mb-2">No threats collected</div>
              <div className="text-sm">Defeat enemies to collect them</div>
            </>
          ) : searchQuery ? (
            <>
              <div className="text-lg mb-2">No matching threats</div>
              <div className="text-sm">Try a different search term</div>
              <button onClick={() => setSearchQuery("")} className="mt-2 text-sm text-blue-500 hover:text-blue-700">
                Clear search
              </button>
            </>
          ) : (
            <>
              <div className="text-lg mb-2">No threats to display</div>
              <div className="text-sm">Adjust your filters to see threats</div>
            </>
          )}
        </div>
      )}

      {/* Threat cards */}
      <div className="grid grid-cols-1 gap-4">
        {/* Add a visual indicator for active vs collected threats */}
        {filteredThreats.map((threat) => {
          const counterTowers = getCounterTowers(threat)
          const isActive = activeThreats.includes(threat.id)
          const isCollected = encounteredThreats.includes(threat.id) && !isActive

          return (
            <div key={threat.id} className="border rounded-lg overflow-hidden" style={{ borderColor: threat.color }}>
              <div
                className="p-3 text-white font-medium flex items-center gap-2"
                style={{ backgroundColor: threat.color }}
              >
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">{threat.symbol}</div>
                <span>{threat.name}</span>
                <span className="ml-auto text-xs px-2 py-1 bg-black/20 rounded-full">{threat.severity}</span>

                {/* Status indicator */}
                {isActive && (
                  <span className="text-xs px-2 py-1 bg-red-500/80 text-white rounded-full animate-pulse">Active</span>
                )}
                {isCollected && (
                  <span className="text-xs px-2 py-1 bg-green-500/80 text-white rounded-full">Collected</span>
                )}
              </div>

              {/* Rest of the threat card content remains the same */}
              <div className="p-3 space-y-2">
                <p className="text-sm">{threat.description}</p>

                <div>
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground">Attack Method</h4>
                  <p className="text-sm">{threat.attackType}</p>
                </div>

                <div>
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground">Speed</h4>
                  <p className="text-sm">{threat.speed}</p>
                </div>

                <div>
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground">Weaknesses</h4>
                  <ul className="text-sm list-disc pl-5">
                    {threat.weaknesses.map((weakness, index) => {
                      const tower = Object.values(towerData).find((t) => t.id === weakness)
                      return <li key={index}>{tower ? tower.name : weakness}</li>
                    })}
                  </ul>
                </div>

                <div>
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground">Required Defenses</h4>
                  <div className="mt-1 grid grid-cols-1 gap-1">
                    {counterTowers.map((tower) => (
                      <div key={tower.id} className="flex items-center gap-2 text-sm">
                        <div
                          className="w-4 h-4 rounded-full flex-shrink-0"
                          style={{ backgroundColor: tower.color }}
                        ></div>
                        <span className="truncate">{tower.name}</span>
                      </div>
                    ))}
                  </div>
                  {counterTowers.length === 0 && (
                    <p className="text-sm text-red-500 italic">No effective defenses found!</p>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

