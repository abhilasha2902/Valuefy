import React, { useState } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { Mic, MicOff, Loader2, AlertCircle, Clock, Calendar, ListTodo, FileText } from 'lucide-react';
import { extractInformation } from '../lib/gemini';

export default function VoiceRecorder() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<any>(null);
  
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  const handleStartListening = () => {
    setError(null);
    setResults(null);
    resetTranscript();
    SpeechRecognition.startListening({ continuous: true });
  };

  const handleStopListening = async () => {
    SpeechRecognition.stopListening();
    if (!transcript?.trim()) {
      setError('No speech detected. Please try again.');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);
      const extractedInfo = await extractInformation(transcript);
      setResults(extractedInfo);
    } catch (err) {
      setError('Failed to process speech. Please try again.');
      console.error('Processing error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!browserSupportsSpeechRecognition) {
    return (
      <div className="flex items-center justify-center p-6 bg-red-50 text-red-700 rounded-xl border border-red-200">
        <AlertCircle className="w-5 h-5 mr-2" />
        <p>Your browser doesn't support speech recognition. Please try a modern browser like Chrome.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="flex flex-col items-center mb-12">
        <div className="relative">
          <button
            onClick={listening ? handleStopListening : handleStartListening}
            className={`p-6 rounded-full shadow-lg ${
              listening 
                ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                : 'bg-indigo-600 hover:bg-indigo-700'
            } text-white transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed`}
            disabled={isProcessing}
          >
            {listening ? <MicOff size={32} /> : <Mic size={32} />}
          </button>
          {listening && (
            <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full animate-ping" />
          )}
        </div>
        <p className="mt-4 text-sm font-medium text-gray-600">
          {listening ? 'Tap to stop recording' : 'Tap to start recording'}
        </p>
      </div>

      {error && (
        <div className="mb-8 p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 flex items-center animate-fadeIn">
          <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-xl p-6 mb-8 transform transition-all duration-300 hover:shadow-2xl">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <FileText className="w-5 h-5 mr-2 text-indigo-600" />
          Live Transcript
        </h2>
        <div className={`min-h-[100px] bg-gray-50 rounded-lg p-4 transition-all duration-300 ${
          listening ? 'border-2 border-indigo-500' : 'border border-gray-200'
        }`}>
          <p className="text-gray-700 whitespace-pre-wrap">
            {transcript || 'Start speaking to see the transcript...'}
          </p>
        </div>
      </div>

      {isProcessing && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="animate-spin mr-2 text-indigo-600" size={24} />
          <span className="text-gray-700 font-medium">Processing your conversation...</span>
        </div>
      )}

      {results && (
        <div className="space-y-8 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-xl p-6 transform transition-all duration-300 hover:shadow-2xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <ListTodo className="w-5 h-5 mr-2 text-indigo-600" />
              Action Items
            </h2>
            {results.actionItems.length > 0 ? (
              <ul className="space-y-3">
                {results.actionItems.map((item: any, index: number) => (
                  <li key={index} className="flex items-start p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.task}</p>
                      <p className="text-sm text-gray-600">Due: {item.deadline}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 italic">No action items detected</p>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-xl p-6 transform transition-all duration-300 hover:shadow-2xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-indigo-600" />
              Meeting Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Date</p>
                <p className="font-medium text-gray-900">{results.meetingDetails.date}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Time</p>
                <p className="font-medium text-gray-900">{results.meetingDetails.time}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Participants</p>
                <p className="font-medium text-gray-900">
                  {results.meetingDetails.participants.join(', ')}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-xl p-6 transform transition-all duration-300 hover:shadow-2xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-indigo-600" />
              Key Points
            </h2>
            {results.keyPoints.length > 0 ? (
              <ul className="space-y-2">
                {results.keyPoints.map((point: string, index: number) => (
                  <li key={index} className="flex items-start">
                    <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-indigo-100 text-indigo-600 rounded-full mr-2">
                      {index + 1}
                    </span>
                    <p className="text-gray-700">{point}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 italic">No key points detected</p>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-xl p-6 transform transition-all duration-300 hover:shadow-2xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-indigo-600" />
              Calendar Events
            </h2>
            {results.calendarEvents.length > 0 ? (
              <ul className="space-y-3">
                {results.calendarEvents.map((event: any, index: number) => (
                  <li key={index} className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium text-gray-900">{event.title}</p>
                    <p className="text-sm text-gray-600">
                      {event.date} at {event.time}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 italic">No calendar events detected</p>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-xl p-6 transform transition-all duration-300 hover:shadow-2xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-indigo-600" />
              Meeting Summary
            </h2>
            <p className="text-gray-700 whitespace-pre-wrap">{results.summary}</p>
          </div>
        </div>
      )}
    </div>
  );
}