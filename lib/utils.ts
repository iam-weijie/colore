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

export function convertToLocal(rawDate: Date): Date {
  const offset = new Date().getTimezoneOffset() * 60000;
  const localDate = new Date(rawDate.getTime() - offset);
  return localDate;
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
  const screenWidth = Dimensions.get("window").width * 2;
  const screenHeight = Dimensions.get("window").height;
  const screenArea = screenWidth * screenHeight;

  const minTargetArea = Math.min(postItCount * 0.03 * screenArea, screenArea); // can't exceed 100%


  if (isPinned) {
    return {
      top: 60 + Math.random() * 10,
      left: 40 + Math.random() * 10,
      rotate: `${Math.random() * 4 - 2}deg`,
    };
  }

  const MAX_RETRIES = 20;
  let attempts = 0;

  while (attempts < MAX_RETRIES) {
    const top = Math.random() * (screenHeight - POSTIT_HEIGHT);
    const left = Math.random() * (screenWidth - POSTIT_WIDTH);

    let minDistance = Infinity;

    for (const pos of storedPosition) {
      const dx = pos.left - left;
      const dy = pos.top - top;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < minDistance) minDistance = distance;
    }

    // Calculate how much area this placement adds based on overlap
    const overlapFactor = Math.max(0.2, Math.min(1, minDistance / POSTIT_WIDTH)); // scaled 0.2 to 1
    const effectiveArea = POSTIT_AREA * overlapFactor;

    const rotate = `${Math.floor(Math.random() * 16 - 8)}deg`;
    const newPosition = { top, left, rotate };

    storedPosition.push({ top, left });
    accumulatedArea += effectiveArea;

    return newPosition;
  }

  console.warn("Could not place post-it after retries");
  return null;
};



/**
 * Formats a date to a relative time string (e.g., "just now", "1m", "2h", "3d", "1w", "2mo", "1y")
 * @param date The date to format (Date object or string)
 * @returns A string representing the relative time
 */
export function getRelativeTime(date: Date | string): string {
  const now = new Date();
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Get time difference in milliseconds
  const diff = now.getTime() - dateObj.getTime();
  
  // Convert to seconds
  const seconds = Math.floor(diff / 1000);
  
  // Less than a minute
  if (seconds < 60) {
    return 'just now';
  }
  
  // Minutes (less than an hour)
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes} minutes ago`;
  }
  
  // Hours (less than a day)
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} hours ago`;
  }
  
  // Days (less than a week)
  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days} days ago`;
  }
  
  // Weeks (less than a month)
  const weeks = Math.floor(days / 7);
  if (weeks < 4) {
    return `${weeks} weeks ago`;
  }
  
  // Months (less than a year)
  const months = Math.floor(days / 30);
  if (months < 12) {
    return `${months} months ago`;
  }
  
  // Years
  const years = Math.floor(days / 365);
  return `${years} years ago`;
}

