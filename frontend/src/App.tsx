import { Sidebar } from "@/components/Layout/Sidebar";
import { GraphCanvas } from "@/components/GraphView/GraphCanvas";
import { StatsCards } from "@/components/Dashboard/StatsCards";
import { TagCloud } from "@/components/Dashboard/TagCloud";
import { OrphanList } from "@/components/Dashboard/OrphanList";
import { RecentNotes } from "@/components/Dashboard/RecentNotes";
import { ChatPanel } from "@/components/ChatPanel/ChatPanel";
import { useNavStore } from "@/stores";

function DashboardView() {
  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      <h2 className="text-lg font-semibold">仪表盘</h2>
      <StatsCards />
      <div className="grid grid-cols-2 gap-4">
        <TagCloud />
        <div className="space-y-4">
          <OrphanList />
          <RecentNotes />
        </div>
      </div>
    </div>
  );
}

function GraphView() {
  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1">
        <GraphCanvas />
      </div>
    </div>
  );
}

function ChatView() {
  return (
    <div className="flex-1 flex flex-col">
      <ChatPanel />
    </div>
  );
}

function SettingsPlaceholder() {
  return (
    <div className="flex-1 flex items-center justify-center text-muted-foreground">
      <p>设置功能将在 P5 实现</p>
    </div>
  );
}

const views = {
  graph: GraphView,
  dashboard: DashboardView,
  chat: ChatView,
  settings: SettingsPlaceholder,
};

function App() {
  const view = useNavStore((s) => s.view);
  const ViewComponent = views[view];

  return (
    <div className="h-screen flex bg-background">
      <Sidebar />
      <ViewComponent />
    </div>
  );
}

export default App;
