import styles from './SceneFallback.module.css'

export default function SceneFallback() {
  return (
    <div className={styles.container} role="alert">
      <p className={styles.message}>
        This experience requires WebGL. Please try a modern browser with hardware acceleration enabled.
      </p>
    </div>
  )
}
