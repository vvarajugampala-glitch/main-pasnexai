import { ImageResponse } from "next/og";

export const alt = "Pasnex.ai AI Automation Platform";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#030712",
          color: "white",
          position: "relative",
          overflow: "hidden",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 18% 20%, rgba(37,99,235,.42), transparent 30%), radial-gradient(circle at 86% 24%, rgba(124,58,237,.34), transparent 28%), linear-gradient(135deg, #030712 0%, #07101d 52%, #08152a 100%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: 70,
            top: 80,
            width: 330,
            height: 330,
            borderRadius: 999,
            border: "2px solid rgba(96,165,250,.35)",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: 118,
            top: 128,
            width: 234,
            height: 234,
            borderRadius: 999,
            border: "2px solid rgba(124,58,237,.35)",
          }}
        />
        <div style={{ position: "relative", display: "flex", flexDirection: "column", padding: "72px 82px", width: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div
              style={{
                width: 76,
                height: 76,
                borderRadius: 20,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(135deg, #2563eb, #7c3aed 52%, #22d3ee)",
                fontSize: 42,
                fontWeight: 900,
              }}
            >
              P
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 46, fontWeight: 900, letterSpacing: -1 }}>Pasnex.ai</div>
              <div style={{ marginTop: 4, fontSize: 18, color: "#94a3b8", letterSpacing: 4, textTransform: "uppercase" }}>
                AI Automation Platform
              </div>
            </div>
          </div>

          <div style={{ marginTop: 74, maxWidth: 760, fontSize: 76, lineHeight: 1.02, fontWeight: 900 }}>
            Automate social conversations with AI.
          </div>
          <div style={{ marginTop: 28, maxWidth: 720, fontSize: 28, lineHeight: 1.45, color: "#cbd5e1" }}>
            Instagram, Facebook, WhatsApp, lead capture, replies and support workflows that work 24/7.
          </div>

          <div style={{ marginTop: 54, display: "flex", gap: 18 }}>
            {["AI Replies", "Lead Capture", "24/7 Support"].map((item) => (
              <div
                key={item}
                style={{
                  padding: "14px 22px",
                  borderRadius: 999,
                  background: "rgba(255,255,255,.08)",
                  border: "1px solid rgba(255,255,255,.12)",
                  fontSize: 22,
                  fontWeight: 700,
                  color: "#e2e8f0",
                }}
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    size
  );
}
