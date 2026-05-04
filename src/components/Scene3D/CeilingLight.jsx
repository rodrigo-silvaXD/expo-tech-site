import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'

export function CeilingLight({ isOn }) {
  const glowRef = useRef()
  const light1Ref = useRef()
  const light2Ref = useRef()

  useFrame((state) => {
    if (!glowRef.current) return
    if (isOn) {
      const flicker = 1 + Math.sin(state.clock.elapsedTime * 60) * 0.002
      if (light1Ref.current) light1Ref.current.intensity = 1.6 * flicker
      if (light2Ref.current) light2Ref.current.intensity = 0.7 * flicker
    }
  })

  return (
    <>
      {/* Suporte do luminário */}
      <mesh position={[0, 2.95, -0.5]}>
        <cylinderGeometry args={[0.04, 0.04, 0.08, 8]} />
        <meshLambertMaterial color="#c8c0b0" />
      </mesh>
      <mesh position={[-2, 2.95, -0.5]}>
        <cylinderGeometry args={[0.04, 0.04, 0.08, 8]} />
        <meshLambertMaterial color="#c8c0b0" />
      </mesh>
      <mesh position={[2, 2.95, -0.5]}>
        <cylinderGeometry args={[0.04, 0.04, 0.08, 8]} />
        <meshLambertMaterial color="#c8c0b0" />
      </mesh>

      {/* Corpo principal do luminário */}
      <group position={[0, 2.84, -0.5]}>
        <mesh>
          <boxGeometry args={[5.5, 0.12, 0.28]} />
          <meshLambertMaterial color="#d8d4cc" />
        </mesh>
        {/* Painel luminoso */}
        <mesh position={[0, -0.065, 0]}>
          <boxGeometry args={[5.3, 0.01, 0.24]} />
          <meshLambertMaterial
            color={isOn ? '#fffef0' : '#888880'}
            emissive={isOn ? '#fff8d0' : '#000000'}
            emissiveIntensity={isOn ? 2.5 : 0}
          />
        </mesh>
      </group>

      {/* Luminário 2 (fundo da sala) */}
      <group position={[0, 2.84, -2.8]}>
        <mesh>
          <boxGeometry args={[5.5, 0.12, 0.28]} />
          <meshLambertMaterial color="#d8d4cc" />
        </mesh>
        <mesh position={[0, -0.065, 0]}>
          <boxGeometry args={[5.3, 0.01, 0.24]} />
          <meshLambertMaterial
            color={isOn ? '#fffef0' : '#888880'}
            emissive={isOn ? '#fff8d0' : '#000000'}
            emissiveIntensity={isOn ? 2.5 : 0}
          />
        </mesh>
      </group>

      {/* Luzes pontuais do teto */}
      {isOn && (
        <>
          <pointLight ref={light1Ref} position={[0, 2.7, -0.5]} color="#fff5dc" intensity={1.6} distance={8} castShadow shadow-mapSize={[512, 512]} />
          <pointLight ref={light2Ref} position={[0, 2.7, -2.8]} color="#fff5dc" intensity={0.7} distance={6} />
          <pointLight position={[-3, 2.7, -0.5]} color="#fffae8" intensity={0.5} distance={5} />
          <pointLight position={[3, 2.7, -0.5]} color="#fffae8" intensity={0.5} distance={5} />
        </>
      )}
    </>
  )
}
