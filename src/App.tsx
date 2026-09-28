import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { ChevronLeft, ChevronRight, LockKeyhole, Mail, Sparkles, X } from 'lucide-react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { unlockLetters, type Letter } from './letters'

const assetUrl = (path: string) => `${import.meta.env.BASE_URL}${path}`
const MODEL_URL = assetUrl('models/magic-garden-planet.glb')
const CHARACTER_URL = assetUrl('models/character/mom-character.glb')
const LETTER_COUNT = 3

export default function App() {
  const [ready, setReady] = useState(false)
  const [letters, setLetters] = useState<Letter[] | null>(null)
  const [letterIndex, setLetterIndex] = useState<number | null>(null)
  const [opened, setOpened] = useState(0)
  const [unlocking, setUnlocking] = useState(false)
  const [travelToken, setTravelToken] = useState(0)
  const [traveling, setTraveling] = useState(false)
  const handleReady = useCallback(() => setReady(true), [])
  const openMailbox = useCallback(() => {
    if (!letters) {
      setUnlocking(true)
      return
    }
    setTraveling(true)
    setTravelToken((value) => value + 1)
  }, [letters, opened])
  const handleUnlocked = useCallback((unlocked: Letter[]) => {
    setLetters(unlocked)
    setUnlocking(false)
    setTraveling(true)
    setTravelToken((value) => value + 1)
  }, [])
  const handleArrival = useCallback(() => {
    if (!letters) return
    const next = opened % letters.length
    setLetterIndex(next)
    setOpened((value) => Math.min(value + 1, letters.length))
    setTraveling(false)
  }, [letters, opened])

  return (
    <main className="world-shell">
      <Sky />
      <WorldCanvas onReady={handleReady} onMailbox={openMailbox} travelToken={travelToken} onArrival={handleArrival} />

      <header className="topbar">
        <a className="brand" href="#top" aria-label="回到小宇宙">
          <span className="brand-mark"><Sparkles size={16} /></span>
          <span><b>给妈妈的小宇宙</b><small>A GARDEN OF LETTERS</small></span>
        </a>
        <div className="letter-progress" aria-label={`已开启 ${opened} 封，共 ${LETTER_COUNT} 封`}>
          {Array.from({ length: LETTER_COUNT }, (_, index) => <i key={index} className={index < opened ? 'is-open' : ''} />)}
          <span>{opened}/{LETTER_COUNT} 封信</span>
        </div>
      </header>

      <section className="intro" id="top">
        <p>45 YEARS · A LIFE IN BLOOM</p>
        <h1>妈妈，生日快乐</h1>
        <span>这颗会转动的小星球，收藏了为你亮起的家、花园与三封信。</span>
      </section>

      <button className="mailbox-trigger" onClick={openMailbox} disabled={traveling} aria-label="打开下一封信">
        <span className="mailbox-icon"><Mail size={21} /></span>
        <span><small>{opened < LETTER_COUNT ? '花园信箱' : '重新阅读'}</small><b>{opened < LETTER_COUNT ? `打开第 ${opened + 1} 封信` : '从第一封开始'}</b></span>
        <ChevronRight size={18} />
      </button>

      <div className={`loading-screen ${ready ? 'is-ready' : ''}`}>
        <div className="loading-orbit"><i /><i /><i /></div>
        <p>正在点亮花园星球</p>
      </div>

      {unlocking && <UnlockModal onClose={() => setUnlocking(false)} onUnlocked={handleUnlocked} />}
      {letterIndex !== null && letters && (
        <LetterModal
          index={letterIndex}
          letter={letters[letterIndex]}
          letterCount={letters.length}
          onClose={() => setLetterIndex(null)}
          onChange={(next) => setLetterIndex((next + letters.length) % letters.length)}
        />
      )}
    </main>
  )
}

function Sky() {
  return <div className="sky" aria-hidden="true">
    <div className="sun" />
    <div className="cloud cloud-one"><i /><i /><i /></div>
    <div className="cloud cloud-two"><i /><i /><i /></div>
    <div className="cloud cloud-three"><i /><i /><i /></div>
    <div className="sky-grain" />
  </div>
}

