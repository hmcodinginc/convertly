import { cn } from "@/lib/utils"

import type { VertlyBodyMode, VertlyEyeState, VertlyLifeAction } from "@/features/vertly/types"
import type { RobotPose } from "@/features/vertly/utils/resolveRobotPose"

type VertlyCompanionCharacterProps = {
  bodyMode?: VertlyBodyMode
  isDragging?: boolean
  lifeAction?: VertlyLifeAction
  eyeState?: VertlyEyeState
  gazeX?: number
  gazeY?: number
  pose?: RobotPose
}

function VertlyCompanionCharacter({
  bodyMode = "idle",
  isDragging = false,
  lifeAction = "idle",
  eyeState = "idle",
  gazeX = 0,
  gazeY = 0,
  pose = { headTilt: 0, bodyLean: 0, armLeft: -24, armRight: 24 },
}: VertlyCompanionCharacterProps) {
  return (
    <span
      className={cn(
        "vertly-robot",
        `vertly-robot--mode-${bodyMode}`,
        isDragging && "vertly-robot--dragging",
        lifeAction !== "idle" && `vertly-robot--action-${lifeAction}`,
        `vertly-robot--eye-${eyeState}`
      )}
      style={{
        ["--vertly-gaze-x" as string]: `${gazeX}px`,
        ["--vertly-gaze-y" as string]: `${gazeY}px`,
        ["--vertly-head-tilt" as string]: `${pose.headTilt}deg`,
        ["--vertly-body-lean" as string]: `${pose.bodyLean}deg`,
        ["--vertly-arm-l" as string]: `${pose.armLeft}deg`,
        ["--vertly-arm-r" as string]: `${pose.armRight}deg`,
      }}
      aria-hidden
    >
      <span className="vertly-robot__hover-shadow" />
      <span className="vertly-robot__aura" />

      <span className="vertly-robot__rig">
        <svg
          className="vertly-robot__svg"
          viewBox="0 0 56 76"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="vertly-head-ceramic" x1="14" y1="8" x2="42" y2="36">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="45%" stopColor="#f3f3f8" />
              <stop offset="100%" stopColor="#e6e6ee" />
            </linearGradient>
            <linearGradient id="vertly-body-ceramic" x1="16" y1="44" x2="40" y2="72">
              <stop offset="0%" stopColor="#fafafc" />
              <stop offset="100%" stopColor="#e4e4ec" />
            </linearGradient>
            <linearGradient id="vertly-arm-ceramic" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="55%" stopColor="#f2f2f8" />
              <stop offset="100%" stopColor="#e2e2ea" />
            </linearGradient>
            <linearGradient id="vertly-head-shine" x1="28" y1="10" x2="28" y2="34">
              <stop offset="0%" stopColor="rgba(255,255,255,0.65)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0.05)" />
            </linearGradient>
            <radialGradient id="vertly-eye-glow" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="1" />
              <stop offset="65%" stopColor="var(--accent)" stopOpacity="0.5" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
            </radialGradient>
            <filter id="vertly-robot-shadow" x="-30%" y="-20%" width="160%" height="160%">
              <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodOpacity="0.2" />
            </filter>
            <filter id="vertly-arm-shadow" x="-40%" y="-20%" width="180%" height="180%">
              <feDropShadow dx="0" dy="1" stdDeviation="1.2" floodOpacity="0.14" />
            </filter>
          </defs>

          <g className="vertly-robot__arm vertly-robot__arm--left">
            <rect
              x="5"
              y="49"
              width="5.5"
              height="13"
              rx="2.75"
              fill="url(#vertly-arm-ceramic)"
              filter="url(#vertly-arm-shadow)"
            />
            <rect x="5.5" y="50" width="2" height="5" rx="1" fill="rgba(255,255,255,0.45)" />
          </g>

          <g className="vertly-robot__arm vertly-robot__arm--right">
            <rect
              x="45.5"
              y="49"
              width="5.5"
              height="13"
              rx="2.75"
              fill="url(#vertly-arm-ceramic)"
              filter="url(#vertly-arm-shadow)"
            />
            <rect x="48" y="50" width="2" height="5" rx="1" fill="rgba(255,255,255,0.45)" />
          </g>

          <g className="vertly-robot__torso">
            <ellipse
              cx="28"
              cy="58"
              rx="13.5"
              ry="14.5"
              fill="url(#vertly-body-ceramic)"
              filter="url(#vertly-robot-shadow)"
            />
            <ellipse cx="28" cy="58" rx="13.5" ry="14.5" fill="rgba(0,0,0,0.04)" />
            <ellipse cx="24" cy="52" rx="3" ry="5" fill="rgba(255,255,255,0.35)" />
          </g>

          <rect
            className="vertly-robot__neck"
            x="25"
            y="40.5"
            width="6"
            height="5.5"
            rx="2"
            fill="#d8d8e0"
          />

          <g className="vertly-robot__head-group">
            <ellipse
              cx="28"
              cy="24"
              rx="17"
              ry="15.5"
              fill="url(#vertly-head-ceramic)"
              filter="url(#vertly-robot-shadow)"
            />
            <ellipse
              cx="28"
              cy="24"
              rx="17"
              ry="15.5"
              fill="url(#vertly-head-shine)"
              opacity="0.7"
            />

            <path
              className="vertly-robot__visor"
              d="M12 21 C12 14.5 18.5 10 28 10 C37.5 10 44 14.5 44 21 C44 24.5 40.5 26.5 28 26.5 C15.5 26.5 12 24.5 12 21Z"
              fill="#12121a"
            />
            <path
              d="M14 20.5 C14 16 19 12.5 28 12.5 C37 12.5 42 16 42 20.5"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="0.75"
              fill="none"
            />

            <g className="vertly-robot__eyes">
              <ellipse className="vertly-robot__eye-glow" cx="21.5" cy="20" rx="7.5" ry="6" />
              <ellipse className="vertly-robot__eye-glow" cx="34.5" cy="20" rx="7.5" ry="6" />
              <ellipse className="vertly-robot__eye" cx="21.5" cy="20" rx="4.8" ry="5.8" />
              <ellipse className="vertly-robot__eye" cx="34.5" cy="20" rx="4.8" ry="5.8" />
              <ellipse className="vertly-robot__eye-shine" cx="20.2" cy="18.4" rx="1.3" ry="1.5" />
              <ellipse className="vertly-robot__eye-shine" cx="33.2" cy="18.4" rx="1.3" ry="1.5" />
            </g>
          </g>
        </svg>
      </span>
    </span>
  )
}

export { VertlyCompanionCharacter }
