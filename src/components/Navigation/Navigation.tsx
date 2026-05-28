import { useRef, useEffect } from 'react'
import gsap from 'gsap'
import type { DestinationId } from '../../config/destinations'
import { DESTINATIONS } from '../../config/destinations'
import { SCENE } from '../../config/scene'
import styles from './Navigation.module.css'

interface NavigationProps {
  active: DestinationId
  reducedMotion: boolean
  onNavigate: (id: DestinationId) => void
}

export default function Navigation({ active, reducedMotion, onNavigate }: NavigationProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const tlRef = useRef<gsap.core.Tween | null>(null)

  const activeIndex = DESTINATIONS.findIndex(d => d.id === active)
  const totalDests = DESTINATIONS.length

  useEffect(() => {
    if (!progressRef.current) return

    const targetX = (activeIndex / (totalDests - 1)) * 100

    if (tlRef.current) {
      tlRef.current.kill()
    }

    const duration = reducedMotion ? 0.001 : SCENE.transition.duration * 0.8

    tlRef.current = gsap.to(progressRef.current, {
      left: `${targetX}%`,
      duration,
      ease: SCENE.transition.ease,
    })

    return () => {
      tlRef.current?.kill()
    }
  }, [active, activeIndex, totalDests, reducedMotion])

  return (
    <nav
      className={styles.nav}
      aria-label="Experience navigation"
      data-testid="navigation"
    >
      {/* Travel / progress track */}
      <div ref={trackRef} className={styles.track} aria-hidden="true">
        <div className={styles.trackLine} />
        <div ref={progressRef} className={styles.dot} />
      </div>

      <ul className={styles.list} role="list">
        {DESTINATIONS.map((dest) => {
          const isActive = dest.id === active
          return (
            <li key={dest.id} className={styles.item}>
              <button
                type="button"
                className={`${styles.button} ${isActive ? styles.active : ''}`}
                onClick={() => onNavigate(dest.id)}
                aria-current={isActive ? 'page' : undefined}
                data-destination={dest.id}
              >
                {dest.label}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