function WorldCanvas({ onReady, onMailbox, travelToken, onArrival }: { onReady: () => void; onMailbox: () => void; travelToken: number; onArrival: () => void }) {
  const mountRef = useRef<HTMLDivElement>(null)
  const mailboxHandler = useRef(onMailbox)
  mailboxHandler.current = onMailbox
  const arrivalHandler = useRef(onArrival)
  arrivalHandler.current = onArrival
  const travelTokenRef = useRef(travelToken)
  travelTokenRef.current = travelToken

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return
    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0xc9e8ef, 0.035)
    const camera = new THREE.PerspectiveCamera(38, mount.clientWidth / mount.clientHeight, 0.1, 100)
    const cameraDistance = mount.clientWidth / mount.clientHeight < 0.75 ? 13.2 : 11
    camera.position.set(0.2, 1.15, cameraDistance)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.15
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFShadowMap
    mount.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.055
    controls.enablePan = false
    controls.minDistance = 7.4
    controls.maxDistance = 16
    controls.minPolarAngle = Math.PI * 0.22
    controls.maxPolarAngle = Math.PI * 0.72
    controls.autoRotate = true
    controls.autoRotateSpeed = 0.42
    controls.target.set(0, -0.15, 0)

    scene.add(new THREE.HemisphereLight(0xfff5df, 0x386b61, 2.8))
    const sunlight = new THREE.DirectionalLight(0xffd0a2, 4.5)
    sunlight.position.set(-5, 7, 6)
    sunlight.castShadow = true
    sunlight.shadow.mapSize.set(2048, 2048)
    scene.add(sunlight)
    const rim = new THREE.DirectionalLight(0x8bd4ff, 2.1)
    rim.position.set(5, 1, -5)
    scene.add(rim)

    const world = new THREE.Group()
    world.rotation.x = -0.06
    scene.add(world)

    const soil = new THREE.Mesh(
      new THREE.SphereGeometry(2.25, 96, 64),
      new THREE.MeshStandardMaterial({ color: 0x587b41, roughness: 0.92, metalness: 0 })
    )
    soil.position.y = -1.15
    soil.receiveShadow = true
    world.add(soil)

    const lowerSoil = new THREE.Mesh(
      new THREE.SphereGeometry(2.16, 64, 48, 0, Math.PI * 2, Math.PI * 0.5, Math.PI * 0.5),
      new THREE.MeshStandardMaterial({ color: 0x6b4937, roughness: 1 })
    )
    lowerSoil.position.y = -1.2
    world.add(lowerSoil)

    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(2.34, 64, 64),
      new THREE.MeshBasicMaterial({ color: 0xffd8a8, transparent: true, opacity: 0.075, side: THREE.BackSide })
    )
    atmosphere.position.y = -1.15
    world.add(atmosphere)

    const flowerHeads: THREE.Group[] = []
    const floatingClouds: THREE.Group[] = []
    const floatingBirds: THREE.Group[] = []
    const flowerColors = [0xff8fb6, 0xffd66b, 0xffffff, 0xa88ae8, 0xf16f7e]
    for (let i = 0; i < 46; i += 1) {
      const a = (i / 46) * Math.PI * 2 + Math.sin(i * 2.7) * 0.24
      const r = 1.35 + (i % 5) * 0.19
      const y = -0.05 + Math.sin(i * 1.71) * 0.1
      const flower = makeFlower(flowerColors[i % flowerColors.length])
      flower.position.set(Math.cos(a) * r, y, Math.sin(a) * r)
      flower.rotation.y = -a
      flower.scale.setScalar(0.7 + (i % 4) * 0.08)
      world.add(flower)
      flowerHeads.push(flower)
    }

    for (let i = 0; i < 34; i += 1) {
      const a = Math.PI + (i / 33) * Math.PI
      const r = 1.18 + (i % 6) * 0.17
      const flower = makeFlower(flowerColors[(i + 2) % flowerColors.length])
      flower.position.set(Math.cos(a) * r, 0.08 + Math.sin(i * 1.4) * 0.14, Math.sin(a) * r)
      flower.rotation.y = -a
      flower.scale.setScalar(0.72 + (i % 3) * 0.12)
      world.add(flower)
      flowerHeads.push(flower)
    }

    const cloudPositions: Array<[number, number, number, number]> = [
      [-1.45, 1.62, -2.05, 0.62],
      [1.4, 1.38, -2.15, 0.5],
      [0.15, 2.08, -2.28, 0.42],
    ]
    cloudPositions.forEach(([x, y, z, scale]) => {
      const cloud = makeCloud()
      cloud.position.set(x, y, z)
      cloud.scale.setScalar(scale)
      world.add(cloud)
      floatingClouds.push(cloud)
    })

    const gardenDecor = makeGardenDecor()
    // Keep the lower garden on the front-facing hemisphere, directly below the houses.
    gardenDecor.position.set(0, -0.78, 2.02)
    world.add(gardenDecor)
    ;[[-1.55, 1.1, -1.65], [1.05, 1.55, -1.75], [1.65, 0.92, -1.4]].forEach(([x, y, z]) => {
      const bird = makeBird()
      bird.position.set(x, y, z)
      bird.scale.setScalar(0.7)
      world.add(bird)
      floatingBirds.push(bird)
    })

    const mailbox = makeMailbox()
    mailbox.position.set(1.72, 0.17, 1.72)
    mailbox.rotation.y = -0.68
    world.add(mailbox)

    world.add(makeCobblestonePath())
    const cottageLeft = makeCottage(0xe8aa79, 0x843d38)
    cottageLeft.position.set(-1.58, -0.06, 0.62)
    cottageLeft.rotation.y = 0.42
    cottageLeft.scale.setScalar(0.62)
    world.add(cottageLeft)
    const cottageRight = makeCottage(0x9fc6b0, 0xd56d4f)
    cottageRight.position.set(1.3, -0.12, -0.42)
    cottageRight.rotation.y = -0.55
    cottageRight.scale.setScalar(0.52)
    world.add(cottageRight)

    const gltfLoader = new GLTFLoader()
    let character: THREE.Group | null = null
    let characterBaseScale = 1
    let lastTravelToken = 0
    let travelStart = -1
    let travelFrom = new THREE.Vector3()
    const travelTo = new THREE.Vector3(1.28, -0.1, 1.9)
    gltfLoader.load(MODEL_URL, (gltf) => {
      const model = gltf.scene
      const box = new THREE.Box3().setFromObject(model)
      const size = box.getSize(new THREE.Vector3())
      const center = box.getCenter(new THREE.Vector3())
      const scale = 5.15 / Math.max(size.x, size.y, size.z)
      model.scale.setScalar(scale)
      model.position.set(-center.x * scale, -center.y * scale + 0.28, -center.z * scale)
      model.rotation.y = 0.18
      model.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.castShadow = true
          object.receiveShadow = true
          if (object.material) object.material.needsUpdate = true
        }
      })
      world.add(model)
      onReady()
    }, undefined, () => onReady())

    const textureLoader = new THREE.TextureLoader()
    const diffuse = textureLoader.load(assetUrl('models/character/texture_diffuse.webp'))
    diffuse.colorSpace = THREE.SRGBColorSpace
    diffuse.flipY = false
    const normal = textureLoader.load(assetUrl('models/character/texture_normal.webp'))
    normal.flipY = false
    const roughness = textureLoader.load(assetUrl('models/character/texture_roughness.webp'))
    roughness.flipY = false
    const metallic = textureLoader.load(assetUrl('models/character/texture_metallic.webp'))
    metallic.flipY = false
    const characterMaterial = new THREE.MeshStandardMaterial({ map: diffuse, normalMap: normal, roughnessMap: roughness, metalnessMap: metallic, roughness: 0.82, metalness: 0.05 })
    gltfLoader.load(CHARACTER_URL, (gltf) => {
      character = gltf.scene
      const box = new THREE.Box3().setFromObject(character)
      const size = box.getSize(new THREE.Vector3())
      const center = box.getCenter(new THREE.Vector3())
      const scale = 0.9 / size.y
      characterBaseScale = scale
      character.scale.setScalar(scale)
      character.position.set(-0.9 - center.x * scale, 0.42 - box.min.y * scale, 1.28 - center.z * scale)
      character.rotation.y = 0.16
      character.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.material = characterMaterial
          object.castShadow = true
          object.receiveShadow = true
        }
      })
      world.add(character)
    })

    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    const pointerStart = new THREE.Vector2()
    const down = (event: PointerEvent) => pointerStart.set(event.clientX, event.clientY)
    const up = (event: PointerEvent) => {
      if (pointerStart.distanceTo(new THREE.Vector2(event.clientX, event.clientY)) > 7) return
      const rect = renderer.domElement.getBoundingClientRect()
      pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1)
      raycaster.setFromCamera(pointer, camera)
      if (raycaster.intersectObject(mailbox, true).length) mailboxHandler.current()
    }
    renderer.domElement.addEventListener('pointerdown', down)
    renderer.domElement.addEventListener('pointerup', up)

    const startedAt = performance.now()
    let frame = 0
    const animate = () => {
      const time = (performance.now() - startedAt) / 1000
      if (character && travelTokenRef.current > lastTravelToken) {
        lastTravelToken = travelTokenRef.current
        travelFrom = character.position.clone()
        travelStart = performance.now()
        controls.autoRotate = false
      }
      if (character && travelStart >= 0) {
        const progress = Math.min((performance.now() - travelStart) / 3600, 1)
        const segment = Math.min(Math.floor(progress * 3), 2)
        const segmentProgress = progress * 3 - segment
        const eased = segmentProgress * segmentProgress * (3 - 2 * segmentProgress)
        const waypoint = new THREE.Vector3().lerpVectors(travelFrom, travelTo, (segment + 1) / 3)
        const segmentStart = segment === 0 ? travelFrom : new THREE.Vector3().lerpVectors(travelFrom, travelTo, segment / 3)
        character.position.lerpVectors(segmentStart, waypoint, eased)
        character.position.y += Math.sin(segmentProgress * Math.PI) * 0.14
        character.rotation.y = Math.atan2(travelTo.x - travelFrom.x, travelTo.z - travelFrom.z)
        character.scale.set(characterBaseScale, characterBaseScale * (1 + Math.sin(progress * Math.PI * 7) * 0.045), characterBaseScale)
        if (progress >= 1) {
          travelStart = -1
          controls.autoRotate = true
          character.position.copy(travelTo)
          arrivalHandler.current()
        }
      }
      flowerHeads.forEach((flower, index) => {
        flower.rotation.z = Math.sin(time * 1.6 + index * 0.7) * 0.08
        const petals = flower.userData.petals as THREE.Group | undefined
        if (petals) petals.rotation.y = time * (0.28 + (index % 4) * 0.04)
      })
      floatingClouds.forEach((cloud, index) => {
        cloud.position.y += Math.sin(time * 0.7 + index * 1.8) * 0.0007
        cloud.rotation.y = Math.sin(time * 0.22 + index) * 0.12
      })
      floatingBirds.forEach((bird, index) => {
        bird.position.y += Math.sin(time * 1.2 + index) * 0.0008
        bird.rotation.z = Math.sin(time * 1.4 + index) * 0.05
      })
      mailbox.rotation.z = Math.sin(time * 2.2) * 0.018
      controls.update()
      renderer.render(scene, camera)
      frame = requestAnimationFrame(animate)
    }
    animate()

    const resize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight
      camera.position.z = camera.aspect < 0.75 ? 13.2 : 11
      camera.updateProjectionMatrix()
      renderer.setSize(mount.clientWidth, mount.clientHeight)
    }
    window.addEventListener('resize', resize)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', resize)
      renderer.domElement.removeEventListener('pointerdown', down)
      renderer.domElement.removeEventListener('pointerup', up)
      controls.dispose()
      renderer.dispose()
      mount.removeChild(renderer.domElement)
    }
  }, [onReady])

  return <div className="world-canvas" ref={mountRef} />
}

