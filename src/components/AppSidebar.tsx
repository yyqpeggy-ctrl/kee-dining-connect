import { NavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  UtensilsCrossed,
  Wine,
  ClipboardList,
  ChefHat,
  Store,
  Users,
  DollarSign,
  Scale,
  ShoppingCart,
  CookingPot,
  Megaphone,
} from "lucide-react";
import StoreSelector from "./StoreSelector";
import { useStore } from "@/contexts/StoreContext";

const navSections = [
  {
    title: "运营中心",
    items: [
      { to: "/", icon: LayoutDashboard, label: "仪表盘" },
      { to: "/tables", icon: UtensilsCrossed, label: "桌台管理" },
      { to: "/orders", icon: ClipboardList, label: "订单管理" },
      { to: "/kitchen", icon: CookingPot, label: "厨房管理" },
    ],
  },
  {
    title: "供应链",
    items: [
      { to: "/inventory", icon: Wine, label: "库存管理" },
      { to: "/procurement", icon: ShoppingCart, label: "采购管理" },
    ],
  },
  {
    title: "企业管理",
    items: [
      { to: "/stores", icon: Store, label: "门店管理" },
      { to: "/hr", icon: Users, label: "人事管理" },
      { to: "/finance", icon: DollarSign, label: "财务管理" },
      { to: "/legal", icon: Scale, label: "法务管理" },
      { to: "/marketing", icon: Megaphone, label: "市场管理" },
    ],
  },
];

const AppSidebar = () => {
  const location = useLocation();
  const { currentStore, setCurrentStore } = useStore();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-[220px] bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border">
        <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
          <ChefHat className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-sm font-bold font-display text-foreground tracking-tight">食智云</h1>
          <p className="text-[10px] text-muted-foreground">餐饮企业管理平台</p>
        </div>
      </div>

      {/* Store Selector */}
      <div className="px-3 py-3 border-b border-sidebar-border">
        <StoreSelector currentStore={currentStore} onStoreChange={setCurrentStore} />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto scrollbar-hide">
        {navSections.map((section) => (
          <div key={section.title}>
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-3 mb-2">
              {section.title}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = location.pathname === item.to;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className="relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors group"
                  >
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-active"
                        className="absolute inset-0 rounded-lg bg-sidebar-accent glow-border"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                      />
                    )}
                    <item.icon
                      className={`relative z-10 w-4 h-4 transition-colors ${
                        isActive ? "text-primary" : "text-sidebar-foreground group-hover:text-foreground"
                      }`}
                    />
                    <span
                      className={`relative z-10 transition-colors ${
                        isActive ? "text-foreground font-medium" : "text-sidebar-foreground group-hover:text-foreground"
                      }`}
                    >
                      {item.label}
                    </span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-medium text-secondary-foreground">
            管
          </div>
          <div>
            <p className="text-xs font-medium text-foreground">系统管理员</p>
            <p className="text-[10px] text-muted-foreground">{currentStore.name}</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default AppSidebar;
