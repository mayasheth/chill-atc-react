import { Outlet } from "react-router-dom";
import { AppFooter } from "@/components/panels";

export default function RootLayout() {
  return (
    <div className="flex min-h-dvh flex-col items-center bg-surface-0">
      <main className="flex-1">
        <Outlet />
      </main>
      <AppFooter />
    </div>
  );
}
