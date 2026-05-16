import { Sidebar } from "./components/Layout/Sidebar";
import { GraphCanvas } from "./components/GraphView/GraphCanvas";
import { StatsCards } from "./components/Dashboard/StatsCards";
import { ChatPanel } from "./components/ChatPanel/ChatPanel";

function App() {
  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 flex flex-col">
        <div className="flex-1">
          <GraphCanvas />
        </div>
        <div className="border-t p-4">
          <StatsCards />
        </div>
      </main>
      <div className="w-96">
        <ChatPanel />
      </div>
    </div>
  );
}

export default App;
