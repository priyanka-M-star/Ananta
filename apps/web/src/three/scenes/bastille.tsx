'use client';

/**
 * Social Science lesson scene — The Storming of the Bastille (14 July 1789).
 *
 * Stylised stone fortress: central keep + 4 corner towers + outer wall ring
 * + gate + a small crowd of silhouette figures.
 *
 * 14-second animation cycle, driven by elapsed time:
 *   0–4 s   stand     fortress intact, slow camera orbit
 *   4–7 s   fall      corner towers tilt outward, center keep sinks
 *   7–10 s  flag      tricolour rises from the centre on a pole
 *   10–14 s rebuild   everything resets for the loop
 *
 * Exports { Bastille, BastilleLite } per the 3D Strategy contract.
 */

import { useFrame } from '@react-three/fiber';
import { useRef, useMemo, useState, useEffect } from 'react';
import { type Group, type Mesh, Vector3 } from 'three';
import { AnantaCanvas } from '../canvas';
import { EditorialLights, ShadowGround } from '../lighting';

const STONE_LIGHT = '#C9B59B';
const STONE_DARK = '#A08566';
const STONE_SHADOW = '#7B6347';
const WOOD = '#4A2C1A';
const FLAG_BLUE = '#0055A4';
const FLAG_WHITE = '#F5F5F5';
const FLAG_RED = '#EF4135';

const CORNER_POSITIONS: [number, number, number][] = [
  [-2.2, 0, -2.2],
  [ 2.2, 0, -2.2],
  [-2.2, 0,  2.2],
  [ 2.2, 0,  2.2],
];

const CYCLE_SECONDS = 14;

interface Phase {
  stand: number;   // 0..1 — fortress visible
  fall: number;    // 0..1 — towers tilted outward
  flag: number;    // 0..1 — flag risen + scaled up
}

function phaseAt(t: number): Phase {
  const c = (t % CYCLE_SECONDS) / CYCLE_SECONDS;
  // 0–0.29 stand · 0.29–0.50 fall · 0.50–0.71 flag · 0.71–1.0 rebuild
  if (c < 0.29)      return { stand: 1, fall: 0, flag: 0 };
  if (c < 0.50) {
    const p = (c - 0.29) / 0.21;
    return { stand: 1 - p, fall: p, flag: 0 };
  }
  if (c < 0.71) {
    const p = (c - 0.50) / 0.21;
    return { stand: 0, fall: 1, flag: p };
  }
  const p = (c - 0.71) / 0.29;
  return { stand: p, fall: 1 - p, flag: Math.max(0, 1 - p * 1.3) };
}

function CornerTower({ basePos, phase }: { basePos: [number, number, number]; phase: Phase }) {
  const ref = useRef<Group | null>(null);
  const angle = Math.atan2(basePos[2], basePos[0]);

  useFrame(() => {
    const g = ref.current;
    if (!g) return;
    const tilt = phase.fall * (Math.PI / 2.2);
    g.rotation.x = -Math.sin(angle) * tilt;
    g.rotation.z =  Math.cos(angle) * tilt;
    g.position.x = basePos[0] + Math.cos(angle) * phase.fall * 0.8;
    g.position.z = basePos[2] + Math.sin(angle) * phase.fall * 0.8;
    g.position.y = -phase.fall * 0.5;
  });

  // 8 battlement notches around the rim
  const battlements = useMemo(
    () =>
      Array.from({ length: 8 }).map((_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return [Math.cos(a) * 0.78, 3.75, Math.sin(a) * 0.78] as [number, number, number];
      }),
    [],
  );

  return (
    <group ref={ref} position={basePos}>
      {/* tower body */}
      <mesh castShadow receiveShadow position={[0, 1.8, 0]}>
        <cylinderGeometry args={[0.7, 0.85, 3.6, 14]} />
        <meshStandardMaterial color={STONE_LIGHT} roughness={0.85} />
      </mesh>
      {/* battlements */}
      {battlements.map((p, i) => (
        <mesh key={i} castShadow position={p}>
          <boxGeometry args={[0.22, 0.25, 0.22]} />
          <meshStandardMaterial color={STONE_DARK} roughness={0.9} />
        </mesh>
      ))}
      {/* conical roof */}
      <mesh castShadow position={[0, 4.25, 0]}>
        <coneGeometry args={[0.78, 0.9, 14]} />
        <meshStandardMaterial color={STONE_DARK} roughness={0.9} />
      </mesh>
    </group>
  );
}

