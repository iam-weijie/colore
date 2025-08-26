import { Post, Position } from "@/types/type";
import { Dimensions } from "react-native";
import { useState } from "react";

/** ---------------------------------------------
 * Date/Time Utilities (UTC storage → Local display)
 * - Treats all incoming timestamp strings as UTC.
 * - Formats all dates/times using the user's local timezone.
 * ----------------------------------------------*/

type DateLike = string | number | Date;

/** Internal: robust UTC parser (handles missing "Z" and date-only) */
function parseUTC(input: DateLike): Date {
  if (input instanceof Date) return new Date(input.getTime());
  if (typeof input === "number") return new Date(input); // ms since epoch

  if (typeof input === "string") {
    const s = input.trim();

    // Already has tz info (Z or ±HH:MM)
    if (/[zZ]$|[+\-]\d{2}:?\d{2}$/.test(s)) return new Date(s);

    // Date-only → treat as midnight UTC
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return new Date(`${s}T00:00:00Z`);

    // ISO-like without tz → force UTC
    if (/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2})?/.test(s)) {
      return new Date(`${s.replace(" ", "T")}Z`);
    }

    // Fallback (may be locale-dependent)
    return new Date(s);
  }

  return new Date(NaN);
}

/** Converts UTC input to a Date at the correct instant (local shown at format time). */
export function convertToLocal(rawDate: DateLike): Date {
  try {
    const d = parseUTC(rawDate);
    if (isNaN(d.getTime())) throw new Error("Invalid date");
    return new Date(d.getTime()); // same instant; formatting applies local tz
  } catch (err) {
    console.warn("Date conversion failed:", err, rawDate);
    return new Date(); // safe fallback
  }
}

/** Relative time: seconds → minutes → hours → days → weeks → months → years */
export function getRelativeTime(rawDate: DateLike): string {
  const target = convertToLocal(rawDate);
  const diffMs = target.getTime() - Date.now(); // positive = future, negative = past

  // Units in ms
  const sec = 1000;
  const min = 60 * sec;
  const hour = 60 * min;
  const day = 24 * hour;
  const week = 7 * day;
  const month = 30.4375 * day;    // avg calendar month
  const year = 365.25 * day;      // avg calendar year

  const absMs = Math.abs(diffMs);

  // Choose the best unit threshold
  let value: number;
  let unit: Intl.RelativeTimeFormatUnit;

  if (absMs < 5 * sec) {
    return diffMs >= 0 ? "in a few seconds" : "just now";
  } else if (absMs < min) {
    value = Math.round(diffMs / sec);
    unit = "second";
  } else if (absMs < hour) {
    value = Math.round(diffMs / min);
    unit = "minute";
  } else if (absMs < day) {
    value = Math.round(diffMs / hour);
    unit = "hour";
  } else if (absMs < week) {
    value = Math.round(diffMs / day);
    unit = "day";
  } else if (absMs < month) {
    value = Math.round(diffMs / week);
    unit = "week";
  } else if (absMs < year) {
    value = Math.round(diffMs / month);
    unit = "month";
  } else {
    value = Math.round(diffMs / year);
    unit = "year";
  }

  // Prefer Intl for localization
  try {
    if (typeof Intl !== "undefined" && Intl.RelativeTimeFormat) {
      const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
      return rtf.format(value, unit);
    }
  } catch {}

  // Manual fallback (English)
  const absVal = Math.abs(value);
  const s = absVal === 1 ? "" : "s";
  const unitStr = `${unit}${s}`;
  return value >= 0 ? `in ${absVal} ${unitStr}` : `${absVal} ${unitStr} ago`;
}

