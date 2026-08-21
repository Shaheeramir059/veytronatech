import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { services, projects } from './data.js';

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = matchMedia('(max-width: 850px)').matches;

const noiseChunk = `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0);
  const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy));
  vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);
  vec3 l=1.0-g;
  vec3 i1=min(g.xyz,l.zxy);
  vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;
  vec3 x2=x0-i2+C.yyy;
  vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857;
  vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z);
  vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy;
  vec4 y=y_*ns.x+ns.yyyy;
  vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);
  vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0;
  vec4 s1=floor(b1)*2.0+1.0;
  vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
  vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);
  vec3 p1=vec3(a0.zw,h.y);
  vec3 p2=vec3(a1.xy,h.z);
  vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);
  m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}`;

export class World {
  constructor(canvas) {
    this.canvas = canvas;
    this.pointer = new THREE.Vector2();
    this.targetPointer = new THREE.Vector2(0.35, 0.1);
    this.clock = new THREE.Clock();
    this.section = 'home';
    this.focus = null;
    this.hovered = null;
    this.dragging = false;
    this.moved = 0;
    this.dragStart = new THREE.Vector2();
    this.spin = 0.2;
    this.velocity = 0;
    this.pulse = 0;
    this.autoMotion = !reducedMotion;
    this.listeners = new Map();
    this.raycaster = new THREE.Raycaster();
    this.pickables = [];
    this.nodes = [];
    this._scale = new THREE.Vector3();
    this._cam = new THREE.Vector3();
    this._look = new THREE.Vector3();
    this._themeA = new THREE.Color(0x38bdf8);
    this._themeB = new THREE.Color(0x7c3aed);
    this.#setup();
    this.#bind();
    this.#loop();
  }

  on(event, handler) {
    this.listeners.set(event, handler);
  }

  emit(event, detail) {
    this.listeners.get(event)?.(detail);
  }

  setSection(id) {
    this.section = id;
    const themes = {
      home: [0x38bdf8, 0x7c3aed],
      about: [0x67e8f9, 0x2563eb],
      services: [0x22d3ee, 0x0ea5e9],
      work: [0xf0abfc, 0x8b5cf6],
      build: [0x5eead4, 0x38bdf8],
      contact: [0x93c5fd, 0x67e8f9]
    };
    const [colorA, colorB] = themes[id] || themes.home;
    this._themeA.setHex(colorA);
    this._themeB.setHex(colorB);
  }

  focusService(id) {
    this.focus = id;
    this.pulse = 1;
  }

  clearFocus() {
    this.focus = null;
  }

  pulseCore() {
    this.pulse = 1.4;
    this.pulseWaves.forEach((wave, index) => {
      wave.userData.age = -index * 0.16;
      wave.visible = true;
    });
    this.emit('pulse');
  }

  toggleMotion() {
    this.autoMotion = !this.autoMotion;
    this.emit('motion', this.autoMotion);
    return this.autoMotion;
  }

  resetView() {
    this.focus = null;
    this.spin = 0.2;
    this.velocity = 0;
    this.emit('select', null);
  }

