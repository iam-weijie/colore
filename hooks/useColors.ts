import { fetchAPI } from "@/lib/fetch";
import { PostItColor } from "@/types/type";

/** ------------------- Utilities ------------------- **/

// Safe log1p with scalar weight
const lg = (x: number, w = 1) => w * Math.log1p(Math.max(0, x));

// Normalized Shannon entropy for a string array (e.g., color ids)
const normalizedEntropy = (items: string[]) => {
  if (!items?.length) return 0;
  const counts = new Map<string, number>();
  for (const c of items) counts.set(c, (counts.get(c) ?? 0) + 1);
  const N = items.length;
  const k = counts.size;
  if (k <= 1) return 0;
  let H = 0;
  counts.forEach((n) => {
    const p = n / N;
    H -= p * Math.log(p);
  });
  return H / Math.log(k); // [0,1]
};

// Simple Bayesian average for rates: (sum + C*m) / (n + C)
const bayesAverage = (sum: number, n: number, m = 0.5, C = 10) =>
  (Math.max(0, sum) + C * m) / (Math.max(0, n) + C);

// Sum SRB “zero” baselines from unlocked colors
const sumSRBZeroes = (userColors: PostItColor[] = []) => {
  let s0 = 0, r0 = 0, b0 = 0;
  for (const c of userColors) {
    if (!c?.SRB) continue;
    s0 += c.SRB[0] ?? 0; // S (Blue)
    r0 += c.SRB[1] ?? 0; // R (Pink)
    b0 += c.SRB[2] ?? 0; // B (Yellow)
  }
  return { s0, r0, b0 };
};

// Trust: compress total activity into [0,100] with a smooth logistic
const logistic100 = (x: number, k = 0.02, mid = 200) =>
  Math.round(100 / (1 + Math.exp(-k * (x - mid))));

/** ---------- Tiered soft-cap & anti-dominance helpers ---------- **/

// Piecewise soft cap: linear -> mild log -> strong log (harder per tier)
const softCapTiered = (
  x: number,
  t1: number,
  t2: number,
  a1: number,
  a2: number,
  k1: number,
  k2: number,
  maxCap: number
) => {
  const v = Math.max(0, x);
  if (v <= t1) return v;
  if (v <= t2) return t1 + a1 * Math.log1p((v - t1) / k1) * k1;
  const tier2Gain = a1 * Math.log1p((t2 - t1) / k1) * k1;
  const tier3Gain = a2 * Math.log1p((v - t2) / k2) * k2;
  return Math.min(t1 + tier2Gain + tier3Gain, maxCap);
};

// Herfindahl–Hirschman Index (concentration). 1/3 ≤ HHI ≤ 1 for 3 buckets.
const hhi = (p: number[]) => p.reduce((s, x) => s + x * x, 0);

// Blend toward uniform if too concentrated. λ_max limits how far we nudge.
const blendTowardUniformByHHI = (p: number[], lambdaMax = 0.45) => {
  const H = hhi(p);
  const Hmin = 1 / p.length; // 1/3
  const lambda = Math.max(0, Math.min(1, (H - Hmin) / (1 - Hmin))) * lambdaMax;
  const u = 1 / p.length;
  const blended = p.map((pi) => (1 - lambda) * pi + lambda * u);
  const sum = blended.reduce((s, x) => s + x, 0) || 1;
  return blended.map((x) => x / sum);
};

// Hard cap on max share (e.g., 70%). Redistribute the excess proportionally.
const capMaxShare = (p: number[], maxShare = 0.7) => {
  let arr = [...p];
  let changed = false;
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] > maxShare) {
      const excess = arr[i] - maxShare;
      arr[i] = maxShare;
      const othersIdx = arr.map((_, j) => j).filter((j) => j !== i);
      const othersSum = othersIdx.reduce((s, j) => s + arr[j], 0) || 1;
      for (const j of othersIdx) arr[j] += (arr[j] / othersSum) * excess;
      changed = true;
    }
  }
  if (!changed) return arr;
  const sum = arr.reduce((s, x) => s + x, 0) || 1;
  return arr.map((x) => x / sum);
};

