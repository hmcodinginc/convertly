import { cn } from "@/lib/utils"

function App() {
  return (
    <main className={cn(
      "min-h-screen",
      "bg-black",
      "text-white",
      "flex",
      "items-center",
      "justify-center"
    )}>
      <div className="text-center">
        <h1 className="text-6xl font-bold tracking-tight">
          Convertly
        </h1>

        <p className="mt-4 text-zinc-400">
          AI-powered website growth audits
        </p>
      </div>
    </main>
  )
}

export default App