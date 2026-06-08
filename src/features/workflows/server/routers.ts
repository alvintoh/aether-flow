import type { Edge, Node } from "@xyflow/react";
import { and, count, eq, ilike } from "drizzle-orm";
import { generateSlug } from "random-word-slugs";
import { z } from "zod";

import { PAGINATION } from "@/config/constants";
import { node, workflow } from "@/db/schema";
import { db } from "@/lib/db";
import { TRPCError } from "@trpc/server";

import {
  createTRPCRouter,
  premiumProcedure,
  protectedProcedure,
} from "@/trpc/init";

export const workflowsRouter = createTRPCRouter({
  create: premiumProcedure.mutation(async ({ ctx }) => {
    const [wf] = await db
      .insert(workflow)
      .values({
        name: generateSlug(3),
        userId: ctx.auth.user.id,
      })
      .returning();

    await db.insert(node).values({
      workflowId: wf.id,
      type: "INITIAL",
      name: "INITIAL",
      position: { x: 0, y: 0 },
    });

    return wf;
  }),

  remove: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [deleted] = await db
        .delete(workflow)
        .where(
          and(eq(workflow.id, input.id), eq(workflow.userId, ctx.auth.user.id)),
        )
        .returning();
      return deleted;
    }),

  updateName: protectedProcedure
    .input(z.object({ id: z.string(), name: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const [updated] = await db
        .update(workflow)
        .set({ name: input.name })
        .where(
          and(eq(workflow.id, input.id), eq(workflow.userId, ctx.auth.user.id)),
        )
        .returning();
      return updated;
    }),

  getOne: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const wf = await db.query.workflow.findFirst({
        where: (t, { and, eq }) =>
          and(eq(t.id, input.id), eq(t.userId, ctx.auth.user.id)),
        with: { nodes: true, connections: true },
      });

      if (!wf) throw new TRPCError({ code: "NOT_FOUND" });

      const nodes: Node[] = wf.nodes.map((n) => ({
        id: n.id,
        type: n.type,
        position: n.position as { x: number; y: number },
        data: (n.data as Record<string, unknown>) || { label: n.name },
      }));

      const edges: Edge[] = wf.connections.map((c) => ({
        id: c.id,
        source: c.fromNodeId,
        target: c.toNodeId,
        sourceHandle: c.fromOutput,
        targetHandle: c.toInput,
      }));

      return { id: wf.id, name: wf.name, nodes, edges };
    }),

  getMany: protectedProcedure
    .input(
      z.object({
        page: z.number().default(PAGINATION.DEFAULT_PAGE),
        pageSize: z
          .number()
          .min(PAGINATION.MIN_PAGE_SIZE)
          .max(PAGINATION.MAX_PAGE_SIZE)
          .default(PAGINATION.DEFAULT_PAGE_SIZE),
        search: z.string().default(""),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { page, pageSize, search } = input;

      const whereClause = and(
        eq(workflow.userId, ctx.auth.user.id),
        search ? ilike(workflow.name, `%${search}%`) : undefined,
      );

      const [items, [{ value: totalCount }]] = await Promise.all([
        db.query.workflow.findMany({
          where: () => whereClause,
          limit: pageSize,
          offset: (page - 1) * pageSize,
          orderBy: (t, { desc }) => desc(t.updatedAt),
        }),
        db.select({ value: count() }).from(workflow).where(whereClause),
      ]);

      const totalPages = Math.ceil(totalCount / pageSize);

      return {
        items,
        page,
        pageSize,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      };
    }),
});
