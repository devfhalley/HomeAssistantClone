import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import PowerMonitoring from "@/pages/PowerMonitoring";
import Panel66KVA from "@/pages/Panel66KVA";
import Home from "@/pages/Home";
import { ProtectedRoute } from "@/lib/protected-route";
import { AuthProvider } from "@/hooks/use-auth";
import { createContext, useState, useEffect, useContext } from "react";

// Authentication bypassed but provider still needed for hooks

// Create date context for passing selected date throughout the app
interface DateContextType {
  selectedDate: Date;
}

// Create a context with a default date (today)
export const DateContext = createContext<DateContextType>({
  selectedDate: new Date(),
});

// Custom hook to use the date context
export function useSelectedDate() {
  const context = useContext(DateContext);
  if (!context) {
    throw new Error('useSelectedDate must be used within a DateContext.Provider');
  }
  return context.selectedDate;
}

// Helper function to get date from URL parameters
function getDateFromUrl(): Date {
  const urlParams = new URLSearchParams(window.location.search);
  const dateParam = urlParams.get('date');
  
  if (dateParam) {
    // Parse the date and return it if valid
    const date = new Date(dateParam);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }
  
  // Default to today if no valid date parameter
  return new Date();
}

function Router() {
  return (
    <Switch>
      {/* All routes use ProtectedRoute which now bypasses authentication */}
      <ProtectedRoute path="/" component={Home} />
      <ProtectedRoute path="/wo-08" component={PowerMonitoring} />
      <ProtectedRoute path="/panel-66kva" component={Panel66KVA} />
      <Route path="/auth" component={Home} /> {/* Redirect auth to Home */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Get initial date from URL parameters
  const [selectedDate, setSelectedDate] = useState<Date>(getDateFromUrl());

  // Listen for changes to URL parameters
  useEffect(() => {
    const handlePopState = () => {
      setSelectedDate(getDateFromUrl());
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Provide the date context to the entire app
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <DateContext.Provider value={{ selectedDate }}>
          <Router />
          <Toaster />
        </DateContext.Provider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
