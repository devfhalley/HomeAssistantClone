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

// Authentication bypassed but provider still needed for hooks

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
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
