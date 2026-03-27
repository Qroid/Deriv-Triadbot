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

  return (
    <nav className="lg:hidden fixed bottom-6 left-4 right-4 z-50 h-[70px]">
      <div className="relative w-full h-full">
        {/* SVG Background with Dynamic Cutout */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <svg width="100%" height="70" viewBox="0 0 100 70" preserveAspectRatio="none">
            <defs>
              <mask id="liquid-mask">
                <rect x="0" y="0" width="100" height="70" fill="white" />
                <motion.circle 
                  animate={{ 
                    cx: `${(activeIndex * (100 / navItems.length)) + (100 / navItems.length / 2)}` 
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 35 }}
                  cy="15" 
                  r="13" 
                  fill="black" 
                />
              </mask>
            </defs>
            <rect 
              x="0" 
              y="15" 
              width="100" 
              height="55" 
              rx="24" 
              fill="#E31C4B" 
              mask="url(#liquid-mask)"
            />
          </svg>
        </div>

        {/* Floating Circle Indicator */}
        <div className="absolute inset-0 pointer-events-none z-20">
          <motion.div
            className="absolute top-[-25px] w-[60px] h-[60px]"
            initial={false}
            animate={{
              left: `${(activeIndex * (100 / navItems.length)) + (100 / navItems.length / 2)}%`,
              translateX: "-50%"
            }}
            transition={{ type: "spring", stiffness: 300, damping: 35 }}
          >
            <div className="w-full h-full bg-white rounded-full border-[5px] border-[#E31C4B] shadow-xl flex items-center justify-center">
               {activeIndex !== -1 && (
                <div className="text-[#E31C4B]">
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
                className="relative flex flex-col items-center justify-center flex-1 h-full pt-4"
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
                    y: isActive ? -5 : 0,
                    scale: isActive ? 1.1 : 0.9,
                  }}
                  className={`text-[10px] uppercase tracking-widest text-white mt-1 transition-all duration-300 ${isActive ? 'font-black' : 'font-bold'}`}
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
