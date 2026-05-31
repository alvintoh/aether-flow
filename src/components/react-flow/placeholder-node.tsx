"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { forwardRef, type ReactNode } from "react";

import { BaseNode } from "@/components/react-flow/base-node";

export type PlaceholderNodeProps = Partial<NodeProps> & {
  children?: ReactNode;
  onClick?: () => void;
};

export const PlaceholderNode = forwardRef<HTMLDivElement, PlaceholderNodeProps>(
  ({ children, onClick }, ref) => {
    return (
      <BaseNode
        className="w-auto h-auto border-dashed border-gray-400 p-2 text-center text-gray-400 shadow-none cursor-pointer hover:border-gray-500 hover:bg-gray-50"
        onClick={onClick}
        ref={ref}
      >
        {children}
        <Handle
          type="target"
          style={{ visibility: "hidden" }}
          position={Position.Top}
          isConnectable={false}
        />
        <Handle
          type="source"
          style={{ visibility: "hidden" }}
          position={Position.Bottom}
          isConnectable={false}
        />
      </BaseNode>
    );
  },
);
