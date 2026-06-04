'use client';

/**
 * Maths lesson scene — Surface Area of a Cube.
 *
 * Six face-planes start in their natural cube positions, then drift outward
 * along their normals on a sine cycle, then return. The student sees the cube
 * is six identical squares whose areas sum to 6a².
 *
 * Two exports:
 *   - <ExplodingCube />  — full Three.js scene
 *   - <ExplodingCubeLite /> — static SVG with caption rotation (no Canvas)
 *
 * Both teach the same beats; the page chooses which based on use3dMode().
 */

import { useFrame } from '@react-three/fiber';
import { useRef, useState, useEffect } from 'react';
import { type Mesh, type Group, Vector3, BoxGeometry, EdgesGeometry, LineBasicMaterial } from 'three';
import { AnantaCanvas } from '../canvas';
import { EditorialLights, ShadowGround } from '../lighting';

const SIZE = 1.5; // half-edge

// One material per face role. Subtle palette difference — top/bottom darker, sides lighter.
const COLOR_TOP = '#D97706';
const COLOR_SIDE = '#F59E0B';
const COLOR_BOTTOM = '#B45309';

const FACES: { color: string; position: [number, number, number]; rotation: [number, number, number] }[] = [
  // top, bottom
  { color: COLOR_TOP,    position: [0,  SIZE, 0], rotation: [-Math.PI / 2, 0, 0] },
  { color: COLOR_BOTTOM, position: [0, -SIZE, 0], rotation: [ Math.PI / 2, 0, 0] },
  // front, back
  { color: COLOR_SIDE, position: [0, 0,  SIZE], rotation: [0,         0, 0] },
  { color: COLOR_SIDE, position: [0, 0, -SIZE], rotation: [0,  Math.PI, 0] },
  // right, left
  { color: COLOR_SIDE, position: [ SIZE, 0, 0], rotation: [0,  Math.PI / 2, 0] },
  { color: COLOR_SIDE, position: [-SIZE, 0, 0], rotation: [0, -Math.PI / 2, 0] },
];

function CubeFaces({ explosion }: { explosion: number }) {
  const refs = useRef<(Mesh | null)[]>([]);

  useFrame(() => {
    FACES.forEach((face, i) => {
      const m = refs.current[i];
      if (!m) return;
      // Each face drifts along its outward normal — derive from rotation:
      // for our 6-face setup the normal is just the unit vector toward the base position.
      const base = new Vector3(...face.position).normalize();
      m.position.set(
        face.position[0] + base.x * explosion,
        face.position[1] + base.y * explosion,
        face.position[2] + base.z * explosion,
      );
    });
  });

  return (
    <>
      {FACES.map((face, i) => (
        <mesh
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          rotation={face.rotation}
          position={face.position}
          castShadow
          receiveShadow
        >
          <planeGeometry args={[SIZE * 2, SIZE * 2]} />
          <meshStandardMaterial
            color={face.color}
            roughness={0.5}
            metalness={0.15}
            transparent
            opacity={0.9}
            side={2 /* DoubleSide */}
          />
        </mesh>
      ))}
    </>
  );
}

function CubeEdges({ visible }: { visible: number }) {
  // Outline of the cube — fades as the faces drift apart.
  const ref = useRef<Mesh | null>(null);
  const geo = new EdgesGeometry(new BoxGeometry(SIZE * 2, SIZE * 2, SIZE * 2));
  const mat = new LineBasicMaterial({ color: '#1F1611', transparent: true, opacity: 0.18 * visible });
  // useFrame to keep opacity in sync; constructing mat each frame avoids stale refs.
  return (
    <lineSegments ref={ref as never} args={[geo, mat]} />
  );
}

function Scene() {
  const root = useRef<Group | null>(null);
  const [explosion, setExplosion] = useState(0);
  const [edgeAlpha, setEdgeAlpha] = useState(1);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const phase = (Math.sin(t * Math.PI / 4) + 1) / 2; // 0..1 over 8s
    const e = phase * 0.85;
    setExplosion(e);
    setEdgeAlpha(Math.max(0, 1 - phase * 1.6));

    if (root.current) root.current.rotation.y = t * 0.18;
  });

  return (
    <group ref={root}>
      <CubeFaces explosion={explosion} />
      <CubeEdges visible={edgeAlpha} />
    </group>
  );
}

