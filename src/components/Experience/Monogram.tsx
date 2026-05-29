import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js'
import { SCENE } from '../../config/scene'

const BASE_URL = import.meta.env.BASE_URL as string

interface MonogramProps {
  onReady: () => void
}

interface ParsedMonogram {
  geometries: THREE.BufferGeometry[]
  centerX: number
  centerZ: number
}

export default function Monogram({ onReady }: MonogramProps) {
  const groupRef = useRef<THREE.Group>(null)
  const [parsed, setParsed] = useState<ParsedMonogram | null>(null)
  const onReadyRef = useRef(onReady)
  useEffect(() => {
    onReadyRef.current = onReady
  })

  // Load and parse SVG into extruded geometries
  useEffect(() => {
    const loader = new SVGLoader()
    const url = BASE_URL.replace(/\/$/, '') + '/assets/el-monogram.svg'
    const cfg = SCENE.sculpture

    const extrudeSettings: THREE.ExtrudeGeometryOptions = {
      depth: cfg.extrudeDepth,
      bevelEnabled: cfg.bevelEnabled,
      bevelThickness: cfg.bevelThickness,
      bevelSize: cfg.bevelSize,
      bevelSegments: cfg.bevelSegments,
      curveSegments: 8,
    }

    loader.load(
      url,
      (data) => {
        const geos: THREE.BufferGeometry[] = []
        for (const path of data.paths) {
          const shapes = SVGLoader.createShapes(path)
          for (const shape of shapes) {
            const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings)

            // SVG Y-axis points downward; Three.js Y points upward.
            // SVGLoader preserves SVG y values, so without correction the
            // letter silhouettes are vertically inverted in 3D space.
            // applyMatrix4 flips Y on positions, updates normals via the
            // inverse-transpose normal matrix, and refreshes bounding
            // box + sphere in one atomic call.
            geo.applyMatrix4(new THREE.Matrix4().makeScale(1, -1, 1))

            // A Y-reflection inverts triangle winding (CW ↔ CCW).
            // Swap vertex 1 and 2 of every triangle to restore outward-facing
            // front faces before recomputing smooth vertex normals.
            const idx = geo.index!
            for (let i = 0; i < idx.count; i += 3) {
              const tmp = idx.getX(i + 1)
              idx.setX(i + 1, idx.getX(i + 2))
              idx.setX(i + 2, tmp)
            }
            idx.needsUpdate = true
            geo.computeVertexNormals()

            geos.push(geo)
          }
        }

        if (geos.length === 0) {
          onReadyRef.current()
          return
        }

        // Measure combined bounds for centering
        const positions: Float32Array[] = []
        let totalCount = 0
        for (const g of geos) {
          const pos = g.attributes['position'] as THREE.BufferAttribute
          positions.push(pos.array as Float32Array)
          totalCount += pos.count
        }
        const merged = new Float32Array(totalCount * 3)
        let offset = 0
        for (const p of positions) {
          merged.set(p, offset)
          offset += p.length
        }
        const tempGeo = new THREE.BufferGeometry()
        tempGeo.setAttribute('position', new THREE.BufferAttribute(merged, 3))
        tempGeo.computeBoundingBox()
        const bbox = tempGeo.boundingBox!
        tempGeo.dispose()

        const centerX = (bbox.max.x + bbox.min.x) / 2
        const centerY = (bbox.max.y + bbox.min.y) / 2

        setParsed({ geometries: geos, centerX, centerZ: centerY })
      },
      undefined,
      () => {
        onReadyRef.current()
      }
    )
  }, [])

  // Apply orientation once geometry is in the DOM
  useEffect(() => {
    if (!parsed || !groupRef.current) return
    const cfg = SCENE.sculpture
    const g = groupRef.current
    // SVG Y-axis is inverted; rotate -90° on X to lay the front face flat upward
    g.rotation.x = -Math.PI / 2
    g.scale.setScalar(cfg.scale)
    // Centre the monogram at world origin
    g.position.set(
      -parsed.centerX * cfg.scale,
      cfg.yFloor,
      parsed.centerZ * cfg.scale
    )
    onReadyRef.current()
  }, [parsed])

  if (!parsed) return null

  return (
    <group ref={groupRef}>
      {parsed.geometries.map((geo, i) => (
        <mesh key={i} geometry={geo} castShadow receiveShadow>
          <meshStandardMaterial
            color={SCENE.sculpture.color}
            roughness={SCENE.sculpture.roughness}
            metalness={SCENE.sculpture.metalness}
          />
        </mesh>
      ))}
    </group>
  )
}