/** Duration (not wall-clock): "45 mins", "1h 15m", "2h" */
export function formatTime(minutes: number): string {
  const total = Math.max(0, Math.round(Number.isFinite(minutes) ? minutes : 0));
  if (total < 60) return `${total} min${total === 1 ? "" : "s"}`;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

/** "MM/DD/YYYY" using local timezone derived from UTC input */
export function formatDate(rawDate: DateLike): string {
  const d = convertToLocal(rawDate);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

// Fallback month names for environments without full Intl support
const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTH_LONG  = ["January","February","March","April","May","June","July","August","September","October","November","December"];

/** "Aug. 22, 2025" (with period after month) */
export function formatDateTruncatedMonth(rawDate: DateLike): string {
  const d = convertToLocal(rawDate);
  try {
    const month = d.toLocaleDateString(undefined, { month: "short" });
    const day = d.getDate();
    const year = d.getFullYear();
    return `${month.replace(".", "")}. ${day}, ${year}`;
  } catch {
    return `${MONTH_SHORT[d.getMonth()]}. ${d.getDate()}, ${d.getFullYear()}`;
  }
}

/** "22 August 2025" */
export function formatDateWithMonth(rawDate: DateLike): string {
  const d = convertToLocal(rawDate);
  try {
    return new Intl.DateTimeFormat(undefined, {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(d);
  } catch {
    const day = d.getDate();
    return `${day} ${MONTH_LONG[d.getMonth()]} ${d.getFullYear()}`;
  }
}

/** Age from birthday; date-only strings are treated as UTC midnight */
export function calculateAge(birthday: DateLike): number {
  const b = parseUTC(birthday);
  if (isNaN(b.getTime())) return 0;

  // Use UTC components for the birth date to avoid DST edge effects
  const by = b.getUTCFullYear();
  const bm = b.getUTCMonth();
  const bd = b.getUTCDate();

  const today = new Date();
  let age = today.getFullYear() - by;
  const mDiff = today.getMonth() - bm;
  const dDiff = today.getDate() - bd;
  if (mDiff < 0 || (mDiff === 0 && dDiff < 0)) age--;

  return Math.max(0, age);
}


// Constants for Post-It dimensions
export const POSTIT_WIDTH = 160;
export const POSTIT_HEIGHT = 160;
export const MIN_DISTANCE = 40; // Minimum distance between Post-Its

/**
 * Calculates optimal board dimensions based on the number of Post-Its
 * @param postItCount Number of Post-Its on the board
 * @param postItSize Size of each Post-It
 * @param screenDimensions Device screen dimensions
 * @param minPadding Minimum padding between Post-Its
 * @returns Optimal width and height for the board
 */
export const calculateBoardDimensions = (
  postItCount: number,
  postItSize = { width: POSTIT_WIDTH, height: POSTIT_HEIGHT },
  screenDimensions = { 
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height 
  },
  minPadding = MIN_DISTANCE
): { width: number; height: number } => {
  // Base dimensions - minimum 2x screen size to allow scrolling
  let baseWidth = screenDimensions.width * 2;
  let baseHeight = screenDimensions.height * 2;
  
  // For very few Post-Its, use the base dimensions
  if (postItCount <= 10) {
    return { width: baseWidth, height: baseHeight };
  }
  
  // Calculate area needed per Post-It (including padding)
  const postItArea = (postItSize.width + minPadding) * (postItSize.height + minPadding);
  
  // Calculate total area needed
  const totalAreaNeeded = postItArea * postItCount * 1.5; // 1.5x for extra space
  
  // Calculate side length of a square with this area
  const sideLength = Math.sqrt(totalAreaNeeded);
  
  // Ensure the dimensions are at least the base dimensions
  const width = Math.max(baseWidth, sideLength);
  const height = Math.max(baseHeight, sideLength);
  
  // Cap dimensions at reasonable limits
  const maxDimension = 10000; // Prevent extremely large boards
  return {
    width: Math.min(width, maxDimension),
    height: Math.min(height, maxDimension)
  };
};

/**
 * Creates a grid-based distribution for Post-Its
 * @param boardDimensions Width and height of the board
 * @param postItSize Size of each Post-It
 * @param minPadding Minimum padding between Post-Its
 * @returns Grid dimensions and cell size
 */
const createPositioningGrid = (
  boardDimensions: { width: number; height: number },
  postItSize = { width: POSTIT_WIDTH, height: POSTIT_HEIGHT },
  minPadding = MIN_DISTANCE
) => {
  const cellWidth = postItSize.width + minPadding;
  const cellHeight = postItSize.height + minPadding;
  
  const gridColumns = Math.floor(boardDimensions.width / cellWidth);
  const gridRows = Math.floor(boardDimensions.height / cellHeight);
  
  return {
    columns: gridColumns,
    rows: gridRows,
    cellWidth,
    cellHeight
  };
};

// Storage for positions to maintain consistency
let positionGrid: boolean[][] = [];
let storedPosition: Position[] = [];

export const cleanStoredPosition = () => {
  storedPosition = [];
  positionGrid = [];
};

/**
 * Enhanced algorithm for random Post-It positioning with better distribution
 * @param isPinned Whether the Post-It is pinned
 * @param existingPositions Existing positions to avoid
 * @param postItCount Total number of Post-Its
 * @param boardDimensions Dimensions of the board
 * @returns Position for the Post-It
 */
export const EnhancedRandomPosition = (
  isPinned: boolean,
  existingPositions: any = null,
  postItCount: number,
  boardDimensions?: { width: number; height: number }
): Position => {
  // Default board dimensions if not provided
  const dimensions = boardDimensions || {
    width: Dimensions.get("window").width * 4,
    height: Dimensions.get("window").height * 2
  };

  // Handle pinned Post-Its (fixed at top left)
  if (isPinned) {
    return {
      top: 60 + Math.random() * 10,
      left: 40 + Math.random() * 10,
      rotate: `${Math.abs(Math.random() * 4)}deg`, // Small rotation for pinned
    };
  }
  
  // Initialize position grid if needed
  if (positionGrid.length === 0) {
    const grid = createPositioningGrid(dimensions);
    positionGrid = [];
    for (let i = 0; i < grid.rows; i++) {
      positionGrid[i] = [];
      for (let j = 0; j < grid.columns; j++) {
        positionGrid[i][j] = false;
      }
    }
  }

  const grid = createPositioningGrid(dimensions);
  
  // Find all available cells
  const availableCells: { row: number; col: number }[] = [];
  for (let row = 0; row < positionGrid.length; row++) {
    for (let col = 0; col < positionGrid[row].length; col++) {
      if (!positionGrid[row]?.[col]) {
        availableCells.push({ row, col });
      }
    }
  }
  
  // If no available cells or grid hasn't been initialized properly
  if (availableCells.length === 0) {
    // Fallback to old algorithm with spacing improvements
    const MAX_RETRIES = 50;
  let bestPosition = {
      top: Math.random() * (dimensions.height - POSTIT_HEIGHT),
      left: Math.random() * (dimensions.width - POSTIT_WIDTH),
      rotate: `${Math.abs(Math.random() * 8)}deg`,
  };
  let bestDistance = 0;

  for (let attempts = 0; attempts < MAX_RETRIES; attempts++) {
      const top = Math.random() * (dimensions.height - POSTIT_HEIGHT);
      const left = Math.random() * (dimensions.width - POSTIT_WIDTH);
    
    // Find minimum distance to existing post-its
    let minDistance = Infinity;
    for (const pos of storedPosition) {
      const dx = pos.left - left;
      const dy = pos.top - top;
      const distance = Math.sqrt(dx * dx + dy * dy);
      minDistance = Math.min(minDistance, distance);
    }

    // If no stored positions yet, or this position is better
    if (storedPosition.length === 0 || minDistance > bestDistance) {
      bestDistance = minDistance;
      bestPosition = {
        top,
        left,
        rotate: `${Math.abs(Math.random() * 8)}deg`,
      };
    }

    // If we found a good position, use it immediately
    if (minDistance > MIN_DISTANCE) {
      storedPosition.push({ top, left });
      return bestPosition;
    }
  }

  storedPosition.push({ top: bestPosition.top, left: bestPosition.left });
  return bestPosition;
  }
  
  // Choose a random available cell
  const randomIndex = Math.floor(Math.random() * availableCells.length);
  const { row, col } = availableCells[randomIndex];
  
  // Mark as occupied
  positionGrid[row][col] = true;
  
  // Calculate actual position with some randomness within the cell
  const jitterX = Math.random() * (grid.cellWidth * 0.2);
  const jitterY = Math.random() * (grid.cellHeight * 0.2);
  
  const left = col * grid.cellWidth + jitterX;
  const top = row * grid.cellHeight + jitterY;
  
  // Store the position
  storedPosition.push({ top, left });
  
  return {
    top,
    left,
    rotate: `${Math.abs(Math.random() * 8)}deg`, // Random rotation
  };
};

/**
 * Formats a date to a relative time string (e.g., "just now", "1m", "2h", "3d", "1w", "2mo", "1y")
 * This function respects timezones by using Date.now() and getTime() to calculate time differences
 * 
 * @param date The date to format (Date object or string)
 * @returns A string representing the relative time
 */

/**
 * Formats numbers with K (thousands), M (millions), and B (billions) abbreviations
 * @param num The number to format
 * @returns A string with the formatted number
 */
export function formatNumber(num: number): string {
  if (num === undefined || num === null) return '0';
  
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
  }
  
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  
  return num.toString();
}

/**
 * Checks if the provided value is a valid Date object that can be used for calculations
 * @param date The value to check
 * @returns boolean indicating if the value is a valid date
 */
export function isValidDate(date: any): boolean {
  return date instanceof Date && !isNaN(date.getTime());
}


