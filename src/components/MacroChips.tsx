interface Props {
  p: number;
  c: number;
  f: number;
}

const chipStyle = {
  fontSize: 11,
  padding: "2px 8px",
  borderRadius: 20,
  fontWeight: 600,
  lineHeight: 1.2,
  whiteSpace: "nowrap" as const,
};

export function MacroChips({ p, c, f }: Props) {
  return (
    <div className="mt-1 flex flex-wrap items-center gap-1.5">
      <span style={{ ...chipStyle, background: "rgba(62,155,255,0.15)", color: "#3E9BFF" }}>
        P: {p}g 🔵
      </span>
      <span style={{ ...chipStyle, background: "rgba(255,217,61,0.15)", color: "#FFD93D" }}>
        C: {c}g 🟡
      </span>
      <span style={{ ...chipStyle, background: "rgba(255,107,107,0.15)", color: "#FF6B6B" }}>
        F: {f}g 🔴
      </span>
    </div>
  );
}
