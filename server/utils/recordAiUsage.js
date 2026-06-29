import AiUsageLog from "../models/AiUsageLog.js";
import { estimateOpenAiCostUsd } from "./openaiPricing.js";

/**
 * Persist an AI usage row (non-blocking for callers — errors are logged only).
 */
export async function recordAiUsage(entry) {
  try {
    const promptTokens = Math.max(0, Number(entry.promptTokens) || 0);
    const completionTokens = Math.max(0, Number(entry.completionTokens) || 0);
    const totalTokens =
      entry.totalTokens != null
        ? Math.max(0, Number(entry.totalTokens) || 0)
        : promptTokens + completionTokens;
    const model = String(entry.model || "").trim();
    const estimatedCostUsd =
      entry.estimatedCostUsd != null
        ? Number(entry.estimatedCostUsd)
        : estimateOpenAiCostUsd(model, promptTokens, completionTokens);

    await AiUsageLog.create({
      userId: entry.userId,
      userEmail: entry.userEmail || "",
      endpoint: entry.endpoint || "match-roles",
      model,
      promptTokens,
      completionTokens,
      totalTokens,
      estimatedCostUsd: Number.isFinite(estimatedCostUsd) ? estimatedCostUsd : 0,
      durationMs: Math.max(0, Number(entry.durationMs) || 0),
      status: entry.status || "success",
      finishReason: entry.finishReason ?? null,
      openaiRequestId: entry.openaiRequestId ?? null,
      filteredRoleCount: entry.filteredRoleCount ?? null,
      promptVersion: entry.promptVersion || "",
      errorMessage: entry.errorMessage ? String(entry.errorMessage).slice(0, 500) : null,
    });
  } catch (err) {
    console.error("[recordAiUsage]", err);
  }
}
