// router.tsx
import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import DocCreationPage from "./SignedUp/freetier/Doc-creation-page";
import LinkGithubRepo from "./SignedUp/freetier/LinkGithubRepo";
import MyErrorBoundary from "./MyErrorBoundary";

const router = createBrowserRouter([
    {
        path: "/",
        element: <App />,
        errorElement: <MyErrorBoundary />
    },
    {
        path: "/tutorial",
        element: <DocCreationPage />
    },
    {
        path: "/github-link",
        element: <LinkGithubRepo />
    }
]);

export default router;
