"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRelativeTime = exports.AlgorithmRandomPosition = exports.cleanStoredPosition = exports.calculateAge = exports.formatDateWithMonth = exports.formatDate = exports.formatDateTruncatedMonth = exports.convertToLocal = exports.formatTime = void 0;
const react_native_1 = require("react-native");
function formatTime(minutes) {
    const formattedMinutes = +(minutes === null || minutes === void 0 ? void 0 : minutes.toFixed(0)) || 0;
    if (formattedMinutes < 60) {
        return `${minutes} min`;
    }
    else {
        const hours = Math.floor(formattedMinutes / 60);
        const remainingMinutes = formattedMinutes % 60;
        return `${hours}h ${remainingMinutes}m`;
    }
}
exports.formatTime = formatTime;
function convertToLocal(rawDate) {
    const offset = new Date().getTimezoneOffset() * 60000;
    const localDate = new Date(rawDate.getTime() - offset);
    return localDate;
}
exports.convertToLocal = convertToLocal;
function formatDateTruncatedMonth(rawDate) {
    const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
    ];
    const month = months[rawDate.getMonth()];
    const day = String(rawDate.getDate());
    const year = rawDate.getFullYear();
    // let hours = rawDate.getHours();
    // const minutes = String(rawDate.getMinutes());
    // const amOrPm = hours >= 12 ? "pm" : "am";
    // hours = hours % 12 || 12; // display 12am instead of 0
    return `${month}. ${day}, ${year}`;
}
exports.formatDateTruncatedMonth = formatDateTruncatedMonth;
function formatDate(rawDate) {
    let date = new Date(rawDate);
    let day = date.getDate();
    let month = date.getMonth() + 1;
    let year = date.getFullYear();
    month = month < 10 ? `0${month}` : month;
    day = day < 10 ? `0${day}` : day;
    return `${month}/${day}/${year}`;
}
exports.formatDate = formatDate;
function formatDateWithMonth(dateString) {
    const date = new Date(dateString);
    const day = date.getDate();
    const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
    ];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    return `${day < 10 ? "0" + day : day} ${month} ${year}`;
}
exports.formatDateWithMonth = formatDateWithMonth;
function calculateAge(birthday) {
    const today = new Date();
    let age = today.getFullYear() - birthday.getFullYear();
    const m = today.getMonth() - birthday.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthday.getDate())) {
        age--;
    }
    return age;
}
exports.calculateAge = calculateAge;
let storedPosition = [];
const POSTIT_WIDTH = 160;
const POSTIT_HEIGHT = 160;
const POSTIT_AREA = POSTIT_WIDTH * POSTIT_HEIGHT;
let accumulatedArea = 0;
const cleanStoredPosition = () => {
    storedPosition = [];
};
exports.cleanStoredPosition = cleanStoredPosition;
const MIN_DISTANCE = 40; // Minimum distance (in px) to avoid overlap
// Helper function to check for overlap
const isOverlapping = (newPos, positions) => {
    for (let pos of positions) {
        const distance = Math.sqrt(Math.pow(newPos.top - pos.top, 2) + Math.pow(newPos.left - pos.left, 2));
        if (distance < MIN_DISTANCE) {
            return true; // Overlap detected
        }
    }
    return false; // No overlap
};
const AlgorithmRandomPosition = (isPinned, _, postItCount) => {
    const screenWidth = react_native_1.Dimensions.get("window").width * 2.25;
    const screenHeight = react_native_1.Dimensions.get("window").height;
    if (isPinned) {
        return {
            top: 60 + Math.random() * 10,
            left: 40 + Math.random() * 10,
            rotate: `${Math.abs(Math.random() * 4)}deg`, // Only positive rotation for pinned
        };
    }
    const MAX_RETRIES = 50; // Increased retries
    let bestPosition = {
        top: Math.random() * (screenHeight - POSTIT_HEIGHT),
        left: Math.random() * (screenWidth - POSTIT_WIDTH),
        rotate: `${Math.abs(Math.random() * 8)}deg`, // Only positive rotation
    };
    let bestDistance = 0;
    for (let attempts = 0; attempts < MAX_RETRIES; attempts++) {
        const top = Math.random() * (screenHeight - POSTIT_HEIGHT);
        const left = Math.random() * (screenWidth - POSTIT_WIDTH);
        // Find minimum distance to existing post-its
        let minDistance = Infinity;
        for (const pos of storedPosition) {
            const dx = pos.left - left;
            const dy = pos.top - top;
            const distance = Math.sqrt(dx * dx + dy * dy);
            minDistance = Math.min(minDistance, distance);
        }
        // If no stored positions yet, or this position is better
        if (storedPosition.length === 0 || minDistance > bestDistance) {
            bestDistance = minDistance;
            bestPosition = {
                top,
                left,
                rotate: `${Math.abs(Math.random() * 8)}deg`,
            };
        }
        // If we found a good position, use it immediately
        if (minDistance > MIN_DISTANCE) {
            storedPosition.push({ top, left });
            return bestPosition;
        }
    }
    // After all retries, use the best position we found
    storedPosition.push({ top: bestPosition.top, left: bestPosition.left });
    return bestPosition;
};
exports.AlgorithmRandomPosition = AlgorithmRandomPosition;
/**
 * Formats a date to a relative time string (e.g., "just now", "1m", "2h", "3d", "1w", "2mo", "1y")
 * @param date The date to format (Date object or string)
 * @returns A string representing the relative time
 */
function getRelativeTime(date) {
    const now = new Date();
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    // Get time difference in milliseconds
    const diff = now.getTime() - dateObj.getTime();
    // Convert to seconds
    const seconds = Math.floor(diff / 1000);
    // Less than a minute
    if (seconds < 60) {
        return 'just now';
    }
    // Minutes (less than an hour)
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
        return `${minutes} minutes ago`;
    }
    // Hours (less than a day)
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
        return `${hours} hours ago`;
    }
    // Days (less than a week)
    const days = Math.floor(hours / 24);
    if (days < 7) {
        return `${days} days ago`;
    }
    // Weeks (less than a month)
    const weeks = Math.floor(days / 7);
    if (weeks < 4) {
        return `${weeks} weeks ago`;
    }
    // Months (less than a year)
    const months = Math.floor(days / 30);
    if (months < 12) {
        return `${months} months ago`;
    }
    // Years
    const years = Math.floor(days / 365);
    return `${years} years ago`;
}
exports.getRelativeTime = getRelativeTime;
