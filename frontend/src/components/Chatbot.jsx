import { useState } from 'react';

const Chatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { text: "Hello! I am your AI assistant. Do you need help?", sender: "bot" }
    ]);
    const [input, setInput] = useState("");

    const handleSend = () => {
        if (!input.trim()) return;

        setMessages([...messages, { text: input, sender: "user" }]);
        setInput("");

        // Mock response
        setTimeout(() => {
            setMessages(prev => [...prev, {
                text: "I understand. Prioritize safety and follow on-screen instructions.",
                sender: "bot"
            }]);
        }, 1000);
    };

    return (
        <div className="fixed bottom-4 right-4 z-50">
            {/* Toggle Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-transform transform hover:scale-110"
                >
                    🤖
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className="w-80 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl flex flex-col h-96">
                    <div className="p-4 bg-gray-800 border-b border-gray-700 flex justify-between items-center rounded-t-lg">
                        <h3 className="text-white font-bold">AI Helper</h3>
                        <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">✕</button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] p-3 rounded-lg text-sm ${msg.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'}`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="p-4 border-t border-gray-700 flex">
                        <input
                            type="text"
                            className="flex-1 bg-gray-800 text-white border border-gray-600 rounded-l-lg p-2 text-sm outline-none"
                            placeholder="Type a message..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        />
                        <button onClick={handleSend} className="bg-blue-600 px-4 rounded-r-lg text-white">➤</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Chatbot;
