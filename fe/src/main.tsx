// main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './global-css/navbar.css'; // or wherever you put it
// Import your pages/components:
import App from './App';                          // Landing page
import DocCreationPage from './SignedUp/freetier/Doc-creation-page';
import LinkGithubRepo from './SignedUp/freetier/LinkGithubRepo';

// 1) Define your routes:
const router = createBrowserRouter([
    {
        path: '/',
        element: <App />,            // Landing page at "/"
    },
    {
        path: '/tutorial',
        element: <DocCreationPage />, // e.g., after sign-up success
    },
    {
        path: '/github-link',
        element: <LinkGithubRepo />,  // A separate page for linking GitHub
    },
]);

// 2) Render your router in the #root div:
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
        <RouterProvider router={router} />
    </React.StrictMode>,
);
