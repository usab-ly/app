import Sidebar from '@/components/Sidebar';
import TitleBar from '@/components/TitleBar';

export default function Home() {
  return (
    <main className='flex flex-col h-screen w-screen overflow-hidden'>
      <TitleBar />
      <div className='flex-1 relative'>
        <Sidebar />
        {/* BrowserView is managed by Electron, no component needed here */}
      </div>
    </main>
  );
}
