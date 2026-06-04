'use client';

import { Canvas as R3FCanvas, type CanvasProps } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import { Suspense, type ReactNode } from 'react';
import { ACESFilmicToneMapping, SRGBColorSpace, PCFSoftShadowMap } from 'three';

/**
 * Shared Canvas wrapper.
 * - Caps device pixel ratio at 2 so 3× phones don't melt
 * - Soft PCF shadows (editorial, not glow)
 * - sRGB output with mild filmic tone-mapping
 * - Suspense fallback for any scene that lazy-loads a glTF
 */
interface Props extends Omit<CanvasProps, 'children'> {
  children: ReactNode;
  cameraPosition?: [number, number, number];
  fov?: number;
}

export function AnantaCanvas({
  children,
  cameraPosition = [4, 3, 6],
  fov = 40,
  className,
  ...rest
}: Props) {
  return (
    <R3FCanvas
      className={className}
      shadows
      dpr={[1, 2]}
      gl={{
        antialias: true,
        outputColorSpace: SRGBColorSpace,
        toneMapping: ACESFilmicToneMapping,
        toneMappingExposure: 1.0,
        powerPreference: 'high-performance',
        alpha: true,
      }}
      onCreated={({ gl }) => {
        gl.shadowMap.type = PCFSoftShadowMap;
      }}
      {...rest}
    >
      <PerspectiveCamera makeDefault position={cameraPosition} fov={fov} />
      <Suspense fallback={null}>{children}</Suspense>
    </R3FCanvas>
  );
}
