import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig } from "remotion";

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

	// TEXT
	const IMAGE_SRC =
		"https://i.pinimg.com/600x/ac/82/57/ac8257e1cfc4e63f5c63f3d4869eb7c4.jpg";

	// TIMING
	const HUE_STEP_DEG = 42;

	// LAYOUT
	const PADDING = Math.max(24, Math.round(width * 0.04));
	const LOGO_WIDTH = Math.max(180, Math.round(width * 0.24));
	const LOGO_HEIGHT = Math.max(110, Math.round(height * 0.18));
	const START_X = Math.max(0, Math.round((width - LOGO_WIDTH) * 0.18));
	const START_Y = Math.max(0, Math.round((height - LOGO_HEIGHT) * 0.22));

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

	const hue = (bounceCount * HUE_STEP_DEG) % 360;

	return (
		<AbsoluteFill
			style={{
				backgroundColor: COLOR_BACKGROUND,
				fontFamily: "Inter, sans-serif",
			}}
		>
			<Img
				src={IMAGE_SRC}
				style={{
					position: "absolute",
					left: 0,
					top: 0,
					width: LOGO_WIDTH,
					height: LOGO_HEIGHT,
					objectFit: "contain",
					transform: `translate3d(${x}px, ${y}px, 0)`,
					filter: `hue-rotate(${hue}deg) saturate(1.35) brightness(1.08)`,
					willChange: "transform, filter",
				}}
			/>
		</AbsoluteFill>
	);
};