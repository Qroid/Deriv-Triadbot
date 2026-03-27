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

  return (
    <nav className="lg:hidden fixed bottom-6 left-4 right-4 z-50 h-[70px]">
      <div className="relative w-full h-full">
        {/* SVG Background with Liquid Curve Cutout */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <svg width="100%" height="70" viewBox="0 0 100 70" preserveAspectRatio="none" className="drop-shadow-2xl overflow-visible">
            <motion.path
              fill="#E31C4B"
              animate={{
                d: `M 0,20 
                    L ${centerX - 15},20 
                    C ${centerX - 10},20 ${centerX - 8},20 ${centerX - 7},15
                    C ${centerX - 5},5 ${centerX + 5},5 ${centerX + 7},15
                    C ${centerX + 8},20 ${centerX + 10},20 ${centerX + 15},20
                    L 100,20 
                    L 100,70 
                    L 0,70 
                    Z`
              }}
              transition={{ type: "spring", stiffness: 200, damping: 25 }}
            />
            {/* Base bar with rounded corners */}
            <rect x="0" y="20" width="100" height="50" rx="24" fill="#E31C4B" />
          </svg>
        </div>

        {/* Floating Circle Indicator */}
        <div className="absolute inset-0 pointer-events-none z-20">
          <motion.div
            className="absolute top-[-22px] w-[60px] h-[60px]"
            initial={false}
            animate={{
              left: `${centerX}%`,
              translateX: "-50%"
            }}
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
          >
            <div className="w-full h-full bg-white rounded-full border-[4px] border-primary shadow-xl flex items-center justify-center">
               {activeIndex !== -1 && (
                <div className="text-primary">
                  {(() => {
                    const Icon = navItems[activeIndex].icon;
                    return <Icon className="h-7 w-7 stroke-[2.5px]" />;
                  })()}
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Navigation Items */}
        <div className="relative flex items-center justify-around h-full px-2 z-10">
          {navItems.map((item, index) => {
            const isActive = index === activeIndex;
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                className="relative flex flex-col items-center justify-center flex-1 h-full pt-5"
              >
                <motion.div
                  animate={{
                    opacity: isActive ? 0 : 0.6,
                    scale: isActive ? 0 : 1,
                    y: isActive ? 10 : 0
                  }}
                  className="text-white"
                >
                  <Icon className="h-6 w-6 stroke-[2px]" />
                </motion.div>
                
                <motion.span
                  animate={{
                    opacity: isActive ? 1 : 0.7,
                    y: isActive ? -4 : 0,
                    scale: isActive ? 1.05 : 0.9,
                  }}
                  className={`text-[9px] uppercase tracking-widest text-white mt-1 transition-all duration-300 ${isActive ? 'font-black' : 'font-bold'}`}
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
