export default function HomePage() {
  return (
    <main style={{ margin: "0 auto", maxWidth: 960, padding: "64px 24px" }}>
      <p style={{ color: "var(--muted)", fontSize: 14, margin: 0 }}>Slick MVP</p>
      <h1 style={{ fontSize: 40, lineHeight: 1.1, margin: "12px 0 16px" }}>
        Signal-driven growth operating system
      </h1>
      <p style={{ color: "var(--muted)", fontSize: 18, lineHeight: 1.6, maxWidth: 680 }}>
        This scaffold contains the Product API, Admin Dashboard shell, Postgres domain
        model, and integration boundaries for the first implementation slice.
      </p>
    </main>
  );
}
