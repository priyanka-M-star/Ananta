# `apps/web/src/three`

Production react-three-fiber scenes. Each scene exports BOTH a 3D component
and a Lite (2D) component; the consuming page picks one via `use3dMode()`.

This implements the budget and fallback strategy from `Ananta_3D_Strategy.html`.

## Layout

```
three/
├── canvas.tsx              Shared Canvas wrapper (DPR cap, shadow type, tone)
├── lighting.tsx            EditorialLights + ShadowGround presets
├── use-3d-mode.ts          Detects when to drop to Lite
└── scenes/
    ├── exploding-cube.tsx  Maths · Surface Area of a Cube
    │                       Exports { ExplodingCube, ExplodingCubeLite }
    └── bastille.tsx        Social · Storming of the Bastille (14 Jul 1789)
                            14-second stand → fall → tricolour cycle
                            Exports { Bastille, BastilleLite }
```

Routes that consume them:

```
/live-demo/maths    → ExplodingCube + ExplodingCubeLite (Praketa)
/live-demo/social   → Bastille     + BastilleLite     (Adhvara)
```

## How to add a new scene

1. Create `scenes/<name>.tsx`.
2. Export **two** components: `<name>` (uses Canvas) and `<name>Lite` (no Canvas).
3. Both must teach the same beats.
4. Lite mode runs without WebGL — pure SVG + CSS + Tailwind.
5. Stay under the budget:
   - ≤ 60 draw calls
   - ≤ 100k triangles on screen
   - ≤ 3 lights (1 shadow caster)
   - ≤ 320 KB JS added to the route (run `next-bundle-analyzer` after)
6. Import the scene with `next/dynamic` + `ssr: false` so the three bundle
   stays out of the parent route's main chunk.
7. Use `<AnantaCanvas>` and `<EditorialLights />` so the lighting and tone
   stay consistent across every scene.

## Why this pattern

- One file per scene, both rendering paths together — easy to compare.
- Lite mode is never an afterthought. If you can't make a Lite, you didn't
  understand the lesson clearly enough.
- Dynamic import means a student who never visits `/live-demo` never
  downloads the three.js bundle.
