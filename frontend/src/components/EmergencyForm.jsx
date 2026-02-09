import { useState, useEffect } from 'react';
import useGeolocation from '../hooks/useGeolocation';
import useVoiceRecorder from '../hooks/useVoiceRecorder';
import { reportEmergency } from '../services/api';

const EmergencyForm = ({ onReportSubmitted }) => {
    const { location, error: locError } = useGeolocation();
    const { isRecording, startRecording, stopRecording, mediaBlobUrl } = useVoiceRecorder();

    const [description, setDescription] = useState("");
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [recognition, setRecognition] = useState(null);

    // Voice recognition setup
    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognitionInstance = new SpeechRecognition();
            recognitionInstance.continuous = false;
            recognitionInstance.lang = 'en-US';
            recognitionInstance.interimResults = false;

            recognitionInstance.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                setDescription(prev => prev ? prev + " " + transcript : transcript);
            };

            setRecognition(recognitionInstance);
        }
    }, []);

    const handleVoiceClick = () => {
        if (isRecording) {
            stopRecording();
            if (recognition) recognition.stop();
        } else {
            startRecording();
            if (recognition) recognition.start();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!description && !file) {
            alert("Please provide a description or media.");
            return;
        }

        setLoading(true);
        const formData = new FormData();
        formData.append('description', description);
        formData.append('latitude', location.coordinates.lat || 0);
        formData.append('longitude', location.coordinates.lng || 0);
        if (file) {
            formData.append('files', file);
        }

        try {
            const result = await reportEmergency(formData);
            onReportSubmitted(result);
        } catch (error) {
            alert("Failed to submit report. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-gray-900 text-white p-6 rounded-xl shadow-2xl max-w-md mx-auto border border-red-600">
            <h2 className="text-3xl font-bold mb-6 text-red-500 text-center animate-pulse">REPORT EMERGENCY</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Location Status */}
                <div className="flex items-center space-x-2 text-sm">
                    <span className="text-gray-400">Location:</span>
                    {location.loaded ? (
                        <span className="text-green-400 font-mono">
                            {location.coordinates.lat.toFixed(4)}, {location.coordinates.lng.toFixed(4)}
                        </span>
                    ) : (
                        <span className="text-yellow-400 animate-pulse">Locating...</span>
                    )}
                </div>

                {/* Description Input */}
                <div className="relative">
                    <textarea
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-red-500 outline-none h-32"
                        placeholder="Describe the emergency..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    ></textarea>

                    {/* Voice Button */}
                    <button
                        type="button"
                        onClick={handleVoiceClick}
                        className={`absolute right-2 bottom-2 p-2 rounded-full transition-colors ${isRecording ? 'bg-red-600 animate-pulse' : 'bg-gray-700 hover:bg-gray-600'}`}
                    >
                        🎤
                    </button>
                </div>

                {/* File Upload */}
                <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-800 hover:bg-gray-700">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <span className="text-sm text-gray-400">Allowed: Image / Video</span>
                        </div>
                        <input type="file" className="hidden" onChange={(e) => setFile(e.target.files[0])} accept="image/*,video/*" />
                    </label>
                </div>
                {file && <p className="text-xs text-green-400 text-center">Selected: {file.name}</p>}

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg text-lg transition-transform transform active:scale-95 disabled:opacity-50"
                >
                    {loading ? "SENDING HELP..." : "SUBMIT REPORT"}
                </button>
            </form>
        </div>
    );
};

export default EmergencyForm;
