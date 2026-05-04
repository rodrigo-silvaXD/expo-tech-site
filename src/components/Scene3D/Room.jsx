import { useMemo } from 'react'
import * as THREE from 'three'

function Wall({ args, position, rotation, color = '#f0ebe0' }) {
  return (
    <mesh position={position} rotation={rotation} receiveShadow castShadow>
      <boxGeometry args={args} />
      <meshLambertMaterial color={color} />
    </mesh>
  )
}

function Baseboard({ position, length, rotation }) {
  return (
    <mesh position={position} rotation={rotation}>
      <boxGeometry args={[length, 0.12, 0.08]} />
      <meshLambertMaterial color="#d4c9b0" />
    </mesh>
  )
}

function Desk() {
  return (
    <group position={[-1.5, 0, -2.8]}>
      <mesh position={[0, 0.74, 0]} receiveShadow castShadow>
        <boxGeometry args={[2.4, 0.07, 1.1]} />
        <meshLambertMaterial color="#8b6914" />
      </mesh>
      {[[-0.95, 0.35, 0.4], [0.95, 0.35, 0.4], [-0.95, 0.35, -0.4], [0.95, 0.35, -0.4]].map((p, i) => (
        <mesh key={i} position={p} castShadow>
          <boxGeometry args={[0.07, 0.7, 0.07]} />
          <meshLambertMaterial color="#6b4f10" />
        </mesh>
      ))}
      <mesh position={[0, 0.77, -0.2]}>
        <boxGeometry args={[0.6, 0.35, 0.02]} />
        <meshLambertMaterial color="#1a1a2e" />
      </mesh>
    </group>
  )
}

function Chair({ position, rotationY = 0 }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 0.44, 0]}>
        <boxGeometry args={[0.45, 0.06, 0.45]} />
        <meshLambertMaterial color="#2c3e50" />
      </mesh>
      <mesh position={[0, 0.76, -0.19]}>
        <boxGeometry args={[0.45, 0.62, 0.06]} />
        <meshLambertMaterial color="#2c3e50" />
      </mesh>
      {[[-0.17, 0.22, 0.17], [0.17, 0.22, 0.17], [-0.17, 0.22, -0.17], [0.17, 0.22, -0.17]].map((p, i) => (
        <mesh key={i} position={p}>
          <cylinderGeometry args={[0.025, 0.025, 0.44, 6]} />
          <meshLambertMaterial color="#1a252f" />
        </mesh>
      ))}
    </group>
  )
}

function Window({ position, rotation }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh>
        <boxGeometry args={[1.4, 1.1, 0.08]} />
        <meshLambertMaterial color="#8fa8b8" />
      </mesh>
      <mesh position={[0, 0, 0.05]}>
        <boxGeometry args={[1.4, 1.1, 0.02]} />
        <meshLambertMaterial color="#cde8ff" transparent opacity={0.45} />
      </mesh>
      <mesh position={[0, 0, 0.06]}>
        <boxGeometry args={[1.38, 0.04, 0.01]} />
        <meshLambertMaterial color="#a0b8c8" />
      </mesh>
      <mesh position={[0, 0, 0.06]}>
        <boxGeometry args={[0.04, 1.08, 0.01]} />
        <meshLambertMaterial color="#a0b8c8" />
      </mesh>
    </group>
  )
}

function FloorTile({ x, z }) {
  const isLight = (x + z) % 2 === 0
  return (
    <mesh position={[x * 0.95 - 3.8, 0.001, z * 0.95 - 3.8]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[0.93, 0.93]} />
      <meshLambertMaterial color={isLight ? '#c8b99a' : '#b8a888'} />
    </mesh>
  )
}

