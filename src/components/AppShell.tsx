import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { BottomNav } from "./BottomNav";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-background">
      <motion.main
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="flex-1 px-5 safe-top pb-32"
      >
        {children}
      </motion.main>
      <BottomNav />
    </div>
  );
}
