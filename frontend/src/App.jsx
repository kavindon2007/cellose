import { useState } from 'react';
import EmergencyForm from './components/EmergencyForm';
import StatusTracker from './components/StatusTracker';
import Chatbot from './components/Chatbot';

function App() {
    const [view, setView] = useState('form'); // 'form' or 'tracker'
    const [incidentData, setIncidentData] = useState(null);

    const handleReportSubmitted = (data) => {
        setIncidentData(data);
        setView('tracker');
    };

    return (
        <div className="min-h-screen bg-gray-950 text-white font-sans selection:bg-red-500 selection:text-white">
            {/* Header */}
            <header className="bg-red-700 p-4 shadow-lg flex justify-between items-center sticky top-0 z-50">
                <h1 className="text-2xl font-black tracking-tighter italic">ResQ-AI <span className="text-sm font-normal not-italic opacity-75">| Emergency Response</span></h1>
                <button className="text-sm bg-black/20 px-3 py-1 rounded hover:bg-black/30 transition">
                    🇺🇸 / 🇱🇰
                </button>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                {view === 'form' && (
                    <div className="animate-fade-in-up">
                        <EmergencyForm onReportSubmitted={handleReportSubmitted} />
                        <p className="text-center text-gray-500 mt-8 text-sm max-w-md mx-auto">
                            Input is analyzed by AI to determine severity and dispatcher routing.
                            <br /><span className="text-red-500 font-bold">In critical danger, call 911 immediately.</span>
                        </p>
                    </div>
                )}

                {view === 'tracker' && incidentData && (
                    <div className="animate-fade-in-up">
                        <div className="max-w-md mx-auto mb-4">
                            <button
                                onClick={() => setView('form')}
                                className="text-gray-400 hover:text-white text-sm flex items-center gap-1"
                            >
                                ← Back to Report
                            </button>
                        </div>
                        <StatusTracker
                            incidentId={incidentData.incident_id}
                            initialStatus="Request Received"
                            aiAnalysis={incidentData.ai_analysis}
                        />
                    </div>
                )}
            </main>

            {/* Innovations */}
            <Chatbot />
        </div>
    );
}

export default App;
