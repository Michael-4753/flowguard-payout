import { AppShell } from "@/components/shell/app-shell";
import { MilestonesScreen } from "@/components/screens/milestones-screen";

export const metadata = {
  title: "FlowGuard — Milestone workbench",
};

export default function MilestonesPage() {
  return (
    <AppShell>
      <MilestonesScreen />
    </AppShell>
  );
}
