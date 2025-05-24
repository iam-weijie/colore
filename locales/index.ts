// locales/index.ts
import enLogin from './en/login.json';
import enSignup from './en/signup.json';
import enOnboarding from './en/onboarding.json';

import frLogin from './fr/login.json';
import frSignup from './fr/signup.json';
import frOnboarding from './fr/onboarding.json';

export const translations = {
  en: {
    ...enLogin,
    ...enSignup,
    ...enOnboarding,
  },
  fr: {
    ...frLogin,
    ...frSignup,
    ...frOnboarding,
  }
};
