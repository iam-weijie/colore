
import bookmark from "@/assets/icons/bookmark.png";
import check from "@/assets/icons/check.png";
import close from "@/assets/icons/close.png";
import comment from "@/assets/icons/comment.png";
import email from "@/assets/icons/email.png";
import globe from "@/assets/icons/globe.png";
import fire from "@/assets/icons/fire.png";
import home from "@/assets/icons/home.png";
import hide from "@/assets/icons/hide.png";
import lock from "@/assets/icons/lock.png";
import menu from "@/assets/icons/menu.png";
import notification from "@/assets/icons/notification.png";
import addUser from "@/assets/icons/add-user.png";
import chevron from "@/assets/icons/chevron.png";
import hamburgerMenu from "@/assets/icons/hamburger-menu.png";
import palette from "@/assets/icons/palette.png";
import pencil from "@/assets/icons/pencil.png";
import plus from "@/assets/icons/plus.png";
import info from "@/assets/icons/info.png";
import shuffle from "@/assets/icons/shuffle.png";
import pin from "@/assets/icons/pin.png";
import profile from "@/assets/icons/profile.png";
import planet from "@/assets/icons/planet-earth.png";
import send from "@/assets/icons/send.png";
import settings from "@/assets/icons/settings.png";
import star from "@/assets/icons/star.png";
import timer from "@/assets/icons/timer.png";
import trash from "@/assets/icons/trash.png";
import wink from "@/assets/icons/wink.png";
import back from "@/assets/icons/back.png"
import bold from "@/assets/icons/bold.png"
import italics from "@/assets/icons/italics.png"
import sparkles from "@/assets/icons/sparkles.png"
import sparklesFill from "@/assets/icons/sparkles-fill.png"
import underline from "@/assets/icons/underline.png"
import H from "@/assets/icons/h.png"
import oList from "@/assets/icons/ordered-list.png"
import add from "@/assets/icons/add.png"
import uList from "@/assets/icons/unordered-list.png"
import eraser from "@/assets/icons/eraser.png";
import user from "@/assets/icons/user.png";
import searchUsers from "@/assets/icons/search-users.png";
import removeUser from "@/assets/icons/remove-user.png";


import login from "@/assets/images/login_squares.png";

import { allColors, defaultColors } from "@/constants/colors";


/* CHARACTER IMAGES */
import alexelliotSad from "@/assets/characters/alexelliot-sad-1.png";
import alexelliotScared from "@/assets/characters/alexelliot-scared.png";

import bobChill from "@/assets/characters/bob-chill-1.png";
import bobChill2 from "@/assets/characters/bob-chill-2.png";
import bobChill3 from "@/assets/characters/bob-chill-3.png";
import bobLol from "@/assets/characters/bob-lol-1.png";

import rosieChill from "@/assets/characters/rosie-chill-1.png";
import rosieDisgusted from "@/assets/characters/rosie-disgusted-1.png";
import rosieMad from "@/assets/characters/rosie-mad-1.png";
import rosieMoney from "@/assets/characters/rosie-money-1.png";

import steveAmazed from "@/assets/characters/steve-amazed-1.png";
import steveAnnoyed from "@/assets/characters/steve-annoyed-1.png";
import steveAnnoyed2 from "@/assets/characters/steve-annoyed-2.png";
import steveNerd from "@/assets/characters/steve-nerd-1.png";


export const icons = {
  email,
  lock,
  globe,
  back,
  check,
  home,
  bold,
  italics,
  underline,
  H,
  oList,
  uList,
  pin,
  planet,
  close,
  fire,
  info, 
  shuffle,
  hide,
  timer,
  profile,
  menu,
  plus,
  star,
  trash,
  pencil,
  comment,
  palette,
  settings,
  wink,
  send,
  bookmark,
  chevron,
  notification,
  hamburgerMenu,
  addUser,
  eraser,
  sparklesFill,
  sparkles,
  add,
  user,
  searchUsers,
  removeUser
};

export const images = {
  login
};

export const characters = {
  alexelliotSad,
  alexelliotScared,

  bobChill,
  bobChill2,
  bobChill3,
  bobLol,

  rosieChill,
  rosieDisgusted,
  rosieMad,
  rosieMoney,

  steveAmazed,
  steveAnnoyed,
  steveAnnoyed2,
  steveNerd,
};

// Export colors for use in components
export const temporaryColors = allColors.slice(0, 5);
export { defaultColors, allColors };


export const characterMood = {
  alexelliot: [
    alexelliotSad,
    alexelliotScared,
  ],
  bob: [
    bobChill,
    bobChill2,
    bobChill3,
    bobLol,
  ],
  rosie: [
    rosieChill,
    rosieDisgusted,
    rosieMad,
    rosieMoney,
  ],
  steve: [
    steveAmazed,
    steveAnnoyed,
    steveAnnoyed2,
    steveNerd,
  ],
};


