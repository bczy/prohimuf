// Three.js layer used to hold the crosshair (and any future flat overlay) ABOVE
// the CRT composite. During the CrtPass the world renders on layer 0 into an
// offscreen target and is composited (bloom/scanlines/grain); the overlay layer
// is then drawn flat, unprocessed, straight to the screen so aim stays 1:1 and
// pixel-sharp (ADR-0031; art gate P4). Kept in its own tiny module so both the
// pass (which reads the camera-side of the seam) and CrosshairSprite (which sets
// mesh.layers) share one constant with zero extra imports.
export const CRT_OVERLAY_LAYER = 1;
