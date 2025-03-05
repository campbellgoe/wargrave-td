"use client"

import type { Enemy } from "@/types/game-types"
import { towerData } from "@/data/game-data"

interface ThreatInfoProps {
  threats: Enemy[]
}

export default function ThreatInfo({ threats }: ThreatInfoProps) {
  // Helper function to find towers that counter a specific threat
  const getCounterTowers = (threat: Enemy) => {
    return Object.values(towerData).filter(
      (tower) =>
        // Check if tower explicitly counters this threat
        tower.counters.includes(threat.id) ||
        // Check if threat is weak to this tower
        threat.weaknesses.includes(tower.id),
    )
  }

  return (
    <div className="p-4 bg-card border border-border rounded-b-lg shadow-md h-[calc(50dvh-100px)] overflow-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {threats.map((threat) => {
          const counterTowers = getCounterTowers(threat)

          return (
            <div key={threat.id} className="border rounded-lg overflow-hidden" style={{ borderColor: threat.color }}>
              <div
                className="p-3 text-white font-medium flex items-center gap-2"
                style={{ backgroundColor: threat.color }}
              >
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">{threat.symbol}</div>
                <span>{threat.name}</span>
                <span className="ml-auto text-xs px-2 py-1 bg-black/20 rounded-full">{threat.severity}</span>
              </div>

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
                  <div className="mt-1 grid grid-cols-2 gap-1">
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