function makeFlower(color: number) {
  const group = new THREE.Group()
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.018, 0.2, 6), new THREE.MeshStandardMaterial({ color: 0x3f7e49 }))
  stem.position.y = 0.1
  group.add(stem)
  const head = new THREE.Group()
  head.position.y = 0.22
  const petalMaterial = new THREE.MeshStandardMaterial({ color, roughness: 0.64, side: THREE.DoubleSide })
  for (let p = 0; p < 5; p += 1) {
    const petal = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), petalMaterial)
    const angle = (p / 5) * Math.PI * 2
    petal.position.set(Math.cos(angle) * 0.06, 0, Math.sin(angle) * 0.06)
    petal.scale.set(1.65, 0.42, 0.85)
    petal.rotation.y = -angle
    head.add(petal)
  }
  head.add(new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), new THREE.MeshStandardMaterial({ color: 0xf4a72e })))
  group.add(head)
  group.userData.petals = head
  return group
}

function makeCloud() {
  const cloud = new THREE.Group()
  const material = new THREE.MeshStandardMaterial({ color: 0xfffbef, roughness: 1, transparent: true, opacity: 0.88 })
  const parts: Array<[number, number, number, number]> = [
    [-0.58, 0, 0, 0.48],
    [-0.18, 0.15, 0.02, 0.62],
    [0.28, 0.05, 0, 0.54],
    [0.64, -0.03, -0.02, 0.38],
  ]
  parts.forEach(([x, y, z, scale]) => {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(0.7, 18, 12), material)
    puff.position.set(x, y, z)
    puff.scale.set(scale * 1.45, scale * 0.72, scale)
    cloud.add(puff)
  })
  return cloud
}

