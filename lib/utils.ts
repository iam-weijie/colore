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

// Algorithm for random position generation
export const AlgorithmRandomPosition = (isPinned: boolean, prevPost: Position) => {
  const screenHeight = Dimensions.get("window").height / 1.97;
  const screenWidth  = Dimensions.get("window").width / 1.8;

  // pinned notes still get their fixed “stuck” spot
  if (isPinned) {
    return {
      top:  60 + Math.random() * 10,
      left: 40 + Math.random() * 10,
    };
  }

  // minimum “push” in px, maximum is half the screen
  const MIN_OFFSET = 40;
  const MAX_OFFSET_Y = screenHeight  / 1.25;
  const MAX_OFFSET_X = screenWidth;

  // decide whether the prev note was closer to top or bottom
  const directionY = prevPost.top < screenHeight / 2 ? +1 : -1;
  const directionX = prevPost.left < screenWidth / 2 ? +1 : -1;

  // pick a random offset in [MIN_OFFSET, MAX_OFFSET]
  const offsetY = MIN_OFFSET + Math.random() * (MAX_OFFSET_Y - MIN_OFFSET);
  const offsetX = MIN_OFFSET + Math.random() * (MAX_OFFSET_X - MIN_OFFSET);

  // compute and clamp to screen bounds
  let newTop  = prevPost.top + directionY * offsetY;
  let newLeft = prevPost.left + directionX * offsetX + 15;

  newTop  = Math.min(Math.max(newTop, 0), screenHeight);
  newLeft = Math.min(Math.max(newLeft, 0), screenWidth);

  // Check if storedPosition is empty
  if (storedPosition.length === 0) {
    // If empty, no need to check overlap, just return the position
    storedPosition = [{ top: newTop, left: newLeft }];
    return { top: newTop, left: newLeft };
  }

  // Check for overlap if there are already stored positions
  let retries = 5;
  while (isOverlapping({ top: newTop, left: newLeft }, storedPosition) && retries > 0) {
    // Retry generating a new position if overlap occurs
    newTop = prevPost.top + directionY * (MIN_OFFSET + Math.random() * (MAX_OFFSET_Y - MIN_OFFSET));
    newLeft = prevPost.left + directionX * (MIN_OFFSET + Math.random() * (MAX_OFFSET_X - MIN_OFFSET));
    newTop  = Math.min(Math.max(newTop, 0), screenHeight);
    newLeft = Math.min(Math.max(newLeft, 0), screenWidth) + 15;
    retries--;
  }


  // Save new position to storedPosition if no overlap
  storedPosition = [...storedPosition, { top: newTop, left: newLeft }];

  return { top: newTop, left: newLeft };
};