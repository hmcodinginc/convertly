/** Capitalize only the first letter; leave the rest unchanged. e.g. jHON → JHON, raj → Raj */
export function capitalizeNamePart(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ""
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
}

export function formatPersonName(firstName: string, lastName: string): {
  firstName: string
  lastName: string
  fullName: string
} {
  const nextFirst = capitalizeNamePart(firstName)
  const nextLast = capitalizeNamePart(lastName)
  return {
    firstName: nextFirst,
    lastName: nextLast,
    fullName: `${nextFirst} ${nextLast}`.trim(),
  }
}

export function joinFullName(firstName: string, lastName: string, email?: string): string {
  const full = formatPersonName(firstName, lastName).fullName
  if (full) return full
  return email?.trim() ?? ""
}

export function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const trimmed = fullName.trim()
  if (!trimmed) {
    return { firstName: "", lastName: "" }
  }

  const spaceIndex = trimmed.indexOf(" ")
  if (spaceIndex === -1) {
    return { firstName: capitalizeNamePart(trimmed), lastName: "" }
  }

  return {
    firstName: capitalizeNamePart(trimmed.slice(0, spaceIndex)),
    lastName: capitalizeNamePart(trimmed.slice(spaceIndex + 1)),
  }
}
