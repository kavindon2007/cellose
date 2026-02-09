import { useState, useEffect } from 'react';

const steps = [
    "Request Received",
    "Preparing",
    "Team Dispatched",
    "On the Way",
    "Action in Progress",
    "Resolved"
];

const StatusTracker = ({ incidentId, initialStatus, aiAnalysis }) => {
    const [currentStatus, setCurrentStatus] = useState(initialStatus || "Request Received");

    useEffect(() => {
        if (!incidentId) return;

        const ws = new WebSocket(`ws://localhost:8000/ws/status/${incidentId}`);

        ws.onopen = () => {
            console.log("Connected to Status Tracker");
        };

        ws.onmessage = (event) => {
            setCurrentStatus(event.data);
        };

        return () => {
            ws.close();
        };
    }, [incidentId]);

    const getStepColor = (step) => {
        const stepIndex = steps.indexOf(step);
        const currentIndex = steps.indexOf(currentStatus);

        if (stepIndex < currentIndex) return "text-green-500 border-green-500";
        if (stepIndex === currentIndex) return "text-blue-500 border-blue-500 animate-pulse";
        return "text-gray-500 border-gray-600";
    };

    return (
        <div className="bg-gray-900 text-white p-6 rounded-xl shadow-2xl max-w-md mx-auto border border-gray-700 mt-6">
            <h3 className="text-xl font-bold mb-4 text-center">Status Tracker <span className="text-gray-400 text-sm">#{incidentId}</span></h3>

            {/* AI Analysis Summary */}
            {aiAnalysis && (
                <div className={`mb-6 p-4 rounded-lg border ${aiAnalysis.severity === 'Critical' ? 'bg-red-900/50 border-red-500 animate-pulse' : 'bg-gray-800 border-gray-700'}`}>
                    <h4 className="font-bold flex justify-between">
                        Ai Analysis: <span className={`${aiAnalysis.severity === 'Critical' ? 'text-red-500' : 'text-yellow-400'}`}>{aiAnalysis.severity.toUpperCase()}</span>
                    </h4>
                    <p className="text-sm text-gray-300 mt-2">{aiAnalysis.summary_message}</p>
                </div>
            )}

            {/* Stepper */}
            <div className="space-y-6 relative border-l-2 border-gray-700 ml-4 py-2">
                {steps.map((step, index) => (
                    <div key={index} className="flex items-center mb-4 relative pl-8">
                        {/* Dot */}
                        <div className={`absolute -left-[9px] w-4 h-4 rounded-full border-2 bg-gray-900 ${getStepColor(step).split(" ")[1] || "border-gray-600"}`}></div>

                        <div className={`flex-1 ${getStepColor(step)}`}>
                            <h4 className={`text-lg font-medium ${steps.indexOf(currentStatus) === index ? 'font-bold' : ''}`}>{step}</h4>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default StatusTracker;