function makeGardenDecor() {
  const decor = new THREE.Group()
  const pebbleMaterial = new THREE.MeshStandardMaterial({ color: 0xc5b89c, roughness: 0.95 })
  for (let i = 0; i < 18; i += 1) {
    const pebble = new THREE.Mesh(new THREE.SphereGeometry(0.045 + (i % 3) * 0.014, 8, 6), pebbleMaterial)
    const angle = (i / 18) * Math.PI * 2
    pebble.position.set(Math.cos(angle) * (0.75 + (i % 2) * 0.12), 0.04, Math.sin(angle) * 0.58)
    pebble.scale.y = 0.45
    decor.add(pebble)
  }
  const shrubMaterial = new THREE.MeshStandardMaterial({ color: 0x4e8b50, roughness: 0.9 })
  for (let i = 0; i < 7; i += 1) {
    const shrub = new THREE.Mesh(new THREE.SphereGeometry(0.16 + (i % 2) * 0.04, 12, 8), shrubMaterial)
    shrub.position.set(-0.78 + i * 0.26, 0.12 + (i % 2) * 0.04, 0.22 + Math.sin(i) * 0.12)
    decor.add(shrub)
  }
  for (let i = 0; i < 4; i += 1) {
    const mushroom = new THREE.Group()
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 0.16, 8), new THREE.MeshStandardMaterial({ color: 0xfff1d2 }))
    stem.position.y = 0.08
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 8), new THREE.MeshStandardMaterial({ color: [0xe88365, 0xf2c45f, 0xa97bc4, 0xeb91ac][i] }))
    cap.scale.y = 0.42
    cap.position.y = 0.18
    mushroom.add(stem, cap)
    mushroom.position.set(-0.45 + i * 0.3, 0, 0.62 + (i % 2) * 0.12)
    decor.add(mushroom)
  }
  return decor
}

