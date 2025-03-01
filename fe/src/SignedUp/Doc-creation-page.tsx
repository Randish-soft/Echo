/** fe/src/SignedUp/Doc-creation-page.tsx */
import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import "../global-css/navbar.css";
import "./CSS/doc.css";

interface DocItem {
    title: string;
    description: string;
}

const DocCreationPage: React.FC = () => {
    const navigate = useNavigate();

    const docItems: DocItem[] = [
        { title: 'Free Style', description: 'Choose your own style and incorporate many templates.' },
        { title: 'User Manual', description: 'Explain how to use the app (stakeholders, etc.).' },
        { title: 'Tech Manual', description: "API details and deeper code documentation." },
        { title: 'Code Doc', description: "Serious about explaining each file thoroughly." },
        { title: 'Proof of Concept', description: 'Explain how the entire application works.' },
        { title: 'Project Idea', description: 'Document how your app should technically work.' },
        { title: 'Copyrights', description: "Make your hard work officially yours." },
    ];

    const handleLogout = () => {
        localStorage.removeItem('myAppToken');
        navigate('/');
    };

    /**
     * IMPORTANT: We match the router by using "/github-link"
     */
    const handleCardClick = () => {
        navigate('/github-link');
    };

    // For equal-height cards:
    const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

    useEffect(() => {
        let maxHeight = 0;
        cardRefs.current.forEach((cardEl) => {
            if (cardEl) {
                const cardHeight = cardEl.offsetHeight;
                if (cardHeight > maxHeight) {
                    maxHeight = cardHeight;
                }
            }
        });
        cardRefs.current.forEach((cardEl) => {
            if (cardEl) {
                cardEl.style.height = `${maxHeight}px`;
            }
        });
    }, [docItems]);

    return (
        <div className="container py-4">
            {/* Header */}
            <header className="navbar mb-4">
                <h1 className="brand">echo</h1>
                <button className="nav-btn" onClick={handleLogout}>
                    Log out
                </button>
            </header>

            <h1 className="display-5 text-center mb-5">Create Your First Documentation</h1>

            {/* First row (4 items) */}
            <div className="row g-4 d-flex justify-content-around mb-4">
                {docItems.slice(0, 4).map((item, idx) => (
                    <div className="col-md-3" key={idx}>
                        <div
                            className="card text-center"
                            onClick={handleCardClick}
                            ref={(el) => (cardRefs.current[idx] = el)}
                        >
                            <div className="card-body">
                                <div className="small text-muted">{item.title}</div>
                                <h5 className="card-title mt-1">{item.title}</h5>
                                <p className="card-text">{item.description}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Second row (3 items) */}
            <div className="row g-4 d-flex justify-content-center">
                {docItems.slice(4).map((item, idx) => {
                    const adjustedIndex = idx + 4;
                    return (
                        <div className="col-md-3" key={adjustedIndex}>
                            <div
                                className="card text-center"
                                onClick={handleCardClick}
                                ref={(el) => (cardRefs.current[adjustedIndex] = el)}
                            >
                                <div className="card-body">
                                    <div className="small text-muted">{item.title}</div>
                                    <h5 className="card-title mt-1">{item.title}</h5>
                                    <p className="card-text">{item.description}</p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default DocCreationPage;
