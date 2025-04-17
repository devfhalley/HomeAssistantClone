import { LayoutGrid, ToggleLeft, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation, Link } from "wouter";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

type MenuItem = {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  badge?: number;
};

type MenuItemWithPath = MenuItem & { path: string };

const menuItems: MenuItemWithPath[] = [
  { icon: <LayoutGrid className="w-5 h-5" />, label: "Home", path: "/" },
  { icon: <ToggleLeft className="w-5 h-5" />, label: "Panel 1 33KVA", path: "/wo-08" },
  { icon: <ToggleLeft className="w-5 h-5" />, label: "Panel 2 82KVA", path: "/panel-82kva" },
];

const SidebarItem = ({ 
  item, 
  onClick 
}: { 
  item: MenuItemWithPath; 
  onClick?: () => void;
}) => {
  const [location] = useLocation();
  const isActive = location === item.path;
  
  return (
    <li>
      <Link
        to={item.path}
        onClick={onClick}
        className={cn(
          "flex items-center px-3 py-2 rounded-md hover:bg-gray-200 transition-colors",
          isActive && "bg-gray-200 border-l-2 border-primary text-primary"
        )}
      >
        <div className={cn("w-6", isActive && "text-primary")}>
          {item.icon}
        </div>
        <span className="flex-1 ml-2">{item.label}</span>
        {item.badge && (
          <span className="bg-orange-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
            {item.badge}
          </span>
        )}
      </Link>
    </li>
  );
};

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const Sidebar = ({ isOpen = true, onClose }: SidebarProps) => {
  const isMobile = useIsMobile();
  
  // Close the mobile sidebar when an item is clicked
  const handleItemClick = () => {
    if (isMobile && onClose) {
      onClose();
    }
  };
  
  return (
    <div 
      className={cn(
        "bg-gray-50 border-r border-gray-200 flex flex-col overflow-y-auto transition-all duration-300 z-20",
        isMobile 
          ? isOpen 
            ? "fixed inset-y-0 left-0 w-64" 
            : "fixed inset-y-0 -left-64 w-64"
          : "w-52"
      )}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center">
          {isMobile && (
            <button 
              onClick={onClose}
              className="mr-3 text-gray-700 focus:outline-none"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          )}
          <h1 className="font-medium text-lg">Home Assistant</h1>
        </div>
      </div>

      <nav className="flex-1">
        <ul className="py-2 px-1 space-y-1">
          {menuItems.map((item, index) => (
            <SidebarItem 
              key={index} 
              item={item} 
              onClick={handleItemClick}
            />
          ))}
        </ul>
      </nav>

      <div className="mt-auto border-t border-gray-200 py-2 px-3">
        <div className="flex items-center">
          <div className="w-7 h-7 rounded-full bg-gray-300 flex items-center justify-center text-gray-700 mr-3">
            r
          </div>
          <span>md</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
