import { useEffect } from "react";
import { apiGet } from "./client";
import { useGraphStore, useDashboardStore } from "@/stores";

// ── Graph ──

export function useGraphData() {
  const setGraphData = useGraphStore((s) => s.setGraphData);
  const graphData = useGraphStore((s) => s.graphData);

  useEffect(() => {
    if (!graphData) {
      apiGet<{ nodes: unknown[]; edges: unknown[] }>("/api/graph").then(
        (data) => setGraphData(data)
      );
    }
  }, []);

  return graphData;
}

// ── Dashboard ──

export function useStats() {
  const { stats, setStats, orphans, setOrphans, recent, setRecent } =
    useDashboardStore();

  useEffect(() => {
    if (!stats) {
      apiGet<ReturnType<typeof useDashboardStore.getState>["stats"]>(
        "/api/stats/overview"
      ).then(setStats);
    }
  }, []);

  useEffect(() => {
    if (orphans.length === 0) {
      apiGet<{ orphans: typeof orphans }>("/api/stats/orphans").then((d) =>
        setOrphans(d.orphans)
      );
    }
  }, []);

  useEffect(() => {
    if (recent.length === 0) {
      apiGet<{ recent: typeof recent }>("/api/stats/recent").then((d) =>
        setRecent(d.recent)
      );
    }
  }, []);

  return { stats, orphans, recent };
}
