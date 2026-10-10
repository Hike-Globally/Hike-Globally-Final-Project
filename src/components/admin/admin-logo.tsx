import Image from 'next/image'

export default function AdminLogo() {
  return (
    <div className="hg-admin-logo">
      <span className="hg-admin-logo__mark" aria-hidden="true">
        <Image src="/images/logo.svg" alt="" width={32} height={30} unoptimized />
      </span>
      <span className="hg-admin-logo__wordmark">
        <span className="hg-admin-logo__name">Hike Globally</span>
        <span className="hg-admin-logo__descriptor">EXPEDITIONS · NEPAL</span>
      </span>
    </div>
  )
}
