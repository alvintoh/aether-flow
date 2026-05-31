import type { NodeTypes } from "@xyflow/react";

import { InitialNode } from "@/features/editor/components/initial-node";
import { NodeType } from "@/generated/prisma/enums";

export const nodeComponents = {
  [NodeType.INITIAL]: InitialNode,
} as const satisfies NodeTypes;

export type RegisteredNodeType = keyof typeof nodeComponents;
