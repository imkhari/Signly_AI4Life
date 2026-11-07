import { createBrowserRouter } from 'react-router-dom';
import { HomeRoleSelect } from './features/HomeRoleSelect';
import { PatientPage } from './features/patient/PatientPage';
import { NursePage } from './features/nurse/NursePage';
import { DemoPage } from './features/demo/DemoPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <HomeRoleSelect />,
  },
  {
    path: '/patient',
    element: <PatientPage />,
  },
  {
    path: '/nurse',
    element: <NursePage />,
  },
  {
    path: '/demo',
    element: <DemoPage />,
  },
]);

