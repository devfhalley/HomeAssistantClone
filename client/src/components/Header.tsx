import { Search, MessageSquare, PenSquare, LogOut, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

const Header = () => {
  const { user, logoutMutation } = useAuth();
  
  return (
    <header className="bg-primary text-white flex items-center justify-between px-4 py-2">
      <div className="flex space-x-6">
        <a href="/" className="font-medium text-white">POWER MONITORING</a>
        <a href="/" className="font-medium opacity-80 hover:opacity-100">HOME</a>
      </div>
      <div className="flex items-center space-x-2">
        <button className="p-2 hover:bg-blue-500 rounded-full">
          <Search className="h-5 w-5" />
        </button>
        <button className="p-2 hover:bg-blue-500 rounded-full">
          <MessageSquare className="h-5 w-5" />
        </button>
        <button className="p-2 hover:bg-blue-500 rounded-full">
          <PenSquare className="h-5 w-5" />
        </button>
        
        {user && (
          <Button 
            variant="ghost" 
            className="text-white hover:bg-blue-500" 
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
          >
            {logoutMutation.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <LogOut className="h-5 w-5 mr-2" />
                Logout
              </>
            )}
          </Button>
        )}
      </div>
    </header>
  );
};

export default Header;
