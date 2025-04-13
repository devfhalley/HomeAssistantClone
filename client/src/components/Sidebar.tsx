import { LayoutGrid, ToggleLeft, Menu } from "lucide-react";
import { cn } from "@/lib/utils";

type MenuItem = {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  badge?: number;
};

const menuItems: MenuItem[] = [
  { icon: <LayoutGrid className="w-5 h-5" />, label: "Overview" },
  { icon: <ToggleLeft className="w-5 h-5" />, label: "WO 08", active: true },
];

const SidebarItem = ({ item }: { item: MenuItem }) => {
  return (
    <li>
      <a
        href="#"
        className={cn(
          "flex items-center px-3 py-2 rounded-md hover:bg-gray-200 transition-colors",
          item.active && "bg-gray-200 border-l-2 border-primary text-primary"
        )}
      >
        <div className={cn("w-6", item.active && "text-primary")}>
          {item.icon}
        </div>
        <span className="flex-1 ml-2">{item.label}</span>
        {item.badge && (
          <span className="bg-orange-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
            {item.badge}
          </span>
        )}
      </a>
    </li>
  );
};

const Sidebar = () => {
  return (
    <div className="w-52 bg-gray-50 border-r border-gray-200 flex flex-col overflow-y-auto">
      <div className="flex items-center px-4 py-3 border-b border-gray-200">
        <button className="mr-3 text-gray-700">
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="font-medium text-lg">Home Assistant</h1>
      </div>

      <nav className="flex-1">
        <ul className="py-2 px-1 space-y-1">
          {menuItems.map((item, index) => (
            <SidebarItem key={index} item={item} />
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