  #setup() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, isMobile ? 1.4 : 1.75));
    this.renderer.setSize(innerWidth, innerHeight);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0x04060b, 8, 28);

    this.camera = new THREE.PerspectiveCamera(38, innerWidth / innerHeight, 0.1, 80);
    this.camera.position.set(-1.4, 0.15, 7.2);

    this.scene.add(new THREE.HemisphereLight(0xb9e7ff, 0x0b0618, 0.55));
    this.keyLight = new THREE.DirectionalLight(0xe8f6ff, 1.4);
    this.keyLight.position.set(-4, 3, 6);
    this.fill = new THREE.PointLight(0x38bdf8, 12, 18);
    this.fill.position.set(3.2, 1.4, 2.4);
    this.rim = new THREE.PointLight(0x8b5cf6, 10, 16);
    this.rim.position.set(2.6, -2.2, -1.5);
    this.mouseLight = new THREE.PointLight(0x7dd3fc, 8, 10);
    this.scene.add(this.keyLight, this.fill, this.rim, this.mouseLight);

    this.root = new THREE.Group();
    this.root.position.set(2.15, 0.05, 0);
    this.scene.add(this.root);

    this.#stars();
    this.#sculpture();
    this.#orbit();
    this.#nodes();
    this.#swarm();
    this.#projects();
    this.#stage();
    this.#holograms();
    this.#composer();
  }

  #stars() {
    const count = isMobile ? 900 : 2400;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      positions[i * 3] = (Math.random() - 0.35) * 40;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 24;
      positions[i * 3 + 2] = (Math.random() - 0.8) * 20;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.stars = new THREE.Points(
      geometry,
      new THREE.PointsMaterial({ color: 0xcfe9ff, size: 0.018, transparent: true, opacity: 0.55, depthWrite: false })
    );
    this.scene.add(this.stars);
  }

  #sculpture() {
    const geo = new THREE.IcosahedronGeometry(1.55, isMobile ? 3 : 5);
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPulse: { value: 0 },
        uMouse: { value: new THREE.Vector2(0.3, 0.1) },
        uColorA: { value: new THREE.Color(0x38bdf8) },
        uColorB: { value: new THREE.Color(0x7c3aed) },
        uDark: { value: new THREE.Color(0x071018) }
      },
      vertexShader: `
        uniform float uTime;
        uniform float uPulse;
        uniform vec2 uMouse;
        varying vec3 vNormal;
        varying vec3 vView;
        varying float vNoise;
        ${noiseChunk}
        void main(){
          float n = snoise(normal * 1.6 + uTime * 0.28);
          float n2 = snoise(position * 0.9 + vec3(0.0, uTime * 0.22, 0.0));
          vNoise = n;
          float disp = n * 0.09 + n2 * 0.05 + uPulse * 0.18;
          disp += (uMouse.x * normal.x + uMouse.y * normal.y) * 0.12;
          vec3 pos = position + normal * disp;
          vec4 world = modelViewMatrix * vec4(pos, 1.0);
          vNormal = normalize(normalMatrix * normal);
          vView = -world.xyz;
          gl_Position = projectionMatrix * world;
        }
      `,
      fragmentShader: `
        uniform vec3 uColorA;
        uniform vec3 uColorB;
        uniform vec3 uDark;
        varying vec3 vNormal;
        varying vec3 vView;
        varying float vNoise;
        void main(){
          vec3 n = normalize(vNormal);
          vec3 v = normalize(vView);
          float fresnel = pow(1.0 - max(dot(n, v), 0.0), 2.8);
          float sweep = 0.5 + 0.5 * n.y;
          vec3 irid = mix(uColorA, uColorB, sweep);
          vec3 base = mix(uDark, irid, 0.08 + vNoise * 0.04);
          vec3 color = mix(base, irid, fresnel);
          color += vec3(0.85, 0.95, 1.0) * pow(fresnel, 4.0) * 0.55;
          gl_FragColor = vec4(color, 1.0);
        }
      `
    });

    this.sculpture = new THREE.Mesh(geo, this.material);
    this.sculpture.userData = { kind: 'core' };
    this.root.add(this.sculpture);
    this.pickables.push(this.sculpture);

    const wire = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.72, 1),
      new THREE.MeshBasicMaterial({ color: 0x67e8f9, wireframe: true, transparent: true, opacity: 0.07 })
    );
    this.wire = wire;
    this.root.add(wire);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(2.35, 0.008, 12, 180),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.35 })
    );
    ring.rotation.x = Math.PI * 0.42;
    this.ringA = ring;
    const ringB = ring.clone();
    ringB.rotation.x = Math.PI * 0.62;
    ringB.rotation.y = 0.5;
    ringB.material = ring.material.clone();
    ringB.material.color.set(0x8b5cf6);
    this.ringB = ringB;
    this.root.add(ring, ringB);
  }

  #orbit() {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(2.6, 0.2, 0),
      new THREE.Vector3(0, 1.4, 2.2),
      new THREE.Vector3(-2.4, 0.1, 0.2),
      new THREE.Vector3(0.2, -1.3, -2.1),
      new THREE.Vector3(2.6, 0.2, 0)
    ], true);
    this.ribbon = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 160, 0.018, 8, true),
      new THREE.MeshBasicMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.55 })
    );
    this.root.add(this.ribbon);

    this.pulseWaves = Array.from({ length: 3 }, (_, index) => {
      const wave = new THREE.Mesh(
        new THREE.TorusGeometry(0.38, 0.012, 8, 96),
        new THREE.MeshBasicMaterial({ color: 0xb6efff, transparent: true, opacity: 0, depthWrite: false })
      );
      wave.rotation.x = Math.PI * (0.42 + index * 0.08);
      wave.userData.age = 1;
      wave.visible = false;
      this.root.add(wave);
      return wave;
    });
  }

  #nodes() {
    this.nodeGroup = new THREE.Group();
    this.root.add(this.nodeGroup);
    services.forEach((service, index) => {
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.11, 24, 24),
        new THREE.MeshStandardMaterial({
          color: service.accent,
          emissive: service.accent,
          emissiveIntensity: 1.1,
          roughness: 0.2,
          metalness: 0.4
        })
      );
      const angle = (index / services.length) * Math.PI * 2 - 0.4;
      mesh.position.set(Math.cos(angle) * 2.55, Math.sin(angle * 1.1) * 0.85, Math.sin(angle) * 2.15);
      mesh.userData = { kind: 'service', id: service.id, service };
      this.nodeGroup.add(mesh);
      const connection = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), mesh.position.clone()]),
        new THREE.LineBasicMaterial({ color: service.accent, transparent: true, opacity: 0.24 })
      );
      this.nodeGroup.add(connection);
      this.nodes.push(mesh);
      this.pickables.push(mesh);
    });
  }

  #swarm() {
    const count = isMobile ? 80 : 180;
    const positions = new Float32Array(count * 3);
    this.swarmSeeds = Array.from({ length: count }, (_, index) => ({
      angle: (index / count) * Math.PI * 2,
      radius: 1.8 + (index % 11) * 0.11,
      speed: 0.12 + (index % 7) * 0.018,
      phase: index * 0.71
    }));
    this.swarmSeeds.forEach((seed, index) => {
      positions[index * 3] = Math.cos(seed.angle) * seed.radius;
      positions[index * 3 + 1] = Math.sin(seed.phase) * 1.35;
      positions[index * 3 + 2] = Math.sin(seed.angle) * seed.radius * 0.72;
    });
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.swarm = new THREE.Points(
      geometry,
      new THREE.PointsMaterial({ color: 0xd6f5ff, size: isMobile ? 0.024 : 0.018, transparent: true, opacity: 0.72, depthWrite: false })
    );
    this.root.add(this.swarm);
  }

  #projects() {
    this.projectMeshes = [];
    projects.forEach((project, index) => {
      const mesh = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.13, 0),
        new THREE.MeshStandardMaterial({
          color: 0xf8fbff,
          emissive: 0x38bdf8,
          emissiveIntensity: 0.35,
          metalness: 0.85,
          roughness: 0.2
        })
      );
      mesh.position.set(Math.cos(index * 2.2) * 3.15, 1.15 - index * 0.55, Math.sin(index * 2.2) * 1.4);
      mesh.userData = { kind: 'project', project };
      this.root.add(mesh);
      this.projectMeshes.push(mesh);
      this.pickables.push(mesh);
    });
  }

  #stage() {
    this.stage = new THREE.Group();
    this.stage.position.y = -2.45;
    this.root.add(this.stage);

    const grid = new THREE.GridHelper(9, isMobile ? 12 : 20, 0x38bdf8, 0x153750);
    grid.material.transparent = true;
    grid.material.opacity = 0.22;
    this.stage.add(grid);
    this.grid = grid;

    const scanRing = new THREE.Mesh(
      new THREE.RingGeometry(1.8, 1.83, 96),
      new THREE.MeshBasicMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.45, side: THREE.DoubleSide, depthWrite: false })
    );
    scanRing.rotation.x = -Math.PI / 2;
    this.stage.add(scanRing);
    this.scanRing = scanRing;

    const innerRing = new THREE.Mesh(
      new THREE.RingGeometry(0.78, 0.8, 72),
      new THREE.MeshBasicMaterial({ color: 0xa78bfa, transparent: true, opacity: 0.36, side: THREE.DoubleSide, depthWrite: false })
    );
    innerRing.rotation.x = -Math.PI / 2;
    this.stage.add(innerRing);
    this.innerRing = innerRing;
  }

  #holograms() {
    this.holograms = [];
    const panels = [
      [-2.15, 1.25, -0.7, 0.45],
      [2.05, 0.78, -1.2, -0.35],
      [1.45, -1.55, 0.65, 0.2]
    ];
    panels.forEach(([x, y, z, rotation], index) => {
      const group = new THREE.Group();
      group.position.set(x, y, z);
      group.rotation.y = rotation;
      group.userData.baseY = y;
      group.userData.baseRotation = rotation;

      const panel = new THREE.Mesh(
        new THREE.BoxGeometry(0.66, 1.04, 0.035),
        new THREE.MeshBasicMaterial({ color: 0x65d7ff, transparent: true, opacity: 0.045, depthWrite: false })
      );
      panel.userData = { kind: 'hologram', title: 'Signal relay' };
      group.add(panel);
      this.pickables.push(panel);

      const outline = new THREE.LineSegments(
        new THREE.EdgesGeometry(panel.geometry),
        new THREE.LineBasicMaterial({ color: index === 1 ? 0xc4b5fd : 0x8ee8ff, transparent: true, opacity: 0.76 })
      );
      group.add(outline);

      [-0.26, 0, 0.26].forEach(offset => {
        const signal = new THREE.Mesh(
          new THREE.BoxGeometry(0.43, 0.015, 0.022),
          new THREE.MeshBasicMaterial({ color: 0xd5f7ff, transparent: true, opacity: 0.44, depthWrite: false })
        );
        signal.position.y = offset;
        group.add(signal);
      });

      this.root.add(group);
      this.holograms.push(group);
    });
  }

  #composer() {
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.composer.addPass(new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.42, 0.7, 0.28));
    this.composer.addPass(new OutputPass());
  }

  #bind() {
    addEventListener('pointermove', event => {
      this.targetPointer.x = (event.clientX / innerWidth) * 2 - 1;
      this.targetPointer.y = -(event.clientY / innerHeight) * 2 + 1;
      if (this.dragging) {
        const dx = event.clientX - this.dragStart.x;
        this.spin += dx * 0.005;
        this.velocity = dx * 0.004;
        this.moved += Math.abs(dx) + Math.abs(event.clientY - this.dragStart.y);
        this.dragStart.set(event.clientX, event.clientY);
      }
    });

    addEventListener('pointerdown', event => {
      if (event.target.closest('.ui-layer, dialog') && !event.target.closest('[data-orbit]')) return;
      this.dragging = true;
      this.moved = 0;
      this.dragStart.set(event.clientX, event.clientY);
    });
    addEventListener('pointerup', () => { this.dragging = false; });

    addEventListener('click', event => {
      if (event.target.closest('a,button,input,select,textarea,label,dialog,.copy')) return;
      if (this.moved > 8) return;
      this.#pick();
    });

    addEventListener('keydown', event => {
      if (event.target.matches('input,textarea,select')) return;
      const map = { 1: 'ai', 2: 'web', 3: 'auto', 4: 'innovation' };
      if (map[event.key]) {
        const service = services.find(item => item.id === map[event.key]);
        this.focus = this.focus === service.id ? null : service.id;
        this.emit('select', this.focus ? service : null);
      }
      if (event.code === 'Space') {
        event.preventDefault();
        this.pulseCore();
      }
    });

    addEventListener('resize', () => {
      this.camera.aspect = innerWidth / innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(innerWidth, innerHeight);
      this.composer.setSize(innerWidth, innerHeight);
    });
  }

  #pick() {
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hit = this.raycaster.intersectObjects(this.pickables)[0]?.object;
    if (!hit) return;
    if (hit.userData.kind === 'core') this.pulseCore();
    if (hit.userData.kind === 'service') {
      this.focus = this.focus === hit.userData.id ? null : hit.userData.id;
      this.emit('select', this.focus ? hit.userData.service : null);
    }
    if (hit.userData.kind === 'project') this.emit('project', hit.userData.project);
    if (hit.userData.kind === 'hologram') this.pulseCore();
  }

  #hover() {
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const next = this.raycaster.intersectObjects(this.pickables)[0]?.object || null;
    if (next !== this.hovered) {
      this.hovered = next;
      this.canvas.style.cursor = next ? 'pointer' : 'grab';
      this.emit('hover', next?.userData || null);
    }
  }

  #cameraForSection() {
    const desktop = innerWidth > 850;
    const frames = {
      home: desktop ? [-1.55, 0.12, 7.1] : [0, 0.2, 8.4],
      about: desktop ? [-0.4, 0.55, 8.2] : [0, 0.4, 8.8],
      services: desktop ? [0.15, 0.05, 6.4] : [0, 0.1, 7.4],
      work: desktop ? [0.4, 0.35, 7.0] : [0, 0.2, 8.0],
      build: desktop ? [-0.8, -0.2, 7.4] : [0, 0, 8.2],
      contact: desktop ? [-1.1, 0.6, 8.6] : [0, 0.5, 9]
    };
    return frames[this.section] || frames.home;
  }

  #loop() {
    const tick = () => {
      const t = this.clock.getElapsedTime();
      this.pointer.lerp(this.targetPointer, reducedMotion ? 1 : 0.08);
      if (!this.dragging) {
        this.spin += this.velocity + (this.autoMotion ? 0.0024 : 0);
        this.velocity *= 0.93;
      }
      this.pulse *= 0.92;

      const [cx, cy, cz] = this.#cameraForSection();
      this._cam.set(cx + this.pointer.x * 0.45, cy + this.pointer.y * 0.28, cz);
      this.camera.position.lerp(this._cam, 0.05);
      this._look.set(this.root.position.x * 0.55, 0.05, 0);
      this.camera.lookAt(this._look);

      this.root.rotation.y = this.spin;
      this.root.rotation.x = this.pointer.y * -0.12;
      this.sculpture.rotation.y = t * 0.12;
      this.wire.rotation.y = -t * 0.08;
      this.ringA.rotation.z = t * 0.18;
      this.ringB.rotation.z = -t * 0.12;
      this.ribbon.rotation.y = t * 0.22;
      this.nodeGroup.rotation.y = t * 0.05;
      this.stars.rotation.y = t * 0.01;
      this.scanRing.rotation.z = t * 0.42;
      this.innerRing.rotation.z = -t * 0.62;
      this.stage.rotation.y = t * 0.025;

      this.material.uniforms.uTime.value = t;
      this.material.uniforms.uPulse.value = this.pulse;
      this.material.uniforms.uMouse.value.lerp(this.pointer, 0.1);
      this.material.uniforms.uColorA.value.lerp(this._themeA, 0.035);
      this.material.uniforms.uColorB.value.lerp(this._themeB, 0.035);
      this.fill.color.lerp(this._themeA, 0.035);
      this.rim.color.lerp(this._themeB, 0.035);

      this.mouseLight.position.set(
        this.root.position.x + this.pointer.x * 2.4,
        this.pointer.y * 1.8,
        3
      );

      this.nodes.forEach((node, i) => {
        const hot = this.focus === node.userData.id || this.hovered === node;
        node.scale.lerp(this._scale.setScalar(hot ? 1.7 : 1 + Math.sin(t * 2 + i) * 0.08), 0.12);
        node.material.emissiveIntensity = hot ? 2 : 1.05;
      });
      this.projectMeshes.forEach((mesh, i) => {
        mesh.rotation.y = t * 0.7 + i;
        mesh.rotation.x = t * 0.4;
        const hot = this.hovered === mesh || this.section === 'work';
        mesh.scale.lerp(this._scale.setScalar(hot ? 1.45 : 1), 0.1);
      });
      this.holograms.forEach((panel, index) => {
        const lift = this.autoMotion ? Math.sin(t * (0.8 + index * 0.08) + index) * 0.16 : 0;
        panel.position.y = panel.userData.baseY + lift;
        panel.rotation.y = panel.userData.baseRotation + (this.autoMotion ? Math.sin(t * 0.42 + index) * 0.11 : 0);
        panel.rotation.x = this.pointer.y * 0.08;
      });

      this.pulseWaves.forEach(wave => {
        wave.userData.age += 0.018;
        const age = wave.userData.age;
        if (age >= 1) {
          wave.visible = false;
          return;
        }
        const scale = 0.6 + age * 5.2;
        wave.scale.setScalar(scale);
        wave.material.opacity = Math.max(0, (1 - age) * 0.62);
      });

      const swarmPositions = this.swarm.geometry.attributes.position;
      this.swarmSeeds.forEach((seed, index) => {
        const angle = seed.angle + t * (this.autoMotion ? seed.speed : 0);
        const radius = seed.radius + Math.sin(t * 0.8 + seed.phase) * 0.16;
        swarmPositions.setXYZ(
          index,
          Math.cos(angle) * radius,
          Math.sin(angle * 1.7 + seed.phase) * 1.3,
          Math.sin(angle) * radius * 0.72
        );
      });
      swarmPositions.needsUpdate = true;

      this.#hover();
      this.composer.render();
      requestAnimationFrame(tick);
    };
    tick();
  }
}
