import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import "../../global-css/navbar.css";
import "./CSS/doc.css";

interface DocItem {
    title: string;
    description: string;
}

const DocCreationPage: React.FC = () => {
    const navigate = useNavigate();

    const docItems: DocItem[] = [
        { title: 'Free Style', description: 'You get to choose your own style and you incorporate many templates.' },
        { title: 'User Manual', description: 'Not too technical, only explaining how to use the app (stakeholders, ...).' },
        { title: 'Tech Manual', description: "For API's and how specific code documentation of classes/clumps." },
        { title: 'Code Doc', description: "Okay, you're really serious about explaining each file by itself, slay." },
        { title: 'Proof of Concept', description: 'You want to write a doc that explains how the whole application works.' },
        { title: 'Project Idea', description: 'You want to write a document on how your app should technically work.' },
        { title: 'Copyrights', description: "You worked really hard on your app/project, time to make it yours." },
    ];

    const handleLogout = () => {
        localStorage.removeItem('myAppToken');
        navigate('/');
    };

    const handleCardClick = () => {
        navigate('/github-link');
    };

    /**
     * -- Card Height Equalization --
     * We'll store references to each card, then measure their heights on mount
     * and set them all to the tallest height found.
     */
    const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

    useEffect(() => {
        let maxHeight = 0;

        // Find the tallest card
        cardRefs.current.forEach(cardEl => {
            if (cardEl) {
                const cardHeight = cardEl.offsetHeight;
                if (cardHeight > maxHeight) {
                    maxHeight = cardHeight;
                }
            }
        });

        // Set each card's height to maxHeight
        cardRefs.current.forEach(cardEl => {
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
                        {/* Attach ref to the .card element */}
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
                    // Notice we still store refs in the same array,
                    // but the index needs to be offset by 4.
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
