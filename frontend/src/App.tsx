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
    <div className="flex-1 overflow-auto">
      <div className="max-w-4xl mx-auto p-8 space-y-8">
        <div>
          <h2 className="text-xl font-semibold tracking-tight mb-1">仪表盘</h2>
          <p className="text-sm text-muted-foreground">笔记库概览与统计</p>
        </div>
        <StatsCards />
        <div className="grid grid-cols-2 gap-6">
          <TagCloud />
          <div className="space-y-6">
            <OrphanList />
            <RecentNotes />
          </div>
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
  return <ChatPanel />;
}

function SettingsPlaceholder() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center">
      <p className="text-sm text-muted-foreground">设置将在 P5 中实现</p>
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
