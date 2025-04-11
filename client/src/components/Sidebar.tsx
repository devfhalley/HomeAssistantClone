import React from "react";
import { useLocation, Link } from "wouter";
import { 
  LayoutDashboard, 
  Settings, 
  BatteryCharging 
} from "lucide-react";
import { cn } from "@/lib/utils";

type SidebarItemProps = {
  icon: React.ReactNode;
  label: string;
  href: string;
  active: boolean;
};

const SidebarItem = ({ icon, label, href, active }: SidebarItemProps) => {
  return (
    <Link href={href}>
      <div
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer",
          active ? "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400" : "text-gray-500 dark:text-gray-400"
        )}
      >
        {icon}
        <span>{label}</span>
      </div>
    </Link>
  );
};

export const Sidebar = () => {
  const [location] = useLocation();
  
  const isActive = (path: string) => {
    return location === path;
  };

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-white dark:bg-gray-950 dark:border-gray-800">
      <div className="p-4">
        <div className="flex items-center gap-2 font-medium text-lg">
          <BatteryCharging className="h-5 w-5 text-blue-600" />
          <span>Home Assistant</span>
        </div>
      </div>
      <div className="flex-1 px-3">
        <div className="space-y-1 py-2">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 mt-2">
            Dashboard
          </p>
          <SidebarItem
            icon={<LayoutDashboard className="h-5 w-5" />}
            label="Power Monitoring"
            href="/"
            active={isActive("/")}
          />
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 mt-4">
            Administration
          </p>
          <SidebarItem
            icon={<Settings className="h-5 w-5" />}
            label="Manage Panels"
            href="/manage-panels"
            active={isActive("/manage-panels")}
          />
        </div>
      </div>
    </div>
  );
};

export default Sidebar;