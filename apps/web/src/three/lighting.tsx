'use client';

/**
 * Editorial 3-light preset that matches the cream/warm palette across Ananta.
 * Sun (warm directional, casts shadows) + fill (cooler, no shadow) + ambient.
 *
 * Drop <EditorialLights /> into any scene's <group> — the budget is one
 * shadow caster, three lights total. Stays within the perf limits set in
 * Ananta_3D_Strategy.html § 03.
 */
export function EditorialLights() {
  return (
    <>
      <ambientLight intensity={0.55} color="#FAF5EB" />

      <directionalLight
        castShadow
        position={[5, 8, 5]}
        intensity={1.1}
        color="#FFF5DC"
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
        shadow-bias={-0.0005}
      />

      <directionalLight
        position={[-5, 4, 5]}
        intensity={0.4}
        color="#FFE9C2"
      />
    </>
  );
}

/** Ground plane that receives soft shadows only — invisible material. */
export function ShadowGround({ y = -1.8, radius = 8 }: { y?: number; radius?: number }) {
  return (
    <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, y, 0]}>
      <circleGeometry args={[radius, 64]} />
      <meshStandardMaterial color="#FFFFFF" roughness={0.85} metalness={0.02} />
    </mesh>
  );
}
