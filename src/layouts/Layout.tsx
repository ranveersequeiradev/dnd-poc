import Header from '../components/Header';
import SideMenu from '../components/SideMenu';

export default function Layout({ children }) {
  return (
    <div className="flex flex-col min-h-screen">
      {/* <Header /> */}
      <div className="flex flex-1">
        {/* <SideMenu /> */}
        <main className="flex-1 p-4">
          {children}
        </main>
      </div>
    </div>
  );
}
