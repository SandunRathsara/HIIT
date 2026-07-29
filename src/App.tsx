import { createHashRouter, RouterProvider, Navigate } from 'react-router'
import { WorkoutListScreen } from '@/screens/WorkoutListScreen'
import { CreateWorkoutScreen } from '@/screens/CreateWorkoutScreen'
import { WorkoutScreen } from '@/screens/WorkoutScreen'

// A data router (rather than <HashRouter>) so useBlocker is available for the
// "quit workout?" confirmation. Hash routing needs no server rewrite rules.
const router = createHashRouter([
  { path: '/', element: <WorkoutListScreen /> },
  { path: '/new', element: <CreateWorkoutScreen /> },
  { path: '/workout/:id', element: <WorkoutScreen /> },
  { path: '*', element: <Navigate to="/" replace /> },
])

export default function App() {
  return <RouterProvider router={router} />
}
