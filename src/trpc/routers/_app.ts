import { inngest } from "@/inngest/client";
import prisma from "@/lib/db";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { baseProcedure, createTRPCRouter, protectedProcedure } from "../init";

export const appRouter = createTRPCRouter({
  testAI: baseProcedure.mutation(async () => {
    const { text } = await generateText({
      model: google(process.env.GOOGLE_MODEL ?? "gemini-2.5-flash"),
      prompt: "Write a vegetarian lasagna recipe for 4 people.",
    });

    return { text };
  }),

  getWorkflows: protectedProcedure.query(() => {
    return prisma.workflow.findMany({});
  }),
  createWorkflow: protectedProcedure.mutation(async () => {
    await inngest.send({
      name: "test/hello.world",
      data: {
        email: "test@example.com",
      },
    });

    return { success: true, message: "Job queued" };
  }),
});
// export type definition of API
export type AppRouter = typeof appRouter;
