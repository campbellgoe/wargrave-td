export interface Tower {
  id: string
  name: string
  description: string
  effectiveness: string
  counters: string[]
  color: string
  symbol: string
  effects: string[]
  attackType: string
}

export interface Position {
  x: number
  y: number
}

export interface PlacedTower extends Tower {
  instanceId: number
  position: Position
  lastAttackTime: number
  range: number
  cooldown: number
}

export interface Enemy {
  id: string
  name: string
  description: string
  attackType: string
  weaknesses: string[]
  severity: string
  speed: string
  color: string
  symbol: string
}

export interface Effect {
  type: string
  duration: number
  startTime?: number
  damage?: number
  factor?: number
}

export interface SpawnedEnemy extends Enemy {
  instanceId: number
  position: Position
  health: number
  path: Position[] // Series of points the enemy will follow
  effects: Effect[]
  reachedEnd: boolean
}

