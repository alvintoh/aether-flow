import type { inferInput } from "@trpc/tanstack-react-query";

import { prefetch, trpc } from "@/trpc/server";

type Input = inferInput<typeof trpc.workflows.getMany>;

/**
 * Prefetch all workflows
 */
export function prefetchWorkflows(params: Input) {
  return prefetch(trpc.workflows.getMany.queryOptions(params));
}

/**
 * Prefetch a single workflow
 */
export function prefetchWorkflow(id: string) {
  return prefetch(trpc.workflows.getOne.queryOptions({ id }));
}
