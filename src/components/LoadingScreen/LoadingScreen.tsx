import { useEffect, useRef } from 'react'
import styles from './LoadingScreen.module.css'

interface Props {
  visible: boolean
}

export default function LoadingScreen({ visible }: Props) {
  const barRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!visible || !barRef.current) return
    barRef.current.style.transform = 'scaleX(0)'
    const raf = requestAnimationFrame(() => {
      if (!barRef.current) return
      barRef.current.style.transition = 'transform 1.8s cubic-bezier(0.16,1,0.3,1)'
      barRef.current.style.transform = 'scaleX(0.85)'
    })
    return () => cancelAnimationFrame(raf)
  }, [visible])

  if (!visible) return null

  return (
    <div className={styles.overlay} aria-hidden="true">
      <div className={styles.track}>
        <div ref={barRef} className={styles.bar} />
      </div>
    </div>
  )
}