/** ------------------- Tunable weights ------------------- **/
const WEIGHTS = {
  // Blue (creation/contribution)
  boardJoined: 1.2,
  postReceived: 1.6,
  promptMade: 1.8,
  boardMade: 2.5,
  // Yellow (engagement)
  likesScale: 1.0,
  commentsScale: 2.0,
  answersScale: 3.0,
  // Pink (customization/expression)
  emoji: 1.2,
  formatting: 1.8,
  likedPost: 1.0,
  savedPost: 2.2,
  nicknameBonus: 5,
};

// Default tier caps if API not configured yet
const DEFAULT_TIERS = {
  blue:   { t1: 120, t2: 300, a1: 0.75, a2: 0.35, k1: 15, k2: 30, maxCap: 900 },
  yellow: { t1: 100, t2: 250, a1: 0.70, a2: 0.30, k1: 12, k2: 24, maxCap: 900 },
  pink:   { t1: 110, t2: 280, a1: 0.72, a2: 0.32, k1: 14, k2: 28, maxCap: 900 },
};

// (Optional) fetch cohort-based tier caps (e.g., percentiles) from your backend
const getTierCaps = async () => {
  try {
    const resp = await fetchAPI(`/api/colors/getTierCaps`); // return { blue:{...}, yellow:{...}, pink:{...} }
    if (resp?.blue && resp?.yellow && resp?.pink) return resp;
  } catch (_) {}
  return DEFAULT_TIERS;
};

/** ------------------- Blue ------------------- **/
export const calculateBlue = async (userId: string): Promise<number> => {
  try {
    const {
      totalPostMade = 0,
      totalPostReceived = 0,
      totalPostContentLength = 0,
      totalBoardMade = 0,
      totalBoardJoined = 0,
      totalPromptMade = 0,
    } = await fetchAPI(`/api/colors/getAllBlueConfig?userId=${userId}`);

    const avgLen = totalPostMade ? totalPostContentLength / totalPostMade : 0;
    const lengthFactor = lg(avgLen, 1);      // quality
    const volumeFactor = lg(totalPostMade, 2.5); // quantity
    const weightedPosts = 18 * lengthFactor * Math.max(1, volumeFactor);

    const weighted =
      weightedPosts +
      WEIGHTS.boardJoined * totalBoardJoined +
      WEIGHTS.postReceived * totalPostReceived +
      WEIGHTS.promptMade * totalPromptMade +
      WEIGHTS.boardMade * totalBoardMade;

    return Number.isFinite(weighted) ? weighted : 0;
  } catch (e) {
    console.error("Blue calc failed", e);
    return 0;
  }
};

/** ------------------- Yellow ------------------- **/
export const calculateYellow = async (userId: string): Promise<number> => {
  try {
    const {
      totalLikesReceived = 0,
      totalCommentsReceived = 0,
      totalPromptAnswersReceived = 0,
    } = await fetchAPI(`/api/colors/getAllYellowConfig?userId=${userId}`);

    const raw = {
      likes: Math.max(0, totalLikesReceived),
      comments: Math.max(0, totalCommentsReceived),
      answers: Math.max(0, totalPromptAnswersReceived),
    };

    const bl = bayesAverage(raw.likes, raw.likes + raw.comments, 0.5, 10);
    const bc = bayesAverage(raw.comments, raw.likes + raw.comments, 0.5, 10);
    const ba = bayesAverage(raw.answers, raw.answers + raw.comments, 0.5, 6);

    const score =
      10 *
      (WEIGHTS.likesScale * lg(raw.likes) * bl +
        WEIGHTS.commentsScale * lg(raw.comments) * bc +
        WEIGHTS.answersScale * lg(raw.answers) * ba);

    return Number.isFinite(score) ? score : 0;
  } catch (e) {
    console.error("Yellow calc failed", e);
    return 0;
  }
};

/** ------------------- Pink ------------------- **/
export const calculatePink = async (userId: string): Promise<number> => {
  try {
    const {
      totalBoards = 0,
      totalEmoji = 0,
      totalFormattingPost = 0,
      nicknameDiffers = false,
      totalLikedPost = 0,
      totalSavedPost = 0,
      colorsUsed = [],
    } = await fetchAPI(`/api/colors/getAllPinkConfig?userId=${userId}`);

    const H = normalizedEntropy(colorsUsed);
    const varietyBoost = 10 * H * lg(colorsUsed.length || 0, 1);

    const base =
      totalBoards +
      WEIGHTS.emoji * lg(totalEmoji, 1.2) +
      WEIGHTS.formatting * lg(totalFormattingPost, 1.2) +
      WEIGHTS.likedPost * lg(totalLikedPost, 1.0) +
      WEIGHTS.savedPost * lg(totalSavedPost, 1.0) +
      varietyBoost;

    const final = nicknameDiffers ? base + WEIGHTS.nicknameBonus : base;
    return Number.isFinite(final) ? final : 0;
  } catch (e) {
    console.error("Pink calc failed", e);
    return 0;
  }
};