export function ExplodingCube({ className }: { className?: string }) {
  return (
    <AnantaCanvas className={className} cameraPosition={[4, 3, 6]} fov={40}>
      <EditorialLights />
      <ShadowGround y={-1.8} radius={8} />
      <Scene />
    </AnantaCanvas>
  );
}

// ============================================================
// Lite mode — same teaching, no Canvas
// ============================================================

const LITE_BEATS: { caption: string; visual: 'cube' | 'faces' | 'formula' }[] = [
  { caption: 'A cube has six identical square faces.', visual: 'cube' },
  { caption: "Let's pull the faces apart — you can see all six.", visual: 'faces' },
  { caption: 'Each face is a square of side a, with area a × a = a².', visual: 'faces' },
  { caption: 'Total surface area = a² + a² + a² + a² + a² + a² = 6a².', visual: 'formula' },
];

export function ExplodingCubeLite({ className }: { className?: string }) {
  const [beat, setBeat] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setBeat((b) => (b + 1) % LITE_BEATS.length), 4500);
    return () => clearInterval(id);
  }, []);

  const b = LITE_BEATS[beat]!;

  return (
    <div className={className} style={{ display: 'grid', placeItems: 'center', height: '100%', padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 480 }}>
        <CubeIllustration kind={b.visual} />
        <p
          className="serif"
          style={{
            fontSize: 18,
            color: 'var(--ink)',
            marginTop: 20,
            transition: 'opacity .35s ease',
          }}
        >
          {b.caption}
        </p>
        <div className="mono" style={{ fontSize: 10, color: 'var(--ink-soft)', marginTop: 8 }}>
          STEP {beat + 1} OF {LITE_BEATS.length} · LITE MODE
        </div>
      </div>
    </div>
  );
}

function CubeIllustration({ kind }: { kind: 'cube' | 'faces' | 'formula' }) {
  if (kind === 'formula') {
    return (
      <div
        className="mono serif"
        style={{
          padding: '24px 32px',
          background: 'var(--ink)',
          color: '#FEF3C7',
          borderRadius: 16,
          fontSize: 28,
          fontWeight: 600,
          display: 'inline-block',
        }}
      >
        SA = 6 × a²
      </div>
    );
  }

  // Two simple isometric illustrations: closed cube, exploded faces.
  const closed = kind === 'cube';
  return (
    <svg viewBox="0 0 200 160" width="220" height="180" style={{ display: 'block', margin: '0 auto' }}>
      <defs>
        <linearGradient id="top" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
        <linearGradient id="left" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FCD34D" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
        <linearGradient id="right" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#D97706" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>
      </defs>

      {closed ? (
        <>
          {/* closed isometric cube */}
          <polygon points="100,20 160,50 160,110 100,140 40,110 40,50" fill="url(#left)" stroke="#1F1611" strokeWidth="1" />
          <polygon points="100,20 160,50 100,80 40,50" fill="url(#top)" stroke="#1F1611" strokeWidth="1" />
          <polygon points="100,80 160,50 160,110 100,140" fill="url(#right)" stroke="#1F1611" strokeWidth="1" />
        </>
      ) : (
        <>
          {/* exploded — six squares on a cross-net */}
          <rect x="80"  y="20" width="40" height="40" fill="url(#top)"   stroke="#1F1611" strokeWidth="1" />
          <rect x="80"  y="60" width="40" height="40" fill="url(#left)"  stroke="#1F1611" strokeWidth="1" />
          <rect x="80"  y="100" width="40" height="40" fill="url(#right)" stroke="#1F1611" strokeWidth="1" />
          <rect x="40"  y="60" width="40" height="40" fill="url(#left)"  stroke="#1F1611" strokeWidth="1" />
          <rect x="120" y="60" width="40" height="40" fill="url(#left)"  stroke="#1F1611" strokeWidth="1" />
          <rect x="160" y="60" width="40" height="40" fill="url(#right)" stroke="#1F1611" strokeWidth="1" />
        </>
      )}
    </svg>
  );
}
