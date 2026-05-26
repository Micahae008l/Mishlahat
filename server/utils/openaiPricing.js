/** USD per 1M tokens — override via env for model-specific pricing. */
const DEFAULT_INPUT_PER_1M = 2.5;
const DEFAULT_OUTPUT_PER_1M = 10;

function envNum(key, fallback) {
  const raw = process.env[key];
  if (raw == null || raw === "") return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

export function estimateOpenAiCostUsd(model, promptTokens, completionTokens) {
  const inputPer1M = envNum("AI_PRICE_INPUT_PER_1M", DEFAULT_INPUT_PER_1M);
  const outputPer1M = envNum("AI_PRICE_OUTPUT_PER_1M", DEFAULT_OUTPUT_PER_1M);
  const prompt = Math.max(0, Number(promptTokens) || 0);
  const completion = Math.max(0, Number(completionTokens) || 0);
  const cost =
    (prompt / 1_000_000) * inputPer1M + (completion / 1_000_000) * outputPer1M;
  return Math.round(cost * 1_000_000) / 1_000_000;
}

export function pricingMeta() {
  return {
    inputPer1M: envNum("AI_PRICE_INPUT_PER_1M", DEFAULT_INPUT_PER_1M),
    outputPer1M: envNum("AI_PRICE_OUTPUT_PER_1M", DEFAULT_OUTPUT_PER_1M),
    note: "Estimated from token counts; historical calls before tracking are not included.",
  };
}
