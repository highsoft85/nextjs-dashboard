import { GlobeAltIcon } from '@heroicons/react/24/outline';
import { lusitana } from '@/app/ui/fonts';

export default function AppLogo() {
  return (
    <div
      className={`${lusitana.className} flex flex-row items-center leading-none text-white`}>
      <GlobeAltIcon className="h12 w-12 rotate-[15deg]" />
      <p className="text-[44px]">Highsoft85</p>
    </div>
  )
}