import type { Tower, Enemy, SpawnedEnemy, Position, PlacedTower, Effect } from "@/types/game-types"

/**
 * Generates a random path for an enemy to follow
 * Ensures enemies move in a generally downward direction
 */
export function generateRandomPath(): Position[] {
  // Create a path that trends downward
  const pathLength = 5 + Math.floor(Math.random() * 3) // 5-7 points
  const path: Position[] = []

  // Start at a random x position at the top
  path.push({
    x: 10 + Math.random() * 80, // percentage (keep away from edges)
    y: 0, // Top of the arena
  })

  // Generate points that always move downward
  for (let i = 1; i < pathLength; i++) {
    const prevY = path[i - 1].y
    const progress = i / pathLength // How far along the path we are (0-1)

    // Ensure each point is lower than the previous one
    // The y value increases more rapidly as we progress through the path
    const yStep = 100 / pathLength // Distribute steps evenly to ensure reaching bottom
    path.push({
      x: 10 + Math.random() * 80, // random x position (keep away from edges)
      y: prevY + yStep + Math.random() * 5, // Ensure consistent downward movement
    })
  }

  // Ensure the last point is at the bottom
  path[path.length - 1] = {
    x: 10 + Math.random() * 80, // Keep away from edges
    y: 100, // Bottom of the arena
  }

  return path
}

/**
 * Creates a new spawned enemy instance
 */
export function createSpawnedEnemy(enemy: Enemy, nextId: number): SpawnedEnemy {
  // Generate a random path for the enemy to follow
  const path = generateRandomPath()

  // Use the first point in the path as the starting position
  const startPosition = {
    x: path[0].x,
    y: path[0].y,
  }

  return {
    ...enemy,
    instanceId: nextId,
    position: startPosition, // Start at the first point of the path
    health: 100,
    path: path,
    effects: [],
    reachedEnd: false,
  }
}

/**
 * Creates a new placed tower instance
 */
export function createPlacedTower(tower: Tower, nextId: number, x: number, y: number): PlacedTower {
  // Base stats - increase range for better gameplay
  let range = tower.attackType === "area" ? 150 : 120 // Increased from 100 to 120 for single target
  let cooldown = 800 // Decreased from 1000 to 800 for faster attacks

  // Special case for towers that counter specific attacks
  if (tower.counters.length > 0) {
    range += 20 // Increased from 15 to 20
    cooldown = 700 // Decreased from 900 to 700
  }

  // Special cases for specific tower types
  if (tower.id === "ssl" || tower.id === "encryption" || tower.id === "vpn") {
    range += 30 // Increased from 25 to 30
    cooldown = 600 // Decreased from 800 to 600
  }

  return {
    ...tower,
    instanceId: nextId,
    position: { x, y },
    lastAttackTime: 0,
    range: range,
    cooldown: cooldown,
  }
}

/**
 * Calculates distance between two positions
 */
export function calculateDistance(pos1: Position, pos2: Position): number {
  const dx = pos1.x - pos2.x
  const dy = pos1.y - pos2.y
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * Checks if a tower can attack an enemy
 */
export function canTowerAttackEnemy(tower: PlacedTower, enemy: SpawnedEnemy): boolean {
  // Skip if enemy is already defeated
  if (enemy.health <= 0) return false

  // Calculate distance
  const distance = calculateDistance(tower.position, enemy.position)

  // Convert the enemy position from percentage to pixels for accurate range checking
  // This is critical because tower.position is in pixels but enemy.position is in percentages
  const towerX = tower.position.x
  const towerY = tower.position.y

  // We need to use the same scale for comparison
  // Since tower range is in pixels, we need to convert enemy position to pixels too
  const enemyXPixels = (enemy.position.x * window.innerWidth) / 100
  const enemyYPixels = (enemy.position.y * 500) / 100 // Using 500px as the arena height

  const pixelDistance = Math.sqrt(Math.pow(towerX - enemyXPixels, 2) + Math.pow(towerY - enemyYPixels, 2))

  // Check if enemy is in range using the pixel-based distance
  return pixelDistance <= tower.range
}

// Update the isTowerEffectiveAgainstEnemy function to only return true for effective towers
export function isTowerEffectiveAgainstEnemy(tower: PlacedTower, enemy: SpawnedEnemy): boolean {
  // Direct match: Check if tower counters this enemy type by ID
  if (tower.counters.includes(enemy.id)) {
    return true
  }

  // Weakness match: Check if enemy is weak to this tower type
  if (enemy.weaknesses.includes(tower.id)) {
    return true
  }

  // If neither condition is met, the tower is not effective
  return false // Changed from true to false to ensure only effective towers can attack
}

// Update the calculateDamageAgainstEnemy function to return 0 for ineffective towers
export function calculateDamageAgainstEnemy(tower: PlacedTower, enemy: SpawnedEnemy): number {
  // Check if tower is effective against this enemy
  if (!isTowerEffectiveAgainstEnemy(tower, enemy)) {
    return 0 // No damage if tower is not effective
  }

  // Base damage
  let damage = 10

  // Direct counter: Tower explicitly counters this enemy by ID
  const isDirectCounter = tower.counters.includes(enemy.id)

  // Weakness match: Enemy is weak to this tower type
  const isWeaknessMatch = enemy.weaknesses.includes(tower.id)

  // Apply damage multipliers
  if (isDirectCounter && isWeaknessMatch) {
    // Both direct counter and weakness match - super effective!
    damage *= 3.0
  } else if (isDirectCounter) {
    damage *= 2.5 // Direct counter
  } else if (isWeaknessMatch) {
    damage *= 2.0 // Weakness match
  }

  // Special cases for specific combinations
  if (enemy.id === "mitm") {
    if (tower.id === "encryption") {
      damage = 35 // Encryption is very effective
    } else if (tower.id === "vpn") {
      damage = 30 // VPN is quite effective
    } else if (tower.id === "ssl") {
      damage = 45 // SSL is extremely effective
    }
  }

  if (enemy.id === "ddos" && tower.id === "firewall") {
    damage = 25 // Firewall is quite effective against DDoS
  }

  if (enemy.id === "ransomware" && tower.id === "backup") {
    damage = 40 // Backup systems are extremely effective against ransomware
  }

  if (enemy.id === "zeroday" && tower.id === "updates") {
    damage = 35 // Updates are very effective against zero-day exploits
  }

  // Round to nearest integer
  return Math.round(damage)
}

/**
 * Creates a new effect
 */
export function createEffect(type: string, duration: number, options: Partial<Effect> = {}): Effect {
  return {
    type,
    duration,
    startTime: Date.now(),
    ...options,
  }
}

/**
 * Calculates damage based on enemy severity
 */
export function calculateEnemyDamage(severity: string): number {
  switch (severity) {
    case "Extreme":
      return 25
    case "High":
      return 15
    case "Medium":
      return 10
    default:
      return 5
  }
}

