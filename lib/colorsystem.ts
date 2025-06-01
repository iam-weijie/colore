export type SRB = [number, number, number];

export type Color = {
  name: string;
  meaning: string;
  SRB: SRB;
};

export const initRandomColor = (userColors: Color[]): Color | null => {
  if (!userColors || userColors.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * userColors.length);
  return userColors[randomIndex];
};

// Blue Progress: Posts made + Posts received
export const calculateBlue = (postsMade: number, postsReceived: number): number => {
  return Math.floor((postsMade + postsReceived) / 3); // or tweak divisor as needed
};

// Yellow Progress: Likes received + Comments received
export const calculateYellow = (likes: number, comments: number): number => {
  return Math.floor((likes + comments) / 10); // or tweak divisor as needed
};

// Pink Progress: Customizations
export const calculatePink = (customizations: number): number => {
  return Math.floor(customizations / 5); // or tweak divisor as needed
};

// Find color that matches user's SRB closely (not exactly)
export const colorMatch = (userSRB: SRB, library: Color[]): Color | null => {

    for (let color of library) {
    const [s1, r1, b1] = userSRB;
    const [s2, r2, b2] = color.SRB;

    const isClose =
      Math.abs(s1 - s2) <= 1 &&
      Math.abs(r1 - r2) <= 1 &&
      Math.abs(b1 - b2) <= 1;

    if (isClose) return color;
  }

  return null;
};

// Reset SRB after match
export const zeroSRB = (): SRB => {
  return [0, 0, 0];
};



/*
to use it paste the below code

import {
  initRandomColor,
  calculateBlue,
  calculateYellow,
  calculatePink,
  colorMatch,
  zeroSRB,
} from "@/lib/colorSystem";


const S = calculateBlue(postsMade, postsReceived);
const R = calculateYellow(likesReceived, commentsReceived);
const B = calculatePink(customizationCount);

const matchedColor = colorMatch([S, R, B], colorLibrary);

if (matchedColor) {
  console.log("Unlocked:", matchedColor.name);
  const resetSRB = zeroSRB();
} 

*/


