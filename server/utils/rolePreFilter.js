/**
 * Pre-filters the 302-role catalog down to ~30-50 best candidates
 * based on hard profile constraints, so the AI reasons over a focused set.
 *
 * Each surviving role also carries `_factors` — short Hebrew explanations of
 * the deterministic signals that raised its score, so the UI can show
 * data-grounded "why" chips alongside the AI's free-text reasoning.
 */

const FOCUS_TO_TAGS = {
  Tech: ["coding", "software", "cyber", "networks", "it", "data", "ai", "electronics", "hardware", "devops", "qa"],
  Physical: ["combat", "fitness", "fieldwork", "rescue", "driving", "construction", "mechanics"],
  Research: ["intelligence", "research", "data", "maps", "visual-analysis", "math", "physics", "attention-to-detail"],
  Medical: ["medicine", "emergency", "dentistry", "lab", "biology", "chemistry", "helping-people"],
};

const FOCUS_LABEL_HE = {
  Tech: "טכנולוגי",
  Physical: "פיזי/שטח",
  Research: "מחקרי",
  Medical: "רפואי",
};

const COMBAT_PREF_WANTS_COMBAT = new Set(["Kravi", "FieldCombat", "Mixed"]);
const COMBAT_PREF_NO_COMBAT = new Set(["Jobnik", "SupportHQ", "TechTrack", "MedicalInstruction"]);

/**
 * @param {object[]} roles  - Full catalog roles array
 * @param {object} stats    - { daparScore, medicalProfile }
 * @param {object} prefs    - { combatPreference, focus, physicalActivityLevel }
 * @param {object} yom      - Migrated 12-key yom hameah object
 * @returns {object[]}      - Filtered + scored roles (top ~40), each with _score and _factors
 */
