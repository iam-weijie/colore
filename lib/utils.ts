import { Post, Position } from "@/types/type";
import { Dimensions } from "react-native";
import { useState } from "react";

export function formatTime(minutes: number): string {
  const formattedMinutes = +minutes?.toFixed(0) || 0;

  if (formattedMinutes < 60) {
    return `${minutes} min`;
  } else {
    const hours = Math.floor(formattedMinutes / 60);
    const remainingMinutes = formattedMinutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  }
}

/**
 * Converts a UTC date to the user's local timezone
 * This function ensures the date is properly converted to the local timezone
 * without applying the timezone offset twice
 * 
 * @param rawDate The date to convert (Date object)
 * @returns A Date object in the user's local timezone
 */
/**
 * Converts a UTC date to the user's local timezone
 * This function ensures the date is properly converted to the local timezone
 * without applying the timezone offset twice
 * 
 * @param rawDate The date to convert (Date object)
 * @returns A Date object in the user's local timezone
 */
export function convertToLocal(rawDate: Date): Date {
  // Check if the date is valid before conversion
  if (isNaN(rawDate.getTime())) {
    console.warn('Invalid date provided to convertToLocal:', rawDate);
    return new Date(); // Return current date as fallback
  }
  
  try {
    // Create a new date object from the ISO string to ensure proper timezone handling
    return new Date(rawDate.toISOString());
  } catch (error) {
    console.error('Error in convertToLocal:', error);
    return new Date(); // Return current date as fallback
  }
  // Check if the date is valid before conversion
  if (isNaN(rawDate.getTime())) {
    console.warn('Invalid date provided to convertToLocal:', rawDate);
    return new Date(); // Return current date as fallback
  }
  
  try {
    // Create a new date object from the ISO string to ensure proper timezone handling
    return new Date(rawDate.toISOString());
  } catch (error) {
    console.error('Error in convertToLocal:', error);
    return new Date(); // Return current date as fallback
  }
}

export function formatDateTruncatedMonth(rawDate: Date): string {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const month = months[rawDate.getMonth()];
  const day = String(rawDate.getDate());
  const year = rawDate.getFullYear();

  // let hours = rawDate.getHours();
  // const minutes = String(rawDate.getMinutes());
  // const amOrPm = hours >= 12 ? "pm" : "am";
  // hours = hours % 12 || 12; // display 12am instead of 0

  return `${month}. ${day}, ${year}`;
}

export function formatDate(rawDate: Date): string {
  let date = new Date(rawDate);

  let day: string | number = date.getDate();
  let month: string | number = date.getMonth() + 1;
  let year = date.getFullYear();

  month = month < 10 ? `0${month}` : month;
  day = day < 10 ? `0${day}` : day;

  return `${month}/${day}/${year}`;
}

export function formatDateWithMonth(dateString: string): string {
  const date = new Date(dateString);
  const day = date.getDate();
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();

  return `${day < 10 ? "0" + day : day} ${month} ${year}`;
}

export function calculateAge(birthday: Date): number {
  const today = new Date();

  let age = today.getFullYear() - birthday.getFullYear();
  const m = today.getMonth() - birthday.getMonth();

  if (m < 0 || (m === 0 && today.getDate() < birthday.getDate())) {
    age--;
  }

  return age;
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
export function getRelativeTime(date: Date | string): string {
  // Get current time in milliseconds
  const now = Date.now();
  
  // Convert input to Date object if it's a string, then get time in milliseconds
  let timestamp: number;
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Check if the date is valid
    if (isNaN(dateObj.getTime())) {
      console.warn('Invalid date provided to getRelativeTime:', date);
      return 'unknown time';
    }
    
    timestamp = dateObj.getTime();
  } catch (error) {
    console.error('Error in getRelativeTime:', error);
    return 'unknown time';
  }
  
  // Get time difference in milliseconds
  const diff = now - timestamp;
  
  // Convert to seconds
  const seconds = Math.floor(diff / 1000);
  
  // Less than a minute
  if (seconds < 60) {
    return 'just now';
  }
  
  // Minutes (less than an hour)
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {

    return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  }
  
  // Hours (less than a day)
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  }
  
  // Days (less than a week)
  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days} day${days > 1 ? "s" : ""} ago`;
  }
  
  // Weeks (less than a month)
  const weeks = Math.floor(days / 7);
  if (weeks < 4) {
    return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
  }
  
  // Months (less than a year)
  const months = Math.floor(days / 30);
  if (months < 12) {
    return `${months} month${months > 1 ? "s" : ""} ago`;
  }
  
  // Years
  const years = Math.floor(days / 365);
  return `${years} year${years > 1 ? "s" : ""} ago`;
}

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


