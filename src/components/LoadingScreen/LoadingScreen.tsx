import { useEffect, useRef, useState } from 'react'
import styles from './LoadingScreen.module.css'

interface Props {
  visible: boolean
}

export default function LoadingScreen({ visible }: Props) {
  const barRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(true)

  // Animate bar filling on mount
  useEffect(() => {
    if (!barRef.current) return
    const bar = barRef.current
    bar.style.transform = 'scaleX(0)'
    const raf = requestAnimationFrame(() => {
      bar.style.transition = 'transform 2.0s cubic-bezier(0.16,1,0.3,1)'
      bar.style.transform = 'scaleX(0.82)'
    })
    return () => cancelAnimationFrame(raf)
  }, [])

  // Fade out and unmount when !visible
  useEffect(() => {
    if (visible || !overlayRef.current) return
    const overlay = overlayRef.current
    overlay.style.transition = 'opacity 0.7s ease'
    overlay.style.opacity = '0'
    const timer = setTimeout(() => setMounted(false), 720)
    return () => clearTimeout(timer)
  }, [visible])

  if (!mounted) return null

  return (
    <div ref={overlayRef} className={styles.overlay} aria-hidden="true">
      <div className={styles.track}>
        <div ref={barRef} className={styles.bar} />
      </div>
    </div>
  )
}
