// main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

// Import your pages/components:
import App from './App';                          // Landing page
import DocCreationPage from "./SignedUp/freetier/Doc-creation-page.tsx";

// 1) Define your routes:
const router = createBrowserRouter([
    {
        path: '/',
        element: <App />,            // Landing page at "/"
    },
    {
        path: '/tutorial',
        element: <DocCreationPage />,   // Tutorial page at "/tutorial"
    },
    // Add more routes here as needed
]);

// 2) Render your router in the #root div:
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
        <RouterProvider router={router} />
    </React.StrictMode>,
);
