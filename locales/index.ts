// locales/index.ts
import enLogin from './en/login.json';
import enSignup from './en/signup.json';
import enOnboarding from './en/onboarding.json';

export const translations = {
  en: {
    ...enLogin,
    ...enSignup,
    ...enOnboarding,
  }
};
