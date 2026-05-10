import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { WorkflowsList } from "@/features/workflows/components/workflows";
import { prefetchWorkflows } from "@/features/workflows/server/prefetch";
import { HydrateClient } from "@/trpc/server";

export default function Page() {
  prefetchWorkflows();

  return (
    <HydrateClient>
      <ErrorBoundary fallback={<p>Something went wrong</p>}>
        <Suspense fallback={<p>Loading...</p>}>
          <WorkflowsList />
        </Suspense>
      </ErrorBoundary>
    </HydrateClient>
  );
}