function CentralKeep({ phase }: { phase: Phase }) {
  const keepRef = useRef<Mesh | null>(null);
  const towerRef = useRef<Mesh | null>(null);
  const roofRef = useRef<Mesh | null>(null);

  useFrame(({ clock }) => {
    const k = 1 - phase.fall * 0.7;
    if (keepRef.current) {
      keepRef.current.scale.setScalar(k);
      keepRef.current.rotation.z = Math.sin(clock.elapsedTime * 8) * phase.fall * 0.05; // tremor
    }
    if (towerRef.current) {
      towerRef.current.scale.setScalar(k);
      towerRef.current.position.y = 3.9 - phase.fall * 2.5;
    }
    if (roofRef.current) {
      roofRef.current.scale.setScalar(k);
      roofRef.current.position.y = 5.25 - phase.fall * 3.5;
      roofRef.current.rotation.z = phase.fall * 1.2; // topples
    }
  });

  return (
    <>
      <mesh ref={keepRef} castShadow receiveShadow position={[0, 1.5, 0]}>
        <boxGeometry args={[3.2, 3.0, 3.2]} />
        <meshStandardMaterial color={STONE_LIGHT} roughness={0.85} />
      </mesh>
      <mesh ref={towerRef} castShadow position={[0, 3.9, 0]}>
        <cylinderGeometry args={[0.9, 1.0, 1.8, 16]} />
        <meshStandardMaterial color={STONE_LIGHT} roughness={0.85} />
      </mesh>
      <mesh ref={roofRef} castShadow position={[0, 5.25, 0]}>
        <coneGeometry args={[1.05, 0.9, 16]} />
        <meshStandardMaterial color={STONE_DARK} roughness={0.9} />
      </mesh>
    </>
  );
}

function OuterWall({ phase }: { phase: Phase }) {
  const ref = useRef<Group | null>(null);

  useFrame(() => {
    if (ref.current) ref.current.position.y = -phase.fall * 0.6;
  });

  const segments = useMemo(() => {
    const count = 16;
    return Array.from({ length: count }).map((_, i) => {
      const a = (i / count) * Math.PI * 2;
      const notch = i % 4 === 2 ? 0.6 : 1; // every 4th seg shorter
      return { angle: a, notch };
    });
  }, []);

  return (
    <group ref={ref}>
      {segments.map(({ angle, notch }, i) => {
        const r = 4.6;
        return (
          <mesh
            key={i}
            castShadow
            receiveShadow
            position={[Math.cos(angle) * r, 0.8, Math.sin(angle) * r]}
            rotation={[0, -angle - Math.PI / 2, 0]}
            scale={[1, notch, 1]}
          >
            <boxGeometry args={[1.0, 1.6, 0.5]} />
            <meshStandardMaterial color={STONE_SHADOW} roughness={0.9} />
          </mesh>
        );
      })}
      {/* gate */}
      <mesh castShadow position={[0, 0.7, 4.6]}>
        <boxGeometry args={[1.2, 1.3, 0.55]} />
        <meshStandardMaterial color={WOOD} roughness={0.85} />
      </mesh>
    </group>
  );
}

