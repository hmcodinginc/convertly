type Ymd = { year: number; month: number; day: number }

function parseBirthdate(birthdate: string): Ymd | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthdate.trim())
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  if (!year || month < 1 || month > 12 || day < 1 || day > 31) return null
  return { year, month, day }
}

function getZonedYmd(timeZone: string, date = new Date()): Ymd {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timeZone || "UTC",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })

  const parts = formatter.formatToParts(date)
  const year = Number(parts.find((part) => part.type === "year")?.value)
  const month = Number(parts.find((part) => part.type === "month")?.value)
  const day = Number(parts.find((part) => part.type === "day")?.value)

  return {
    year: Number.isFinite(year) ? year : date.getUTCFullYear(),
    month: Number.isFinite(month) ? month : date.getUTCMonth() + 1,
    day: Number.isFinite(day) ? day : date.getUTCDate(),
  }
}

export function isBirthdayToday(birthdate: string, timeZone = "UTC"): boolean {
  const birth = parseBirthdate(birthdate)
  if (!birth) return false
  const today = getZonedYmd(timeZone)
  return birth.month === today.month && birth.day === today.day
}

/** Age the user turns on this birthday (in the given timezone). */
export function getTurningAge(birthdate: string, timeZone = "UTC"): number | null {
  const birth = parseBirthdate(birthdate)
  if (!birth) return null
  const today = getZonedYmd(timeZone)
  const age = today.year - birth.year
  return age > 0 && age < 150 ? age : null
}

export function formatBirthdateDisplay(birthdate: string): string {
  const birth = parseBirthdate(birthdate)
  if (!birth) return birthdate
  const date = new Date(Date.UTC(birth.year, birth.month - 1, birth.day))
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(date)
}

const DISMISS_PREFIX = "convertly.birthday.dismissed"

export function isBirthdayDismissed(userId: string, year: number): boolean {
  try {
    return localStorage.getItem(`${DISMISS_PREFIX}.${userId}.${year}`) === "1"
  } catch {
    return false
  }
}

export function dismissBirthday(userId: string, year: number): void {
  try {
    localStorage.setItem(`${DISMISS_PREFIX}.${userId}.${year}`, "1")
  } catch {
    /* ignore quota / private mode */
  }
}

export function getBirthdayYearInTimezone(timeZone = "UTC"): number {
  return getZonedYmd(timeZone).year
}
