import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Bot, History, LineChart, Settings, Blocks } from "lucide-react";
import { motion } from "framer-motion";

const navItems = [
  { path: "/", label: "Home", icon: LayoutDashboard },
  { path: "/bots", label: "Bots", icon: Bot },
  { path: "/builder", label: "Builder", icon: Blocks },
  { path: "/market", label: "Scanner", icon: LineChart },
  { path: "/history", label: "History", icon: History },
  { path: "/settings", label: "Settings", icon: Settings },
];

export default function MobileNav() {
  const location = useLocation();
  
  const activeIndex = navItems.findIndex(item => 
    location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(item.path))
  );

  const itemWidth = 100 / navItems.length;
  const centerX = (activeIndex * itemWidth) + (itemWidth / 2);

  // Narrower curve for 6 items (each item is ~16.6% wide)
  const curveWidth = 10; 

  return (
    <nav className="lg:hidden fixed bottom-4 left-4 right-4 z-[9999] h-[72px] safe-area-bottom">
      <div className="relative w-full h-full">
        {/* SVG Background with Liquid Curve Cutout */}
        <div className="absolute inset-0 z-0 pointer-events-none drop-shadow-[0_-8px_20px_rgba(0,0,0,0.1)]">
          <svg width="100%" height="72" viewBox="0 0 100 72" preserveAspectRatio="none" className="overflow-visible">
            <motion.path
              fill="#E31C4B"
              animate={{
                d: `M 0,22
                    Q 0,22 4,22
                    L ${centerX - curveWidth},22 
                    C ${centerX - curveWidth + 4},22 ${centerX - curveWidth + 6},22 ${centerX - curveWidth + 7},17
                    C ${centerX - curveWidth + 8},8 ${centerX + curveWidth - 8},8 ${centerX + curveWidth - 7},17
                    C ${centerX + curveWidth - 6},22 ${centerX + curveWidth - 4},22 ${centerX + curveWidth},22
                    L 96,22
                    Q 100,22 100,22
                    L 100,68
                    Q 100,72 96,72
                    L 4,72
                    Q 0,72 0,68
                    Z`
              }}
              transition={{ type: "spring", stiffness: 180, damping: 22 }}
            />
          </svg>
        </div>

        {/* Floating Circle Indicator */}
        <div className="absolute inset-0 pointer-events-none z-20">
          <motion.div
            className="absolute top-[-20px] w-[56px] h-[56px]"
            initial={false}
            animate={{
              left: `${centerX}%`,
              translateX: "-50%"
            }}
            transition={{ type: "spring", stiffness: 180, damping: 22 }}
          >
            <div className="w-full h-full bg-white rounded-full border-[3px] border-primary shadow-2xl flex items-center justify-center">
               {activeIndex !== -1 && (
                <div className="text-primary">
                  {(() => {
                    const Icon = navItems[activeIndex].icon;
                    return <Icon className="h-6 w-6 stroke-[2.5px]" />;
                  })()}
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Navigation Items */}
        <div className="relative flex items-center justify-around h-full px-1 z-10">
          {navItems.map((item, index) => {
            const isActive = index === activeIndex;
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                className="relative flex flex-col items-center justify-center flex-1 h-full pt-6"
              >
                <motion.div
                  animate={{
                    opacity: isActive ? 0 : 0.6,
                    scale: isActive ? 0 : 1,
                    y: isActive ? 10 : 0
                  }}
                  className="text-white"
                >
                  <Icon className="h-5 w-5 stroke-[2px]" />
                </motion.div>
                
                <motion.span
                  animate={{
                    opacity: isActive ? 1 : 0.6,
                    y: isActive ? -5 : 0,
                    scale: isActive ? 1.05 : 0.9,
                  }}
                  className={`text-[8px] uppercase tracking-widest text-white mt-1.5 transition-all duration-300 ${isActive ? 'font-black' : 'font-bold'}`}
                >
                  {item.label}
                </motion.span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