export function Room({ lightStatus }) {
  const tiles = useMemo(() => {
    const t = []
    for (let x = 0; x < 9; x++) for (let z = 0; z < 9; z++) t.push({ x, z })
    return t
  }, [])

  return (
    <group>
      {/* Chão */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[10, 9]} />
        <meshLambertMaterial color="#b8a880" />
      </mesh>
      {tiles.map(({ x, z }) => <FloorTile key={`${x}-${z}`} x={x} z={z} />)}

      {/* Teto */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 3, 0]} receiveShadow>
        <planeGeometry args={[10, 9]} />
        <meshLambertMaterial color="#f5f2ed" />
      </mesh>

      {/* Paredes */}
      <Wall args={[10, 3, 0.12]} position={[0, 1.5, -4.5]} color="#ede8dd" />
      <Wall args={[10, 3, 0.12]} position={[0, 1.5, 4.5]} color="#e8e3d8" />
      <Wall args={[0.12, 3, 9]} position={[-5, 1.5, 0]} color="#e8e3d8" />
      <Wall args={[0.12, 3, 9]} position={[5, 1.5, 0]} color="#e5e0d5" />

      {/* Rodapé */}
      <Baseboard position={[0, 0.06, -4.44]} length={10} rotation={[0,0,0]} />
      <Baseboard position={[0, 0.06, 4.44]} length={10} rotation={[0,0,0]} />
      <Baseboard position={[-4.94, 0.06, 0]} length={9} rotation={[0, Math.PI/2, 0]} />
      <Baseboard position={[4.94, 0.06, 0]} length={9} rotation={[0, Math.PI/2, 0]} />

      {/* Porta (parede frontal) */}
      <mesh position={[-0.55, 1.08, 4.44]}>
        <boxGeometry args={[1.0, 2.16, 0.12]} />
        <meshLambertMaterial color="#e0d9cc" />
      </mesh>
      <mesh position={[3.5, 1.5, 4.44]}>
        <boxGeometry args={[3.0, 3, 0.12]} />
        <meshLambertMaterial color="#e8e3d8" />
      </mesh>
      <mesh position={[-3.5, 1.5, 4.44]}>
        <boxGeometry args={[3.0, 3, 0.12]} />
        <meshLambertMaterial color="#e8e3d8" />
      </mesh>
      {/* Acima da porta */}
      <mesh position={[0, 2.7, 4.44]}>
        <boxGeometry args={[2.0, 0.6, 0.12]} />
        <meshLambertMaterial color="#e8e3d8" />
      </mesh>
      {/* Batente da porta */}
      <mesh position={[0, 1.08, 4.44]}>
        <boxGeometry args={[2.04, 2.2, 0.06]} />
        <meshLambertMaterial color="#c8a87a" />
      </mesh>
      <mesh position={[0, 1.08, 4.44]}>
        <boxGeometry args={[1.8, 2.0, 0.08]} />
        <meshLambertMaterial color="#b89060" />
      </mesh>
      {/* Maçaneta */}
      <mesh position={[0.78, 1.05, 4.49]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshLambertMaterial color="#c0a060" />
      </mesh>

      {/* Janelas */}
      <Window position={[-2, 1.9, -4.44]} rotation={[0, 0, 0]} />
      <Window position={[2, 1.9, -4.44]} rotation={[0, 0, 0]} />
      <Window position={[-4.94, 1.9, -1]} rotation={[0, Math.PI/2, 0]} />

      {/* Luz natural pelas janelas */}
      <pointLight position={[2, 2.5, -4]} intensity={0.3} color="#fff8e0" distance={4} />
      <pointLight position={[-2, 2.5, -4]} intensity={0.3} color="#fff8e0" distance={4} />

      {/* Mobília */}
      <Desk />
      {/* Cadeira atrás da mesa — virada para frente (+z = câmera) */}
      <Chair position={[-1.5, 0, -3.72]} rotationY={0} />
      {/* Cadeiras na frente da mesa — viradas para a mesa (-z) */}
      <Chair position={[-0.65, 0, -1.72]} rotationY={Math.PI} />
      <Chair position={[-2.35, 0, -1.72]} rotationY={Math.PI} />

      {/* Quadro branco */}
      <mesh position={[4.94, 1.9, -1.5]} rotation={[0, -Math.PI/2, 0]}>
        <boxGeometry args={[2.2, 1.2, 0.04]} />
        <meshLambertMaterial color="#f8f8f5" />
      </mesh>
      <mesh position={[4.93, 1.9, -1.5]} rotation={[0, -Math.PI/2, 0]}>
        <boxGeometry args={[2.1, 1.1, 0.01]} />
        <meshLambertMaterial color="#fafaf8" />
      </mesh>

      {/* Armário */}
      <mesh position={[-4.6, 0.9, -3.5]}>
        <boxGeometry args={[0.6, 1.8, 1.2]} />
        <meshLambertMaterial color="#a09080" />
      </mesh>
      <mesh position={[-4.6, 0.9, -3.5]}>
        <boxGeometry args={[0.61, 1.78, 1.18]} />
        <meshLambertMaterial color="#b0a090" />
      </mesh>
    </group>
  )
}
