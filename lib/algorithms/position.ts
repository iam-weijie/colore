// Constants
export const POSTIT_WIDTH = 160;
export const POSTIT_HEIGHT = 160;
export const MIN_DISTANCE = 20;
export const MIN_COVERAGE_RATIO = 0.75;
const MAX_BOARD_SIZE = 5000;

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
 * Sigmoid function for smooth ratio adjustment
 */
const sigmoid = (x: number, lower: number, upper: number): number => {
  // Scale input to make transition smoother (0-100 post-its)
  const scaledX = (x / 50) * 6 - 3; // Maps to [-3,3] for 0-100 post-its
  const sig = 1 / (1 + Math.exp(-scaledX));
  return lower + sig * (upper - lower);
};

/**
 * Calculates dynamic visible area ratios
 */
const getVisibleRatios = (postItCount: number) => ({
  widthRatio: sigmoid(postItCount, 0.6, 0.8),  // X-axis: 60%-80%
  heightRatio: sigmoid(postItCount, 0.4, 0.7)  // Y-axis: 40%-70%
});

/**
 * Calculates visible area from screen dimensions
 */
const getVisibleArea = (screen: ScreenDimensions, postItCount: number): BoardDimensions => {
  const ratios = getVisibleRatios(postItCount);
  return {
    width: screen.width * ratios.widthRatio,
    height: screen.height * ratios.heightRatio
  };
};

/**
 * Calculates board dimensions based on requirements
 */
export const calculateBoardDimensions = (
  postItCount: number,
  screen: ScreenDimensions
): BoardDimensions => {
  const visibleArea = getVisibleArea(screen, postItCount);
  const minArea = (POSTIT_WIDTH * POSTIT_HEIGHT * postItCount) / MIN_COVERAGE_RATIO;
  
  // Calculate required dimensions separately
  const requiredWidth = Math.max(
    visibleArea.width,
    Math.sqrt(minArea * (screen.width / screen.height))
  );
  
  const requiredHeight = Math.max(
    visibleArea.height,
    Math.sqrt(minArea * (screen.height / screen.width))
  );

  return {
    width: Math.min(Math.ceil(requiredWidth), MAX_BOARD_SIZE),
    height: Math.min(Math.ceil(requiredHeight), MAX_BOARD_SIZE)
  };
};

/**
 * Generates random position within bounds
 */
const generatePosition = (
  board: BoardDimensions,
  visibleArea: BoardDimensions,
  isExpanded: boolean
): Position => {
  // Use visible area for initial placement, full board when expanded
  const maxLeft = isExpanded ? 
    board.width - POSTIT_WIDTH : 
    Math.min(board.width, visibleArea.width) - POSTIT_WIDTH;
    
  const maxTop = isExpanded ?
    board.height - POSTIT_HEIGHT :
    Math.min(board.height, visibleArea.height) - POSTIT_HEIGHT;

  return {
    left: Math.max(0, Math.random() * maxLeft),
    top: Math.max(0, Math.random() * maxTop),
    rotate: `${(Math.random() - 0.5) * 8}deg`
  };
};

/**
 * Simple collision detection
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
 * Main position generator
 */
export const getAllPositions = (
  postItCount: number,
  screen: ScreenDimensions,
  existingPositions: Position[] = [],
  currentBoard?: BoardDimensions
): Position[] => {
  const visibleArea = getVisibleArea(screen, postItCount);
  const board = currentBoard || calculateBoardDimensions(postItCount, screen);
  const positions: Position[] = [...existingPositions];
  let isExpanded = false;
  
  // Try to place each new post-it
  while (positions.length < postItCount) {
    let attempts = 0;
    let placed = false;
    
    // Try multiple positions
    while (!placed && attempts < 50) {
      const newPos = generatePosition(board, visibleArea, isExpanded);
      
      if (!hasCollision(newPos, positions)) {
        positions.push(newPos);
        placed = true;
      }
      attempts++;
    }
    
    // If we can't place, expand the search area
    if (!placed) {
      if (!isExpanded) {
        isExpanded = true; // First try using full board
      } else {
        // If already expanded, increase board size
        const largerBoard = calculateBoardDimensions(postItCount * 1.5, screen);
        return getAllPositions(postItCount, screen, existingPositions, largerBoard);
      }
    }
  }
  
  return positions;
};