function Crowd() {
  // 24 silhouette figures around the fortress; gentle bob
  const refs = useRef<(Group | null)[]>([]);
  const figures = useMemo(() => {
    const count = 24;
    return Array.from({ length: count }).map((_, i) => {
      const a = (i / count) * Math.PI * 2;
      const r = 6.8 + Math.random() * 1.2;
      return {
        position: [Math.cos(a) * r, 0, Math.sin(a) * r] as [number, number, number],
        phase: i * 0.27,
      };
    });
  }, []);

  useFrame(({ clock }) => {
    figures.forEach((f, i) => {
      const g = refs.current[i];
      if (!g) return;
      g.position.y = Math.sin(clock.elapsedTime * 2 + f.phase) * 0.08;
    });
  });

  return (
    <>
      {figures.map((f, i) => (
        <group key={i} ref={(el) => { refs.current[i] = el; }} position={f.position}>
          <mesh castShadow position={[0, 0.35, 0]}>
            <cylinderGeometry args={[0.16, 0.22, 0.7, 10]} />
            <meshStandardMaterial color="#3F2E22" roughness={0.6} />
          </mesh>
          <mesh castShadow position={[0, 0.82, 0]}>
            <sphereGeometry args={[0.13, 12, 10]} />
            <meshStandardMaterial color="#3F2E22" roughness={0.6} />
          </mesh>
        </group>
      ))}
    </>
  );
}

function Tricolour({ phase }: { phase: Phase }) {
  const ref = useRef<Group | null>(null);

  useFrame(() => {
    const g = ref.current;
    if (!g) return;
    const s = phase.flag;
    g.scale.setScalar(Math.max(0.001, s));
    g.position.y = -6 + s * 6;
  });

  return (
    <group ref={ref} position={[0, -6, 0]}>
      {/* pole */}
      <mesh castShadow position={[0, 2.75, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 5.5, 8]} />
        <meshStandardMaterial color={WOOD} roughness={0.7} />
      </mesh>
      {/* three stripes */}
      <mesh castShadow position={[0.32, 4.8, 0]}>
        <planeGeometry args={[0.5, 1.2]} />
        <meshStandardMaterial color={FLAG_BLUE} side={2} roughness={0.5} />
      </mesh>
      <mesh castShadow position={[0.82, 4.8, 0]}>
        <planeGeometry args={[0.5, 1.2]} />
        <meshStandardMaterial color={FLAG_WHITE} side={2} roughness={0.5} />
      </mesh>
      <mesh castShadow position={[1.32, 4.8, 0]}>
        <planeGeometry args={[0.5, 1.2]} />
        <meshStandardMaterial color={FLAG_RED} side={2} roughness={0.5} />
      </mesh>
    </group>
  );
}

function Scene() {
  const [phase, setPhase] = useState<Phase>({ stand: 1, fall: 0, flag: 0 });

  useFrame(({ clock, camera }) => {
    const p = phaseAt(clock.elapsedTime);
    setPhase(p);

    // Camera orbit — slowly closes in as the flag rises
    const angle = clock.elapsedTime * 0.13;
    const radius = 10 - p.flag * 1.5;
    camera.position.x = Math.sin(angle) * radius;
    camera.position.z = Math.cos(angle) * radius;
    camera.position.y = 3.5 + p.flag * 0.5;
    camera.lookAt(0, 1.5 + p.flag * 1, 0);
  });

  return (
    <>
      <CentralKeep phase={phase} />
      {CORNER_POSITIONS.map((p, i) => (
        <CornerTower key={i} basePos={p} phase={phase} />
      ))}
      <OuterWall phase={phase} />
      <Crowd />
      <Tricolour phase={phase} />
    </>
  );
}

export function Bastille({ className }: { className?: string }) {
  return (
    <AnantaCanvas className={className} cameraPosition={[7, 4, 9]} fov={40}>
      <EditorialLights />
      <ShadowGround y={0} radius={14} />
      <Scene />
    </AnantaCanvas>
  );
}

// ============================================================
// Lite mode — historical timeline + key events, no Canvas
// ============================================================

const LITE_BEATS: { caption: string; date: string }[] = [
  { date: 'May 1789', caption: 'King Louis XVI summons the Estates-General. France is broke; he wants more tax.' },
  { date: '20 Jun 1789', caption: 'The Third Estate locks itself in a tennis court and refuses to leave until France has a constitution.' },
  { date: '14 Jul 1789', caption: 'Parisians storm the Bastille. The fortress symbolised royal power — its fall is the start of the Revolution.' },
  { date: 'Aug 1789', caption: 'Declaration of the Rights of Man: all men are born free and equal.' },
  { date: 'Jan 1793', caption: 'Louis XVI is executed by guillotine. France becomes a republic.' },
  { date: 'Nov 1799', caption: 'Napoleon takes power, ending the Revolution and beginning the Empire.' },
];

