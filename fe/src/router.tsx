import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import LinkGithubRepo from "./SignedUp/LinkGithubRepo";
import DocumentPage from "./SignedUp/DocumentPage";
import MyErrorBoundary from "./MyErrorBoundary";

const router = createBrowserRouter([
    {
        path: "/",
        element: <App />,
        errorElement: <MyErrorBoundary />,
    },
    {
        path: "/link-github",
        element: <LinkGithubRepo />,
    },
    {
        // This is the page that shows the repo tree on the left,
        // doc editor on the right, commits to GitHub, etc.
        path: "/document-page",
        element: <DocumentPage />,
    }
]);

export default router;
