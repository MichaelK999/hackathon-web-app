import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";

import { computeLayout } from "./layout";
import {
	type CameraState,
	type ConstellationLayout,
	type ConstellationSceneGroup,
	DEFAULT_CONFIG,
	type GraphData,
	type GraphNode,
	PALETTE,
	type RendererCallbacks,
	type RendererConfig,
} from "./types";

// ── Texture helpers ─────────────────────────────────────────

function createStarTexture(
	size: number,
	cssColor: string,
	softness: number,
): THREE.CanvasTexture {
	const canvas = document.createElement("canvas");
	canvas.width = canvas.height = size;
	const ctx = canvas.getContext("2d")!;
	const cx = size / 2;
	const grad = ctx.createRadialGradient(cx, cx, 0, cx, cx, cx);
	grad.addColorStop(0, cssColor);
	grad.addColorStop(softness, cssColor);
	grad.addColorStop(1, "rgba(0,0,0,0)");
	ctx.fillStyle = grad;
	ctx.fillRect(0, 0, size, size);
	const tex = new THREE.CanvasTexture(canvas);
	tex.needsUpdate = true;
	return tex;
}

function createTextSprite(
	text: string,
	fontSize: number,
	cssColor: string,
	initialOpacity: number,
): THREE.Sprite {
	const canvas = document.createElement("canvas");
	const ctx = canvas.getContext("2d")!;
	const scale = 2;
	const fSize = fontSize * scale;
	ctx.font = `${fSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
	const metrics = ctx.measureText(text);
	const w = Math.ceil(metrics.width) + 8;
	const h = fSize + 8;
	canvas.width = w;
	canvas.height = h;
	ctx.font = `${fSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
	ctx.fillStyle = cssColor;
	ctx.globalAlpha = 1;
	ctx.textBaseline = "top";
	ctx.fillText(text, 4, 4);
	const tex = new THREE.CanvasTexture(canvas);
	tex.needsUpdate = true;
	const mat = new THREE.SpriteMaterial({
		map: tex,
		transparent: true,
		opacity: initialOpacity,
		depthTest: false,
		blending: THREE.NormalBlending,
	});
	const sprite = new THREE.Sprite(mat);
	sprite.scale.set(w / scale, h / scale, 1);
	return sprite;
}

// ── Easing ──────────────────────────────────────────────────

function easeInOutCubic(t: number): number {
	return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

// ── Lerp helper for smooth transitions ──────────────────────

function lerpTo(current: number, target: number, speed: number): number {
	return current + (target - current) * speed;
}

// ── Main class ──────────────────────────────────────────────

export class ConstellationRenderer {
	private config: RendererConfig;
	private callbacks: RendererCallbacks;

	// Three.js core
	private renderer: THREE.WebGLRenderer;
	private scene: THREE.Scene;
	private camera: THREE.OrthographicCamera;
	private composer: EffectComposer;
	private clock = new THREE.Clock();

	// Background stars
	private bgStarMaterial: THREE.ShaderMaterial | null = null;

	// Constellation scene groups (mutable rendering state)
	private groups: ConstellationSceneGroup[] = [];

	// Shared textures (created once, reused)
	private subStarTex: THREE.CanvasTexture;
	private topicStarTex: THREE.CanvasTexture;

	// Camera animation
	private focusedRootId: string | null = null;
	private focusedSubId: string | null = null;
	private animating = false;
	private animStart = 0;
	private camFrom: CameraState = { x: 0, y: 0, zoom: 1 };
	private camTo: CameraState = { x: 0, y: 0, zoom: 1 };

	// Interaction
	private raycaster = new THREE.Raycaster();
	private mouse = new THREE.Vector2();
	private hoveredNode: GraphNode | null = null;
	private isPanning = false;
	private panStart = { x: 0, y: 0 };
	private dragDistance = 0; // track drag distance to distinguish click vs drag
	private pointerDownPos = { x: 0, y: 0 };

	// Touch/pinch state
	private activeTouches = new Map<number, { x: number; y: number }>();
	private lastPinchDist = 0;
	private lastPinchCenter = { x: 0, y: 0 };

	// Smooth zoom (for touchpad)
	private targetZoom = 1;
	// Zoom anchor: world-space point that should stay under the cursor
	private zoomAnchor: { wx: number; wy: number; sx: number; sy: number } | null = null;

	// Lifecycle
	private container: HTMLElement;
	private animFrameId: number | null = null;
	private resizeObserver: ResizeObserver;
	private disposed = false;

	// Bound event handlers (for cleanup)
	private boundMouseMove: (e: MouseEvent) => void;
	private boundClick: (e: MouseEvent) => void;
	private boundWheel: (e: WheelEvent) => void;
	private boundPointerDown: (e: PointerEvent) => void;
	private boundPointerMove: (e: PointerEvent) => void;
	private boundPointerUp: (e: PointerEvent) => void;
	private boundContextMenu: (e: Event) => void;
	private boundTouchStart: (e: TouchEvent) => void;
	private boundTouchMove: (e: TouchEvent) => void;
	private boundTouchEnd: (e: TouchEvent) => void;
	private boundKeyDown: (e: KeyboardEvent) => void;

	constructor(
		container: HTMLElement,
		callbacks: RendererCallbacks = {},
		config: Partial<RendererConfig> = {},
	) {
		this.container = container;
		this.callbacks = callbacks;
		this.config = { ...DEFAULT_CONFIG, ...config };

		// Renderer
		this.renderer = new THREE.WebGLRenderer({ antialias: true });
		this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
		this.renderer.setClearColor(this.config.background);
		container.appendChild(this.renderer.domElement);

		// Scene
		this.scene = new THREE.Scene();

		// Orthographic camera
		const frustum = 600;
		const aspect = container.clientWidth / container.clientHeight || 1;
		this.camera = new THREE.OrthographicCamera(
			-frustum * aspect,
			frustum * aspect,
			frustum,
			-frustum,
			0.1,
			2000,
		);
		this.camera.position.set(0, 0, 1000);
		this.camera.lookAt(0, 0, 0);

		// Bloom
		const { bloom } = this.config;
		this.composer = new EffectComposer(this.renderer);
		this.composer.addPass(new RenderPass(this.scene, this.camera));
		this.composer.addPass(
			new UnrealBloomPass(
				new THREE.Vector2(container.clientWidth, container.clientHeight),
				bloom.strength,
				bloom.radius,
				bloom.threshold,
			),
		);

		// Shared textures
		this.subStarTex = createStarTexture(64, PALETTE.subcategoryCSS, 0.4);
		this.topicStarTex = createStarTexture(64, PALETTE.topicCSS, 0.35);

		// Background stars
		this.createBackgroundStars();

		// Resize observer
		this.resizeObserver = new ResizeObserver(() => this.handleResize());
		this.resizeObserver.observe(container);
		this.handleResize();

		// Event listeners
		this.boundMouseMove = this.onMouseMove.bind(this);
		this.boundClick = this.onClick.bind(this);
		this.boundWheel = this.onWheel.bind(this);
		this.boundPointerDown = this.onPointerDown.bind(this);
		this.boundPointerMove = this.onPointerMove.bind(this);
		this.boundPointerUp = this.onPointerUp.bind(this);
		this.boundContextMenu = (e: Event) => e.preventDefault();
		this.boundTouchStart = this.onTouchStart.bind(this);
		this.boundTouchMove = this.onTouchMove.bind(this);
		this.boundTouchEnd = this.onTouchEnd.bind(this);
		this.boundKeyDown = this.onKeyDown.bind(this);

		const canvas = this.renderer.domElement;
		canvas.addEventListener("mousemove", this.boundMouseMove);
		canvas.addEventListener("click", this.boundClick);
		canvas.addEventListener("wheel", this.boundWheel, { passive: false });
		canvas.addEventListener("pointerdown", this.boundPointerDown);
		canvas.addEventListener("pointermove", this.boundPointerMove);
		canvas.addEventListener("pointerup", this.boundPointerUp);
		canvas.addEventListener("pointerleave", this.boundPointerUp);
		canvas.addEventListener("contextmenu", this.boundContextMenu);
		canvas.addEventListener("touchstart", this.boundTouchStart, {
			passive: false,
		});
		canvas.addEventListener("touchmove", this.boundTouchMove, {
			passive: false,
		});
		canvas.addEventListener("touchend", this.boundTouchEnd);
		window.addEventListener("keydown", this.boundKeyDown);

		// Start render loop
		this.animate();
	}

	// ── Public API ──────────────────────────────────────────────

	/**
	 * Update the displayed graph data. Handles full replacement —
	 * removes old constellations and builds new ones.
	 */
	updateData(data: GraphData): void {
		this.clearConstellations();
		if (data.nodes.length === 0) return;

		const layout = computeLayout(data);
		for (const cl of layout.constellations) {
			this.buildConstellation(cl);
		}

		// Auto-fit camera to show all constellations
		if (!this.focusedRootId) {
			this.fitCamera(layout.totalRadius);
		}
	}

	/** Programmatically focus a constellation by root ID. */
	focusConstellation(rootId: string): void {
		const group = this.groups.find((g) => g.rootId === rootId);
		if (!group) return;

		this.focusedRootId = rootId;
		this.startCameraAnimation({
			x: group.center.x,
			y: group.center.y,
			zoom: this.config.focusZoom,
		});
	}

	/** Focus on a specific subcategory within the currently focused constellation. */
	focusSubcategory(subId: string): void {
		const group = this.groups.find((g) => g.rootId === this.focusedRootId);
		if (!group) return;

		const star = group.stars.find(
			(s) => s.type === "subcategory" && s.node.id === subId,
		);
		if (!star) return;

		this.focusedSubId = subId;
		this.startCameraAnimation({
			x: group.center.x + star.sprite.position.x,
			y: group.center.y + star.sprite.position.y,
			zoom: this.config.subFocusZoom,
		});
	}

	/** Return from sub-focus to constellation focus, or from constellation to overview. */
	unfocus(): void {
		if (this.focusedSubId) {
			// Back to constellation level
			this.focusedSubId = null;
			const group = this.groups.find((g) => g.rootId === this.focusedRootId);
			if (group) {
				this.startCameraAnimation({
					x: group.center.x,
					y: group.center.y,
					zoom: this.config.focusZoom,
				});
			}
		} else {
			// Back to overview
			this.focusedRootId = null;
			this.startCameraAnimation({ x: 0, y: 0, zoom: 1 });
		}
	}

	/** Whether we're currently focused on a constellation. */
	get isFocused(): boolean {
		return this.focusedRootId !== null;
	}

	/** Get the currently focused root ID. */
	get focusedRoot(): string | null {
		return this.focusedRootId;
	}

	/** Clean up all resources. Call when unmounting. */
	dispose(): void {
		this.disposed = true;
		if (this.animFrameId !== null) cancelAnimationFrame(this.animFrameId);
		this.resizeObserver.disconnect();

		const canvas = this.renderer.domElement;
		canvas.removeEventListener("mousemove", this.boundMouseMove);
		canvas.removeEventListener("click", this.boundClick);
		canvas.removeEventListener("wheel", this.boundWheel);
		canvas.removeEventListener("pointerdown", this.boundPointerDown);
		canvas.removeEventListener("pointermove", this.boundPointerMove);
		canvas.removeEventListener("pointerup", this.boundPointerUp);
		canvas.removeEventListener("pointerleave", this.boundPointerUp);
		canvas.removeEventListener("contextmenu", this.boundContextMenu);
		canvas.removeEventListener("touchstart", this.boundTouchStart);
		canvas.removeEventListener("touchmove", this.boundTouchMove);
		canvas.removeEventListener("touchend", this.boundTouchEnd);
		window.removeEventListener("keydown", this.boundKeyDown);

		this.clearConstellations();
		this.scene.clear();
		this.renderer.dispose();
		this.composer.dispose();
		this.subStarTex.dispose();
		this.topicStarTex.dispose();

		if (this.container.contains(canvas)) {
			this.container.removeChild(canvas);
		}
	}

	// ── Background stars ────────────────────────────────────────

	private createBackgroundStars(): void {
		const count = this.config.backgroundStarCount;
		const positions = new Float32Array(count * 3);
		const phases = new Float32Array(count);
		const speeds = new Float32Array(count);
		const sizes = new Float32Array(count);
		// Per-star color tint: 0 = cool purple, 1 = warm amber
		const tints = new Float32Array(count);
		// Flicker type: 0 = gentle twinkle, 1 = occasional sharp flicker
		const flickerFlags = new Float32Array(count);
		// Spread must cover the viewport even at minimum zoom (0.3) with
		// a potentially large frustum after fitCamera().  Use a generous
		// value so stars never run out when zoomed all the way out.
		const spread = 20000;

		for (let i = 0; i < count; i++) {
			positions[i * 3] = (Math.random() - 0.5) * spread * 2;
			positions[i * 3 + 1] = (Math.random() - 0.5) * spread * 2;
			positions[i * 3 + 2] = -10;
			phases[i] = Math.random() * Math.PI * 2;

			const r = Math.random();
			if (r < 0.1) {
				// 10% — bright flickering stars
				sizes[i] = 2.5 + Math.random() * 2.0;
				speeds[i] = 2.0 + Math.random() * 4.0;
				flickerFlags[i] = 1.0;
			} else if (r < 0.3) {
				// 20% — medium stars, gentle pulse
				sizes[i] = 1.5 + Math.random() * 1.5;
				speeds[i] = 0.3 + Math.random() * 0.8;
				flickerFlags[i] = 0.0;
			} else {
				// 70% — tiny dim stars, very slow
				sizes[i] = 0.5 + Math.random() * 1.0;
				speeds[i] = 0.1 + Math.random() * 0.4;
				flickerFlags[i] = 0.0;
			}

			tints[i] = Math.random();
		}

		const geo = new THREE.BufferGeometry();
		geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
		geo.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
		geo.setAttribute("aSpeed", new THREE.BufferAttribute(speeds, 1));
		geo.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
		geo.setAttribute("aTint", new THREE.BufferAttribute(tints, 1));
		geo.setAttribute("aFlicker", new THREE.BufferAttribute(flickerFlags, 1));

		this.bgStarMaterial = new THREE.ShaderMaterial({
			uniforms: {
				uTime: { value: 0 },
				uColorCool: { value: new THREE.Color(0x9078cc) },
				uColorWarm: { value: new THREE.Color(0xccaa88) },
				uPixelRatio: { value: this.renderer.getPixelRatio() },
			},
			vertexShader: `
        attribute float aPhase;
        attribute float aSpeed;
        attribute float size;
        attribute float aTint;
        attribute float aFlicker;
        varying float vAlpha;
        varying float vTint;
        uniform float uTime;
        uniform float uPixelRatio;
        void main() {
          float wave = 0.5 + 0.5 * sin(uTime * aSpeed + aPhase);

          if (aFlicker > 0.5) {
            // Sharp flicker: use pow to create brief bright spikes
            float spike = pow(wave, 8.0);
            vAlpha = 0.1 + 0.9 * spike;
          } else {
            // Gentle twinkle
            vAlpha = 0.2 + 0.5 * wave;
          }

          vTint = aTint;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * uPixelRatio;
          gl_Position = projectionMatrix * mv;
        }
      `,
			fragmentShader: `
        uniform vec3 uColorCool;
        uniform vec3 uColorWarm;
        varying float vAlpha;
        varying float vTint;
        void main() {
          float d = length(gl_PointCoord - 0.5) * 2.0;
          float alpha = smoothstep(1.0, 0.2, d) * vAlpha;
          vec3 color = mix(uColorCool, uColorWarm, vTint);
          gl_FragColor = vec4(color, alpha * 0.7);
        }
      `,
			transparent: true,
			depthTest: false,
			blending: THREE.AdditiveBlending,
		});

		const points = new THREE.Points(geo, this.bgStarMaterial);
		points.renderOrder = -1;
		this.scene.add(points);
	}

	// ── Constellation building ──────────────────────────────────

	private buildConstellation(layout: ConstellationLayout): void {
		const group = new THREE.Group();
		group.position.set(layout.center.x, layout.center.y, 0);
		this.scene.add(group);

		const sceneGroup: ConstellationSceneGroup = {
			rootId: layout.rootId,
			rootName: layout.rootName,
			center: layout.center,
			group,
			stars: [],
			lines: [],
			labels: [],
			rootLabel: null,
		};

		// Subcategory stars
		for (const sub of layout.subcategories) {
			const mat = new THREE.SpriteMaterial({
				map: this.subStarTex,
				color: PALETTE.subcategory,
				transparent: true,
				opacity: 0.9,
				blending: THREE.AdditiveBlending,
				depthTest: false,
			});
			const sprite = new THREE.Sprite(mat);
			const baseScale = 14;
			sprite.scale.set(baseScale, baseScale, 1);
			sprite.position.set(sub.local.x, sub.local.y, 0);
			group.add(sprite);

			sceneGroup.stars.push({
				sprite,
				node: sub.node,
				type: "subcategory",
				baseScale,
				phase: Math.random() * Math.PI * 2,
				parentSubId: sub.node.id,
			});

			// Subcategory label (zoom-only)
			const label = createTextSprite(
				sub.node.name,
				13,
				PALETTE.subcategoryCSS,
				0,
			);
			label.position.set(sub.local.x, sub.local.y - 12, 1);
			group.add(label);
			sceneGroup.labels.push({ sprite: label, zoomOnly: true, subId: sub.node.id });
		}

		// Topic stars
		for (const topic of layout.topics) {
			const mat = new THREE.SpriteMaterial({
				map: this.topicStarTex,
				color: PALETTE.topic,
				transparent: true,
				opacity: 0.8,
				blending: THREE.AdditiveBlending,
				depthTest: false,
			});
			const sprite = new THREE.Sprite(mat);
			const baseScale = 8;
			sprite.scale.set(baseScale, baseScale, 1);
			sprite.position.set(topic.local.x, topic.local.y, 0);
			group.add(sprite);

			sceneGroup.stars.push({
				sprite,
				node: topic.node,
				type: "topic",
				baseScale,
				phase: Math.random() * Math.PI * 2,
				parentSubId: topic.parentSubId,
			});

			// Topic label (zoom-only)
			const label = createTextSprite(topic.node.name, 11, PALETTE.topicCSS, 0);
			label.position.set(topic.local.x, topic.local.y - 8, 1);
			group.add(label);
			sceneGroup.labels.push({ sprite: label, zoomOnly: true, subId: topic.parentSubId });
		}

		// Connection lines
		for (const link of layout.links) {
			// Convert world positions to local (relative to group)
			const fromLocal = {
				x: link.from.x - layout.center.x,
				y: link.from.y - layout.center.y,
			};
			const toLocal = {
				x: link.to.x - layout.center.x,
				y: link.to.y - layout.center.y,
			};

			const geo = new THREE.BufferGeometry().setFromPoints([
				new THREE.Vector3(fromLocal.x, fromLocal.y, 0),
				new THREE.Vector3(toLocal.x, toLocal.y, 0),
			]);

			const baseOpacity = link.kind === "structural" ? 0.35 : 0.5;
			const mat = new THREE.LineBasicMaterial({
				color: PALETTE.connection,
				transparent: true,
				opacity: baseOpacity,
				blending: THREE.AdditiveBlending,
				depthTest: false,
			});
			const line = new THREE.Line(geo, mat);
			group.add(line);
			sceneGroup.lines.push({ line, kind: link.kind, baseOpacity });
		}

		// Root label (constellation title)
		const labelY =
			layout.subcategories.length > 0
				? Math.max(...layout.subcategories.map((s) => s.local.y)) + 30
				: 30;
		const rootLabel = createTextSprite(
			layout.rootName,
			18,
			PALETTE.rootLabelCSS,
			1.0,
		);
		rootLabel.position.set(0, labelY, 2);
		group.add(rootLabel);
		sceneGroup.rootLabel = { sprite: rootLabel, zoomOnly: false };

		this.groups.push(sceneGroup);
	}

	private clearConstellations(): void {
		for (const g of this.groups) {
			this.scene.remove(g.group);
			// Dispose materials and geometries
			g.group.traverse((obj) => {
				if (obj instanceof THREE.Sprite) {
					obj.material.dispose();
				} else if (obj instanceof THREE.Line) {
					obj.geometry.dispose();
					(obj.material as THREE.Material).dispose();
				}
			});
		}
		this.groups = [];
		this.focusedRootId = null;
		this.focusedSubId = null;
	}

	// ── Camera ──────────────────────────────────────────────────

	private fitCamera(totalRadius: number): void {
		const frustum = Math.max(600, totalRadius * 1.3);
		const aspect =
			this.container.clientWidth / this.container.clientHeight || 1;
		this.camera.left = -frustum * aspect;
		this.camera.right = frustum * aspect;
		this.camera.top = frustum;
		this.camera.bottom = -frustum;
		this.camera.zoom = 1;
		this.targetZoom = 1;
		this.camera.position.set(0, 0, 1000);
		this.camera.updateProjectionMatrix();
	}

	private startCameraAnimation(target: CameraState): void {
		this.zoomAnchor = null;
		this.animating = true;
		this.animStart = performance.now();
		this.camFrom = {
			x: this.camera.position.x,
			y: this.camera.position.y,
			zoom: this.camera.zoom,
		};
		this.camTo = target;
		this.targetZoom = target.zoom;
	}

	private updateCameraAnimation(now: number): void {
		if (!this.animating) return;
		const t = Math.min((now - this.animStart) / this.config.zoomDuration, 1);
		const e = easeInOutCubic(t);

		this.camera.position.x =
			this.camFrom.x + (this.camTo.x - this.camFrom.x) * e;
		this.camera.position.y =
			this.camFrom.y + (this.camTo.y - this.camFrom.y) * e;
		this.camera.zoom =
			this.camFrom.zoom + (this.camTo.zoom - this.camFrom.zoom) * e;
		this.targetZoom = this.camera.zoom;
		this.camera.updateProjectionMatrix();

		if (t >= 1) this.animating = false;
	}

	// ── Twinkling & focus fading ────────────────────────────────

	private updateConstellationVisuals(time: number): void {
		for (const cg of this.groups) {
			const isConstellationFocused =
				this.focusedRootId === null || this.focusedRootId === cg.rootId;
			const constellationFade = isConstellationFocused ? 1.0 : 0.08;
			const inSubFocus =
				this.focusedSubId !== null && this.focusedRootId === cg.rootId;

			// Stars: twinkle + fade
			for (const star of cg.stars) {
				const flicker = 1.0 + 0.08 * Math.sin(time * 2.0 + star.phase);
				const s = star.baseScale * flicker;
				star.sprite.scale.set(s, s, 1);

				const baseOpacity = star.type === "subcategory" ? 0.9 : 0.8;
				let starFade = constellationFade;

				if (inSubFocus) {
					// In sub-focus: only show the focused subcategory and its topics
					const belongsToFocusedSub =
						(star.type === "subcategory" &&
							star.node.id === this.focusedSubId) ||
						(star.type === "topic" &&
							star.parentSubId === this.focusedSubId);
					starFade = belongsToFocusedSub ? 1.0 : 0.05;
				}

				const target = baseOpacity * starFade;
				star.sprite.material.opacity = lerpTo(
					star.sprite.material.opacity,
					target,
					0.08,
				);
			}

			// Lines: fade
			for (const lm of cg.lines) {
				const target = lm.baseOpacity * constellationFade * (inSubFocus ? 0.15 : 1.0);
				const mat = lm.line.material as THREE.LineBasicMaterial;
				mat.opacity = lerpTo(mat.opacity, target, 0.08);
			}

			// Zoom-only labels: show when focused, respect sub-focus
			const showLabels = this.focusedRootId === cg.rootId;
			for (const label of cg.labels) {
				if (!label.zoomOnly) continue;

				let target = 0;
				if (showLabels) {
					if (inSubFocus) {
						// Only show labels belonging to focused subcategory
						target =
							label.subId === this.focusedSubId ? 1.0 : 0;
					} else {
						target = 1.0;
					}
				}

				label.sprite.material.opacity = lerpTo(
					label.sprite.material.opacity,
					target,
					0.06,
				);
			}

			// Root label opacity — hide in sub-focus
			if (cg.rootLabel) {
				const target =
					this.focusedRootId === null
						? 1.0
						: this.focusedRootId === cg.rootId
							? inSubFocus
								? 0
								: 1.0
							: 0.1;
				cg.rootLabel.sprite.material.opacity = lerpTo(
					cg.rootLabel.sprite.material.opacity,
					target,
					0.08,
				);
			}
		}
	}

	// ── Interaction handlers ────────────────────────────────────

	private onMouseMove(e: MouseEvent): void {
		const rect = this.renderer.domElement.getBoundingClientRect();
		this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
		this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
	}

	/**
	 * Click handler — only fires if the pointer didn't drag.
	 * Drag distance is tracked in onPointerDown/onPointerMove.
	 */
	private onClick(): void {
		// If the user dragged more than 4px, it's a pan — not a click
		if (this.dragDistance > 4) return;

		this.raycaster.setFromCamera(this.mouse, this.camera);
		const allInteractives = this.collectInteractives();
		const intersects = this.raycaster.intersectObjects(allInteractives);

		if (intersects.length === 0) return;

		const obj = intersects[0].object as THREE.Sprite;
		const ud = obj.userData as {
			nodeRef?: GraphNode;
			nodeType?: string;
			rootClickable?: boolean;
			rootId?: string;
		};

		if (ud.rootClickable && ud.rootId) {
			if (this.focusedRootId === ud.rootId) {
				this.unfocus();
			} else {
				this.focusConstellation(ud.rootId);
			}
		} else if (ud.nodeRef) {
			if (ud.nodeType === "topic") {
				this.callbacks.onTopicClick?.(ud.nodeRef);
			} else if (ud.nodeType === "subcategory") {
				const parent = this.groups.find((g) =>
					g.stars.some((s) => s.node.id === ud.nodeRef!.id),
				);
				if (!parent) return;

				if (this.focusedRootId === parent.rootId) {
					// Already focused on this constellation — zoom into subcategory
					if (this.focusedSubId === ud.nodeRef.id) {
						this.unfocus(); // toggle back to constellation level
					} else {
						this.focusSubcategory(ud.nodeRef.id);
					}
				} else {
					this.focusConstellation(parent.rootId);
				}
			}
		}
	}

	/**
	 * Wheel / trackpad scroll handler.
	 *
	 * Cross-browser strategy (works on Firefox/Linux, Chrome, Safari):
	 *  - ctrlKey = true  → pinch-to-zoom (trackpad) or Ctrl+scroll (mouse)
	 *  - ctrlKey = false → two-finger scroll = pan, mouse wheel = zoom
	 *
	 * To reliably tell trackpad from mouse on Firefox/Linux (where both
	 * send integer deltas), we check for the presence of deltaX — trackpads
	 * almost always produce non-zero deltaX, mouse wheels never do — and
	 * use WheelEvent.deltaMode (0 = pixel = trackpad, 1 = line = mouse).
	 */
	/**
	 * Convert a client-space mouse coordinate to world-space using the
	 * orthographic camera's current zoom and position.
	 */
	private clientToWorld(clientX: number, clientY: number): { x: number; y: number } {
		const rect = this.renderer.domElement.getBoundingClientRect();
		// Normalised device coords (-1..1)
		const ndcX = ((clientX - rect.left) / rect.width) * 2 - 1;
		const ndcY = -((clientY - rect.top) / rect.height) * 2 + 1;

		const cam = this.camera;
		const halfW = (cam.right - cam.left) / (2 * cam.zoom);
		const halfH = (cam.top - cam.bottom) / (2 * cam.zoom);
		return {
			x: cam.position.x + ndcX * halfW,
			y: cam.position.y + ndcY * halfH,
		};
	}

	private onWheel(e: WheelEvent): void {
		e.preventDefault();

		if (e.ctrlKey) {
			// Pinch-to-zoom on trackpad (or Ctrl+scroll)
			const sensitivity = 0.01;
			const oldZoom = this.targetZoom;
			this.targetZoom *= 1 - e.deltaY * sensitivity;
			this.targetZoom = Math.max(0.3, Math.min(8, this.targetZoom));

			// Zoom toward mouse position
			const world = this.clientToWorld(e.clientX, e.clientY);
			const factor = 1 - oldZoom / this.targetZoom;
			this.camera.position.x += (world.x - this.camera.position.x) * factor;
			this.camera.position.y += (world.y - this.camera.position.y) * factor;
			this.zoomAnchor = null;
			return;
		}

		// deltaMode 1 = DOM_DELTA_LINE (discrete mouse wheel)
		// deltaMode 0 = DOM_DELTA_PIXEL (trackpad or high-res mouse)
		const isDiscreteWheel = e.deltaMode === 1;

		// On pixel-mode: if deltaX is non-zero it's almost certainly a
		// two-finger trackpad gesture.  Pure vertical pixel scroll with
		// deltaX === 0 is ambiguous — could be trackpad or a smooth-scroll
		// mouse — so we treat it as zoom (same as a regular scroll wheel).
		const isTrackpadPan = !isDiscreteWheel && e.deltaX !== 0;

		if (isTrackpadPan) {
			// Two-finger scroll → pan
			const panScale = 1.0 / this.camera.zoom;
			this.camera.position.x += e.deltaX * panScale;
			this.camera.position.y -= e.deltaY * panScale;
		} else {
			// Mouse wheel or single-axis trackpad scroll → zoom
			const delta = isDiscreteWheel ? e.deltaY * 16 : e.deltaY;
			const sensitivity = 0.002;
			this.targetZoom *= 1 - delta * sensitivity;
			this.targetZoom = Math.max(0.3, Math.min(8, this.targetZoom));

			// Store the world-space point under the cursor so the
			// animation loop can keep it pinned as zoom interpolates.
			const rect = this.renderer.domElement.getBoundingClientRect();
			const ndcX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
			const ndcY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
			this.zoomAnchor = {
				wx: this.camera.position.x + ndcX * (this.camera.right - this.camera.left) / (2 * this.camera.zoom),
				wy: this.camera.position.y + ndcY * (this.camera.top - this.camera.bottom) / (2 * this.camera.zoom),
				sx: ndcX,
				sy: ndcY,
			};
		}
	}

	/**
	 * Pointer down — start a potential drag/pan.
	 *
	 * The double-tap-hold gesture on Linux touchpads fires as a normal
	 * left-button pointerdown, so it's handled here automatically.
	 * We use a drag-distance threshold (4px) to distinguish clicks
	 * from drags — the click handler ignores events where the pointer
	 * moved more than 4px.
	 */
	private onPointerDown(e: PointerEvent): void {
		this.isPanning = true;
		this.dragDistance = 0;
		this.panStart = { x: e.clientX, y: e.clientY };
		this.pointerDownPos = { x: e.clientX, y: e.clientY };
		// Capture so we keep getting events even if pointer leaves canvas
		this.renderer.domElement.setPointerCapture(e.pointerId);
	}

	private onPointerMove(e: PointerEvent): void {
		if (!this.isPanning) return;

		const dx = e.clientX - this.panStart.x;
		const dy = e.clientY - this.panStart.y;

		// Track total distance for click-vs-drag detection
		this.dragDistance = Math.max(
			this.dragDistance,
			Math.hypot(
				e.clientX - this.pointerDownPos.x,
				e.clientY - this.pointerDownPos.y,
			),
		);

		// Only start panning once past the drag threshold
		if (this.dragDistance > 4) {
			const panScale = 1.0 / this.camera.zoom;
			this.camera.position.x -= dx * panScale;
			this.camera.position.y += dy * panScale;
		}

		this.panStart = { x: e.clientX, y: e.clientY };
	}

	private onPointerUp(e: PointerEvent): void {
		this.isPanning = false;
		this.renderer.domElement.releasePointerCapture(e.pointerId);
	}

	// ── Touch handlers (mobile / tablet) ─────────────────────────

	private onTouchStart(e: TouchEvent): void {
		e.preventDefault();
		for (const t of Array.from(e.changedTouches)) {
			this.activeTouches.set(t.identifier, { x: t.clientX, y: t.clientY });
		}
		if (this.activeTouches.size === 2) {
			const pts = Array.from(this.activeTouches.values());
			this.lastPinchDist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
			this.lastPinchCenter = {
				x: (pts[0].x + pts[1].x) / 2,
				y: (pts[0].y + pts[1].y) / 2,
			};
		}
	}

	private onTouchMove(e: TouchEvent): void {
		e.preventDefault();
		for (const t of Array.from(e.changedTouches)) {
			this.activeTouches.set(t.identifier, { x: t.clientX, y: t.clientY });
		}

		if (this.activeTouches.size === 1) {
			// Single finger drag → pan
			const t = Array.from(e.changedTouches)[0];
			const prev = this.activeTouches.get(t.identifier);
			if (!prev) return;
			const dx = t.clientX - prev.x;
			const dy = t.clientY - prev.y;
			const panScale = 1.0 / this.camera.zoom;
			this.camera.position.x -= dx * panScale;
			this.camera.position.y += dy * panScale;
			this.activeTouches.set(t.identifier, {
				x: t.clientX,
				y: t.clientY,
			});
		} else if (this.activeTouches.size === 2) {
			// Two finger → pinch zoom + pan
			const pts = Array.from(this.activeTouches.values());
			const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
			const center = {
				x: (pts[0].x + pts[1].x) / 2,
				y: (pts[0].y + pts[1].y) / 2,
			};

			if (this.lastPinchDist > 0) {
				const scale = dist / this.lastPinchDist;
				this.targetZoom = Math.max(0.3, Math.min(8, this.targetZoom * scale));

				// Set zoom anchor at pinch center
				const rect = this.renderer.domElement.getBoundingClientRect();
				const ndcX = ((center.x - rect.left) / rect.width) * 2 - 1;
				const ndcY = -((center.y - rect.top) / rect.height) * 2 + 1;
				this.zoomAnchor = {
					wx: this.camera.position.x + ndcX * (this.camera.right - this.camera.left) / (2 * this.camera.zoom),
					wy: this.camera.position.y + ndcY * (this.camera.top - this.camera.bottom) / (2 * this.camera.zoom),
					sx: ndcX,
					sy: ndcY,
				};
			}

			// Pan with pinch center movement
			const panScale = 1.0 / this.camera.zoom;
			this.camera.position.x -= (center.x - this.lastPinchCenter.x) * panScale;
			this.camera.position.y += (center.y - this.lastPinchCenter.y) * panScale;

			this.lastPinchDist = dist;
			this.lastPinchCenter = center;
		}
	}

	private onTouchEnd(e: TouchEvent): void {
		for (const t of Array.from(e.changedTouches)) {
			this.activeTouches.delete(t.identifier);
		}
		if (this.activeTouches.size < 2) {
			this.lastPinchDist = 0;
		}
	}

	// ── Keyboard ─────────────────────────────────────────────────

	private onKeyDown(e: KeyboardEvent): void {
		if (e.key === "Escape") {
			if (this.focusedSubId || this.focusedRootId) {
				this.unfocus();
			}
		}
	}

	// ── Hover detection (called each frame) ─────────────────────

	private updateHover(): void {
		this.raycaster.setFromCamera(this.mouse, this.camera);
		const allInteractives = this.collectInteractives();
		const intersects = this.raycaster.intersectObjects(allInteractives);

		let newHovered: GraphNode | null = null;

		if (intersects.length > 0) {
			const obj = intersects[0].object as THREE.Sprite;
			const ud = obj.userData as {
				nodeRef?: GraphNode;
				rootClickable?: boolean;
			};
			if (ud.nodeRef) {
				newHovered = ud.nodeRef;
			}
			this.renderer.domElement.style.cursor = "pointer";
		} else {
			this.renderer.domElement.style.cursor = "default";
		}

		if (newHovered !== this.hoveredNode) {
			this.hoveredNode = newHovered;
			this.callbacks.onHover?.(newHovered);
		}
	}

	private collectInteractives(): THREE.Sprite[] {
		const list: THREE.Sprite[] = [];
		for (const cg of this.groups) {
			for (const star of cg.stars) {
				// Tag sprites with userData for raycasting identification
				star.sprite.userData = {
					nodeRef: star.node,
					nodeType: star.type,
				};
				list.push(star.sprite);
			}
			if (cg.rootLabel) {
				cg.rootLabel.sprite.userData = {
					rootClickable: true,
					rootId: cg.rootId,
				};
				list.push(cg.rootLabel.sprite);
			}
		}
		return list;
	}

	// ── Resize ──────────────────────────────────────────────────

	private handleResize(): void {
		const w = this.container.clientWidth;
		const h = this.container.clientHeight;
		if (w === 0 || h === 0) return;

		const a = w / h;
		const frustum = Math.abs(this.camera.top);
		this.camera.left = -frustum * a;
		this.camera.right = frustum * a;
		this.camera.updateProjectionMatrix();

		this.renderer.setSize(w, h);
		this.composer.setSize(w, h);
	}

	// ── Render loop ─────────────────────────────────────────────

	private animate = (): void => {
		if (this.disposed) return;
		this.animFrameId = requestAnimationFrame(this.animate);

		const time = this.clock.getElapsedTime();
		const now = performance.now();

		// Background star twinkling
		if (this.bgStarMaterial) {
			this.bgStarMaterial.uniforms.uTime.value = time;
		}

		this.updateCameraAnimation(now);

		// Smooth zoom interpolation (for trackpad/pinch)
		if (Math.abs(this.camera.zoom - this.targetZoom) > 0.001) {
			this.camera.zoom = lerpTo(this.camera.zoom, this.targetZoom, 0.15);

			// Keep the zoom anchor point pinned under the cursor
			if (this.zoomAnchor) {
				const a = this.zoomAnchor;
				const halfW = (this.camera.right - this.camera.left) / (2 * this.camera.zoom);
				const halfH = (this.camera.top - this.camera.bottom) / (2 * this.camera.zoom);
				this.camera.position.x = a.wx - a.sx * halfW;
				this.camera.position.y = a.wy - a.sy * halfH;
			}

			this.camera.updateProjectionMatrix();

			// Auto-unfocus when zoomed out
			if (
				this.focusedRootId &&
				this.camera.zoom < this.config.unfocusZoomThreshold
			) {
				this.unfocus();
			}
		} else {
			this.zoomAnchor = null;
		}

		this.updateConstellationVisuals(time);
		this.updateHover();

		this.composer.render();
	};
}