export function preFilterRoles(roles, stats, prefs, yom) {
  if (!roles?.length) return roles;

  const { daparScore, medicalProfile } = stats;
  const combat = prefs?.combatPreference;
  const focus = prefs?.focus;
  const physical = prefs?.physicalActivityLevel;

  const focusTags = new Set(FOCUS_TO_TAGS[focus] || []);
  const wantsCombat = COMBAT_PREF_WANTS_COMBAT.has(combat);
  const noCombat = COMBAT_PREF_NO_COMBAT.has(combat);

  const scored = [];

  for (const role of roles) {
    let score = 0;
    let eligible = true;
    const factors = [];

    // Hard medical filter: profile < 64 can't do combat roles
    if (role.combat && medicalProfile < 64) {
      eligible = false;
    }
    // Profile < 72 makes combat roles unlikely — heavy penalty
    if (role.combat && medicalProfile < 72) {
      score -= 15;
      factors.push(`פרופיל רפואי ${medicalProfile} מקשה על תפקיד קרבי`);
    }

    if (!eligible) continue;

    // Combat preference alignment
    if (role.combat && wantsCombat) {
      score += 12;
      factors.push("מתאים להעדפה שלך לשירות קרבי/שטח");
    }
    if (role.combat && noCombat) score -= 20;
    if (!role.combat && noCombat) {
      score += 8;
      factors.push("תואם את ההעדפה שלך לשירות עורפי");
    }
    if (!role.combat && wantsCombat) score -= 5;

    // Focus tag matching
    const tags = role.preferenceTags || [];
    let tagHits = 0;
    for (const t of tags) {
      if (focusTags.has(t)) tagHits++;
    }
    score += tagHits * 6;
    if (tagHits > 0 && FOCUS_LABEL_HE[focus]) {
      factors.push(`תואם את המיקוד ה${FOCUS_LABEL_HE[focus]} שבחרת`);
    }

    // DAPAR alignment
    const highDapar = daparScore >= 65;
    const techTags = tags.some(t => ["coding", "software", "cyber", "ai", "data", "intelligence", "research"].includes(t));
    if (highDapar && techTags) {
      score += 8;
      factors.push(`דפ״ר ${daparScore} פותח מסלולים טכנולוגיים/מודיעיניים`);
    }
    if (highDapar && role.selective) {
      score += 4;
      factors.push(`דפ״ר ${daparScore} מתאים לתפקיד סלקטיבי`);
    }
    if (!highDapar && techTags && role.selective) score -= 8;

    // Physical activity alignment
    if (physical === "High" && role.combat) {
      score += 5;
      factors.push("רמת הכושר הגבוהה שלך מתאימה לדרישות הפיזיות");
    }
    if (physical === "Low" && role.combat) score -= 8;
    if (physical === "Low" && !role.combat) score += 3;

    // Yom Hameah dimension alignment (if available)
    if (yom) {
      // Technical roles benefit from high technical scores
      if (techTags && yom.technicalActivation >= 4) {
        score += 4;
        factors.push(`הפעלה טכנית גבוהה במא״ה (${yom.technicalActivation}/5)`);
      }
      if (techTags && yom.dataProcessing >= 4) {
        score += 3;
        factors.push(`עיבוד מידע גבוה במא״ה (${yom.dataProcessing}/5)`);
      }

      // Command/leadership roles
      if (tags.includes("leadership") && yom.command >= 4) {
        score += 5;
        factors.push(`ציון פיקוד גבוה במא״ה (${yom.command}/5)`);
      }
      if (tags.includes("leadership") && yom.command <= 2) score -= 5;

      // Teaching roles
      if (tags.includes("teaching") && yom.instruction >= 4) {
        score += 5;
        factors.push(`ציון הדרכה גבוה במא״ה (${yom.instruction}/5)`);
      }
      if (tags.includes("teaching") && yom.instruction <= 2) score -= 4;

      // People-facing roles
      const peopleTags = tags.some(t => ["helping-people", "welfare", "psychology", "hr"].includes(t));
      if (peopleTags && yom.interpersonalCare >= 4) {
        score += 4;
        factors.push(`יחסים בין־אישיים חזקים במא״ה (${yom.interpersonalCare}/5)`);
      }
      if (peopleTags && yom.interpersonalCare <= 2) score -= 3;

      // Attention-intensive roles
      if (tags.includes("attention-to-detail") && yom.sustainedAttention >= 4) {
        score += 3;
        factors.push(`קשב מתמשך גבוה במא״ה (${yom.sustainedAttention}/5)`);
      }

      // Management roles
      if (tags.some(t => ["operations", "war-room", "logistics", "admin"].includes(t)) && yom.managementOrganization >= 4) {
        score += 4;
        factors.push(`ניהול וארגון גבוהים במא״ה (${yom.managementOrganization}/5)`);
      }

      // Field/spatial roles
      if (tags.includes("fieldwork") && yom.spatialPerception >= 4) {
        score += 3;
        factors.push(`תפיסה מרחבית גבוהה במא״ה (${yom.spatialPerception}/5)`);
      }

      // High diligence benefits selective/long-course roles
      if (role.selective && yom.diligencePersistence >= 4) {
        score += 3;
        factors.push(`השקעה והתמדה גבוהות — יתרון בקורסים ארוכים`);
      }
      if (role.selective && yom.diligencePersistence <= 2) score -= 3;

      // Discipline for sensitive environments
      if (tags.some(t => ["intelligence", "cyber"].includes(t)) && yom.disciplineMaturity >= 4) {
        score += 3;
        factors.push(`בגרות והתנהגות מסגרתית גבוהות — חשוב בסביבות רגישות`);
      }
    }

    // Validation quality bonus
    if (role.validationLevel === "official_public_validated") score += 2;
    if (role.validationLevel === "official_family_validated") score += 1;

    scored.push({ ...role, _score: score, _factors: factors.slice(0, 4) });
  }

  // Sort by score descending, take top 40
  scored.sort((a, b) => b._score - a._score);
  const topN = Math.min(40, scored.length);
  return scored.slice(0, topN);
}
