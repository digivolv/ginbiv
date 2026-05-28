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

const mouse = { x: 0, y: 0 }
const smoothMouse = { x: 0, y: 0 }

function onMouseMove(e: MouseEvent) {
  mouse.x = (e.clientX / window.innerWidth - 0.5) * 2
  mouse.y = -(e.clientY / window.innerHeight - 0.5) * 2
}

export default function CameraRig({ active, reducedMotion, isMobile }: CameraRigProps) {
  const { camera } = useThree()
  const targetRef = useRef(new THREE.Vector3(0, 0, 0))
  const tlRef = useRef<gsap.core.Timeline | null>(null)
  const initialized = useRef(false)
  const prevActive = useRef<DestinationId | null>(null)

  const getPose = useCallback((id: DestinationId): CameraPose => {
    const dest = DESTINATIONS.find(d => d.id === id)!
    return isMobile ? dest.mobile : dest.desktop
  }, [isMobile])

  // Mouse parallax — subtle target shift, no positional drift
  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove, { passive: true })
    return () => window.removeEventListener('mousemove', onMouseMove)
  }, [])

  // Reveal: camera starts slightly withdrawn, drifts to INDEX pose
  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    prevActive.current = active

    const pose = getPose(active)

    camera.position.set(
      pose.position[0] * 0.96,
      pose.position[1] * (reducedMotion ? 1 : 1.30),
      pose.position[2] * (reducedMotion ? 1 : 1.14)
    )
    ;(camera as THREE.PerspectiveCamera).fov = pose.fov + (reducedMotion ? 0 : 7)
    ;(camera as THREE.PerspectiveCamera).updateProjectionMatrix()
    targetRef.current.set(...pose.target)
    camera.lookAt(targetRef.current)

    const duration = reducedMotion
      ? SCENE.transition.reducedMotionDuration
      : SCENE.transition.revealDuration

    const proxy = {
      px: camera.position.x,
      py: camera.position.y,
      pz: camera.position.z,
      fov: (camera as THREE.PerspectiveCamera).fov,
    }

    gsap.to(proxy, {
      px: pose.position[0],
      py: pose.position[1],
      pz: pose.position[2],
      fov: pose.fov,
      duration,
      ease: SCENE.transition.revealEase,
      onUpdate() {
        camera.position.set(proxy.px, proxy.py, proxy.pz)
        ;(camera as THREE.PerspectiveCamera).fov = proxy.fov
        ;(camera as THREE.PerspectiveCamera).updateProjectionMatrix()
      },
    })
  }, [camera, active, getPose, reducedMotion])

  // Navigate to new destination
  useEffect(() => {
    if (!initialized.current) return
    if (prevActive.current === active) return
    prevActive.current = active

    const pose = getPose(active)
    const duration = reducedMotion
      ? SCENE.transition.reducedMotionDuration
      : SCENE.transition.duration

    if (tlRef.current) { tlRef.current.kill(); tlRef.current = null }

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
    return () => { tl.kill() }
  }, [active, camera, getPose, reducedMotion])

  // Per-frame: smooth parallax offset on lookAt target + apply
  useFrame(() => {
    const str = SCENE.parallax.strength
    const sm = SCENE.parallax.smoothing

    if (!reducedMotion) {
      smoothMouse.x += (mouse.x - smoothMouse.x) * sm
      smoothMouse.y += (mouse.y - smoothMouse.y) * sm
    } else {
      smoothMouse.x = 0
      smoothMouse.y = 0
    }

    camera.lookAt(
      targetRef.current.x + smoothMouse.x * str,
      targetRef.current.y + smoothMouse.y * str * 0.45,
      targetRef.current.z
    )
  })

  return null
}
