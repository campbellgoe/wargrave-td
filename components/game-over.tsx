"use client"

import type { Enemy } from "@/types/game-types"
import { AlertTriangle, RefreshCw } from "lucide-react"

interface GameOverProps {
  reason: string
  enemy: Enemy | null
  onRestart: () => void
}

export default function GameOver({ reason, enemy, onRestart }: GameOverProps) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg shadow-lg max-w-md w-full p-6">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle size={32} className="text-red-500" />
          </div>

          <h2 className="text-2xl font-bold">Network Breach!</h2>

          <p className="text-lg">{reason}</p>

          {enemy && (
            <div
              className="w-full p-4 rounded-lg mt-2"
              style={{ backgroundColor: `${enemy.color}20`, borderLeft: `4px solid ${enemy.color}` }}
            >
              <h3 className="font-bold text-lg mb-2">{enemy.name} Attack</h3>
              <p className="text-sm mb-2">{enemy.description}</p>

              <h4 className="font-semibold text-sm mt-4">How to prevent this:</h4>
              <ul className="list-disc pl-5 text-sm">
                {enemy.weaknesses.map((weakness, index) => (
                  <li key={index}>{weakness}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-4 w-full">
            <h3 className="font-semibold mb-2">Network Eulogy</h3>
            <p className="text-sm italic border-l-4 border-gray-300 pl-3 py-1">
              "Here lies the network of Dowding Federation - Wargrave College. It fought bravely against cyber threats,
              but ultimately succumbed to
              {enemy ? ` a ${enemy.name.toLowerCase()} attack` : " security breaches"}. May its firewalls forever burn
              bright in digital heaven."
            </p>
          </div>

          <button
            onClick={onRestart}
            className="mt-6 flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2 rounded-md hover:bg-primary/90 transition-colors"
          >
            <RefreshCw size={16} />
            <span>Restart Defense</span>
          </button>
        </div>
      </div>
    </div>
  )
}

