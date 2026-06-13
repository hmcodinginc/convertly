import { getJson, removeItem, setJson } from "@/services/storage/sessionStorageClient"

const STORAGE_KEY = "convertly.profile.drawers"

export type ProfileDrawerId = "edit" | "password"

export type EditDrawerPersistedState = {
  open: boolean
  firstName: string
  lastName: string
}

export type PasswordDrawerPersistedState = {
  open: boolean
  recoveryMode: boolean
  newPassword: string
  confirmPassword: string
}

type ProfileDrawerPersistedState = {
  edit?: EditDrawerPersistedState
  password?: PasswordDrawerPersistedState
}

function readState(): ProfileDrawerPersistedState {
  return getJson<ProfileDrawerPersistedState>(STORAGE_KEY, {})
}

function writeState(state: ProfileDrawerPersistedState): void {
  const hasEdit = state.edit?.open
  const hasPassword = state.password?.open

  if (!hasEdit && !hasPassword) {
    removeItem(STORAGE_KEY)
    return
  }

  setJson(STORAGE_KEY, state)
}

export function readEditDrawerState(): EditDrawerPersistedState | null {
  const edit = readState().edit
  return edit?.open ? edit : null
}

export function persistEditDrawerState(state: EditDrawerPersistedState): void {
  const current = readState()
  writeState({ ...current, edit: state })
}

export function clearEditDrawerState(): void {
  const current = readState()
  const { edit: _edit, ...rest } = current
  writeState(rest)
}

export function readPasswordDrawerState(): PasswordDrawerPersistedState | null {
  const password = readState().password
  return password?.open ? password : null
}

export function persistPasswordDrawerState(state: PasswordDrawerPersistedState): void {
  const current = readState()
  writeState({ ...current, password: state })
}

export function clearPasswordDrawerState(): void {
  const current = readState()
  const { password: _password, ...rest } = current
  writeState(rest)
}

export function clearAllProfileDrawerState(): void {
  removeItem(STORAGE_KEY)
}
