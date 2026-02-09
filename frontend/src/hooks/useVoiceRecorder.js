import { useState, useRef } from "react";

const useVoiceRecorder = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [mediaBlobUrl, setMediaBlobUrl] = useState(null);
    const mediaRecorderRef = useRef(null);
    const chunksRef = useRef([]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);

            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };

            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: "audio/webm" });
                const url = URL.createObjectURL(blob);
                setMediaBlobUrl(url);
                chunksRef.current = []; // Reset chunks
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch (error) {
            console.error("Error accessing microphone:", error);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    return { isRecording, startRecording, stopRecording, mediaBlobUrl };
};

export default useVoiceRecorder;
