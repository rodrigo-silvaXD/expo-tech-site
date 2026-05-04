import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

function WindParticle({ index, speed }) {
  const meshRef = useRef()
  const offset = useMemo(() => ({
    x: (Math.random() - 0.5) * 0.7,
    y: Math.random() * 0.4,
    phase: Math.random() * Math.PI * 2,
  }), [])

  useFrame((state) => {
    if (!meshRef.current) return
    const t = (state.clock.elapsedTime * speed + offset.phase) % 2.2
    meshRef.current.position.x = offset.x + Math.sin(t * 2) * 0.1
    meshRef.current.position.y = -1.0 + t * 0.8 + offset.y
    meshRef.current.material.opacity = t < 0.3 ? t / 0.3 : t > 1.8 ? (2.2 - t) / 0.4 : 0.7
  })

  return (
    <mesh ref={meshRef} position={[offset.x, -0.5, 0.12]}>
      <sphereGeometry args={[0.025, 4, 4]} />
      <meshBasicMaterial color="#a8e6ff" transparent opacity={0} />
    </mesh>
  )
}

function FanBlade({ angle }) {
  return (
    <mesh rotation={[0, 0, angle]} position={[0, 0, 0.01]}>
      <boxGeometry args={[0.22, 0.04, 0.01]} />
      <meshLambertMaterial color="#7ab8d4" />
    </mesh>
  )
}

export function ACUnit({ status }) {
  const fanRef = useRef()
  const glowRef = useRef()
  const isOn = status !== 'OFF'
  const isHigh = status === 'HIGH'

  useFrame((state, delta) => {
    if (!fanRef.current || !glowRef.current) return
    if (isOn) {
      fanRef.current.rotation.z -= delta * (isHigh ? 8 : 4)
    }
    const pulse = Math.sin(state.clock.elapsedTime * 3) * 0.15 + 0.85
    glowRef.current.material.opacity = isOn ? (isHigh ? 0.55 * pulse : 0.35 * pulse) : 0
  })

  const windSpeed = isHigh ? 1.4 : 0.7

  return (
    <group position={[4.88, 2.35, 0.5]} rotation={[0, -Math.PI / 2, 0]}>
      {/* Caixa principal */}
      <mesh castShadow>
        <boxGeometry args={[1.1, 0.38, 0.2]} />
        <meshLambertMaterial color="#d8dee8" />
      </mesh>

      {/* Face frontal */}
      <mesh position={[0, 0, 0.11]}>
        <boxGeometry args={[1.08, 0.36, 0.01]} />
        <meshLambertMaterial color={isOn ? '#c0d8f0' : '#cdd4e0'} />
      </mesh>

      {/* Grelha de saída de ar */}
      {[-0.3, -0.1, 0.1, 0.3].map((x, i) => (
        <mesh key={i} position={[x, -0.06, 0.115]}>
          <boxGeometry args={[0.04, 0.16, 0.005]} />
          <meshLambertMaterial color="#aab4c4" />
        </mesh>
      ))}

      {/* Visor LED */}
      <mesh position={[0.35, 0.08, 0.115]}>
        <boxGeometry args={[0.18, 0.06, 0.005]} />
        <meshLambertMaterial
          color={isOn ? (isHigh ? '#0040ff' : '#00aaff') : '#223040'}
          emissive={isOn ? (isHigh ? '#0020aa' : '#005588') : '#000000'}
          emissiveIntensity={isOn ? 1.2 : 0}
        />
      </mesh>

      {/* Ventoinha */}
      <group ref={fanRef} position={[-0.3, 0.05, 0.115]}>
        <mesh>
          <circleGeometry args={[0.1, 12]} />
          <meshLambertMaterial color="#8ab0c8" />
        </mesh>
        {[0, Math.PI/3, (Math.PI*2)/3, Math.PI, (Math.PI*4)/3, (Math.PI*5)/3].map((a, i) => (
          <FanBlade key={i} angle={a} />
        ))}
        <mesh>
          <circleGeometry args={[0.025, 8]} />
          <meshLambertMaterial color="#4a7090" />
        </mesh>
      </group>

      {/* Luz azul de status */}
      {isOn && (
        <pointLight
          color={isHigh ? '#0066ff' : '#00aaff'}
          intensity={isHigh ? 1.2 : 0.6}
          distance={3.5}
          position={[0, 0, 0.5]}
        />
      )}

      {/* Glow do painel */}
      <mesh ref={glowRef} position={[0, 0, 0.12]}>
        <planeGeometry args={[1.0, 0.32]} />
        <meshBasicMaterial
          color={isHigh ? '#0055ff' : '#00aaff'}
          transparent
          opacity={0}
          side={THREE.FrontSide}
        />
      </mesh>

      {/* Partículas de vento */}
      {isOn && Array(isHigh ? 12 : 7).fill(0).map((_, i) => (
        <WindParticle key={i} index={i} speed={windSpeed} />
      ))}

      {/* Etiqueta */}
      <mesh position={[0, 0.22, 0.12]}>
        <boxGeometry args={[0.5, 0.06, 0.005]} />
        <meshLambertMaterial color="#9aabb8" />
      </mesh>
    </group>
  )
}
