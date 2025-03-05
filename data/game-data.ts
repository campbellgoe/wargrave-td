import type { Tower, Enemy } from "@/types/game-types"
import towersData from "./towers.json"
import enemiesData from "./enemies.json"

// Type assertion to ensure the JSON data matches our types
export const towerData: Record<string, Tower> = towersData as Record<string, Tower>
export const enemyData: Record<string, Enemy> = enemiesData as Record<string, Enemy>

