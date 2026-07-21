import loadingImage from "./assets/loading-image.png";

type WaitingMascotProps = {
  size?: number;
};

/** Playful bounce+spin loading mascot next to waiting copy. */
export function WaitingMascot({ size = 28 }: WaitingMascotProps) {
  return (
    <img
      src={loadingImage}
      alt=""
      width={size}
      height={size}
      className="waiting-mascot"
      draggable={false}
    />
  );
}
