import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { Redirect } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Home, Loader2 } from "lucide-react";

export default function LoginPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  
  const [loginForm, setLoginForm] = useState({
    username: "",
    password: ""
  });
  
  const [registerForm, setRegisterForm] = useState({
    username: "",
    password: ""
  });
  
  // Redirect if already logged in
  if (user) {
    return <Redirect to="/" />;
  }
  
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(loginForm);
  };
  
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate(registerForm);
  };
  
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Left side - Login/Register form */}
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-8">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <Home className="h-12 w-12 text-primary mx-auto mb-2" />
            <h1 className="text-3xl font-bold">Power Monitoring</h1>
            <p className="text-slate-500">Login to access your dashboard</p>
          </div>
          
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Login</CardTitle>
                  <CardDescription>
                    Enter your credentials to access your account
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleLoginSubmit}>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input 
                        id="username" 
                        type="text" 
                        placeholder="admin" 
                        value={loginForm.username}
                        onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input 
                        id="password" 
                        type="password" 
                        placeholder="••••••••" 
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                        required
                      />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Logging in...
                        </>
                      ) : "Login"}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>
            
            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle>Create an account</CardTitle>
                  <CardDescription>
                    Register a new account to access the dashboard
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleRegisterSubmit}>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-username">Username</Label>
                      <Input 
                        id="new-username" 
                        type="text" 
                        placeholder="Enter a username" 
                        value={registerForm.username}
                        onChange={(e) => setRegisterForm({...registerForm, username: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-password">Password</Label>
                      <Input 
                        id="new-password" 
                        type="password" 
                        placeholder="Choose a password" 
                        value={registerForm.password}
                        onChange={(e) => setRegisterForm({...registerForm, password: e.target.value})}
                        required
                      />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating account...
                        </>
                      ) : "Register"}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>
          </Tabs>
          
          <div className="mt-4 text-center text-sm text-slate-500">
            <p>Default credentials: username: <strong>admin</strong> / password: <strong>poweradmin</strong></p>
          </div>
        </div>
      </div>
      
      {/* Right side - Hero section */}
      <div className="w-full md:w-1/2 bg-primary p-8 text-white hidden md:flex flex-col justify-center">
        <div className="max-w-lg mx-auto">
          <h2 className="text-4xl font-bold mb-6">Power Monitoring System</h2>
          <p className="text-xl mb-8">
            Track and analyze real-time power consumption across multiple panels 
            with comprehensive data visualization and monitoring tools.
          </p>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white/10 p-4 rounded-lg">
              <h3 className="font-semibold text-lg mb-2">Real-time Monitoring</h3>
              <p>View live power metrics across all phases and panels</p>
            </div>
            <div className="bg-white/10 p-4 rounded-lg">
              <h3 className="font-semibold text-lg mb-2">Data Visualization</h3>
              <p>Interactive charts and graphs for easy analysis</p>
            </div>
            <div className="bg-white/10 p-4 rounded-lg">
              <h3 className="font-semibold text-lg mb-2">Multiple Panels</h3>
              <p>Monitor 33KVA and 66KVA panels simultaneously</p>
            </div>
            <div className="bg-white/10 p-4 rounded-lg">
              <h3 className="font-semibold text-lg mb-2">System Status</h3>
              <p>Check environment and database connection status</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}