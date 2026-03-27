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
    <nav className="lg:hidden fixed bottom-6 left-4 right-4 z-50 h-[70px] bg-primary rounded-[24px] shadow-[0_10px_40px_rgba(0,0,0,0.3)] border border-white/10">
      <div className="relative flex items-center justify-around h-full px-2">
        
        {/* Animated Background Liquid Cutout Container */}
        <div className="absolute inset-0 pointer-events-none overflow-visible">
          <motion.div
            className="absolute top-[-35px] w-[70px] h-[70px] z-10"
            initial={false}
            animate={{
              left: `${(activeIndex * (100 / navItems.length)) + (100 / navItems.length / 2)}%`,
              translateX: "-50%"
            }}
            transition={{ type: "spring", stiffness: 300, damping: 35 }}
          >
            {/* White Circle Indicator with Red Border */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[65px] h-[65px] bg-white rounded-full border-[5px] border-primary shadow-xl flex items-center justify-center z-20">
               {activeIndex !== -1 && (
                <div className="text-primary">
                  {(() => {
                    const Icon = navItems[activeIndex].icon;
                    return <Icon className="h-7 w-7 stroke-[2.5px]" />;
                  })()}
                </div>
              )}
            </div>

            {/* Liquid Curve Left */}
            <div className="absolute top-[35px] left-[-22px] w-6 h-6 bg-transparent z-10" 
                 style={{ 
                   borderTopRightRadius: '22px',
                   boxShadow: '10px -10px 0 0 white' 
                 }} />
            {/* Liquid Curve Right */}
            <div className="absolute top-[35px] right-[-22px] w-6 h-6 bg-transparent z-10" 
                 style={{ 
                   borderTopLeftRadius: '22px',
                   boxShadow: '-10px -10px 0 0 white' 
                 }} />
            
            {/* The actual red bar cutout background - matched to active item */}
            <div className="absolute top-[35px] left-1/2 -translate-x-1/2 w-[114px] h-[40px] bg-primary -z-10" 
                 style={{ borderRadius: '35px 35px 0 0', transform: 'translateY(-2px)' }} />
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
              className="relative flex flex-col items-center justify-center flex-1 h-full z-20 pt-2"
            >
              <motion.div
                animate={{
                  opacity: isActive ? 0 : 0.6,
                  scale: isActive ? 0 : 1,
                  y: isActive ? 20 : 0
                }}
                transition={{ duration: 0.2 }}
                className="text-white"
              >
                <Icon className="h-6 w-6 stroke-[2px]" />
              </motion.div>
              
              <motion.span
                animate={{
                  opacity: isActive ? 1 : 0.7,
                  y: isActive ? -2 : 0,
                  scale: isActive ? 1.1 : 0.9,
                }}
                className={`text-[10px] uppercase tracking-widest text-white mt-1.5 transition-all duration-300 ${isActive ? 'font-black' : 'font-bold'}`}
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
