import React from 'react';

import 'bootstrap/dist/css/bootstrap.min.css';

interface DocItem {
    title: string;
    description: string;
    imgSrc: string;
}

const DocCreationPage: React.FC = () => {
    // Exactly 7 items
    const docItems: DocItem[] = [
        {
            title: 'Free-style',
            description:
                'You get to choose your own style and you incorporate many templates together',
            imgSrc: 'https://via.placeholder.com/80?text=FreeStyle',
        },
        {
            title: 'User manuals',
            description: 'Not too technical, only explaining how to use the app.',
            imgSrc: 'https://via.placeholder.com/80?text=UserManual',
        },
        {
            title: 'Technical manuals',
            description: "For API's and how specific code classes/clumps works",
            imgSrc: 'https://via.placeholder.com/80?text=TechManual',
        },
        {
            title: 'Code Documentation',
            description:
                "Okay, you're really serious about explaining each file by itself, slay.",
            imgSrc: 'https://via.placeholder.com/80?text=CodeDoc',
        },
        {
            title: 'Proof of Concept Manual',
            description:
                'You want to write a doc that explains how the whole application works',
            imgSrc: 'https://via.placeholder.com/80?text=Proof',
        },
        {
            title: 'Project Idea',
            description:
                'You dont have code, but you want to write a whole document on how it should technically work',
            imgSrc: 'https://via.placeholder.com/80?text=ProjectIdea',
        },
        {
            title: 'Copyrights',
            description:
                "You worked really hard on your app/project, time to make it unique, don't let anyone copy it",
            imgSrc: 'https://via.placeholder.com/80?text=Copyright',
        },
    ];

    const handleLogout = () => {
        alert('Logging out...');
    };

    return (
        <div className="container py-4">
            {/* HEADER */}
            <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-4">
                <div className="fs-4 fw-bold">echo</div>
                <button className="btn btn-outline-dark" onClick={handleLogout}>
                    Log out
                </button>
            </div>

            {/* TITLE */}
            <h1 className="display-5 text-center mb-5">
                Create Your First Documentation
            </h1>

            {/* FIRST ROW (4 cards) */}
            <div className="row g-4">
                {docItems.slice(0, 4).map((item, idx) => (
                    <div className="col-md-3" key={idx}>
                        <div className="card h-100 text-center">
                            <img
                                src={item.imgSrc}
                                alt={item.title}
                                className="mx-auto mt-3"
                                style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8 }}
                            />
                            <div className="card-body">
                                <h5 className="card-title">{item.title}</h5>
                                <p className="card-text">{item.description}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* SECOND ROW (3 cards, offset for "concert" style) */}
            <div className="row g-4 mt-1">
                {/* An empty col to shift the row to the right (concert seating) */}
                <div className="col-md-1" />
                {docItems.slice(4).map((item, idx) => (
                    <div className="col-md-3" key={idx}>
                        <div className="card h-100 text-center">
                            <img
                                src={item.imgSrc}
                                alt={item.title}
                                className="mx-auto mt-3"
                                style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8 }}
                            />
                            <div className="card-body">
                                <h5 className="card-title">{item.title}</h5>
                                <p className="card-text">{item.description}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DocCreationPage;
