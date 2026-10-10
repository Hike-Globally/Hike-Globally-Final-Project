import Image from 'next/image'

export default function AdminIcon() {
  return (
    <span className="hg-admin-icon" aria-hidden="true">
      <Image src="/images/logo.svg" alt="" width={32} height={30} unoptimized />
    </span>
  )
}
