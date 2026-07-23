import { AnimatePresence, motion } from "framer-motion"
import { Check, ChevronsUpDown, X } from "lucide-react"
import * as React from "react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Text } from "@/components/ui/typography/Text"
import { cn } from "@/lib/utils"

export type ComboboxOption = {
  value: string
  label: string
}

type ComboboxProps = {
  label: string
  value: string
  onChange: (value: string) => void
  options: ComboboxOption[]
  placeholder?: string
  searchPlaceholder?: string
  emptyLabel?: string
  noneLabel?: string
  allowNone?: boolean
  error?: string | null
  hint?: string
  disabled?: boolean
  id?: string
  containerClassName?: string
}

function rankOption(option: ComboboxOption, query: string): number {
  const label = option.label.toLowerCase()
  const code = option.value.toLowerCase()
  if (label === query || code === query) return 0
  if (label.startsWith(query) || code.startsWith(query)) return 1
  if (label.includes(query) || code.includes(query)) return 2
  return 3
}

function filterAndSortOptions(options: ComboboxOption[], query: string): ComboboxOption[] {
  const normalized = query.trim().toLowerCase()
  if (!normalized) {
    return [...options].sort((a, b) => a.label.localeCompare(b.label))
  }

  return options
    .map((option) => ({ option, rank: rankOption(option, normalized) }))
    .filter((entry) => entry.rank < 3)
    .sort((a, b) => a.rank - b.rank || a.option.label.localeCompare(b.option.label))
    .map((entry) => entry.option)
}

function Combobox({
  label,
  value,
  onChange,
  options,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  emptyLabel = "No results",
  noneLabel = "Prefer not to say",
  allowNone = true,
  error,
  hint,
  disabled = false,
  id,
  containerClassName,
}: ComboboxProps) {
  const generatedId = React.useId()
  const fieldId = id ?? generatedId
  const listboxId = `${fieldId}-listbox`
  const hintId = hint ? `${fieldId}-hint` : undefined
  const errorId = error ? `${fieldId}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined

  const containerRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [highlightIndex, setHighlightIndex] = React.useState(0)

  const selected = options.find((option) => option.value === value) ?? null
  const filtered = React.useMemo(() => filterAndSortOptions(options, query), [options, query])

  const items = React.useMemo(() => {
    const rows: Array<{ value: string; label: string; kind: "none" | "option" }> = []
    if (allowNone && !query.trim()) {
      rows.push({ value: "", label: noneLabel, kind: "none" })
    }
    for (const option of filtered) {
      rows.push({ value: option.value, label: option.label, kind: "option" })
    }
    return rows
  }, [allowNone, filtered, noneLabel, query])

  React.useEffect(() => {
    if (!open) return

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false)
        setQuery("")
      }
    }

    document.addEventListener("mousedown", handlePointerDown)
    return () => document.removeEventListener("mousedown", handlePointerDown)
  }, [open])

  React.useEffect(() => {
    setHighlightIndex(0)
  }, [query, open])

  function openCombobox() {
    if (disabled) return
    setOpen(true)
    setQuery("")
    window.setTimeout(() => inputRef.current?.focus(), 0)
  }

  function selectValue(next: string) {
    onChange(next)
    setOpen(false)
    setQuery("")
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) {
      if (event.key === "ArrowDown" || event.key === "Enter") {
        event.preventDefault()
        openCombobox()
      }
      return
    }

    if (event.key === "Escape") {
      event.preventDefault()
      setOpen(false)
      setQuery("")
      return
    }

    if (event.key === "ArrowDown") {
      event.preventDefault()
      setHighlightIndex((current) => Math.min(current + 1, Math.max(items.length - 1, 0)))
      return
    }

    if (event.key === "ArrowUp") {
      event.preventDefault()
      setHighlightIndex((current) => Math.max(current - 1, 0))
      return
    }

    if (event.key === "Enter") {
      event.preventDefault()
      const item = items[highlightIndex]
      if (item) selectValue(item.value)
    }
  }

  const displayValue = open ? query : (selected?.label ?? "")

  return (
    <div className={cn("auth-field", containerClassName)} ref={containerRef}>
      <Label htmlFor={fieldId} className="auth-field-label">
        {label}
      </Label>

      <div className="relative">
        <Input
          ref={inputRef}
          id={fieldId}
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          disabled={disabled}
          placeholder={open ? searchPlaceholder : placeholder}
          value={displayValue}
          onChange={(event) => {
            setQuery(event.target.value)
            if (!open) setOpen(true)
          }}
          onFocus={openCombobox}
          onClick={openCombobox}
          onKeyDown={handleKeyDown}
          className="pr-16"
          autoComplete="off"
        />

        <div className="pointer-events-none absolute top-1/2 right-2 flex -translate-y-1/2 items-center gap-0.5">
          {value && !disabled ? (
            <button
              type="button"
              tabIndex={-1}
              aria-label="Clear selection"
              className="pointer-events-auto flex size-7 items-center justify-center rounded-[var(--radius-sm)] text-muted transition-colors hover:bg-[color-mix(in_srgb,var(--surface)_90%,transparent)] hover:text-foreground"
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                selectValue("")
              }}
            >
              <X className="size-3.5" aria-hidden />
            </button>
          ) : null}
          <ChevronsUpDown className="size-4 text-muted" aria-hidden />
        </div>

        <AnimatePresence>
          {open ? (
            <motion.ul
              id={listboxId}
              role="listbox"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
              className="absolute z-40 mt-2 max-h-60 w-full overflow-y-auto rounded-[var(--radius-md)] border border-[color-mix(in_srgb,var(--border)_75%,transparent)] bg-[color-mix(in_srgb,var(--surface)_96%,transparent)] p-1.5 shadow-[0_18px_48px_-24px_rgba(0,0,0,0.9)] backdrop-blur-md"
            >
              {items.length === 0 ? (
                <li className="px-3 py-2.5 text-sm text-muted">{emptyLabel}</li>
              ) : (
                items.map((item, index) => {
                  const isSelected = item.value === value
                  const isHighlighted = index === highlightIndex
                  return (
                    <li key={`${item.kind}-${item.value || "none"}`} role="option" aria-selected={isSelected}>
                      <button
                        type="button"
                        onMouseEnter={() => setHighlightIndex(index)}
                        onClick={() => selectValue(item.value)}
                        className={cn(
                          "flex w-full items-center justify-between gap-3 rounded-[var(--radius-sm)] px-3 py-2 text-left text-sm transition-colors",
                          isHighlighted && "bg-[color-mix(in_srgb,var(--accent)_12%,transparent)]",
                          !isHighlighted && "hover:bg-[color-mix(in_srgb,var(--accent)_8%,transparent)]",
                          item.kind === "none" && "text-muted"
                        )}
                      >
                        <span className="truncate">{item.label}</span>
                        {isSelected ? (
                          <Check className="size-4 shrink-0 text-[color-mix(in_srgb,var(--accent)_85%,white)]" />
                        ) : null}
                      </button>
                    </li>
                  )
                })
              )}
            </motion.ul>
          ) : null}
        </AnimatePresence>
      </div>

      {hint ? (
        <Text id={hintId} variant="muted" size="sm" className="auth-field-hint max-w-none">
          {hint}
        </Text>
      ) : null}
      {error ? (
        <Text id={errorId} size="sm" className="auth-field-error max-w-none">
          {error}
        </Text>
      ) : null}
    </div>
  )
}

export { Combobox }
