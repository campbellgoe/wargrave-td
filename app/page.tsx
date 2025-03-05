import TowerDefenseGame from "@/components/tower-defense-game"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4">
      <h1 className="text-3xl font-bold mb-4">Cybersecurity Tower Defense</h1>
      <TowerDefenseGame />
    </main>
  )
}

