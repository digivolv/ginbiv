import { SCENE } from '../../config/scene'

export default function StudioEnvironment() {
  const L = SCENE.lights
  const F = SCENE.floor

  return (
    <>
      {/* Warm ambient fill */}
      <ambientLight color={L.ambientColor} intensity={L.ambientIntensity} />

      {/* Key light — main directional, casts shadows */}
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
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
      />

      {/* Cool fill from opposite side */}
      <directionalLight
        color={L.fillColor}
        intensity={L.fillIntensity}
        position={L.fillPosition}
      />

      {/* Soft rim from behind */}
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
    </>
  )
}
