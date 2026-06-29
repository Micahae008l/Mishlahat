import {
  fail,
  ok,
  parseOptionalIntInRange,
  parseString,
  requirePlainObject,
} from "../utils/sanitize.js";

const VALID_SLUGS_PATTERN = /^[a-z0-9-]{2,100}$/;

export function validateCreateReview(req) {
  const bodyResult = requirePlainObject(req.body, "body");
  if (!bodyResult.ok) return bodyResult;

  const allowedTop = ["roleSlug", "roleTitle", "rating", "difficulty", "wouldRecommend", "pros", "cons", "tip"];
  for (const key of Object.keys(bodyResult.value)) {
    if (!allowedTop.includes(key)) return fail(`Unknown field: ${key}`);
  }

  const slugRaw = bodyResult.value.roleSlug;
  if (typeof slugRaw !== "string" || !VALID_SLUGS_PATTERN.test(slugRaw)) {
    return fail("roleSlug is invalid");
  }

  const titleResult = parseString(bodyResult.value.roleTitle, {
    maxLen: 200,
    minLen: 1,
    label: "roleTitle",
  });
  if (!titleResult.ok) return titleResult;

  const ratingResult = parseOptionalIntInRange(bodyResult.value.rating, {
    min: 1,
    max: 5,
    label: "rating",
  });
  if (!ratingResult.ok) return ratingResult;
  if (ratingResult.value == null) return fail("rating is required");

  const difficultyResult = parseOptionalIntInRange(bodyResult.value.difficulty, {
    min: 1,
    max: 5,
    label: "difficulty",
  });
  if (!difficultyResult.ok) return difficultyResult;
  if (difficultyResult.value == null) return fail("difficulty is required");

  if (typeof bodyResult.value.wouldRecommend !== "boolean") {
    return fail("wouldRecommend must be a boolean");
  }

  const sanitized = {
    roleSlug: slugRaw,
    roleTitle: titleResult.value,
    rating: ratingResult.value,
    difficulty: difficultyResult.value,
    wouldRecommend: bodyResult.value.wouldRecommend,
    pros: "",
    cons: "",
    tip: "",
  };

  for (const textKey of ["pros", "cons", "tip"]) {
    if (bodyResult.value[textKey] !== undefined) {
      const t = parseString(bodyResult.value[textKey], {
        maxLen: 500,
        label: textKey,
        allowEmpty: true,
      });
      if (!t.ok) return t;
      sanitized[textKey] = t.value;
    }
  }

  req.body = sanitized;
  return { ok: true };
}
