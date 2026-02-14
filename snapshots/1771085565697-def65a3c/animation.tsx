import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";

export const MyAnimation = () => {
	/*
		DVD-ROM style screensaver: the provided image moves in a straight line at a steady speed,
		bouncing off the edges forever. On every wall hit (including corners), the graphic changes
		color via a hue shift, while keeping linear motion and no rotation.
	*/

	const frame = useCurrentFrame();
	const { width, height, fps } = useVideoConfig();

	// COLORS
	const COLOR_BACKGROUND = "#0B0D12";
	const COLOR_ACCENT = "#7C5CFF";
	const COLOR_ACCENT_2 = "#22D3EE";

	// TEXT
	const IMAGE_SRC =
		"https://i.pinimg.com/600x/ac/82/57/ac8257e1cfc4e63f5c63f3d4869eb7c4.jpg";

	// ICON (iObserver)
	const IOBSERVER_ICON_SRC =
		"https://raw.githubusercontent.com/dumitruPuggle/motion-doge-screensaver/main/uploads/1771085450682-7db4be5d/asset-1.svg";

	// TIMING
	const HUE_STEP_DEG = 42;
	const INTRO_DURATION = Math.round(fps * 0.7);
	const ICON_INTRO_DELAY = Math.round(fps * 0.25);
	const HIT_PUNCH_FRAMES = Math.round(fps * 0.18);
	const HIT_GLOW_FRAMES = Math.round(fps * 0.26);
	const HIT_SQUASH_FRAMES = Math.round(fps * 0.12);

	// LAYOUT
	const PADDING = Math.max(24, Math.round(width * 0.04));
	const LOGO_WIDTH = Math.max(180, Math.round(width * 0.24));
	const LOGO_HEIGHT = Math.max(110, Math.round(height * 0.18));
	const START_X = Math.max(0, Math.round((width - LOGO_WIDTH) * 0.18));
	const START_Y = Math.max(0, Math.round((height - LOGO_HEIGHT) * 0.22));
	const ICON_SIZE = Math.max(44, Math.round(width * 0.06));
	const HUD_HEIGHT = Math.max(70, Math.round(height * 0.12));

	// Calculations and derived values
	const t = frame / fps;

	const minX = PADDING;
	const minY = PADDING;
	const maxX = width - PADDING - LOGO_WIDTH;
	const maxY = height - PADDING - LOGO_HEIGHT;

	const travelX = Math.max(1, maxX - minX);
	const travelY = Math.max(1, maxY - minY);

	// Fast, steady, linear speed (px/s), scaled to comp size
	const SPEED_X = Math.max(480, Math.round(width * 0.9));
	const SPEED_Y = Math.max(420, Math.round(height * 0.85));

	const reflect01 = (u: number) => {
		// u in [0..inf) -> reflected sawtooth in [0..1]
		const m = u % 2;
		return m <= 1 ? m : 2 - m;
	};

	const cyclesX = (START_X - minX + SPEED_X * t) / travelX;
	const cyclesY = (START_Y - minY + SPEED_Y * t) / travelY;

	const x = minX + reflect01(cyclesX) * travelX;
	const y = minY + reflect01(cyclesY) * travelY;

	// Bounce count: each time we cross a wall on either axis
	const bounceCountX = Math.max(0, Math.floor(cyclesX));
	const bounceCountY = Math.max(0, Math.floor(cyclesY));
	const bounceCount = bounceCountX + bounceCountY;

	const hueTarget = (bounceCount * HUE_STEP_DEG) % 360;

	// Detect a new hit (either axis) on this frame
	const bounceCountPrev =
		Math.max(0, Math.floor((START_X - minX + SPEED_X * (Math.max(0, frame - 1) / fps)) / travelX)) +
		Math.max(0, Math.floor((START_Y - minY + SPEED_Y * (Math.max(0, frame - 1) / fps)) / travelY));
	const didHitThisFrame = bounceCount !== bounceCountPrev;
	const lastHitFrame = didHitThisFrame ? frame : null;

	// Keep track of the most recent hit frame without state by deriving from bounceCount.
	// We approximate the moment since last hit by measuring the fractional part distance to the next boundary.
	const fracX = cyclesX - Math.floor(cyclesX);
	const fracY = cyclesY - Math.floor(cyclesY);
	const distToWallX = Math.min(fracX, 1 - fracX);
	const distToWallY = Math.min(fracY, 1 - fracY);
	const wallProximity = Math.min(distToWallX, distToWallY);
	const hitProgress = interpolate(
		wallProximity,
		[0, 0.035, 0.12],
		[1, 0.65, 0],
		{ extrapolateLeft: "clamp", extrapolateRight: "clamp" }
	);

	// Layered intro
	const introOpacity = interpolate(frame, [0, INTRO_DURATION], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	const introScale = spring({
		frame,
		fps,
		config: { damping: 16, stiffness: 110, mass: 0.9 },
	});
	const introY = interpolate(introScale, [0, 1], [Math.round(height * 0.02), 0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	// Smooth hue transition (instead of instantaneous steps) when a hit occurs
	const hueEase = spring({
		frame: frame - bounceCount * 1,
		fps,
		config: { damping: 18, stiffness: 120, mass: 0.8 },
	});
	const hue = interpolate(hueEase, [0, 1], [hueTarget - HUE_STEP_DEG, hueTarget], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	// Micro-interactions on wall proximity: punch, glow, and subtle squash
	const punch = spring({
		frame: frame - Math.round(hitProgress * HIT_PUNCH_FRAMES),
		fps,
		config: { damping: 10, stiffness: 260, mass: 0.6 },
	});
	const punchScale = interpolate(hitProgress, [0, 1], [1, 1.06], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	const punchEase = interpolate(punch, [0, 1], [1, punchScale], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	const squashAmt = interpolate(hitProgress, [0, 1], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	const squashX = interpolate(squashAmt, [0, 1], [1, 1.045], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	const squashY = interpolate(squashAmt, [0, 1], [1, 0.96], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	const glowStrength = interpolate(hitProgress, [0, 1], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp" }
	);
	const blurPx = interpolate(glowStrength, [0, 1], [0, 1.2], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	// Bottom icon: staged entrance + subtle breathing (not synced with main image)
	const iconIn = spring({
		frame: frame - ICON_INTRO_DELAY,
		fps,
		config: { damping: 18, stiffness: 140, mass: 0.9 },
	});
	const iconOpacity = interpolate(iconIn, [0, 1], [0, 0.92], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	const iconY = interpolate(iconIn, [0, 1], [Math.round(height * 0.03), 0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	const breathe =
		0.5 +
		0.5 *
			Math.sin((2 * Math.PI * frame) / Math.max(1, Math.round(fps * 2.8)));
	const iconScale = 1 + 0.02 * breathe;

	// Background accents: vignette + faint scanline shimmer (static bg color from frame 0)
	const vignetteOpacity = 0.55;
	const scanOpacity = 0.08;
	const scanShift = interpolate(
		(frame % Math.max(1, Math.round(fps * 1.2))) / Math.max(1, Math.round(fps * 1.2)),
		[0, 1],
		[0, Math.max(1, Math.round(height * 0.18))],
		{ extrapolateLeft: "clamp", extrapolateRight: "clamp" }
	);

	return (
		<AbsoluteFill
			style={{
				backgroundColor: COLOR_BACKGROUND,
				fontFamily: "Inter, sans-serif",
				overflow: "hidden",
			}}
		>
			{/* Background polish layers */}
			<AbsoluteFill
				style={{
					backgroundImage: `radial-gradient(80% 70% at 50% 45%, rgba(124,92,255,0.16) 0%, rgba(11,13,18,0.0) 55%, rgba(0,0,0,0.65) 100%)`,
					opacity: vignetteOpacity,
				}}
			/>
			<AbsoluteFill
				style={{
					backgroundImage:
						"linear-gradient(to bottom, rgba(255,255,255,0.0) 0%, rgba(255,255,255,0.25) 50%, rgba(255,255,255,0.0) 100%)",
					opacity: scanOpacity,
					transform: `translate3d(0, ${scanShift}px, 0)`,
					mixBlendMode: "overlay",
				}}
			/>

			{/* Moving logo (intent preserved: linear motion, no rotation) */}
			<Img
				src={IMAGE_SRC}
				style={{
					position: "absolute",
					left: 0,
					top: 0,
					width: LOGO_WIDTH,
					height: LOGO_HEIGHT,
					objectFit: "contain",
					transform: `translate3d(${x}px, ${y + introY}px, 0) scale(${introScale * punchEase}) scaleX(${squashX}) scaleY(${squashY})`,
					opacity: introOpacity,
					filter: `hue-rotate(${hue}deg) saturate(1.35) brightness(1.08) blur(${blurPx}px) drop-shadow(0 10px 26px rgba(0,0,0,0.55))`,
					willChange: "transform, filter, opacity",
					pointerEvents: "none",
				}}
			/>

			{/* Hit glow overlay (brief accent near collisions) */}
			<div
				style={{
					position: "absolute",
					left: 0,
					top: 0,
					width: LOGO_WIDTH,
					height: LOGO_HEIGHT,
					transform: `translate3d(${x}px, ${y + introY}px, 0) scale(${introScale * (1 + 0.03 * glowStrength)})`,
					opacity: introOpacity * 0.55 * glowStrength,
					background: `radial-gradient(70% 70% at 50% 50%, rgba(34,211,238,0.55) 0%, rgba(124,92,255,0.28) 45%, rgba(0,0,0,0) 75%)`,
					mixBlendMode: "screen",
					filter: `blur(${Math.max(1, Math.round(width * 0.003))}px)`,
					pointerEvents: "none",
				}}
			/>

			{/* Bottom HUD strip (full-width, subtle) */}
			<div
				style={{
					position: "absolute",
					left: 0,
					right: 0,
					bottom: 0,
					height: HUD_HEIGHT,
					background:
						"linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 55%, rgba(0,0,0,0) 100%)",
					pointerEvents: "none",
				}}
			/>

			{/* iObserver icon: delayed entrance + micro motion */}
			<Img
				src={IOBSERVER_ICON_SRC}
				style={{
					position: "absolute",
					left: "50%",
					bottom: PADDING,
					width: ICON_SIZE,
					height: ICON_SIZE,
					objectFit: "contain",
					opacity: iconOpacity,
					transform: `translate3d(-50%, ${iconY}px, 0) scale(${iconScale})`,
					filter: `drop-shadow(0 10px 22px rgba(0,0,0,0.55)) drop-shadow(0 0 ${Math.round(10 + 18 * glowStrength)}px rgba(124,92,255,${0.15 + 0.25 * glowStrength}))`,
					pointerEvents: "none",
					willChange: "transform, filter, opacity",
				}}
			/>

			{/* Tiny accent line for hierarchy (appears after icon) */}
			<div
				style={{
					position: "absolute",
					left: PADDING,
					right: PADDING,
					bottom: PADDING + Math.round(ICON_SIZE * 0.5),
					height: 1,
					opacity: interpolate(
						frame,
						[ICON_INTRO_DELAY, ICON_INTRO_DELAY + Math.round(fps * 0.35)],
						[0, 0.22],
						{ extrapolateLeft: "clamp", extrapolateRight: "clamp" }
					),
					background: `linear-gradient(90deg, rgba(124,92,255,0) 0%, ${COLOR_ACCENT} 35%, ${COLOR_ACCENT_2} 65%, rgba(34,211,238,0) 100%)`,
					filter: `blur(${Math.max(0, Math.round(width * 0.0006))}px)`,
					pointerEvents: "none",
				}}
			/>
		</AbsoluteFill>
	);
};