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

let storedPosition: Position[] = [];
const POSTIT_WIDTH = 160;
const POSTIT_HEIGHT = 160;
const POSTIT_AREA = POSTIT_WIDTH * POSTIT_HEIGHT;
let accumulatedArea = 0;

export const cleanStoredPosition = () => {
  storedPosition = [];
};

const MIN_DISTANCE = 40; // Minimum distance (in px) to avoid overlap

// Helper function to check for overlap
const isOverlapping = (newPos: Position, positions: Position[]) => {
  for (let pos of positions) {
    const distance = Math.sqrt(
      Math.pow(newPos.top - pos.top, 2) + Math.pow(newPos.left - pos.left, 2)
    );
    if (distance < MIN_DISTANCE) {
      return true; // Overlap detected
    }
  }
  return false; // No overlap
};


export const AlgorithmRandomPosition = (
  isPinned: boolean,
  _: any,
  postItCount: number
) => {
  const screenWidth = Dimensions.get("window").width * 2.25;
  const screenHeight = Dimensions.get("window").height;


  if (isPinned) {
    return {
      top: 60 + Math.random() * 10,
      left: 40 + Math.random() * 10,
      rotate: `${Math.abs(Math.random() * 4)}deg`, // Only positive rotation for pinned
    };
  }

  const MAX_RETRIES = 50; // Increased retries
  let bestPosition = {
    top: Math.random() * (screenHeight - POSTIT_HEIGHT),
    left: Math.random() * (screenWidth - POSTIT_WIDTH),
    rotate: `${Math.abs(Math.random() * 8)}deg`, // Only positive rotation
  };
  let bestDistance = 0;

  for (let attempts = 0; attempts < MAX_RETRIES; attempts++) {
    const top = Math.random() * (screenHeight - POSTIT_HEIGHT);
    const left = Math.random() * (screenWidth - POSTIT_WIDTH);
    
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

  // After all retries, use the best position we found
  storedPosition.push({ top: bestPosition.top, left: bestPosition.left });
  return bestPosition;
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
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  }
  
  // Hours (less than a day)
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  }
  
  // Days (less than a week)
  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  }
  
  // Weeks (less than a month)
  const weeks = Math.floor(days / 7);
  if (weeks < 4) {
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  }
  
  // Months (less than a year)
  const months = Math.floor(days / 30);
  if (months < 12) {
    return `${months} ${months === 1 ? 'month' : 'months'} ago`;
  }
  
  // Years
  const years = Math.floor(days / 365);
  return `${years} ${years === 1 ? 'year' : 'years'} ago`;
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


