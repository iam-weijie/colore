export function formatTime(minutes: number): string {
  const formattedMinutes = +minutes?.toFixed(0) || 0;

  if (formattedMinutes < 60) {
    return `${minutes} min`;
  } else {
    const hours = Math.floor(formattedMinutes / 60);
    const remainingMinutes = formattedMinutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  }
}

export function convertToLocal(rawDate: Date): Date {
  const offset = new Date().getTimezoneOffset() * 60000;
  const localDate = new Date(rawDate.getTime() - offset);
  return localDate;
}

export function formatDateTruncatedMonth(rawDate: Date): string {
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

export function formatDate(rawDate: Date): string {
  let date = new Date(rawDate);

  let day: string | number = date.getDate();
  let month: string | number = date.getMonth() + 1;
  let year = date.getFullYear();

  month = month < 10 ? `0${month}` : month;
  day = day < 10 ? `0${day}` : day;

  return `${month}/${day}/${year}`;
}

export function formatDateWithMonth(dateString: string): string {
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

export function calculateAge(birthday: Date): number {
  const today = new Date();

  let age = today.getFullYear() - birthday.getFullYear();
  const m = today.getMonth() - birthday.getMonth();

  if (m < 0 || (m === 0 && today.getDate() < birthday.getDate())) {
    age--;
  }

  return age;
}
