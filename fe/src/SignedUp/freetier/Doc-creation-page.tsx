import React from 'react';
import { useNavigate } from 'react-router-dom';
import "../../global-css/navbar.css";
import "./CSS/doc.css";

interface DocItem {
    title: string;
    description: string;
    imgSrc: string;
}

const DocCreationPage: React.FC = () => {
    const navigate = useNavigate();

    const docItems: DocItem[] = [
        { title: 'Free Style', description: 'You get to choose your own style and you incorporate many templates.', imgSrc: 'https://via.placeholder.com/80?text=FreeStyle' },
        { title: 'User Manual', description: 'Not too technical, only explaining how to use the app (stakeholders, ...).', imgSrc: 'https://via.placeholder.com/80?text=UserManual' },
        { title: 'Tech Manual', description: "For API's and how specific code documentation of classes/clumps. ", imgSrc: 'https://via.placeholder.com/80?text=TechManual' },
        { title: 'Code Doc', description: "Okay, you're really serious about explaining each file by itself, slay.", imgSrc: 'https://via.placeholder.com/80?text=CodeDoc' },
        { title: 'Proof of Concept', description: 'You want to write a doc that explains how the whole application works.', imgSrc: 'https://via.placeholder.com/80?text=Proof' },
        { title: 'Project Idea', description: 'You want to write a document on how your app should technically work.', imgSrc: 'https://via.placeholder.com/80?text=ProjectIdea' },
        { title: 'Copyrights', description: "You worked really hard on your app/project, time to make it yours.", imgSrc: 'https://via.placeholder.com/80?text=Copyright' },
    ];

    const handleLogout = () => {
        localStorage.removeItem('myAppToken');
        navigate('/');
    };

    const handleCardClick = () => navigate('/github-link');

    return (
        <div className="container py-4">
            <header className="navbar">
                <h1 className="brand">echo</h1>
                <button className="nav-btn" onClick={handleLogout}>Log out</button>
            </header>
            <h1 className="display-5 text-center mb-5">Create Your First Documentation</h1>
            <div className="row g-4 d-flex justify-content-around mb-4">
                {docItems.slice(0, 4).map((item, idx) => (
                    <div className="col-md-3" key={idx}>
                        <div className="card h-100 text-center" onClick={handleCardClick}>
                            <img src={item.imgSrc} alt={item.title} className="mx-auto mt-3" />
                            <div className="card-body">
                                <h5 className="card-title">{item.title}</h5>
                                <p className="card-text">{item.description}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <div className="row g-4 d-flex justify-content-center">
                {docItems.slice(4).map((item, idx) => (
                    <div className="col-md-3" key={idx}>
                        <div className="card h-100 text-center" onClick={handleCardClick}>
                            <img src={item.imgSrc} alt={item.title} className="mx-auto mt-3" />
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
