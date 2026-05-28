import { ContactShadows } from '@react-three/drei'
import { SCENE } from '../../config/scene'

export default function StudioEnvironment() {
  const L = SCENE.lights
  const F = SCENE.floor
  const CS = SCENE.contactShadow
  const S = L.shadowCameraSize

  return (
    <>
      {/* Low ambient — just lifts shadows off black, preserves shadow visibility */}
      <ambientLight color={L.ambientColor} intensity={L.ambientIntensity} />

      {/* Key light — raking from upper-right-front, primary shadow caster */}
      <directionalLight
        color={L.keyColor}
        intensity={L.keyIntensity}
        position={L.keyPosition}
        castShadow
        shadow-mapSize-width={L.shadowMapSize}
        shadow-mapSize-height={L.shadowMapSize}
        shadow-bias={L.shadowBias}
        shadow-radius={L.shadowRadius}
        shadow-camera-near={0.5}
        shadow-camera-far={50}
        shadow-camera-left={-S}
        shadow-camera-right={S}
        shadow-camera-top={S}
        shadow-camera-bottom={-S}
      />

      {/* Fill — soft cool from upper-left, keeps shadow sides readable */}
      <directionalLight
        color={L.fillColor}
        intensity={L.fillIntensity}
        position={L.fillPosition}
      />

      {/* Rim — back-high, catches top bevel edges */}
      <directionalLight
        color={L.rimColor}
        intensity={L.rimIntensity}
        position={L.rimPosition}
      />

      {/* Studio floor */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.001, 0]}
        receiveShadow
      >
        <planeGeometry args={[F.size, F.size]} />
        <meshStandardMaterial
          color={F.color}
          roughness={F.roughness}
          metalness={F.metalness}
        />
      </mesh>

      {/* ContactShadows — soft pooled shadow under the sculpture, always visible */}
      <ContactShadows
        position={[0, 0.001, 0]}
        opacity={CS.opacity}
        blur={CS.blur}
        far={CS.far}
        resolution={CS.resolution}
        color={CS.color}
        scale={16}
      />
    </>
  )
}
