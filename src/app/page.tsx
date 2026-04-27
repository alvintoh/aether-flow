"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useTRPC } from "@/trpc/client";

import { LogoutButton } from "./logout";

export default function Page() {
  const trpc = useTRPC();
  const { data } = useQuery(trpc.workflows.getMany.queryOptions());

  const create = useMutation(
    trpc.workflows.create.mutationOptions({
      onSuccess: () => {
        toast.success("Workflow created");
      },
      onError: (error) => {
        toast.error(`Error: ${error.message}`);
      },
    }),
  );

  return (
    <div className="min-h-screen min-w-screen flex items-center justify-center flex-col gap-y-6">
      protected server component
      <div>{JSON.stringify(data, null, 2)}</div>
      <Button disabled={create.isPending} onClick={() => create.mutate()}>
        Create workflow
      </Button>
      <LogoutButton />
    </div>
  );
}