function makeBird() {
  const bird = new THREE.Group()
  const material = new THREE.MeshBasicMaterial({ color: 0x304b59, side: THREE.DoubleSide })
  const left = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.07), material)
  const right = left.clone()
  left.position.x = -0.1
  right.position.x = 0.1
  left.rotation.z = 0.28
  right.rotation.z = -0.28
  bird.add(left, right)
  return bird
}

function makeMailbox() {
  const group = new THREE.Group()
  group.name = 'garden-mailbox'
  const red = new THREE.MeshStandardMaterial({ color: 0xb83a36, roughness: 0.42, metalness: 0.08 })
  const dark = new THREE.MeshStandardMaterial({ color: 0x31514e, roughness: 0.8 })
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.06, 0.72, 10), dark)
  post.position.y = 0.36
  group.add(post)
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.3, 0.34), red)
  body.position.y = 0.78
  group.add(body)
  const roof = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.42, 18, 1, false, 0, Math.PI), red)
  roof.rotation.z = Math.PI / 2
  roof.rotation.y = Math.PI / 2
  roof.position.y = 0.93
  group.add(roof)
  const flag = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.34, 0.045), new THREE.MeshStandardMaterial({ color: 0xf3d4a1 }))
  flag.position.set(0.23, 0.92, 0)
  group.add(flag)
  const flagTop = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.11, 0.055), new THREE.MeshStandardMaterial({ color: 0xffdf8e }))
  flagTop.position.set(0.29, 1.06, 0)
  group.add(flagTop)
  const glow = new THREE.PointLight(0xffb776, 1.5, 1.8)
  glow.position.set(0, 1, 0.18)
  group.add(glow)
  return group
}

