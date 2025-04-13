import { Search, MessageSquare, PenSquare, LogOut, Loader2, Menu } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

interface HeaderProps {
  toggleSidebar?: () => void;
}

// Custom hook to detect mobile screen size
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    // Set initial state
    setIsMobile(window.innerWidth < 768);
    
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return isMobile;
};

const Header = ({ toggleSidebar }: HeaderProps) => {
  const { user, logoutMutation } = useAuth();
  const isMobile = useIsMobile();
  
  return (
    <header className="bg-primary text-white flex items-center justify-between px-4 py-2">
      <div className="flex items-center space-x-4">
        {/* Burger menu for mobile */}
        {isMobile && (
          <button 
            onClick={toggleSidebar}
            className="p-1 hover:bg-blue-600 rounded-md focus:outline-none"
            aria-label="Toggle menu"
          >
            <Menu className="h-6 w-6" />
          </button>
        )}
        
        <div className="flex space-x-6 items-center">
          <a href="/" className="font-medium text-white whitespace-nowrap">POWER MONITORING</a>
          {/* Hide HOME link on small mobile screens */}
          <a href="/" className="font-medium opacity-80 hover:opacity-100 hidden sm:block">HOME</a>
        </div>
      </div>
      
      <div className="flex items-center space-x-1 md:space-x-2">
        {/* Hide less important buttons on smaller screens */}
        <button className="p-2 hover:bg-blue-500 rounded-full hidden md:block">
          <Search className="h-5 w-5" />
        </button>
        <button className="p-2 hover:bg-blue-500 rounded-full hidden md:block">
          <MessageSquare className="h-5 w-5" />
        </button>
        <button className="p-2 hover:bg-blue-500 rounded-full hidden md:block">
          <PenSquare className="h-5 w-5" />
        </button>
        
        {user && (
          <Button 
            variant="ghost" 
            className="text-white hover:bg-blue-500 px-2 sm:px-3" 
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
          >
            {logoutMutation.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <LogOut className="h-5 w-5 sm:mr-2" />
                <span className="hidden sm:inline">Logout</span>
              </>
            )}
          </Button>
        )}
      </div>
    </header>
  );
};

export default Header;
