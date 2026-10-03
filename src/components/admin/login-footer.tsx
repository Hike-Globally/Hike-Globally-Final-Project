export default function AdminLoginFooter() {
  return (
    <div className="hg-login-footer">
      <span className="hg-login-footer__secure">
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <rect x="4.5" y="8.5" width="11" height="8" rx="2" />
          <path d="M7 8.5V6a3 3 0 0 1 6 0v2.5" />
          <path d="M10 11.5v2" />
        </svg>
        Private team workspace
      </span>
      <span className="hg-login-footer__divider" aria-hidden="true" />
      <span>Authorized team members only</span>
    </div>
  )
}