/** ------------------- Final SRB with tiers & Dirichlet smoothing ------------------- **/
export const calculateSRB = async (
  userId: string,
  userColors: PostItColor[]
): Promise<{ S: number; R: number; B: number; Trust: number }> => {
  // 0) Optional: cohort-aware caps
  const TIERS = await getTierCaps();

  const [blueRaw, yellowRaw, pinkRaw] = await Promise.all([
    calculateBlue(userId),
    calculateYellow(userId),
    calculatePink(userId),
  ]);

  // 1) Apply tiered soft-caps (dynamic if API provided)
  const blue = softCapTiered(
    blueRaw,
    TIERS.blue.t1, TIERS.blue.t2, TIERS.blue.a1, TIERS.blue.a2, TIERS.blue.k1, TIERS.blue.k2, TIERS.blue.maxCap
  );
  const yellow = softCapTiered(
    yellowRaw,
    TIERS.yellow.t1, TIERS.yellow.t2, TIERS.yellow.a1, TIERS.yellow.a2, TIERS.yellow.k1, TIERS.yellow.k2, TIERS.yellow.maxCap
  );
  const pink = softCapTiered(
    pinkRaw,
    TIERS.pink.t1, TIERS.pink.t2, TIERS.pink.a1, TIERS.pink.a2, TIERS.pink.k1, TIERS.pink.k2, TIERS.pink.maxCap
  );

  // 2) Dirichlet prior **before** normalization (replaces post-hoc subtraction)
  //    - alphaBase gives every bucket minimum mass (prevents 100/0/0)
  //    - alphaUnlock converts SRB baseline into small prior mass (not subtraction)
  const { s0, r0, b0 } = sumSRBZeroes(userColors);
  const alphaBase = 3;           // uniform prior strength per bucket (tune 1..5)
  const unlockScale = 0.1;       // convert baseline points to prior mass (tune)
  const alphaS = alphaBase + s0 * unlockScale; // S ↔ Blue
  const alphaB = alphaBase + b0 * unlockScale; // B ↔ Yellow
  const alphaR = alphaBase + r0 * unlockScale; // R ↔ Pink

  const S_mass = Math.max(0, blue)   + alphaS;
  const B_mass = Math.max(0, yellow) + alphaB;
  const R_mass = Math.max(0, pink)   + alphaR;

  let totalMass = S_mass + B_mass + R_mass || 1;

  // 3) Shares (with prior)
  let shares = [S_mass / totalMass, B_mass / totalMass, R_mass / totalMass]; // [S,B,R order]

  // 4) Anti-dominance smoothing (stronger than before)
  shares = blendTowardUniformByHHI(shares, /* lambdaMax */ 0.45);
  shares = capMaxShare(shares, /* maxShare */ 0.70);

  // 5) Percentages that sum ~100 (final rounding pass)
  let [S, B, R] = shares.map((x) => Math.round(x * 100));
  const sum = S + B + R;
  if (sum !== 100) {
    // tiny fix-up to guarantee total = 100
    const diff = 100 - sum;
    if (diff !== 0) {
      // add the remainder to the smallest bucket to encourage balance
      const idx = [S, B, R].indexOf(Math.min(S, B, R));
      if (idx === 0) S += diff;
      else if (idx === 1) B += diff;
      else R += diff;
    }
  }

  // 6) Trust on capped totals (stable, monotone)
  const Trust = logistic100(blue + yellow + pink, 0.02, 200);

  return { S, R, B, Trust };
};

/** ------------------- Save color ------------------- **/
export const handleNewColor = async (
  userId: string,
  color: PostItColor
): Promise<{ status: number }> => {
  try {
    const response = await fetchAPI(`/api/users/updateUserInfo`, {
      method: "PATCH",
      body: JSON.stringify({ clerkId: userId, color: color.id }),
    });
    return { status: response?.status ?? 500 };
  } catch (error) {
    console.error("Failed to save new color", error);
    return { status: 500 };
  }
};
