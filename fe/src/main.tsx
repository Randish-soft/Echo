import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

// Import your pages
import App from './App';               // Landing page
import SignUpPage from './pages/SignUpPage'; // Sign-up page

// 1) Define your routes
const router = createBrowserRouter([
    {
        path: '/',
        element: <App />,            // Landing page at "/"
    },
    {
        path: '/signup',
        element: <SignUpPage />,     // Sign-up page at "/signup"
    },
    // Add more routes here, e.g. for login, dashboard, etc.
]);

// 2) Render your router in the #root div
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
        <RouterProvider router={router} />
    </React.StrictMode>,
);
