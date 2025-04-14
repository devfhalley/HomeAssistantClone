import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SqlQueryDisplayProps {
  queries: {
    name: string;
    sql: string;
  }[];
}

const SqlQueryDisplay: React.FC<SqlQueryDisplayProps> = ({ queries }) => {
  if (!queries || queries.length === 0) {
    return null;
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-lg">SQL Queries</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {queries.map((query, index) => (
            <div key={index} className="border p-2 rounded-md">
              <p className="font-medium text-sm mb-1">{query.name}:</p>
              <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded-sm text-xs whitespace-pre-wrap overflow-x-auto">
                {query.sql}
              </pre>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default SqlQueryDisplay;