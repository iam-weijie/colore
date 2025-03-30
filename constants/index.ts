import album from "@/assets/icons/album.png";
import bookmark from "@/assets/icons/bookmark.png";
import chat from "@/assets/icons/chat.png";
import check from "@/assets/icons/check.png";
import close from "@/assets/icons/close.png";
import comment from "@/assets/icons/comment.png";
import email from "@/assets/icons/email.png";
import globe from "@/assets/icons/globe.png";
import google from "@/assets/icons/google.png";
import heart from "@/assets/icons/heart.png";
import home from "@/assets/icons/home.png";
import lock from "@/assets/icons/lock.png";
import note from "@/assets/icons/note.png";
import palette from "@/assets/icons/palette.png";
import pencil from "@/assets/icons/pencil.png";
import person from "@/assets/icons/person.png";
import pin from "@/assets/icons/pin.png";
import profile from "@/assets/icons/profile.png";
import refresh from "@/assets/icons/refresh.png";
import smartcity from "@/assets/icons/smart-city-2.png";
import search from "@/assets/icons/search.png";
import send from "@/assets/icons/send.png";
import settings from "@/assets/icons/settings.png";
import trash from "@/assets/icons/trash.png";
import wink from "@/assets/icons/wink.png";
import placeholder from "@/assets/icons/placeholder.png";
import login from "@/assets/images/login_squares.png";

import { PostItColor } from "@/types/type";

import canada from "@/assets/countries/canada.png";
import usa from "@/assets/countries/united-states-of-america.png";
import france from "@/assets/countries/france.png";
import italy from "@/assets/countries/italy.png";
import china from "@/assets/countries/china.png";
import argentina from "@/assets/countries/argentina.png";

export const icons = {
  person,
  email,
  lock,
  google,
  check,
  home,
  pin,
  chat,
  globe,
  close,
  profile,
  album,
  search,
  trash,
  pencil,
  placeholder,
  refresh,
  heart,
  comment,
  palette,
  settings,
  smartcity,
  wink,
  note,
  send,
  bookmark,
};

export const countries = {
canada,
  usa,
  france,
  italy,
  china,
  argentina,
}
export const images = {
  login,
};


export const temporaryColors: PostItColor[] = [
  {
    name: "yellow",
    id: 0,
    hex: "#ffe640",
    rarity: "default",
    foldcolorhex: "#fef08a",
    fontColor: "#B29B00",
  },
  {
    name: "pink",
    id: 1,
    hex: "#fbb1d6",
    rarity: "default",
    foldcolorhex: "#ffc7e2",
    fontColor: "#D82C82",
  },
  {
    name: "light-blue",
    id: 2,
    hex: "#93c5fd",
    rarity: "default",
    foldcolorhex: "#b8e1ff",
    fontColor: "#2775CC",
  },
  {
    name: "baby-purple",
    id: 3,
    hex: "#CFB1FB",
    rarity: "default",
    foldcolorhex: "#E2C7FF",
    fontColor: "#8654CF",
  },
];
