import { ImageResponse } from "next/og";

/** App icon: gold "K" monogram on black, generated so no binary assets live in the repo. */
export function appIcon(size: number) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#161412",
          color: "#b08d57",
          fontSize: size * 0.62,
          fontFamily: "serif",
        }}
      >
        K
      </div>
    ),
    { width: size, height: size },
  );
}
