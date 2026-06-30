export function formatRatingStars(rating: string): string {
  const val = parseFloat(rating);
  if (isNaN(val)) return "";
  const full = Math.floor(val);
  const half = val % 1 >= 0.5;
  return "★".repeat(full) + (half ? "½" : "");
}

function parseWatchedDate(watchedDate: string): Date | null {
  if (!watchedDate) return null;

  const dateOnlyMatch = watchedDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  const date = new Date(watchedDate);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatWatchedAgo(watchedDate: string): string {
  const date = parseWatchedDate(watchedDate);
  if (!date) return "";

  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const startOfWatchedDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
  const diffDays = Math.round(
    (startOfWatchedDate.getTime() - startOfToday.getTime()) /
      (24 * 60 * 60 * 1000),
  );

  const relativeTime = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  if (Math.abs(diffDays) < 7) return relativeTime.format(diffDays, "day");

  const diffWeeks = Math.round(diffDays / 7);
  if (Math.abs(diffDays) < 30) return relativeTime.format(diffWeeks, "week");

  const diffMonths =
    (date.getFullYear() - now.getFullYear()) * 12 +
    (date.getMonth() - now.getMonth());
  if (Math.abs(diffMonths) < 12) {
    return relativeTime.format(diffMonths, "month");
  }

  const diffYears = date.getFullYear() - now.getFullYear();
  return relativeTime.format(diffYears, "year");
}
