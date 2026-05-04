import { useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const DOOR_POS = new THREE.Vector3(0.2, 0, 4.0)
const PERSON_COLORS = [
  '#e74c3c', '#3498db', '#2ecc71', '#f39c12',
  '#9b59b6', '#1abc9c', '#e67e22', '#16a085',
  '#c0392b', '#2980b9',
]
const SKIN_TONES = ['#fdbcb4', '#f5c5a3', '#d4956a', '#c68642', '#8d5524']

const SEATS = [
  new THREE.Vector3(-0.5, 0, 2.5),
  new THREE.Vector3(1.5, 0, 2.5),
  new THREE.Vector3(-2.0, 0, 1.0),
  new THREE.Vector3(2.5, 0, 0.5),
  new THREE.Vector3(0.5, 0, 0.0),
  new THREE.Vector3(-2.5, 0, -0.5),
  new THREE.Vector3(1.5, 0, -1.0),
  new THREE.Vector3(3.0, 0, -2.0),
  new THREE.Vector3(-0.5, 0, -2.0),
  new THREE.Vector3(2.0, 0, 2.0),
]

function SinglePerson({ index, isActive }) {
  const groupRef = useRef()
  const bodyRef = useRef()
  const headRef = useRef()
  const [visible, setVisible] = useState(false)

  const bodyColor = PERSON_COLORS[index % PERSON_COLORS.length]
  const skinColor = SKIN_TONES[index % SKIN_TONES.length]
  const seat = SEATS[index % SEATS.length]
  const phase = index * 1.3
  const speed = 0.8 + (index % 3) * 0.2

  const isActiveRef = useRef(isActive)
  useEffect(() => { isActiveRef.current = isActive }, [isActive])

  useEffect(() => {
    if (isActive) {
      setVisible(true)
      if (groupRef.current) {
        groupRef.current.position.copy(DOOR_POS)
      }
    }
  }, [isActive])

  useFrame((state, delta) => {
    if (!groupRef.current) return
    const active = isActiveRef.current

    const target = active ? seat : DOOR_POS
    groupRef.current.position.lerp(target, delta * 1.8)

    const dist = groupRef.current.position.distanceTo(target)

    if (!active && dist < 0.12) {
      setVisible(false)
      groupRef.current.position.copy(DOOR_POS)
    }

    const t = state.clock.elapsedTime * speed + phase
    const bob = Math.sin(t) * 0.025
    const sway = Math.sin(t * 0.5) * 0.02

    if (bodyRef.current) {
      bodyRef.current.position.y = 0.62 + bob
      bodyRef.current.rotation.z = sway
    }
    if (headRef.current) {
      headRef.current.position.y = 1.18 + bob
      headRef.current.rotation.y = Math.sin(t * 0.3) * 0.15
    }

    // Olhar para o centro quando parado
    if (active && dist < 0.3) {
      const dir = new THREE.Vector3(0, 0, 0).sub(groupRef.current.position)
      if (dir.length() > 0.1) {
        const targetAngle = Math.atan2(dir.x, dir.z)
        groupRef.current.rotation.y += (targetAngle - groupRef.current.rotation.y) * delta * 2
      }
    }
  })

  if (!visible) return null

  return (
    <group ref={groupRef} position={[DOOR_POS.x, 0, DOOR_POS.z]}>
      {/* Corpo */}
      <mesh ref={bodyRef} position={[0, 0.62, 0]} castShadow>
        <capsuleGeometry args={[0.17, 0.55, 4, 8]} />
        <meshLambertMaterial color={bodyColor} />
      </mesh>
      {/* Cabeça */}
      <mesh ref={headRef} position={[0, 1.18, 0]} castShadow>
        <sphereGeometry args={[0.16, 10, 10]} />
        <meshLambertMaterial color={skinColor} />
      </mesh>
      {/* Olhos */}
      <mesh position={[0.07, 1.22, 0.14]}>
        <sphereGeometry args={[0.025, 6, 6]} />
        <meshLambertMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[-0.07, 1.22, 0.14]}>
        <sphereGeometry args={[0.025, 6, 6]} />
        <meshLambertMaterial color="#1a1a1a" />
      </mesh>
      {/* Pernas */}
      <mesh position={[-0.08, 0.22, 0]} castShadow>
        <capsuleGeometry args={[0.07, 0.28, 4, 6]} />
        <meshLambertMaterial color="#2c3e50" />
      </mesh>
      <mesh position={[0.08, 0.22, 0]} castShadow>
        <capsuleGeometry args={[0.07, 0.28, 4, 6]} />
        <meshLambertMaterial color="#2c3e50" />
      </mesh>
    </group>
  )
}

export function People({ count }) {
  return (
    <>
      {Array(10).fill(0).map((_, i) => (
        <SinglePerson key={i} index={i} isActive={i < count} />
      ))}
    </>
  )
}
