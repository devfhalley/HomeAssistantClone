import React, { ReactNode } from "react";
import Sidebar from "./Sidebar";

interface HomeAssistantProps {
  children: ReactNode;
}

const HomeAssistant = ({ children }: HomeAssistantProps) => {
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <header className="bg-blue-600 text-white shadow-md">
          <div className="px-6 py-4">
            <h1 className="text-xl font-semibold">Home Assistant</h1>
          </div>
        </header>
        <main>
          {children}
        </main>
      </div>
    </div>
  );
};

export default HomeAssistant;