export function BastilleLite({ className }: { className?: string }) {
  const [beat, setBeat] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setBeat((b) => (b + 1) % LITE_BEATS.length), 5500);
    return () => clearInterval(id);
  }, []);

  const b = LITE_BEATS[beat]!;
  return (
    <div className={className} style={{ display: 'grid', placeItems: 'center', height: '100%', padding: 28 }}>
      <div style={{ textAlign: 'center', maxWidth: 540 }}>
        <BastilleIllustration active={beat === 2} />
        <div className="mono" style={{ fontSize: 11, color: 'var(--ink-soft)', marginTop: 18, letterSpacing: '.05em' }}>
          {b.date.toUpperCase()}
        </div>
        <p className="serif" style={{ fontSize: 18, color: 'var(--ink)', marginTop: 6, lineHeight: 1.4 }}>
          {b.caption}
        </p>
        <div className="mono" style={{ fontSize: 10, color: 'var(--ink-soft)', marginTop: 10 }}>
          STEP {beat + 1} OF {LITE_BEATS.length} · LITE MODE
        </div>
      </div>
    </div>
  );
}

function BastilleIllustration({ active }: { active: boolean }) {
  // A simple SVG fortress that "falls" (towers tilted) when the highlighted beat is reached.
  return (
    <svg viewBox="0 0 240 160" width="260" height="180" style={{ display: 'block', margin: '0 auto' }}>
      <defs>
        <linearGradient id="stone" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#C9B59B" />
          <stop offset="100%" stopColor="#7B6347" />
        </linearGradient>
      </defs>
      {/* ground */}
      <line x1="10" y1="140" x2="230" y2="140" stroke="#1F1611" strokeWidth="1.5" />
      {/* central keep */}
      <g transform={active ? 'rotate(-2 120 130)' : 'rotate(0 120 130)'} style={{ transition: 'transform .5s ease' }}>
        <rect x="90" y="70" width="60" height="70" fill="url(#stone)" stroke="#1F1611" />
        <rect x="100" y="50" width="40" height="20" fill="url(#stone)" stroke="#1F1611" />
        <polygon points="100,50 120,30 140,50" fill="#A08566" stroke="#1F1611" />
      </g>
      {/* left tower */}
      <g
        transform={active ? 'rotate(-30 50 140)' : 'rotate(0 50 140)'}
        style={{ transition: 'transform .6s ease' }}
      >
        <rect x="40" y="80" width="20" height="60" fill="url(#stone)" stroke="#1F1611" />
        <polygon points="40,80 50,60 60,80" fill="#A08566" stroke="#1F1611" />
      </g>
      {/* right tower */}
      <g
        transform={active ? 'rotate(28 190 140)' : 'rotate(0 190 140)'}
        style={{ transition: 'transform .6s ease' }}
      >
        <rect x="180" y="80" width="20" height="60" fill="url(#stone)" stroke="#1F1611" />
        <polygon points="180,80 190,60 200,80" fill="#A08566" stroke="#1F1611" />
      </g>
      {/* tricolour appears after the fall */}
      {active && (
        <g>
          <line x1="120" y1="140" x2="120" y2="80" stroke="#4A2C1A" strokeWidth="2" />
          <rect x="120" y="80" width="14" height="18" fill="#0055A4" stroke="#1F1611" strokeWidth="0.5" />
          <rect x="134" y="80" width="14" height="18" fill="#F5F5F5" stroke="#1F1611" strokeWidth="0.5" />
          <rect x="148" y="80" width="14" height="18" fill="#EF4135" stroke="#1F1611" strokeWidth="0.5" />
        </g>
      )}
    </svg>
  );
}
