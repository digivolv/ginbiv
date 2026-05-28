import { useState, useCallback, useEffect, useRef } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import type { DestinationId } from './config/destinations'
import { DEFAULT_DESTINATION } from './config/destinations'
import Experience from './components/Experience/Experience'
import SceneFallback from './components/Experience/SceneFallback'
import Navigation from './components/Navigation/Navigation'
import LoadingScreen from './components/LoadingScreen/LoadingScreen'
import { useReducedMotion } from './hooks/useReducedMotion'
import { useIsMobile } from './hooks/useIsMobile'

export default function App() {
  const [active, setActive] = useState<DestinationId>(DEFAULT_DESTINATION)
  const [loading, setLoading] = useState(true)
  const reducedMotion = useReducedMotion()
  const isMobile = useIsMobile()
  const firstReady = useRef(false)

  const handleSceneReady = useCallback(() => {
    if (firstReady.current) return
    firstReady.current = true
    setTimeout(() => setLoading(false), 200)
  }, [])

  // Safety: reveal navigation even if WebGL stalls/fails
  useEffect(() => {
    const id = setTimeout(() => {
      if (!firstReady.current) {
        firstReady.current = true
        setLoading(false)
      }
    }, 6000)
    return () => clearTimeout(id)
  }, [])

  const handleNavigate = useCallback((id: DestinationId) => {
    setActive(id)
  }, [])

  return (
    <>
      <ErrorBoundary fallback={<SceneFallback />}>
        <main
          id="experience"
          aria-label="EL monogram sculptural experience"
          style={{ position: 'fixed', inset: 0, width: '100%', height: '100%' }}
        >
          <Experience
            active={active}
            reducedMotion={reducedMotion}
            isMobile={isMobile}
            onSceneReady={handleSceneReady}
          />
        </main>
      </ErrorBoundary>

      <LoadingScreen visible={loading} />

      {!loading && (
        <Navigation
          active={active}
          reducedMotion={reducedMotion}
          onNavigate={handleNavigate}
        />
      )}
    </>
  )
}
