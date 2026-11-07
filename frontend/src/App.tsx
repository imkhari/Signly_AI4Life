import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { SessionProvider } from './state/SessionContext';

export const App: React.FC = () => {
  return (
    <SessionProvider>
      <RouterProvider router={router} />
    </SessionProvider>
  );
};

export default App;
