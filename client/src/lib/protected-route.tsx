import { Route } from "wouter";

// Modified to bypass authentication completely
export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  // No auth check, allow direct access to all routes
  return (
    <Route path={path}>
      <Component />
    </Route>
  );
}