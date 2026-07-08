import { Outlet } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";
import { BottomNav } from "@/components/app/bottom-nav";

export const Route = createFileRoute("/_app")({
  component: AppShell,
});

function AppShell() {
  return (
    <div className="min-h-screen bg-surface">
      <div className="mx-auto min-h-screen max-w-md pb-24">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  );
}
