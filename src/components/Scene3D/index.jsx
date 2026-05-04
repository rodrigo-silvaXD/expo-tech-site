import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Suspense } from 'react'
import { Room } from './Room'
import { People } from './Person'
import { ACUnit } from './ACUnit'
import { CeilingLight } from './CeilingLight'

function SceneContent({ peopleCount, lightStatus, acStatus }) {
  const isLightOn = lightStatus === 'ON'

  return (
    <>
      {/* Luz ambiente — sempre presente, varia com luz */}
      <ambientLight intensity={isLightOn ? 0.65 : 0.25} color={isLightOn ? '#fff8f0' : '#c8d0e0'} />

      {/* Luz direcional do sol pelas janelas */}
      <directionalLight
        position={[-8, 6, -5]}
        intensity={isLightOn ? 0.3 : 0.5}
        color="#fff5e0"
        castShadow
      />

      {/* Luz suave de preenchimento */}
      <hemisphereLight
        skyColor={isLightOn ? '#fff8e0' : '#c0c8e0'}
        groundColor="#806050"
        intensity={isLightOn ? 0.35 : 0.15}
      />

      <Room lightStatus={lightStatus} />
      <CeilingLight isOn={isLightOn} />
      <ACUnit status={acStatus} />
      <People count={peopleCount} />
    </>
  )
}

export function Scene3D({ peopleCount, lightStatus, acStatus, temperature }) {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 5.5, 9.5], fov: 52, near: 0.1, far: 100 }}
      style={{ background: 'linear-gradient(180deg, #c8daf0 0%, #dce8f5 100%)' }}
      gl={{ antialias: true }}
    >
      <color attach="background" args={['#d2e4f4']} />

      <Suspense fallback={null}>
        <SceneContent
          peopleCount={peopleCount}
          lightStatus={lightStatus}
          acStatus={acStatus}
          temperature={temperature}
        />
      </Suspense>

      <OrbitControls
        target={[0, 1.2, 0]}
        minDistance={5}
        maxDistance={18}
        maxPolarAngle={Math.PI / 2 - 0.05}
        enableDamping
        dampingFactor={0.08}
      />
    </Canvas>
  )
}
