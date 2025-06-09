import { tutorialCache } from '../cache/tutorialCache';

export const checkTutorialStatus = async (step: string) => {
  const seenIntro = await tutorialCache.isCompleted(step);

  return seenIntro
};

export const completedTutorialStep = async (step: string) => {
  const completedIntro = await tutorialCache.markCompleted(step)

  return completedIntro
}

