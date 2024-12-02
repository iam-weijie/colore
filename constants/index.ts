import album from "@/assets/icons/album.png";
import chat from "@/assets/icons/chat.png";
import check from "@/assets/icons/check.png";
import close from "@/assets/icons/close.png";
import comment from "@/assets/icons/comment.png";
import email from "@/assets/icons/email.png";
import google from "@/assets/icons/google.png";
import heart from "@/assets/icons/heart.png";
import home from "@/assets/icons/home.png";
import lock from "@/assets/icons/lock.png";
import logout from "@/assets/icons/logout.png";
import palette from "@/assets/icons/palette.png";
import pencil from "@/assets/icons/pencil.png";
import person from "@/assets/icons/person.png";
import pin from "@/assets/icons/pin.png";
import profile from "@/assets/icons/profile.png";
import refresh from "@/assets/icons/refresh.png";
import search from "@/assets/icons/search.png";
import trash from "@/assets/icons/trash.png";
import login from "@/assets/images/login_squares.png";
import signup from "@/assets/images/signup.png";
import { PostItColor } from "@/types/type";

export const icons = {
  person,
  email,
  lock,
  google,
  check,
  home,
  pin,
  chat,
  close,
  profile,
  album,
  logout,
  search,
  trash,
  pencil,
  refresh,
  heart,
  comment,
  palette,
};

export const images = {
  signup,
  login,
};

export const countries = [
  {
    id: "1",
    name: "USA",
    states: [
      { name: "California", cities: ["Los Angeles", "San Francisco"] },
      { name: "New York", cities: ["New York City", "Buffalo"] },
      { name: "Illinois", cities: ["Chicago", "Springfield"] },
    ],
  },
  {
    id: "2",
    name: "Canada",
    states: [
      { name: "Ontario", cities: ["Toronto", "Ottawa"] },
      { name: "British Columbia", cities: ["Vancouver", "Victoria"] },
      { name: "Quebec", cities: ["Montreal", "Quebec City"] },
    ],
  },
];
export const temporaryColors: PostItColor[] = [
  {
    name: "yellow",
    id: 0,
    hex: "#ffe640",
    rarity: "default",
    foldcolorhex: "#fef08a",
  },
  {
    name: "pink",
    id: 1,
    hex: "#fbb1d6",
    rarity: "default",
    foldcolorhex: "#ffc7e2",
  },
  {
    name: "light-blue",
    id: 2,
    hex: "#93c5fd",
    rarity: "default",
    foldcolorhex: "#b8e1ff",
  },
];
