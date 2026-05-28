import { ContactShadows } from '@react-three/drei'
import { SCENE } from '../../config/scene'

export default function StudioEnvironment() {
  const L = SCENE.lights
  const F = SCENE.floor
  const CS = SCENE.contactShadow

  return (
    <>
      {/* Warm ambient fill */}
      <ambientLight color={L.ambientColor} intensity={L.ambientIntensity} />

      {/* Key light — dominant directional from upper-right, casts shadows */}
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
        shadow-camera-far={40}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
      />

      {/* Cool fill from left-front */}
      <directionalLight
        color={L.fillColor}
        intensity={L.fillIntensity}
        position={L.fillPosition}
      />

      {/* Soft rim from behind-above */}
      <directionalLight
        color={L.rimColor}
        intensity={L.rimIntensity}
        position={L.rimPosition}
      />

      {/* Studio floor plane */}
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

      {/* Contact shadow — high-quality soft shadow independent of shadow maps */}
      <ContactShadows
        position={[0, 0.001, 0]}
        opacity={CS.opacity}
        blur={CS.blur}
        far={CS.far}
        resolution={CS.resolution}
        color={CS.color}
        scale={14}
      />
    </>
  )
}
