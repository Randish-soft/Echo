// router.tsx
import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import DocCreationPage from "./SignedUp/Doc-creation-page.tsx";
import LinkGithubRepo from "./SignedUp/LinkGithubRepo.tsx";
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
