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
  
  // Find active index
  const activeIndex = navItems.findIndex(item => 
    location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(item.path))
  );

  return (
    <nav className="lg:hidden fixed bottom-4 left-4 right-4 z-50 h-16 bg-primary rounded-[32px] shadow-[0_10px_40px_rgba(0,0,0,0.3)] border border-white/10">
      <div className="relative flex items-center justify-around h-full px-2">
        
        {/* Animated Background Liquid Cutout Container */}
        <div className="absolute inset-0 pointer-events-none overflow-visible">
          {/* The "Liquid" cutout SVG */}
          <motion.div
            className="absolute top-[-30px] w-20 h-20 z-10"
            initial={false}
            animate={{
              left: `${(activeIndex * (100 / navItems.length)) + (100 / navItems.length / 2)}%`,
              translateX: "-50%"
            }}
            transition={{ type: "spring", stiffness: 300, damping: 35 }}
          >
            {/* White Circle Indicator */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-14 h-14 bg-white rounded-full border-[4px] border-primary shadow-lg flex items-center justify-center">
               {activeIndex !== -1 && (
                <div className="text-primary">
                  {(() => {
                    const Icon = navItems[activeIndex].icon;
                    return <Icon className="h-6 w-6 stroke-[3px]" />;
                  })()}
                </div>
              )}
            </div>

            {/* Liquid Curve Left */}
            <div className="absolute top-[30px] left-[-16px] w-5 h-5 bg-transparent rounded-tr-[20px] shadow-[4px_-4px_0_0_#E31C4B]" />
            {/* Liquid Curve Right */}
            <div className="absolute top-[30px] right-[-16px] w-5 h-5 bg-transparent rounded-tl-[20px] shadow-[-4px_-4px_0_0_#E31C4B]" />
          </motion.div>
        </div>

        {/* Navigation Items */}
        {navItems.map((item, index) => {
          const isActive = index === activeIndex;
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className="relative flex flex-col items-center justify-center flex-1 h-full z-20 pt-1"
            >
              <motion.div
                animate={{
                  opacity: isActive ? 0 : 0.5,
                  scale: isActive ? 0 : 1,
                  y: isActive ? 20 : 0
                }}
                transition={{ duration: 0.2 }}
                className="text-white"
              >
                <Icon className="h-5 w-5 stroke-[2px]" />
              </motion.div>
              
              <motion.span
                animate={{
                  opacity: isActive ? 1 : 0.6,
                  y: isActive ? 4 : 0,
                  scale: isActive ? 1.05 : 0.9,
                }}
                className={`text-[9px] uppercase tracking-wider text-white mt-1 transition-all duration-300 ${isActive ? 'font-black' : 'font-medium'}`}
              >
                {item.label}
              </motion.span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