function makeCobblestonePath() {
  const path = new THREE.Group()
  const material = new THREE.MeshStandardMaterial({ color: 0xd7c7af, roughness: 1 })
  for (let row = 0; row < 9; row += 1) {
    const t = row / 8
    const x = THREE.MathUtils.lerp(1.45, 0.12, t) + Math.sin(t * Math.PI) * 0.2
    const z = THREE.MathUtils.lerp(1.5, 0.2, t)
    for (let column = -1; column <= 1; column += 1) {
      const stone = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 7), material)
      stone.scale.set(1.18, 0.23, 0.82)
      stone.position.set(x + column * 0.2, 0.06 + t * 0.05, z + (row % 2) * 0.035)
      stone.rotation.y = row * 0.38 + column * 0.2
      stone.receiveShadow = true
      path.add(stone)
    }
  }
  return path
}

function makeCottage(wallColor: number, roofColor: number) {
  const house = new THREE.Group()
  const walls = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.62, 0.62), new THREE.MeshStandardMaterial({ color: wallColor, roughness: 0.88 }))
  walls.position.y = 0.31
  walls.castShadow = true
  house.add(walls)
  const roof = new THREE.Mesh(new THREE.ConeGeometry(0.58, 0.42, 4), new THREE.MeshStandardMaterial({ color: roofColor, roughness: 0.78 }))
  roof.position.y = 0.83
  roof.rotation.y = Math.PI / 4
  roof.castShadow = true
  house.add(roof)
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.32, 0.025), new THREE.MeshStandardMaterial({ color: 0x60443a }))
  door.position.set(0, 0.18, 0.323)
  house.add(door)
  const windowMaterial = new THREE.MeshStandardMaterial({ color: 0xffe7a6, emissive: 0xffb94f, emissiveIntensity: 0.65 })
  for (const x of [-0.22, 0.22]) {
    const window = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.15, 0.025), windowMaterial)
    window.position.set(x, 0.4, 0.324)
    house.add(window)
  }
  return house
}

function UnlockModal({ onClose, onUnlocked }: { onClose: () => void; onUnlocked: (letters: Letter[]) => void }) {
  const [passphrase, setPassphrase] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!passphrase.trim() || busy) return
    setBusy(true)
    setError('')
    try {
      onUnlocked(await unlockLetters(passphrase))
    } catch {
      setError('暗号不正确，请再试一次。')
      setBusy(false)
    }
  }
  return <div className="letter-overlay" onMouseDown={onClose}>
    <form className="unlock-sheet" onSubmit={submit} onMouseDown={(event) => event.stopPropagation()}>
      <button className="unlock-close" type="button" onClick={onClose} aria-label="关闭解锁窗口"><X size={18} /></button>
      <span className="unlock-icon"><LockKeyhole size={22} /></span>
      <p>PRIVATE LETTERS</p>
      <h2>输入家庭暗号</h2>
      <label htmlFor="letter-passphrase">暗号</label>
      <input id="letter-passphrase" type="password" value={passphrase} onChange={(event) => setPassphrase(event.target.value)} autoFocus autoComplete="off" />
      {error && <span className="unlock-error" role="alert">{error}</span>}
      <button className="unlock-submit" type="submit" disabled={busy}>{busy ? '正在解锁…' : '打开信箱'}</button>
    </form>
  </div>
}

function LetterModal({ letter, index, letterCount, onClose, onChange }: { letter: Letter; index: number; letterCount: number; onClose: () => void; onChange: (index: number) => void }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return <div className="letter-overlay" onMouseDown={onClose}>
    <article className="letter-sheet" onMouseDown={(event) => event.stopPropagation()}>
      <div className="letter-toolbar">
        <span>LETTER {String(index + 1).padStart(2, '0')} / {String(letterCount).padStart(2, '0')}</span>
        <button onClick={onClose} aria-label="关闭信件"><X size={18} /></button>
      </div>
      <div className="letter-heading"><Mail size={20} /><p>FROM THE GARDEN</p><h2>写给你的信</h2></div>
      <div className="letter-copy">{letter.text}</div>
      <footer className="letter-nav">
        <button onClick={() => onChange(index - 1)}><ChevronLeft size={17} />上一封</button>
        <span>愿每一次打开，都有花香。</span>
        <button onClick={() => onChange(index + 1)}>下一封<ChevronRight size={17} /></button>
      </footer>
    </article>
  </div>
}
