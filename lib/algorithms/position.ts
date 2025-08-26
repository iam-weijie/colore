// Constants
export const POSTIT_WIDTH = 160;
export const POSTIT_HEIGHT = 160;
export const MIN_DISTANCE = 40; // Increased for better spacing
export const MIN_COVERAGE_RATIO = 0.6; // Reduced to allow more space
const MAX_BOARD_SIZE = 8000; // Increased for better distribution

interface Position {
  top: number;
  left: number;
  rotate?: string;
}

type BoardDimensions = {
  width: number;
  height: number;
};

type ScreenDimensions = {
  width: number;
  height: number;
};

/**
 * Calculates board dimensions based on requirements
 */
export const calculateBoardDimensions = (
  postItCount: number,
  screen: ScreenDimensions
): BoardDimensions => {
  // Base dimensions - ensure minimum 2x screen size for scrolling
  const baseWidth = Math.max(screen.width * 2, 800);
  const baseHeight = Math.max(screen.height * 2, 600);
  
  // Calculate area needed per Post-It (including padding)
  const postItArea = (POSTIT_WIDTH + MIN_DISTANCE) * (POSTIT_HEIGHT + MIN_DISTANCE);
  
  // Calculate total area needed with extra space
  const totalAreaNeeded = postItArea * postItCount * 2; // 2x for extra space
  
  // Calculate side length of a square with this area
  const sideLength = Math.sqrt(totalAreaNeeded);
  
  // Ensure the dimensions are at least the base dimensions
  const width = Math.max(baseWidth, sideLength);
  const height = Math.max(baseHeight, sideLength);
  
  // Cap dimensions at reasonable limits
  return {
    width: Math.min(width, MAX_BOARD_SIZE),
    height: Math.min(height, MAX_BOARD_SIZE)
  };
};

/**
 * Generates random position within bounds with better distribution
 */
const generatePosition = (
  board: BoardDimensions,
  existingPositions: Position[]
): Position => {
  const maxLeft = board.width - POSTIT_WIDTH;
  const maxTop = board.height - POSTIT_HEIGHT;
  
  // Try to find a position with good spacing from existing ones
  let attempts = 0;
  const maxAttempts = 100;
  
  while (attempts < maxAttempts) {
    const left = Math.random() * maxLeft;
    const top = Math.random() * maxTop;
    
    // Check if this position has good spacing from existing positions
    let hasGoodSpacing = true;
    
    for (const existing of existingPositions) {
      const dx = left - existing.left;
      const dy = top - existing.top;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < MIN_DISTANCE) {
        hasGoodSpacing = false;
        break;
      }
    }
    
    if (hasGoodSpacing || existingPositions.length === 0) {
      return {
        left,
        top,
        rotate: `${(Math.random() - 0.5) * 6}deg` // Reduced rotation for better appearance
      };
    }
    
    attempts++;
  }
  
  // Fallback: return a random position if we can't find a good one
  return {
    left: Math.random() * maxLeft,
    top: Math.random() * maxTop,
    rotate: `${(Math.random() - 0.5) * 6}deg`
  };
};

/**
 * Enhanced collision detection with better spacing
 */
const hasCollision = (pos: Position, others: Position[]): boolean => {
  const minDist = MIN_DISTANCE + (POSTIT_WIDTH / 2);
  const minDistSq = minDist * minDist;
  
  return others.some(existing => {
    const dx = pos.left - existing.left;
    const dy = pos.top - existing.top;
    return (dx * dx + dy * dy) < minDistSq;
  });
};

/**
 * Main position generator with improved distribution
 */
export const getAllPositions = (
  postItCount: number,
  screen: ScreenDimensions,
  existingPositions: Position[] = [],
  currentBoard?: BoardDimensions
): Position[] => {
  const board = currentBoard || calculateBoardDimensions(postItCount, screen);
  const positions: Position[] = [...existingPositions];
  
  // Try to place each new post-it
  while (positions.length < postItCount) {
    let attempts = 0;
    let placed = false;
    const maxAttempts = 150; // Increased attempts for better placement
    
    // Try multiple positions
    while (!placed && attempts < maxAttempts) {
      const newPos = generatePosition(board, positions);
      
      if (!hasCollision(newPos, positions)) {
        positions.push(newPos);
        placed = true;
      }
      attempts++;
    }
    
    // If we can't place after many attempts, expand the board
    if (!placed) {
      console.warn(`Could not place post-it ${positions.length + 1}, expanding board`);
      const largerBoard = {
        width: board.width * 1.5,
        height: board.height * 1.5
      };
      return getAllPositions(postItCount, screen, existingPositions, largerBoard);
    }
  }
  
  return positions;
};