"use client";

import type { NodeProps } from "@xyflow/react";
import { PlusIcon } from "lucide-react";
import { memo } from "react";

import { PlaceholderNode } from "./react-flow/placeholder-node";

export const InitialNode = memo((_props: NodeProps) => {
  return (
    <PlaceholderNode>
      <div className="cursor-pointer flex items-center justify-center">
        <PlusIcon className="size-4" />
      </div>
    </PlaceholderNode>
  );
});
