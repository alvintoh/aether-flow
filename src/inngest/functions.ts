import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import * as Sentry from "@sentry/node";
import { generateText } from "ai";

import { inngest } from "./client";

const google = createGoogleGenerativeAI();
const openai = createOpenAI();
const anthropic = createAnthropic();

const sentryExperimentalTelemetry = {
  isEnabled: true,
  functionId: "joke_agent",
  recordInputs: true,
  recordOutputs: true,
};

export const execute = inngest.createFunction(
  { id: "execute", triggers: { event: "execute/ai" } },
  async ({ step }) => {
    const geminiModel = process.env.GOOGLE_MODEL;
    const openAIModel = process.env.OPENAI_MODEL;
    const anthropicModel = process.env.ANTHROPIC_MODEL;

    Sentry.logger.info("User triggered test log", {
      log_source: "sentry_test",
    });

    const geminiSteps = geminiModel
      ? await step.ai.wrap("gemini-generate-text", generateText, {
          model: google(geminiModel),
          system: "You are a helpful assistant.",
          prompt: "What is 2 + 2?",
          experimental_telemetry: sentryExperimentalTelemetry,
        })
      : undefined;

    const openaiSteps = openAIModel
      ? await step.ai.wrap("openai-generate-text", generateText, {
          model: openai(openAIModel),
          system: "You are a helpful assistant.",
          prompt: "What is 2 + 2?",
          experimental_telemetry: sentryExperimentalTelemetry,
        })
      : undefined;

    const anthropicSteps = anthropicModel
      ? await step.ai.wrap("anthropic-generate-text", generateText, {
          model: anthropic(anthropicModel),
          system: "You are a helpful assistant.",
          prompt: "What is 2 + 2?",
          experimental_telemetry: sentryExperimentalTelemetry,
        })
      : undefined;

    return {
      geminiSteps,
      openaiSteps,
      anthropicSteps,
    };
  },
);
