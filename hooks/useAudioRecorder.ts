import { useState, useEffect, useRef, useCallback } from 'react';

type RecordingStatus = 'inactive' | 'recording' | 'paused' | 'stopping';

// Extend the global Window interface to include SpeechRecognition
declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}

export const useAudioRecorder = () => {
    const [permission, setPermission] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [recordingStatus, setRecordingStatus] = useState<RecordingStatus>('inactive');
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [transcript, setTranscript] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [elapsedTime, setElapsedTime] = useState(0);

    const mediaRecorder = useRef<MediaRecorder | null>(null);
    const speechRecognizer = useRef<any | null>(null);
    const audioChunks = useRef<Blob[]>([]);
    const timerInterval = useRef<number | null>(null);
    const finalTranscriptRef = useRef<string>('');

    const getMicrophonePermission = useCallback(async () => {
        if (!('MediaRecorder' in window)) {
            setError('您的浏览器不支持录音功能(MediaRecorder API)。');
            return;
        }
        try {
            const streamData = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            setPermission(true);
            setStream(streamData);
            setError(null);
        } catch (err) {
            console.error(err);
            setError('麦克风权限被拒绝。请在您的浏览器设置中允许访问。');
        }
    }, []);

    useEffect(() => {
        getMicrophonePermission();
    }, [getMicrophonePermission]);

    const setupSpeechRecognition = useCallback(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.warn('此浏览器不支持语音识别功能。');
            // Don't set an error, as recording can still work without transcription.
            return;
        }
        const recognizer = new SpeechRecognition();
        recognizer.continuous = true;
        recognizer.interimResults = true;
        recognizer.lang = navigator.language || 'zh-CN';

        recognizer.onresult = (event: any) => {
            let interimTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscriptRef.current += event.results[i][0].transcript + ' ';
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }
            setTranscript(finalTranscriptRef.current + interimTranscript);
        };
        
        recognizer.onerror = (event: any) => {
            // "no-speech" and "aborted" are common events that aren't true errors.
            if (event.error === 'no-speech' || event.error === 'aborted') {
                console.warn(`Speech recognition non-error event: ${event.error}`);
                return; // Gracefully ignore.
            }

            console.error('Speech recognition error:', event.error);
            setError(`语音识别错误: ${event.error}。请重试。`);
        };
        
        recognizer.onend = () => {
            if (recordingStatus === 'recording') {
                speechRecognizer.current?.start();
            }
        };

        speechRecognizer.current = recognizer;
    }, [recordingStatus]);
    
    const startTimer = useCallback(() => {
        if (timerInterval.current) clearInterval(timerInterval.current);
        timerInterval.current = window.setInterval(() => {
            setElapsedTime(prev => prev + 1);
        }, 1000);
    }, []);

    const stopTimer = useCallback(() => {
        if (timerInterval.current) {
            clearInterval(timerInterval.current);
            timerInterval.current = null;
        }
    }, []);

    const startRecording = useCallback(() => {
        if (!stream || recordingStatus !== 'inactive') return;
        
        setError(null);
        setRecordingStatus('recording');
        setElapsedTime(0);
        startTimer();

        const newMediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        mediaRecorder.current = newMediaRecorder;
        mediaRecorder.current.start(1000);

        audioChunks.current = [];
        mediaRecorder.current.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunks.current.push(event.data);
            }
        };
        
        setupSpeechRecognition();
        if(speechRecognizer.current) {
            setTranscript('');
            finalTranscriptRef.current = '';
            speechRecognizer.current.start();
        }

    }, [stream, recordingStatus, setupSpeechRecognition, startTimer]);
    
    const stopRecording = useCallback(() => {
        if (!mediaRecorder.current || recordingStatus === 'inactive' || recordingStatus === 'stopping') return;
        
        setRecordingStatus('stopping');
        stopTimer();
        
        mediaRecorder.current.stop();
        mediaRecorder.current.onstop = () => {
            const blob = new Blob(audioChunks.current, { type: 'audio/webm' });
            setAudioBlob(blob);
            audioChunks.current = [];
            setRecordingStatus('inactive');
        };

        if (speechRecognizer.current) {
            speechRecognizer.current.stop();
        }
    }, [recordingStatus, stopTimer]);
    
    const pauseRecording = useCallback(() => {
        if (!mediaRecorder.current || recordingStatus !== 'recording') return;
        
        mediaRecorder.current.pause();
        setRecordingStatus('paused');
        stopTimer();
        if (speechRecognizer.current) {
            speechRecognizer.current.stop();
        }
    }, [recordingStatus, stopTimer]);

    const resumeRecording = useCallback(() => {
        if (!mediaRecorder.current || recordingStatus !== 'paused') return;

        mediaRecorder.current.resume();
        setRecordingStatus('recording');
        startTimer();
        if (speechRecognizer.current) {
            speechRecognizer.current.start();
        }
    }, [recordingStatus, startTimer]);


    return { permission, recordingStatus, transcript, audioBlob, stream, elapsedTime, error, startRecording, pauseRecording, resumeRecording, stopRecording };
};