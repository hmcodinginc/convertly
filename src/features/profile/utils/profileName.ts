export function joinFullName(firstName: string, lastName: string, email?: string): string {
  const full = `${firstName} ${lastName}`.trim()
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
    return { firstName: trimmed, lastName: "" }
  }

  return {
    firstName: trimmed.slice(0, spaceIndex),
    lastName: trimmed.slice(spaceIndex + 1).trim(),
  }
}
