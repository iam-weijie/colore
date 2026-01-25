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

// Find color that matches user's SRB closely (not exactly)
export const colorMatch = (userSRB: SRB, library: Color[], attempts: number): { color: Color | null, attempts: number, context?: string} => {

    for (let color of library) {
    const [s1, r1, b1] = userSRB;
    const [s2, r2, b2] = color.SRB;

    const isExact =
      Math.abs(s1 - s2) <= 2 &&
      Math.abs(r1 - r2) <= 2 &&
      Math.abs(b1 - b2) <= 2;

    const isClose =  
      Math.abs(s1 - s2) <= 5 &&
      Math.abs(r1 - r2) <= 5 &&
      Math.abs(b1 - b2) <= 5;

    if (isExact) return { color: color , attempts: 0} ;
    else if (isClose) return { color: null, attempts:  attempts - 1, context: "You are close to obtaining a new color"};
    else return { color: null, attempts: attempts - 1}
  }
  // If library is empty, or no colors matched, return default result
  return { color: null, attempts: attempts, context: "Something happened..." };
};


// Reset SRB after match
export const zeroSRB = (): SRB => {
  return [0, 0, 0];
};



