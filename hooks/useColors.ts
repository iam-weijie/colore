import { fetchAPI } from "@/lib/fetch";
import { PostItColor } from "@/types/type";

// Blue Progress: Posts made + Posts received
export const calculateBlue = async (userId: string): Promise<number> => {
  try {
    const {
      totalPostMade,
      totalPostReceived,
      totalPostContentLength,
      totalBoardMade,
      totalBoardJoined,
      totalPromptMade,
    } = await fetchAPI(`/api/colors/getAllBlueConfig?userId=${userId}`);

    // Balanced weighting for both quantity and quality
    const avgLength = totalPostContentLength / (totalPostMade || 1);
    const lengthFactor = Math.log(1 + avgLength);
    const countFactor = Math.log(1 + totalPostMade);
    const weightedPosts = 20 * lengthFactor * countFactor;

    const weightedContribution =
      weightedPosts +
      1.25 * totalBoardJoined +
      1.5 * totalPostReceived +
      2 * totalPromptMade +
      3 * totalBoardMade;

    return weightedContribution;
  } catch (error) {
    console.error("Failed to fetch all blue config", error);
    return 0;
  }
};

// Yellow Progress: Likes received + Comments received + Prompt Answers
export const calculateYellow = async (userId: string): Promise<number> => {
  try {
    const {
      totalLikesReceived,
      totalCommentsReceived,
      totalPromptAnswersReceived,
    } = await fetchAPI(`/api/colors/getAllYellowConfig?userId=${userId}`);

    const weightedLikes = Math.log(1 + totalLikesReceived);
    const weightedComments = Math.log(1 + totalCommentsReceived) * 2;
    const weightedAnswers = Math.log(1 + totalPromptAnswersReceived) * 3;

    const weightedContribution =
      (weightedLikes + weightedComments + weightedAnswers) * 10;

    return weightedContribution;
  } catch (error) {
    console.error("Failed to fetch all yellow config", error);
    return 0;
  }
};

// Pink Progress: Customizations & Aesthetic Expression
const goodnessOfFit = (colorUsed: string[]): number => {
  const observed: Record<string, number> = {};
  for (const color of colorUsed) {
    observed[color] = (observed[color] || 0) + 1;
  }

  const totalColors = colorUsed.length;
  const uniqueColors = Object.keys(observed);
  const numUnique = uniqueColors.length;

  if (numUnique === 0) return 0;

  const expected = totalColors / numUnique;

  let chiSquare = 0;
  for (const color of uniqueColors) {
    const observedValue = observed[color];
    chiSquare += Math.pow(observedValue - expected, 2) / expected;
  }

  return chiSquare;
};

export const calculatePink = async (userId: string): Promise<number> => {
  try {
    const {
      totalBoards,
      totalEmoji,
      totalFormattingPost,
      nicknameDiffers,
      totalLikedPost,
      totalSavedPost,
      colorsUsed,
    } = await fetchAPI(`/api/colors/getAllPinkConfig?userId=${userId}`);

    const chi = goodnessOfFit(colorsUsed);
    const colorCustomization =
      Math.min(
        Math.log(1 + chi) * Math.log(1 + colorsUsed.length),
        10 // optional cap
      );

    const weightedContribution =
      totalBoards +
      1.5 * totalEmoji +
      2 * totalFormattingPost +
      totalLikedPost +
      3 * totalSavedPost +
      colorCustomization;

    const finalScore = nicknameDiffers
      ? weightedContribution + 5
      : weightedContribution;

    return finalScore;
  } catch (error) {
    console.error("Failed to fetch all pink config", error);
    return 0;
  }
};

// Final SRB Color Distribution
export const calculateSRB = async (
  userId: string, userColors: PostItColor[]
): Promise<{ S: number; R: number; B: number }> => {
  const [blue, yellow, pink] = await Promise.all([
    calculateBlue(userId),
    calculateYellow(userId),
    calculatePink(userId),
  ]);

 
  let zeroS = 0;
  let zeroR = 0;
  let zeroB = 0;

  for (const color in userColors) {
    zeroS += userColors[color].SRB[0]
    zeroR += userColors[color].SRB[1]
    zeroB += userColors[color].SRB[2]
  }



  const total = blue + yellow + pink || 1;

  const finalS = Math.max(0,  Math.floor((blue / total) * 100) - zeroS)
  const finalR = Math.max(0,  Math.floor((pink / total) * 100) - zeroR)
  const finalB = Math.max(0,  Math.floor((yellow / total) * 100) - zeroB)

  return {
    S: finalS,
    R: finalR,
    B: finalB,
  };
};


// Save new colors
export const handleNewColor = async (userId: string, color: PostItColor): Promise<{ status: number }> => {
    try {
        const response = await fetchAPI(`/api/users/updateUserInfo`, {
            method: "PATCH",
            body: JSON.stringify({
                clerkId: userId,
                color: color.id
            }),
        });
        if (response.status == 200) return { status: 200 };
        // Ensure a return value for non-200 status
        return { status: response.status || 500 };
    } catch (error) {
        console.error("Failed to save new color: ", error);
        return { status: 500 };
    }
}