import { forbiddenWords } from "./forbiddenWords";

export const containsBadWord = (username: string): boolean => {
  const cleanUsername = username.toLowerCase();
  return forbiddenWords.some((word) => cleanUsername.includes(word));
};


export const forbiddenWords = [
    // General profanity
    "ass", "arse", "asshole", "bastard", "bitch", "bloody", "bollocks", "bullshit", "crap", "cunt", "damn", "dick",
    "dildo", "dyke", "fag", "faggot", "fuck", "fucked", "fucker", "fucking", "goddamn", "hell", "hoe", "jackass",
    "jerk", "motherfucker", "nigga", "nigger", "penis", "piss", "prick", "pussy", "retard", "shit", "shitty",
    "slut", "suck", "tit", "twat", "whore", "wanker",
  
    // Insults and slurs
    "moron", "idiot", "imbecile", "dumbass", "fatass", "loser", "killyourself", "kms", "kys", "noob", "stupid",
    "gaylord", "tranny", "femboy", "nazi", "hitler", "kkk", "terrorist", "isis", "pedo", "pedophile",
  
    // Sexual/explicit
    "sex", "sexy", "69", "420", "porn", "nude", "nudes", "boobs", "boobies", "tits", "dickhead", "fuckboy",
    "fuckgirl", "orgasm", "anal", "vagina", "masturbate", "ejaculate", "cum", "cumming", "balls", "horny", "clit",
    "milf", "nsfw", "deepthroat", "squirting", "moan", "bang", "rawdog", "bbc", "bdsm", "blowjob", "threesome",
  
    // Drugs and violence
    "weed", "cocaine", "meth", "heroin", "ecstasy", "lsd", "shrooms", "crack", "dope", "stoned", "highaf", "joint",
    "blunt", "overdose", "kill", "murder", "rape", "rapist", "abuse", "molest", "shoot", "gun", "bullet", "slaughter",
  
    // Misc hate and inappropriate
    "hate", "racist", "misogynist", "fascist", "incel", "groomer", "abuser", "misogyny", "homophobe", "homophobic",
    "suicide", "hangyourself", "gaschamber", "slave", "lynch", "uncensored", "oppression"
  ];
  
  