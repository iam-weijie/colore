import { fetchAPI } from "@/lib/fetch";
import React, { useState, useMemo } from "react"

// Blue Progress: Posts made + Posts received
const calculateBlue = async (userId: string): Promise<number> => {


    // Constants to be used in the weighting of posts
    const [blueValue, setBlueValue] = useState<number>(0);

    try {
        const {
        totalPostMade,
        totalPostReceived,
        totalPostContentLength,
        totalBoardMade,
        totalBoardJoined,
        totalPromptMade
      } = await fetchAPI(`/api/colors/getAllBlueConfig?userId=${userId}`)

      const avgLength = totalPostContentLength / (totalPostMade || 1); // avoid div by zero
      const lengthFactor = Math.log(1 + avgLength); // scales slowly with very long posts
      const countFactor = Math.log(1 + totalPostMade); // scales slowly with high count

      const weightedPosts = 5 * lengthFactor * countFactor;
      const weightedContribution = 
    weightedPosts
        + 1.25 * totalBoardJoined
        + 1.5 * totalPostReceived
        + 2 * totalPromptMade 
        + 3 * totalBoardMade

        setBlueValue(weightedContribution)

    } catch (error) {
        console.error("Failed to fetch all blue config", error)
    }

    

  return blueValue;
};

// Yellow Progress: Likes received + Comments received
const calculateYellow = async (userId: string): Promise<number> => {

    const [yellowValue, setYellowValue] = useState<number>(0);

    try {
        const {
            totalLikesReceived,
            totalCommentsReceived,
            totalPromptAnswersReceived
        } =  await fetchAPI(`/api/colors/getAllYellowConfig?userId=${userId}`)

        const weightedLikes = Math.log(1 + totalLikesReceived);
        const weightedComments = Math.log(1 + totalCommentsReceived) * 2;
        const weightedAnswers = Math.log(1 + totalPromptAnswersReceived) * 3;

        const weightedContribution = (weightedLikes + weightedComments + weightedAnswers) * 5;

        setYellowValue(weightedContribution)
    } catch (error) {
        console.error("Failed to fetch all yellow config", error)
    }



  return yellowValue; 
};

// Pink Progress: Customizations
const calculatePink = async (userId: string): Promise<number> => {

    const [pinkValue, setPinkValue] = useState<number>(0);

const goodnessOfFit = (colorUsed: string[]): number => {
  // Step 1: Count observed frequencies
  const observed: Record<string, number> = {};
  for (const color of colorUsed) {
    observed[color] = (observed[color] || 0) + 1;
  }

  const totalColors = colorUsed.length;
  const uniqueColors = Object.keys(observed);
  const numUnique = uniqueColors.length;

  // Step 2: Calculate expected count per color (assuming uniform distribution)
  const expected = totalColors / numUnique;

  // Step 3: Chi-Square calculation
  let chiSquare = 0;
  for (const color of uniqueColors) {
    const observedValue = observed[color];
    chiSquare += Math.pow(observedValue - expected, 2) / expected;
  }

  const degreesOfFreedom = numUnique - 1;

  return chiSquare
};

    try {
    const {
        totalBoards,
        totalEmoji,
        totalFormattingPost,
        nicknameDiffers,
        totalLikedPost,
        totalSavedPost,
        colorsUsed
      } =  await fetchAPI(`/api/colors/getAllYellowConfig?userId=${userId}`)

    
      const chi = goodnessOfFit(colorsUsed);
      const normalizedChi = Math.min(chi / (colorsUsed.length || 1), 1); // scale between 0 and 1
      const colorCustomization = normalizedChi * 100;

      const weightedContribution = 
      totalBoards 
        + 1.5 * totalEmoji 
        + 2 * totalFormattingPost
        + totalLikedPost
        + 3 * totalSavedPost
        + colorCustomization
      
      const bonusNickname = nicknameDiffers ? weightedContribution * 1.5 : weightedContribution * 0.8

      setPinkValue(bonusNickname)

      
    } catch (error) {
        console.error("Failed to fetch all yellow config", error)
    }


  return pinkValue; 
};


// Weighted Distribution

export const calculateSRB = async (userId: string) : Promise<{ S: number; R: number; B: number; }> => {

    let blue = await calculateBlue(userId)
    let yellow = await calculateYellow(userId)
    let pink = await calculatePink(userId)

    const total = blue + yellow + pink;

    blue = blue / total * 100
    yellow = yellow / total * 100
    pink = pink / total * 100

    return {S: blue, R: pink, B: yellow }
}


// Send new color to database
