import { NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useState } from "react";
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
  Bike,
  Megaphone,
  BookOpen,
  Database,
  GitBranch,
  Shield,
  ChevronDown,
} from "lucide-react";
import StoreSelector from "./StoreSelector";
import { useStore } from "@/contexts/StoreContext";

interface NavItem {
  to: string;
  icon: React.ElementType;
  label: string;
  children?: { to: string; icon: React.ElementType; label: string }[];
}

const AppSidebar = () => {
  const location = useLocation();
  const { currentStore, setCurrentStore } = useStore();
  const { t } = useTranslation();

  const kitchenChildren = [
    { to: "/kitchen", icon: CookingPot, label: t("kitchenMgmt.title") },
    { to: "/menu", icon: BookOpen, label: t("nav.menu") },
  ];

  const isKitchenActive = kitchenChildren.some((c) => location.pathname === c.to);
  const [kitchenOpen, setKitchenOpen] = useState(isKitchenActive);

  const navSections = [
    {
      title: t("nav.operations"),
      items: [
        { to: "/", icon: LayoutDashboard, label: t("nav.dashboard") },
        { to: "/marketing", icon: Megaphone, label: t("nav.marketing") },
        { to: "/tables", icon: UtensilsCrossed, label: t("nav.tables") },
        { to: "/orders", icon: ClipboardList, label: t("nav.orders") },
        { to: "/delivery", icon: Bike, label: t("nav.delivery") },
      ] as NavItem[],
    },
    {
      title: t("nav.supplyChain"),
      items: [
        { to: "/inventory", icon: Wine, label: t("nav.inventory") },
        { to: "/procurement", icon: ShoppingCart, label: t("nav.procurement") },
      ] as NavItem[],
    },
    {
      title: t("nav.enterprise"),
      items: [
        { to: "/stores", icon: Store, label: t("nav.stores") },
        { to: "/hr", icon: Users, label: t("nav.hr") },
        { to: "/finance", icon: DollarSign, label: t("nav.finance") },
        { to: "/legal", icon: Scale, label: t("nav.legal") },
      ] as NavItem[],
    },
    {
      title: t("nav.general"),
      items: [
        { to: "/data-center", icon: Database, label: t("nav.dataCenter") },
        { to: "/workflow", icon: GitBranch, label: t("nav.workflow") },
        { to: "/permissions", icon: Shield, label: t("nav.permissions") },
      ] as NavItem[],
    },
  ];

  const renderNavItem = (item: NavItem) => {
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
  };

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-[220px] bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border">
        <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
          <ChefHat className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-sm font-bold font-display text-foreground tracking-tight">{t("app.name")}</h1>
          <p className="text-[10px] text-muted-foreground">{t("app.subtitle")}</p>
        </div>
      </div>

      {/* Store Selector */}
      <div className="px-3 py-3 border-b border-sidebar-border">
        <StoreSelector currentStore={currentStore} onStoreChange={setCurrentStore} />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto scrollbar-hide">
        {navSections.map((section, si) => (
          <div key={section.title}>
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-3 mb-2">
              {section.title}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => renderNavItem(item))}

              {/* Kitchen collapsible group — after Operations section */}
              {si === 0 && (
                <div>
                  <button
                    onClick={() => setKitchenOpen(!kitchenOpen)}
                    className={`w-full relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors group ${
                      isKitchenActive ? "text-foreground" : "text-sidebar-foreground hover:text-foreground"
                    }`}
                  >
                    {isKitchenActive && !kitchenOpen && (
                      <motion.div
                        layoutId="sidebar-active"
                        className="absolute inset-0 rounded-lg bg-sidebar-accent glow-border"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                      />
                    )}
                    <ChefHat className={`relative z-10 w-4 h-4 transition-colors ${isKitchenActive ? "text-primary" : ""}`} />
                    <span className={`relative z-10 flex-1 text-left ${isKitchenActive ? "font-medium" : ""}`}>
                      {t("nav.kitchen")}
                    </span>
                    <ChevronDown
                      className={`relative z-10 w-3.5 h-3.5 transition-transform ${kitchenOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {kitchenOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="pl-4 space-y-0.5 mt-0.5">
                          {kitchenChildren.map((child) => renderNavItem(child))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-medium text-secondary-foreground">
            {t("nav.admin").charAt(0)}
          </div>
          <div>
            <p className="text-xs font-medium text-foreground">{t("nav.admin")}</p>
            <p className="text-[10px] text-muted-foreground">{currentStore.name}</p>
          </div>
        </div>
      </div>
    </aside>
  );

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-[220px] bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border">
        <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
          <ChefHat className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-sm font-bold font-display text-foreground tracking-tight">{t("app.name")}</h1>
          <p className="text-[10px] text-muted-foreground">{t("app.subtitle")}</p>
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
            {t("nav.admin").charAt(0)}
          </div>
          <div>
            <p className="text-xs font-medium text-foreground">{t("nav.admin")}</p>
            <p className="text-[10px] text-muted-foreground">{currentStore.name}</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default AppSidebar;
