import { AnimatePresence, motion } from "framer-motion"
import { useCallback, useEffect, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  dismissBirthday,
  getBirthdayYearInTimezone,
  getTurningAge,
  isBirthdayDismissed,
  isBirthdayToday,
} from "@/features/profile/utils/birthday"
import { VertlyCompanionCharacter } from "@/features/vertly/components/launcher/VertlyCompanionCharacter"
import { useVertly } from "@/features/vertly/hooks/useVertly"
import type { VertlyLifeAction } from "@/features/vertly/types"
import { resolveVertlyEyeState } from "@/features/vertly/utils/resolveEyeState"
import { resolveRobotPose } from "@/features/vertly/utils/resolveRobotPose"
import { useAuthSession } from "@/hooks/useAuthSession"
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock"
import { isBusinessFoundationEnabled } from "@/lib/businessFoundation"
import { cn } from "@/lib/utils"
import * as settingsService from "@/services/settingsService"

function BirthdayCelebration() {
  const { account } = useAuthSession()
  const { close, setLauncherSuppressed, showSpeechBubble } = useVertly()
  const [timezone, setTimezone] = useState("UTC")
  const [open, setOpen] = useState(false)
  const [spinning, setSpinning] = useState(false)
  const lifeAction: VertlyLifeAction = "wave"

  useBodyScrollLock(open)

  useEffect(() => {
    if (!account?.userId || !isBusinessFoundationEnabled()) return
    let cancelled = false
    void settingsService
      .getSettings(account.userId)
      .then((settings) => {
        if (!cancelled) setTimezone(settings.preferences.timezone || "UTC")
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [account?.userId])

  const birthdate = account?.birthdate ?? null
  const year = getBirthdayYearInTimezone(timezone)

  useEffect(() => {
    if (!account?.userId || !birthdate) {
      setOpen(false)
      return
    }
    if (!isBirthdayToday(birthdate, timezone)) {
      setOpen(false)
      return
    }
    if (isBirthdayDismissed(account.userId, year)) {
      setOpen(false)
      return
    }
    setOpen(true)
  }, [account?.userId, birthdate, timezone, year])

  useEffect(() => {
    if (!open) return
    close()
    setLauncherSuppressed(true)
    return () => {
      setLauncherSuppressed(false)
    }
  }, [close, open, setLauncherSuppressed])

  useEffect(() => {
    if (!open) return

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reducedMotion) return

    let clearSpinTimer: number | null = null

    const runSpin = () => {
      if (clearSpinTimer !== null) window.clearTimeout(clearSpinTimer)
      setSpinning(false)
      window.requestAnimationFrame(() => {
        setSpinning(true)
        clearSpinTimer = window.setTimeout(() => {
          setSpinning(false)
          clearSpinTimer = null
        }, 1200)
      })
    }

    const firstSpin = window.setTimeout(runSpin, 1400)
    const interval = window.setInterval(runSpin, 10_000)

    return () => {
      window.clearTimeout(firstSpin)
      window.clearInterval(interval)
      if (clearSpinTimer !== null) window.clearTimeout(clearSpinTimer)
      setSpinning(false)
    }
  }, [open])

  const handleDismiss = useCallback(() => {
    if (account?.userId) {
      dismissBirthday(account.userId, year)
    }
    setOpen(false)
    window.setTimeout(() => {
      showSpeechBubble({
        message: "Have a good one.",
        autoDismissMs: 4200,
      })
    }, 280)
  }, [account?.userId, showSpeechBubble, year])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleDismiss()
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [handleDismiss, open])

  const age = useMemo(
    () => (birthdate ? getTurningAge(birthdate, timezone) : null),
    [birthdate, timezone]
  )

  const pose = useMemo(
    () => resolveRobotPose({ x: 0, y: 0 }, "success", false, false, lifeAction),
    [lifeAction]
  )

  const eyeState = useMemo(
    () =>
      resolveVertlyEyeState({
        bodyMode: "success",
        isHovered: false,
        hasSpeechBubble: false,
        lifeAction,
        gazeX: 0,
        gazeY: 0,
      }),
    [lifeAction]
  )

  const bubbles = useMemo(
    () =>
      Array.from({ length: 18 }, (_, index) => ({
        id: index,
        left: `${6 + ((index * 17) % 88)}%`,
        delay: (index % 7) * 0.35,
        duration: 5.5 + (index % 5) * 0.7,
        size: 8 + (index % 4) * 4,
      })),
    []
  )

  const confetti = useMemo(
    () =>
      Array.from({ length: 28 }, (_, index) => ({
        id: index,
        left: `${4 + ((index * 13) % 92)}%`,
        delay: (index % 9) * 0.12,
        duration: 2.4 + (index % 5) * 0.25,
        rotate: (index * 47) % 360,
        color:
          index % 4 === 0
            ? "#7c6cff"
            : index % 4 === 1
              ? "#35b3ff"
              : index % 4 === 2
                ? "#f0abfc"
                : "#fde68a",
      })),
    []
  )

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="birthday-celebration"
          role="dialog"
          aria-modal="true"
          aria-labelledby="birthday-celebration-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28 }}
        >
          <button
            type="button"
            className="birthday-celebration__backdrop"
            aria-label="Dismiss birthday card"
            onClick={handleDismiss}
          />

          <div className="birthday-celebration__fx" aria-hidden>
            {confetti.map((piece) => (
              <span
                key={`c-${piece.id}`}
                className="birthday-celebration__confetti"
                style={{
                  left: piece.left,
                  backgroundColor: piece.color,
                  animationDelay: `${piece.delay}s`,
                  animationDuration: `${piece.duration}s`,
                  ["--birthday-rotate" as string]: `${piece.rotate}deg`,
                }}
              />
            ))}
            {bubbles.map((bubble) => (
              <span
                key={`b-${bubble.id}`}
                className="birthday-celebration__bubble"
                style={{
                  left: bubble.left,
                  width: bubble.size,
                  height: bubble.size,
                  animationDelay: `${bubble.delay}s`,
                  animationDuration: `${bubble.duration}s`,
                }}
              />
            ))}
          </div>

          <motion.div
            className="birthday-celebration__card"
            initial={{ opacity: 0, y: 28, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="birthday-celebration__vertly">
              <p className="birthday-celebration__speech" aria-hidden>
                Happy birthday!
              </p>
              <div className="birthday-celebration__vertly-stage">
                <div
                  className={cn(
                    "birthday-celebration__vertly-rig",
                    spinning && "birthday-celebration__vertly-rig--spin"
                  )}
                >
                  <div className="birthday-celebration__vertly-face birthday-celebration__vertly-face--front">
                    <VertlyCompanionCharacter
                      bodyMode="success"
                      lifeAction={lifeAction}
                      eyeState={eyeState}
                      pose={pose}
                    />
                  </div>
                  <span
                    className="birthday-celebration__vertly-edge birthday-celebration__vertly-edge--left"
                    aria-hidden
                  />
                  <span
                    className="birthday-celebration__vertly-edge birthday-celebration__vertly-edge--right"
                    aria-hidden
                  />
                  <span className="birthday-celebration__vertly-face birthday-celebration__vertly-face--back" aria-hidden />
                </div>
                <span
                  className={cn(
                    "birthday-celebration__vertly-shadow",
                    spinning && "birthday-celebration__vertly-shadow--spin"
                  )}
                  aria-hidden
                />
              </div>
            </div>

            <p className="birthday-celebration__eyebrow">From Vertly</p>
            <h2 id="birthday-celebration-title" className="birthday-celebration__title">
              Happy birthday{account?.firstName ? `, ${account.firstName}` : ""}!
            </h2>
            <p className="birthday-celebration__body">
              {age
                ? `Congratulations on turning ${age}. Here’s to another year of sharper conversion work.`
                : "Congratulations — here’s to another year of sharper conversion work."}
            </p>
            <Button type="button" size="sm" onClick={handleDismiss}>
              Thanks — continue
            </Button>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

export { BirthdayCelebration }
