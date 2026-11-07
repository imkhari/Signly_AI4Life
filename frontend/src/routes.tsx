import { createBrowserRouter } from 'react-router-dom';
import { HomeRoleSelect } from './features/HomeRoleSelect';
import { PatientPage } from './features/patient/PatientPage';
import { NursePage } from './features/nurse/NursePage';

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
]);

