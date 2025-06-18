import { allColors } from "@/constants";
import { PostItColor } from "@/types/type";

export type SRB = [number, number, number];


export const initRandomColor = (userColors: PostItColor[]): PostItColor | null => {
  if (!userColors || userColors.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * userColors.length);
  return userColors[randomIndex];
};

// Find color that matches user's SRB closely (not exactly)
export const colorMatch = (
  userSRB: [number, number, number],
  attempts: number
): { color: PostItColor | null; attempts: number; context?: string } => {
  let closestColor: PostItColor | null = null;
  let bestDistance = Infinity;
  let bestContext: string | undefined;


  for (const color of allColors) {
    const [s1, r1, b1] = userSRB;
    const [s2, r2, b2] = color.SRB;

    const deltaS = s2 - s1;
    const deltaR = r2 - r1;
    const deltaB = b2 - b1;

    const distance = Math.sqrt(deltaS ** 2 + deltaR ** 2 + deltaB ** 2);

    if (
      Math.abs(deltaS) <= 2 &&
      Math.abs(deltaR) <= 2 &&
      Math.abs(deltaB) <= 2
    ) {
      // Exact match

      if (["yellow", "light-blue", "pink"].includes(color.id)) return { color: color, attempts: attempts };
      return { color: color, attempts: 0 };
    }

    if (distance < bestDistance && distance <= 8.6) {
      // Save closest match (Euclidean distance ≤ ~5% per axis)
      closestColor = null;
      bestDistance = distance;

      const advice: string[] = [];

      if (Math.abs(deltaS) > 2)
        advice.push(deltaS > 0 ? "contribute more" : "reflect more");
      if (Math.abs(deltaR) > 2)
        advice.push(deltaR > 0 ? "customize more" : "simplify your posts");
      if (Math.abs(deltaB) > 2)
        advice.push(deltaB > 0 ? "interact more" : "let others engage");

      const roundedDistance = Math.round(distance * 10) / 10;

      bestContext = `You're ${roundedDistance}% away from unlocking a color. Try to ${advice.join(
        ", "
      )}.`;
    }
  }

  return {
    color: closestColor,
    attempts: attempts - 1,
    context: bestContext || "No close match found. Try again!"
  };
};



// Reset SRB after match
export const zeroSRB = (): SRB => {
  return [0, 0, 0];
};



