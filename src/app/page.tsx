"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useTRPC } from "@/trpc/client";

import { LogoutButton } from "./logout";

const Page = () => {
  const trpc = useTRPC();
  const { data } = useQuery(trpc.getWorkflows.queryOptions());

  const testAI = useMutation(
    trpc.testAI.mutationOptions({
      onSuccess: () => {
        toast.success("AI Job queued");
      },
      onError: (error) => {
        toast.error(`Error: ${error.message}`);
      },
    }),
  );

  const create = useMutation(
    trpc.createWorkflow.mutationOptions({
      onSuccess: () => {
        toast.success("Job queued");
      },
    }),
  );

  return (
    <div className="min-h-screen min-w-screen flex items-center justify-center flex-col gap-y-6">
      protected server component
      <div>{JSON.stringify(data, null, 2)}</div>
      <Button disabled={testAI.isPending} onClick={() => testAI.mutate()}>
        Test AI
      </Button>
      <Button disabled={create.isPending} onClick={() => create.mutate()}>
        Create workflow
      </Button>
      <LogoutButton />
    </div>
  );
};

export default Page;
