/**
 * Barrel for the PORTRAIT-ROBOT screen (ADR-0079 / ADR-0083). Render-only: it
 * imports `src/game` TYPES and nothing else from the game layer.
 */
export { PortraitRobotScreen } from "./PortraitRobotScreen";
export type { PortraitRobotScreenProps, PortraitBandView } from "./PortraitRobotScreen";
export { TelecarteGauge } from "./TelecarteGauge";
export type { TelecarteGaugeProps } from "./TelecarteGauge";
export { EarlyExitButton, ARM_WINDOW_MS } from "./EarlyExitButton";
export type { EarlyExitButtonProps } from "./EarlyExitButton";
