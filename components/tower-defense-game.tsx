"use client"

import { useState, useRef, useEffect, useCallback, useContext } from "react"
import {
  ChevronDown,
  ChevronUp,
  Shield,
  X,
  Bug,
  PoundSterlingIcon as Pound,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import TowerPanel from "./tower-panel"
import CanvasArena from "./canvas-arena" // Import the new canvas-based arena
import { towerData, enemyData } from "@/data/game-data"
import type { Tower, PlacedTower, Enemy, SpawnedEnemy } from "@/types/game-types"
import ClientInfo from "./client-info"
import ThreatInfo from "./threat-info"
import GameOver from "./game-over"
import {
  createSpawnedEnemy,
  createPlacedTower,
  createEffect,
  calculateSpawnedEnemyDamage as calculateEnemyDamage,
  calculateDamageAgainstEnemy,
  isTowerEffectiveAgainstEnemy,
} from "@/lib/game-utils"
import { MyAudioContext } from "@/contexts/AudioProvider"

// Change the initial budget from 5.3 million to 1 million to make it more challenging
const INITIAL_BUDGET = 1000000

// Add a function to calculate rewards based on enemy severity
const calculateReward = (severity: string): number => {
  switch (severity) {
    case "Extreme":
      return 75000
    case "High":
      return 45000
    case "Medium":
      return 25000
    default:
      return 15000
  }
}

const playbackRate = 1
export default function TowerDefenseGame() {
  const loadedSamples = useRef<{ gameover: null | AudioBuffer }>({ gameover: null })
  const { audioContext } = useContext(MyAudioContext)
  const playSample = useCallback(
    (audioContext: AudioContext, audioBuffer: AudioBuffer, startTime = 0, volume = 0.5) => {
      const sampleSource = new AudioBufferSourceNode(audioContext, {
        buffer: audioBuffer,
        playbackRate,
      })
      var gainNode = audioContext.createGain()
      gainNode.gain.value = volume // 10 %
      gainNode.connect(audioContext.destination)

      sampleSource.connect(gainNode)
      sampleSource.start(startTime)
      return sampleSource
    },
    [],
  )
  useEffect(() => {
    // preload sound(s)

    if (audioContext) {
      async function getFile(audioContext: AudioContext, filepath: string) {
        const response = await fetch(filepath)
        const arrayBuffer = await response.arrayBuffer()
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
        return audioBuffer
      }
      async function setupSamples(filePaths: string[], audioContext: AudioContext) {
        const samples = await Promise.allSettled(filePaths.map((filePath) => getFile(audioContext, filePath)))
        return samples
      }
      setupSamples(["virus-game-over.wav"], audioContext).then((samples) => {
        try {
          const [gameOverSound] = samples
          if (gameOverSound.status === "fulfilled") {
            loadedSamples.current.gameover = gameOverSound.value
          } else {
            console.warn("Couldn't load sound.")
          }
        } catch (err) {
          console.warn("Couldn't load sound.", err)
        }
      })
    }
  }, [audioContext, playSample])

  // UI state
  const [isThreatPanelOpen, setIsThreatPanelOpen] = useState(true)
  const [isTowerPanelOpen, setIsTowerPanelOpen] = useState(true)
  const [threatInfoNeverOpened, setThreatInfoNeverOpened] = useState(true)
  const [isDebugPanelMinimized, setIsDebugPanelMinimized] = useState(false)

  // Game state - using Maps instead of arrays for better data structure management
  const [placedTowers, setPlacedTowers] = useState<Map<number, PlacedTower>>(new Map())
  const [spawnedEnemies, setSpawnedEnemies] = useState<Map<number, SpawnedEnemy>>(new Map())
  const [activeEnemyTypes, setActiveEnemyTypes] = useState<string[]>([]) // Track active enemy types by ID
  const [isGameRunning, setIsGameRunning] = useState(false)
  const [networkHealth, setNetworkHealth] = useState(100)
  const [gameOver, setGameOver] = useState(false)
  const [gameOverReason, setGameOverReason] = useState<string>("")
  const [lastEnemyToBreachDefense, setLastEnemyToBreachDefense] = useState<Enemy | null>(null)

  // Budget state
  const [budget, setBudget] = useState(INITIAL_BUDGET)

  // Add a state for the selected tower
  const [selectedTower, setSelectedTower] = useState<Tower | null>(null)

  // Move dimensions state up from Arena component
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  // Refs for IDs and timers
  const nextTowerIdRef = useRef(1)
  const nextEnemyIdRef = useRef(1)
  const spawnTimerRef = useRef<NodeJS.Timeout | null>(null)
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null)
  const arenaRef = useRef<HTMLDivElement>(null)

  // Refs to track current game state without re-renders
  const placedTowersRef = useRef<Map<number, PlacedTower>>(new Map())
  const spawnedEnemiesRef = useRef<Map<number, SpawnedEnemy>>(new Map())

  // Add a state to track all encountered threats
  const [encounteredEnemyTypes, setEncounteredEnemyTypes] = useState<string[]>([])

  // Add a state to track reward notifications
  const [rewardNotifications, setRewardNotifications] = useState<
    { amount: number; timestamp: number; enemyName: string; enemyColor: string }[]
  >([])

  // Keep refs in sync with state
  useEffect(() => {
    placedTowersRef.current = placedTowers
  }, [placedTowers])

  useEffect(() => {
    spawnedEnemiesRef.current = spawnedEnemies
  }, [spawnedEnemies])

  // Update active enemy types whenever spawned enemies change
  useEffect(() => {
    const activeTypes = new Set<string>()
    spawnedEnemies.forEach((enemy) => {
      if (enemy.health > 0) {
        activeTypes.add(enemy.id)
      }
    })
    setActiveEnemyTypes(Array.from(activeTypes))
  }, [spawnedEnemies])

  // Update dimensions when arena ref changes or on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (arenaRef.current) {
        const width = arenaRef.current.offsetWidth || 800 // Fallback width
        const height = arenaRef.current.offsetHeight || 400 // Fallback height

        setDimensions({
          width: width > 0 ? width : 800,
          height: height > 0 ? height : 500,
        })
      }
    }

    // Initial update
    updateDimensions()

    // Small delay to ensure DOM is fully rendered
    const timeoutId = setTimeout(updateDimensions, 100)

    // Add resize listener
    window.addEventListener("resize", updateDimensions)

    return () => {
      window.removeEventListener("resize", updateDimensions)
      clearTimeout(timeoutId)
    }
  }, [])

  // Handle selecting a tower
  const handleTowerSelect = (tower: Tower | null) => {
    setSelectedTower(tower)
  }

  // Add a function to place the selected tower
  const handlePlaceTower = (x: number, y: number) => {
    if (selectedTower) {
      // Check if we have enough budget
      if (selectedTower.cost > budget) {
        // Not enough budget - show a notification or feedback
        console.log("Not enough budget to place this tower")
        return
      }

      const instanceId = nextTowerIdRef.current++
      const newTower = createPlacedTower(selectedTower, instanceId, x, y)

      setPlacedTowers((prev) => {
        const updated = new Map(prev)
        updated.set(instanceId, newTower)
        return updated
      })

      // Deduct the cost from the budget
      setBudget((prevBudget) => prevBudget - selectedTower.cost)

      // Automatically deselect the tower after placing it
      setSelectedTower(null)
    }
  }

  // Handle removing a tower from the arena
  const handleRemoveTower = (instanceId: number) => {
    // Get the tower before removing it to refund its cost
    const tower = placedTowers.get(instanceId)

    if (tower) {
      setPlacedTowers((prev) => {
        const updated = new Map(prev)
        updated.delete(instanceId)
        return updated
      })

      // Refund the tower cost (only used for debugging or special cases)
      setBudget((prevBudget) => prevBudget + tower.cost)
    }
  }

  // Spawn a new enemy
  const spawnEnemy = () => {
    // Get a random enemy from the enemyData
    const enemyKeys = Object.keys(enemyData)
    const randomEnemyKey = enemyKeys[Math.floor(Math.random() * enemyKeys.length)]
    const enemy = enemyData[randomEnemyKey]

    const instanceId = nextEnemyIdRef.current++
    const newEnemy = createSpawnedEnemy(enemy, instanceId)

    // Add this enemy type to encountered enemies if not already there
    setEncounteredEnemyTypes((prev) => {
      if (!prev.includes(enemy.id)) {
        return [...prev, enemy.id]
      }
      return prev
    })

    setSpawnedEnemies((prev) => {
      const updated = new Map(prev)
      updated.set(instanceId, newEnemy)
      return updated
    })
    if (threatInfoNeverOpened) {
      setIsThreatPanelOpen(true)
      setThreatInfoNeverOpened(false)
    }
  }

  // Start spawning enemies
  const startSpawnEnemies = () => {
    if (spawnTimerRef.current) return // Already running

    const spawnLoop = () => {
      spawnEnemy()
      // Reduced spawn rate from 3 seconds to 6 seconds
      spawnTimerRef.current = setTimeout(spawnLoop, 6000)
    }

    spawnLoop()
  }

  // Stop spawning enemies
  const stopSpawnEnemies = useCallback(() => {
    if (spawnTimerRef.current) {
      clearTimeout(spawnTimerRef.current)
      spawnTimerRef.current = null
    }
  }, [])

  // Add a reward notification system to show when money is earned
  // First, add a new state for reward notifications
  // Then add a function to add a new reward notification
  const startGameLoop = () => {
    if (gameLoopRef.current) return // Already running

    // Then add a function to add a new reward notification
    const addRewardNotification = (amount: number, enemyName: string, enemyColor: string) => {
      const id = Date.now()
      setRewardNotifications((prev) => [...prev, { amount, timestamp: id, enemyName, enemyColor }])

      // Remove notification after 3 seconds automatically
      setTimeout(() => {
        setRewardNotifications((prev) => prev.filter((n) => n.timestamp !== id))
      }, 3000)
    }

    const gameLoop = () => {
      // Process tower attacks
      setPlacedTowers((currentTowers) => {
        const updatedTowers = new Map(currentTowers)

        // Process each tower
        currentTowers.forEach((tower, towerId) => {
          const now = Date.now()
          // Check if tower can attack (cooldown passed)
          if (now - tower.lastAttackTime < tower.cooldown) {
            return // Skip this tower
          }
  currentTowers.forEach((t2, t2Id) => {
            if(towerId != t2Id){
              const towerX = tower.position.x
              const towerY = tower.position.y
              const t2XPixels = t2.position.x
              const t2YPixels = t2.position.y
              const dx = towerX - t2XPixels
              const dy = towerY - t2YPixels

              const distance = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2))
              const speed = .5
              const inRange = distance <= tower.range/2
              if(inRange){
              
                const moveX = (dx / distance) * speed
                const moveY = (dy / distance) * speed
                updatedTowers.set(towerId, {...tower, position: { ...tower.position, x: tower.position.x + moveX , y: tower.position.y + moveY }})
              }
            }
          })
          // Find enemies in range
          let targetFound = false

          setSpawnedEnemies((currentEnemies) => {
            const updatedEnemies = new Map(currentEnemies)

            // Check each enemy
            currentEnemies.forEach((enemy, enemyId) => {
              // Skip if enemy is already defeated
              if (enemy.health <= 0) return

              // Check if enemy is in range - use arena dimensions for accurate calculation
              const towerX = tower.position.x
              const towerY = tower.position.y
              const enemyXPixels = (enemy.position.x / 100) * dimensions.width
              const enemyYPixels = (enemy.position.y / 100) * dimensions.height

              const distance = Math.sqrt(Math.pow(towerX - enemyXPixels, 2) + Math.pow(towerY - enemyYPixels, 2))

              const inRange = distance <= tower.range

              // Skip if not in range
              if (!inRange) return

              // Check if tower is effective against this enemy
              const isEffective = isTowerEffectiveAgainstEnemy(tower, enemy)

              // Skip if tower is not effective
              if (!isEffective) return

              // Attack the enemy
              targetFound = true

              // Calculate damage based on tower and enemy
              const damage = calculateDamageAgainstEnemy(tower, enemy)

              // Apply effects based on tower type
              const updatedEffects = [...enemy.effects]

              if (tower.effects.includes("burn")) {
                updatedEffects.push(createEffect("burn", 3000, { damage: 5 }))
              }

              if (tower.effects.includes("slow")) {
                updatedEffects.push(createEffect("slow", 2000, { factor: 0.5 }))
              }

              if (tower.effects.includes("block")) {
                updatedEffects.push(createEffect("block", 1500, { factor: 0.3 }))
              }

              if (tower.effects.includes("scan")) {
                // Scanning increases damage from other towers
                updatedEffects.push(createEffect("scan", 4000, { factor: 1.5 }))
              }

              // Check if enemy was just defeated (health went from positive to zero)
              const wasJustDefeated = enemy.health > 0 && enemy.health - damage <= 0

              // Update the enemy with new health and effects
              updatedEnemies.set(enemyId, {
                ...enemy,
                health: Math.max(0, enemy.health - damage),
                effects: updatedEffects,
              })

              // If enemy was just defeated, reward the player with money
              if (wasJustDefeated) {
                // Calculate reward based on enemy severity
                let reward = 0
                switch (enemy.severity) {
                  case "Extreme":
                    reward = 75000
                    break
                  case "High":
                    reward = 45000
                    break
                  case "Medium":
                    reward = 25000
                    break
                  default:
                    reward = 15000
                }

                // Add the reward to the budget
                setBudget((prevBudget) => prevBudget + reward)

                // Show a visual notification of the reward (optional)
                // This would require adding a notification system
                addRewardNotification(reward, enemy.name, enemy.color)
              }
            })

            return updatedEnemies
          })

          // Update tower's last attack time if it attacked
          if (targetFound) {
            updatedTowers.set(towerId, { ...tower, lastAttackTime: now })
          }
        })

        return updatedTowers
      })

      // Process enemy movement and effects
      setSpawnedEnemies((currentEnemies) => {
        const updatedEnemies = new Map()

        // Process each enemy
        currentEnemies.forEach((enemy, enemyId) => {
          // Check if enemy was alive before and is now defeated by effects
          const wasAlive = enemy.health > 0

          // Process effects
          const now = Date.now()
          const updatedEffects = enemy.effects.filter((effect) => {
            // Apply effect damage
            if (effect.type === "burn") {
              enemy.health = Math.max(0, enemy.health - (effect.damage || 0) / 10) // Divide by 10 for smoother damage
            }

            // Keep effect if duration hasn't expired
            return now - (effect.startTime || 0) < effect.duration
          })

          // If enemy was just defeated by effects, reward the player
          if (wasAlive && enemy.health <= 0) {
            // Add reward to budget
            const reward = calculateReward(enemy.severity)
            setBudget((prevBudget) => prevBudget + reward)
            addRewardNotification(reward, enemy.name, enemy.color)
          }

          // Remove defeated enemies
          if (enemy.health <= 0) return

          // Move enemy along its path
          let updatedPosition = { ...enemy.position }
          const updatedPath = [...enemy.path]

          // If there are still points in the path, move towards the next one
          if (updatedPath.length > 1) {
            const targetPoint = updatedPath[1] // Next point in path
            const dx = targetPoint.x - enemy.position.x
            const dy = targetPoint.y - enemy.position.y
            const distance = Math.sqrt(dx * dx + dy * dy)

            // Calculate movement speed (adjust as needed)
            let speed = 0.5 // Base speed in percentage of arena per game loop

            // Apply slow effect if present
            const slowEffect = enemy.effects?.find((effect) => effect.type === "slow")
            if (slowEffect) {
              speed *= slowEffect.factor || 0.5
            }

            // If we're close enough to the target point, remove it from the path
            if (distance < speed) {
              updatedPath.shift() // Remove the first point (current position)
            } else {
              // Move towards the target point
              const moveX = (dx / distance) * speed
              const moveY = (dy / distance) * speed
              updatedPosition = {
                x: enemy.position.x + moveX,
                y: enemy.position.y + moveY,
              }
            }
          }

          // Check if enemy reached the end based on y position (75% of arena height - danger zone)
          const hasReachedEnd = updatedPosition.y >= 75 && !enemy.reachedEnd

          // Update enemy effects and position
          const updatedEnemy = {
            ...enemy,
            position: updatedPosition,
            path: updatedPath,
            effects: updatedEffects,
            reachedEnd: enemy.reachedEnd || hasReachedEnd,
          }

          // Apply damage only when enemy first reaches the end
          if (hasReachedEnd) {
            // Damage the network
            setNetworkHealth((prev) => {
              const damage = calculateEnemyDamage(updatedEnemy.severity)
              const newHealth = Math.max(0, prev - damage)

              // Check for game over
              if (newHealth <= 0) {
                console.log("GAME OVER")
                if (loadedSamples.current.gameover && audioContext)
                  playSample(audioContext, loadedSamples.current.gameover, 0, 0.128)
                setGameOver(true)
                setGameOverReason(`Your network was breached by a ${updatedEnemy.name}`)
                setLastEnemyToBreachDefense(updatedEnemy)
                stopGame()
              }

              return newHealth
            })
          }

          // Keep the enemy in the map
          updatedEnemies.set(enemyId, updatedEnemy)
        })

        return updatedEnemies
      })

      gameLoopRef.current = setTimeout(gameLoop, 150) // Run game loop every 100ms
    }

    gameLoop()
  }

  // Stop the game loop
  const stopGameLoop = useCallback(() => {
    if (gameLoopRef.current) {
      clearTimeout(gameLoopRef.current)
      gameLoopRef.current = null
    }
  }, [])

  // Toggle game state (start/stop)
  const toggleGame = () => {
    if (isGameRunning) {
      stopGame()
    } else {
      startGame()
    }
  }

  // Start the game
  const startGame = () => {
    if (gameOver) {
      // Reset game and clear all towers
      setSpawnedEnemies(new Map())
      setPlacedTowers(new Map()) // Clear all towers
      setNetworkHealth(100)
      setBudget(INITIAL_BUDGET) // Reset budget
      setGameOver(false)
      setGameOverReason("")
      setLastEnemyToBreachDefense(null)
      setEncounteredEnemyTypes([]) // Reset encountered threats
      nextTowerIdRef.current = 1 // Reset tower ID counter
      setRewardNotifications([])
    }

    startSpawnEnemies()
    startGameLoop()
    setIsGameRunning(true)
  }

  // Stop the game
  const stopGame = () => {
    stopSpawnEnemies()
    stopGameLoop()
    setIsGameRunning(false)
  }

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopSpawnEnemies()
      stopGameLoop()
    }
  }, [stopSpawnEnemies, stopGameLoop])

  // Handle keyboard events for deselecting tower with Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedTower) {
        setSelectedTower(null)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [selectedTower])

  // Handle enemy position updates - add this function to the component
  const handleEnemyPositionUpdate = (enemyId: number, position: { x: number; y: number }) => {
    setSpawnedEnemies((prev) => {
      const updated = new Map(prev)
      const enemy = updated.get(enemyId)
      if (enemy) {
        updated.set(enemyId, {
          ...enemy,
          position,
        })
      }
      return updated
    })
  }

  // Format currency for display
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Calculate total spent on towers
  const totalSpent = INITIAL_BUDGET - budget

  // Calculate if we can afford the selected tower
  const canAffordSelectedTower = selectedTower ? budget >= selectedTower.cost : true

  // Debug function to check if towers can attack enemies
  const debugTowerAttacks = () => {
    if (!isGameRunning) return null

    const attacks: {
      tower: string
      enemy: string
      distance: number
      range: number
      health: number
      effective: boolean
    }[] = []

    placedTowers.forEach((tower) => {
      spawnedEnemies.forEach((enemy) => {
        // Calculate tower-to-enemy distance in pixels
        const towerX = tower.position.x
        const towerY = tower.position.y
        const enemyXPixels = (enemy.position.x / 100) * dimensions.width
        const enemyYPixels = (enemy.position.y / 100) * dimensions.height

        const distance = Math.sqrt(Math.pow(towerX - enemyXPixels, 2) + Math.pow(towerY - enemyYPixels, 2))

        const inRange = distance <= tower.range
        const isEffective = isTowerEffectiveAgainstEnemy(tower, enemy)

        // Only include attacks that are both in range AND effective
        if (inRange && isEffective) {
          attacks.push({
            tower: tower.name,
            enemy: enemy.name,
            distance: Math.round(distance),
            range: tower.range,
            health: enemy.health,
            effective: true,
          })
        }
      })
    })

    if (attacks.length === 0) return null

    return (
      <div className="fixed bottom-4 right-4 bg-black/80 text-white rounded-md z-50 max-w-xs overflow-hidden shadow-lg">
        <div className="flex items-center justify-between p-2 bg-gray-700 border-b border-gray-600">
          <div className="flex items-center gap-2">
            <Bug size={16} />
            <h3 className="font-bold text-sm">Active Tower Attacks</h3>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsDebugPanelMinimized(!isDebugPanelMinimized)}
              className="p-1 hover:bg-gray-600 rounded"
            >
              {isDebugPanelMinimized ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            <button onClick={() => setIsDebugPanelMinimized(true)} className="p-1 hover:bg-gray-600 rounded">
              <X size={14} />
            </button>
          </div>
        </div>

        {!isDebugPanelMinimized && (
          <div className="p-2 max-h-40 overflow-auto">
            {attacks.length === 0 ? (
              <p className="text-xs text-gray-400 italic">No effective attacks in range</p>
            ) : (
              attacks.map((attack, i) => (
                <div key={i} className="mb-1 text-xs text-green-400">
                  {attack.tower} → {attack.enemy} ({attack.distance}px / {attack.range}px) [Health:{" "}
                  {attack.health.toFixed(1)}]
                </div>
              ))
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="w-full max-w-screen">
      {/* Network Health and Budget Bar */}
      <div className="sticky top-0 z-50 bg-background pt-2 pb-4 border-b">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Shield size={20} className={networkHealth > 50 ? "text-green-500" : "text-red-500"} />
            <h3 className="font-medium">Network Health</h3>
          </div>
          <span className="font-bold">{networkHealth}%</span>
        </div>
        <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden mb-3">
          <div
            className={`h-full transition-all duration-300 ${
              networkHealth > 70 ? "bg-green-500" : networkHealth > 40 ? "bg-yellow-500" : "bg-red-500"
            }`}
            style={{ width: `${networkHealth}%` }}
          />
        </div>

        {/* Budget display */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Pound size={20} className={budget > INITIAL_BUDGET * 0.3 ? "text-green-500" : "text-red-500"} />
            <h3 className="font-medium">Security Budget</h3>
          </div>
          <div className="text-right">
            <span className="font-bold">{formatCurrency(budget)}</span>
            <span className="text-xs text-muted-foreground ml-1">remaining</span>
          </div>
        </div>
        <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              budget > INITIAL_BUDGET * 0.7
                ? "bg-green-500"
                : budget > INITIAL_BUDGET * 0.3
                  ? "bg-yellow-500"
                  : "bg-red-500"
            }`}
            style={{ width: `${(budget / INITIAL_BUDGET) * 100}%` }}
          />
        </div>

        {/* Show warning if can't afford selected tower */}
        {selectedTower && !canAffordSelectedTower && (
          <div className="mt-2 text-red-500 text-sm flex items-center gap-1">
            <X size={16} />
            <span>
              Cannot afford {selectedTower.name} ({formatCurrency(selectedTower.cost)})
            </span>
          </div>
        )}
      </div>

      <ClientInfo />

      {/* Game control button */}
      <div className="mx-auto flex justify-center items-center my-4">
        <button
          onClick={toggleGame}
          className={`px-4 py-2 rounded-md ${
            isGameRunning ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"
          } text-white font-medium transition-colors`}
        >
          {isGameRunning ? "Stop Attack" : gameOver ? "Restart Game" : "Start Attack"}
        </button>
      </div>

      {/* Main game layout with side panels */}
      <div className="flex flex-row h-[calc(100vh-300px)] min-h-[500px]">
        {/* Left panel - Threats */}
        <div
          className={`bg-card border-r border-border transition-all duration-300 flex flex-col ${
            isThreatPanelOpen ? "w-1/4 min-w-[250px]" : "w-[40px]"
          }`}
        >
          <div
            className={`flex items-center justify-between p-3 bg-destructive text-destructive-foreground cursor-pointer ${
              isThreatPanelOpen ? "flex-row" : "flex-col h-auto"
            }`}
            onClick={() => setIsThreatPanelOpen(!isThreatPanelOpen)}
          >
            {isThreatPanelOpen ? (
              <>
                <h2 className="text-xl font-semibold">
                  Cyber Threats
                  {activeEnemyTypes.length > 0 && (
                    <span className="ml-2 text-sm bg-black/30 px-2 py-0.5 rounded-full">
                      {activeEnemyTypes.length} active
                    </span>
                  )}
                </h2>
                <ChevronLeft size={20} />
              </>
            ) : (
              <>
                <span className="rotate-90 whitespace-nowrap text-xs font-medium">Cyber Threats</span>
                <ChevronRight size={20} className="mt-2" />
              </>
            )}
          </div>

          {isThreatPanelOpen && (
            <div className="flex-1 overflow-auto">
              <ThreatInfo
                threats={Object.values(enemyData)}
                activeThreats={activeEnemyTypes}
                encounteredThreats={encounteredEnemyTypes}
              />
            </div>
          )}
        </div>

        {/* Center - Game Arena */}
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <CanvasArena
            ref={arenaRef}
            placedTowers={Array.from(placedTowers.values())}
            spawnedEnemies={Array.from(spawnedEnemies.values())}
            onPlaceTower={handlePlaceTower}
            onRemoveTower={handleRemoveTower}
            selectedTower={selectedTower}
            onDeselectTower={() => setSelectedTower(null)}
            dimensions={dimensions}
            onEnemyPositionUpdate={handleEnemyPositionUpdate}
          />
        </div>

        {/* Right panel - Towers */}
        <div
          className={`bg-card border-l border-border transition-all duration-300 flex flex-col ${
            isTowerPanelOpen ? "w-1/4 min-w-[250px]" : "w-[40px]"
          }`}
        >
          <div
            className={`flex items-center justify-between p-3 bg-primary text-primary-foreground cursor-pointer ${
              isTowerPanelOpen ? "flex-row" : "flex-col h-auto"
            }`}
            onClick={() => setIsTowerPanelOpen(!isTowerPanelOpen)}
          >
            {isTowerPanelOpen ? (
              <>
                <h2 className="text-xl font-semibold">Defense Towers</h2>
                <ChevronRight size={20} />
              </>
            ) : (
              <>
                <span className="rotate-90 whitespace-nowrap text-xs font-medium">Defense Towers</span>
                <ChevronLeft size={20} className="mt-2" />
              </>
            )}
          </div>

          {isTowerPanelOpen && (
            <div className="flex-1 overflow-auto">
              <TowerPanel
                towers={Object.values(towerData)}
                onSelectTower={handleTowerSelect}
                selectedTowerId={selectedTower?.id || ""}
                budget={budget}
              />
            </div>
          )}
        </div>
      </div>

      {gameOver && <GameOver reason={gameOverReason} enemy={lastEnemyToBreachDefense} onRestart={startGame} />}
      {debugTowerAttacks()}
      {rewardNotifications.map((notification, index) => (
        <div
          key={notification.timestamp + index}
          className="fixed z-50 animate-bounce cursor-pointer transition-opacity hover:opacity-70"
          style={{
            bottom: `${50 + index * 40}px`,
            right: "20px",
            backgroundColor: notification.enemyColor,
            color: "white",
            padding: "8px 12px",
            borderRadius: "8px",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            opacity: 0.9,
          }}
          onClick={() => {
            // Remove this notification when clicked
            setRewardNotifications((prev) => prev.filter((n) => n.timestamp !== notification.timestamp))
          }}
          onMouseEnter={(e) => {
            // Add a data attribute to track hover start time
            e.currentTarget.setAttribute("data-hover-start", Date.now().toString())

            // Set a timeout to dismiss after hovering for 1 second
            const hoverTimeout = setTimeout(() => {
              setRewardNotifications((prev) => prev.filter((n) => n.timestamp !== notification.timestamp))
            }, 1000)

            // Store the timeout ID as a data attribute
            e.currentTarget.setAttribute("data-timeout-id", hoverTimeout.toString())
          }}
          onMouseLeave={(e) => {
            // Clear the timeout when mouse leaves
            const timeoutId = e.currentTarget.getAttribute("data-timeout-id")
            if (timeoutId) {
              clearTimeout(Number.parseInt(timeoutId))
            }
          }}
        >
          <div className="font-bold">+{formatCurrency(notification.amount)}</div>
          <div className="text-xs">Defeated {notification.enemyName}</div>
        </div>
      ))}
    </div>
  )
}

