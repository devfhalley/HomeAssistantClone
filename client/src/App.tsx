import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import PowerMonitoring from "@/pages/PowerMonitoring";
import ManagePanels from "@/pages/ManagePanels";
import HomeAssistant from "@/components/HomeAssistant";

function Router() {
  return (
    <HomeAssistant>
      <Switch>
        <Route path="/" component={PowerMonitoring} />
        <Route path="/manage-panels" component={ManagePanels} />
        <Route component={NotFound} />
      </Switch>
    </HomeAssistant>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
