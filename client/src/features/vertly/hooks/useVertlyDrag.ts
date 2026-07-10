import { useCallback, useEffect, useRef } from "react"

import type { VertlyPosition } from "@/features/vertly/types"
import { runVertlyInertia } from "@/features/vertly/utils/inertia"

const DRAG_THRESHOLD = 14

type UseVertlyDragOptions = {
  position: VertlyPosition
  isOpen: boolean
  setPosition: (position: VertlyPosition, options?: { snap?: boolean }) => void
  setDragging: (dragging: boolean) => void
  onToggle: () => void
}

function useVertlyDrag({
  position,
  isOpen,
  setPosition,
  setDragging,
  onToggle,
}: UseVertlyDragOptions) {
  const dragOffsetRef = useRef({ x: 0, y: 0 })
  const pointerStartRef = useRef({ x: 0, y: 0 })
  const lastMoveRef = useRef({ x: 0, y: 0, t: 0 })
  const velocityRef = useRef({ x: 0, y: 0 })
  const didDragRef = useRef(false)
  const isDraggingRef = useRef(false)
  const isPendingRef = useRef(false)
  const pointerIdRef = useRef<number | null>(null)
  const targetRef = useRef<HTMLElement | null>(null)
  const positionRef = useRef(position)
  const cancelInertiaRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    positionRef.current = position
  }, [position])

  useEffect(() => {
    return () => {
      cancelInertiaRef.current?.()
    }
  }, [])

  const releaseCapture = useCallback(() => {
    const target = targetRef.current
    const pointerId = pointerIdRef.current
    if (target && pointerId != null && target.hasPointerCapture(pointerId)) {
      target.releasePointerCapture(pointerId)
    }
  }, [])

  const finishDrag = useCallback(() => {
    releaseCapture()

    if (!isDraggingRef.current) {
      isPendingRef.current = false
      pointerIdRef.current = null
      targetRef.current = null
      return
    }

    isDraggingRef.current = false
    isPendingRef.current = false
    setDragging(false)

    const velocity = velocityRef.current
    const current = positionRef.current

    pointerIdRef.current = null
    targetRef.current = null

    if (Math.hypot(velocity.x, velocity.y) > 1.5) {
      cancelInertiaRef.current = runVertlyInertia(
        current,
        velocity,
        (next) => {
          positionRef.current = next
          setPosition(next, { snap: false })
        },
        (settled) => {
          positionRef.current = settled
          setPosition(settled, { snap: true })
        }
      )
      return
    }

    setPosition(current, { snap: true })
  }, [releaseCapture, setDragging, setPosition])

  const handleDocumentPointerMove = useCallback(
    (event: PointerEvent) => {
      if (!isPendingRef.current && !isDraggingRef.current) return
      if (pointerIdRef.current !== event.pointerId) return
      if (isOpen) return

      const deltaX = event.clientX - pointerStartRef.current.x
      const deltaY = event.clientY - pointerStartRef.current.y
      const distance = Math.hypot(deltaX, deltaY)

      if (!isDraggingRef.current) {
        if (distance < DRAG_THRESHOLD) return

        const target = targetRef.current
        if (!target) return

        isDraggingRef.current = true
        didDragRef.current = true
        setDragging(true)
        target.setPointerCapture(event.pointerId)
      }

      event.preventDefault()

      const now = performance.now()
      const elapsed = Math.max(now - lastMoveRef.current.t, 1)
      velocityRef.current = {
        x: ((event.clientX - lastMoveRef.current.x) / elapsed) * 16,
        y: ((event.clientY - lastMoveRef.current.y) / elapsed) * 16,
      }
      lastMoveRef.current = { x: event.clientX, y: event.clientY, t: now }

      const next = {
        x: event.clientX - dragOffsetRef.current.x,
        y: event.clientY - dragOffsetRef.current.y,
      }
      positionRef.current = next
      setPosition(next, { snap: false })
    },
    [isOpen, setDragging, setPosition]
  )

  const handleDocumentPointerUp = useCallback(
    (event: PointerEvent) => {
      if (pointerIdRef.current !== event.pointerId) return

      window.removeEventListener("pointermove", handleDocumentPointerMove)
      window.removeEventListener("pointerup", handleDocumentPointerUp)
      window.removeEventListener("pointercancel", handleDocumentPointerUp)

      finishDrag()
    },
    [finishDrag, handleDocumentPointerMove]
  )

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      if (isOpen) return
      if (event.button !== 0) return

      cancelInertiaRef.current?.()
      cancelInertiaRef.current = null

      didDragRef.current = false
      isDraggingRef.current = false
      isPendingRef.current = true
      pointerIdRef.current = event.pointerId
      targetRef.current = event.currentTarget

      pointerStartRef.current = { x: event.clientX, y: event.clientY }
      lastMoveRef.current = { x: event.clientX, y: event.clientY, t: performance.now() }
      velocityRef.current = { x: 0, y: 0 }

      dragOffsetRef.current = {
        x: event.clientX - positionRef.current.x,
        y: event.clientY - positionRef.current.y,
      }

      window.addEventListener("pointermove", handleDocumentPointerMove)
      window.addEventListener("pointerup", handleDocumentPointerUp)
      window.addEventListener("pointercancel", handleDocumentPointerUp)
    },
    [handleDocumentPointerMove, handleDocumentPointerUp, isOpen]
  )

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      if (didDragRef.current) {
        event.preventDefault()
        event.stopPropagation()
        didDragRef.current = false
        return
      }

      onToggle()
    },
    [onToggle]
  )

  useEffect(() => {
    return () => {
      window.removeEventListener("pointermove", handleDocumentPointerMove)
      window.removeEventListener("pointerup", handleDocumentPointerUp)
      window.removeEventListener("pointercancel", handleDocumentPointerUp)
    }
  }, [handleDocumentPointerMove, handleDocumentPointerUp])

  return {
    handlePointerDown,
    handleClick,
  }
}

export { useVertlyDrag, DRAG_THRESHOLD }
