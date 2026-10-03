import { Suspense } from "react";
import { GamePager } from "@/components/GamePager";

export default function ResearchLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Suspense>
        <GamePager />
      </Suspense>
    </>
  );
}
