import { useRef, useEffect, useCallback } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import gsap from 'gsap'
import type { DestinationId, CameraPose } from '../../config/destinations'
import { DESTINATIONS } from '../../config/destinations'
import { SCENE } from '../../config/scene'

interface CameraRigProps {
  active: DestinationId
  reducedMotion: boolean
  isMobile: boolean
}

export default function CameraRig({ active, reducedMotion, isMobile }: CameraRigProps) {
  const { camera } = useThree()
  const targetRef = useRef(new THREE.Vector3(0, 0, 0))
  const tlRef = useRef<gsap.core.Timeline | null>(null)
  const initialized = useRef(false)

  const getPose = useCallback((id: DestinationId): CameraPose => {
    const dest = DESTINATIONS.find(d => d.id === id)!
    return isMobile ? dest.mobile : dest.desktop
  }, [isMobile])

  // Set initial camera pose without animation
  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    const pose = getPose(active)
    camera.position.set(...pose.position)
    ;(camera as THREE.PerspectiveCamera).fov = pose.fov
    ;(camera as THREE.PerspectiveCamera).updateProjectionMatrix()
    targetRef.current.set(...pose.target)
    camera.lookAt(targetRef.current)
  }, [camera, active, getPose])

  // Animate to new destination
  useEffect(() => {
    if (!initialized.current) return

    const pose = getPose(active)
    const duration = reducedMotion
      ? SCENE.transition.reducedMotionDuration
      : SCENE.transition.duration

    // Kill previous timeline safely
    if (tlRef.current) {
      tlRef.current.kill()
      tlRef.current = null
    }

    const proxy = {
      px: camera.position.x,
      py: camera.position.y,
      pz: camera.position.z,
      tx: targetRef.current.x,
      ty: targetRef.current.y,
      tz: targetRef.current.z,
      fov: (camera as THREE.PerspectiveCamera).fov,
    }

    const tl = gsap.timeline()
    tl.to(proxy, {
      px: pose.position[0],
      py: pose.position[1],
      pz: pose.position[2],
      tx: pose.target[0],
      ty: pose.target[1],
      tz: pose.target[2],
      fov: pose.fov,
      duration,
      ease: SCENE.transition.ease,
      onUpdate() {
        camera.position.set(proxy.px, proxy.py, proxy.pz)
        targetRef.current.set(proxy.tx, proxy.ty, proxy.tz)
        ;(camera as THREE.PerspectiveCamera).fov = proxy.fov
        ;(camera as THREE.PerspectiveCamera).updateProjectionMatrix()
      },
    })

    tlRef.current = tl

    return () => {
      tl.kill()
    }
  }, [active, camera, getPose, reducedMotion])

  // Apply lookAt every frame so the camera tracks the target during transition
  useFrame(() => {
    camera.lookAt(targetRef.current)
  })

  return null
}
