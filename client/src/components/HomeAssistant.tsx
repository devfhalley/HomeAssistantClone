import Sidebar from "./Sidebar";
import Header from "./Header";
import { ReactNode } from "react";

interface HomeAssistantProps {
  children: ReactNode;
}

const HomeAssistant = ({ children }: HomeAssistantProps) => {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 bg-gray-100">
          {children}
        </main>
      </div>
    </div>
  );
};

export default HomeAssistant;
