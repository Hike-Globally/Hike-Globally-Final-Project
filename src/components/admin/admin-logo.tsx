export default function AdminLogo() {
  return (
    <div className="hg-admin-logo">
      <span className="hg-admin-logo__mark" aria-hidden="true">
        <svg viewBox="0 0 40 40" fill="none">
          <path d="M5.5 29.5 16.1 12l5.1 8.1 3.1-4.9 10.2 14.3H5.5Z" />
          <path d="m16.1 12 3 4.8 2.1-3.3 3.1 4.9" />
          <path d="M5.5 33.5h29" />
        </svg>
      </span>
      <span className="hg-admin-logo__wordmark">
        <span className="hg-admin-logo__name">Hike Globally</span>
        <span className="hg-admin-logo__descriptor">EXPEDITIONS · NEPAL</span>
      </span>
    </div>
  )
}
