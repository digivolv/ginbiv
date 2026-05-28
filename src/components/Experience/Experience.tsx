import { Suspense, useCallback, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { SCENE } from '../../config/scene'
import type { DestinationId } from '../../config/destinations'
import CameraRig from './CameraRig'
import Monogram from './Monogram'
import StudioEnvironment from './StudioEnvironment'

interface ExperienceProps {
  active: DestinationId
  reducedMotion: boolean
  isMobile: boolean
  onSceneReady: () => void
}

export default function Experience({ active, reducedMotion, isMobile, onSceneReady }: ExperienceProps) {
  const [hasFailed, setHasFailed] = useState(false)

  const handleReady = useCallback(() => {
    onSceneReady()
  }, [onSceneReady])

  if (hasFailed) return null

  return (
    <Canvas
      aria-label="EL monogram sculpture — interactive 3D environment"
      role="img"
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: 'default',
      }}
      shadows
      dpr={SCENE.dpr}
      camera={{
        fov: 42,
        near: SCENE.camera.near,
        far: SCENE.camera.far,
        position: [0, 3.8, 5.2],
      }}
      onCreated={({ gl }) => {
        gl.setClearColor(SCENE.background)
        // Detect context loss
        gl.domElement.addEventListener('webglcontextlost', () => {
          setHasFailed(true)
        })
      }}
      style={{ position: 'fixed', inset: 0, width: '100%', height: '100%' }}
    >
      <Suspense fallback={null}>
        <StudioEnvironment />
        <Monogram onReady={handleReady} />
        <CameraRig active={active} reducedMotion={reducedMotion} isMobile={isMobile} />
      </Suspense>
    </Canvas>
  )
}
