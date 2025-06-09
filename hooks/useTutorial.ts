import { tutorialCache } from '../cache/tutorialCache';

export const checkTutorialStatus = async (step: string) => {
  const seenIntro = await tutorialCache.isCompleted(step);

  return seenIntro
};