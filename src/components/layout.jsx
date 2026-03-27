import { Outlet } from "react-router-dom";
import Header from "./layout/Header";
import Sidebar from "./layout/Sidebar";
import MobileNav from "./layout/MobileNav";

export default function Layout() {
  return (
    <div className="flex flex-col min-h-screen bg-background overflow-x-hidden">
      <Header />
      <div className="flex flex-1 relative pt-16">
        <Sidebar />
        <main className="flex-1 lg:ml-64 w-full relative min-h-[calc(100vh-4rem)] pb-[100px] lg:pb-0 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
      <MobileNav />
      {/* Mobile Nav Bottom Background for Safety */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 h-8 bg-background z-[40]" />
    </div>
  );
}