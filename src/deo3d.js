/* Het Loveli-deootje in 3D. Draait mee met het scrollen door de productsectie.
   Bron voor deo3d.js; bouwen met:
   npx esbuild src/deo3d.js --bundle --minify --format=iife --global-name=SchultheisDeo --loader:.png=dataurl --outfile=deo3d.js
   Het logo zit in het bestand zelf, zodat de pagina ook werkt als je index.html direct opent. */
import {
  WebGLRenderer, Scene, PerspectiveCamera, Group, Mesh, Vector2,
  LatheGeometry, CylinderGeometry, MeshPhysicalMaterial, CanvasTexture,
  DirectionalLight, AmbientLight, PMREMGenerator, SRGBColorSpace, NeutralToneMapping,
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import logoSrc from '../img/loveli-logo.png';

/* Maten naar de echte deo: diameter 2, hoogte 4.5.
   Van onder naar boven: draairing, lichaam met etiket, dop. */
const R = 1;
const Y0 = -2.25;          // onderkant
const Y_RING = -1.66;      // naad draairing / lichaam
const Y_CAP = 0.68;        // naad lichaam / dop
const Y1 = 2.25;           // bovenkant

function profile() {
  const p = [];
  const corner = (cx, cy, r, a0, a1, n = 8) => {
    for (let i = 0; i <= n; i++) {
      const a = a0 + (a1 - a0) * (i / n);
      p.push(new Vector2(cx + Math.cos(a) * r, cy + Math.sin(a) * r));
    }
  };
  const groove = y => {
    p.push(new Vector2(R, y - .018), new Vector2(R - .022, y - .006), new Vector2(R - .022, y + .006), new Vector2(R, y + .018));
  };
  p.push(new Vector2(0, Y0));
  corner(R - .07, Y0 + .07, .07, -Math.PI / 2, 0);
  groove(Y_RING);
  groove(Y_CAP);
  corner(R - .1, Y1 - .1, .1, 0, Math.PI / 2);
  p.push(new Vector2(0, Y1));
  return p;
}

function labelTexture(logo) {
  const W = 1024, H = 720;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  const lw = 330, lh = lw * logo.naturalHeight / logo.naturalWidth;
  g.drawImage(logo, (W - lw) / 2, 150, lw, lh);
  g.fillStyle = '#1b1b1b';
  g.textAlign = 'center';
  g.font = '500 34px "Open Sans", Arial, sans-serif';
  g.letterSpacing = '9px';
  g.fillText('DEODORANT', W / 2, 150 + lh + 70);
  g.fillStyle = '#d98a80';  // het roze van het Loveli-hartje
  g.font = '700 30px "Open Sans", Arial, sans-serif';
  g.letterSpacing = '8px';
  g.fillText('APPLE', W / 2, 150 + lh + 140);
  g.fillText('BLOSSOM', W / 2, 150 + lh + 182);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

export function mountDeo(stage, { getProgress }) {
  const canvas = document.createElement('canvas');
  let renderer;
  try {
    renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  } catch (e) {
    return null;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = NeutralToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;
  const sun = new DirectionalLight(0xffffff, 1.4);
  sun.position.set(-4, 6, 5);
  scene.add(sun, new AmbientLight(0xffffff, .25));

  const camera = new PerspectiveCamera(26, 1, .1, 100);
  camera.position.set(0, 0, 14);

  const plastic = new MeshPhysicalMaterial({ color: 0xffffff, roughness: .42, clearcoat: .35, clearcoatRoughness: .4 });
  const body = new Mesh(new LatheGeometry(profile(), 128), plastic);

  const spin = new Group();
  spin.add(body);
  const tilt = new Group();
  tilt.add(spin);
  scene.add(tilt);

  const logo = new Image();
  logo.onload = () => {
    const arc = 2.4;  // breedte van het etiket in radialen
    const labelGeo = new CylinderGeometry(R + .002, R + .002, 1.9, 96, 1, true, -arc / 2, arc);
    const label = new Mesh(labelGeo, new MeshPhysicalMaterial({
      map: labelTexture(logo), transparent: true, roughness: .42, clearcoat: .35, clearcoatRoughness: .4,
      polygonOffset: true, polygonOffsetFactor: -1,
    }));
    label.position.y = (Y_RING + Y_CAP) / 2 + .05;
    spin.add(label);
    render();
  };
  logo.src = logoSrc;

  /* Compositie: schuin naar links, bovenkant iets naar achteren, helemaal binnen de cirkel */
  let wide = true;
  const layout = () => {
    const w = stage.clientWidth, h = stage.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    wide = w / h > .8;
    camera.position.z = wide ? 15.5 : 17;
    camera.updateProjectionMatrix();
    tilt.position.set(0, -.1, 0);
  };

  let last = -1;
  function render() {
    const p = Math.min(1, Math.max(0, getProgress()));
    // halverwege de sectie staat het etiket naar je toe
    spin.rotation.y = .25 + (p - .5) * Math.PI * 2.4;
    tilt.rotation.z = .52 - p * .16;
    tilt.rotation.x = -.34 + p * .1;
    renderer.render(scene, camera);
    last = p;
  }

  let visible = false;
  let raf = 0;
  const loop = () => {
    raf = 0;
    if (!visible) return;
    if (Math.abs(getProgress() - last) > .0005) render();
    raf = requestAnimationFrame(loop);
  };
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible && !raf) raf = requestAnimationFrame(loop);
  }).observe(stage);
  new ResizeObserver(() => { layout(); render(); }).observe(stage);

  layout();
  stage.appendChild(canvas);
  render();
  stage.classList.add('is-3d');
  return { render };
}
