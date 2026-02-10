import React, { useEffect, useState, useRef } from 'react';
import { WordDetails } from '../types';
import { getWordDetails, generatePronunciation } from '../services/geminiService';
import { ArrowLeft, Volume2, Loader2, BookOpen } from 'lucide-react';

interface DetailViewProps {
  word: string;
  onBack: () => void;
}

export const DetailView: React.FC<DetailViewProps> = ({ word, onBack }) => {
  const [details, setDetails] = useState<WordDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [mainAudioBuffer, setMainAudioBuffer] = useState<ArrayBuffer | null>(null);
  const [isMainPlaying, setIsMainPlaying] = useState(false);
  
  // Sentence state
  const [playingSentenceIdx, setPlayingSentenceIdx] = useState<number | null>(null);
  const [loadingSentenceIdx, setLoadingSentenceIdx] = useState<number | null>(null);
  const sentenceAudioCache = useRef<{[key: number]: ArrayBuffer}>({});
  
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [wordData, audioData] = await Promise.all([
          getWordDetails(word),
          generatePronunciation(word, false) // false = isSentence
        ]);

        if (mounted) {
          setDetails(wordData);
          setMainAudioBuffer(audioData);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();

    return () => {
      mounted = false;
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [word]);

  const playRawAudio = async (buffer: ArrayBuffer, onEndCallback: () => void) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }

      const ctx = audioContextRef.current;
      
      // Ensure context is running
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      const pcmData = new Int16Array(buffer);
      const audioBufferInstance = ctx.createBuffer(1, pcmData.length, 24000);
      const channelData = audioBufferInstance.getChannelData(0);
      
      // Convert PCM 16-bit integers to Float32
      for (let i = 0; i < pcmData.length; i++) {
        channelData[i] = pcmData[i] / 32768.0;
      }
      
      const source = ctx.createBufferSource();
      source.buffer = audioBufferInstance;
      source.connect(ctx.destination);
      
      source.onended = () => {
        onEndCallback();
      };
      
      source.start(0);
    } catch (e) {
      console.error("Audio playback error", e);
      onEndCallback();
    }
  };

  const handleMainPlay = () => {
    if (mainAudioBuffer && !isMainPlaying) {
      setIsMainPlaying(true);
      playRawAudio(mainAudioBuffer, () => setIsMainPlaying(false));
    }
  };

  const handleSentencePlay = async (sentence: string, idx: number) => {
    // Prevent starting another audio if one is loading or playing
    if (loadingSentenceIdx !== null || playingSentenceIdx !== null || isMainPlaying) return;

    // Check cache
    if (sentenceAudioCache.current[idx]) {
      setPlayingSentenceIdx(idx);
      await playRawAudio(sentenceAudioCache.current[idx], () => setPlayingSentenceIdx(null));
      return;
    }

    setLoadingSentenceIdx(idx);
    try {
      const buffer = await generatePronunciation(sentence, true); // true = isSentence
      if (buffer) {
        sentenceAudioCache.current[idx] = buffer;
        setPlayingSentenceIdx(idx);
        await playRawAudio(buffer, () => setPlayingSentenceIdx(null));
      }
    } catch (e) {
      console.error("Failed to generate sentence audio", e);
    } finally {
      setLoadingSentenceIdx(null);
    }
  };

  const highlightWord = (text: string, highlight: string) => {
    // Escape regex characters in highlight string
    const safeHighlight = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = text.split(new RegExp(`(${safeHighlight})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === highlight.toLowerCase() ? (
            <strong key={i} className="font-extrabold text-blue-700">{part}</strong>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
        <p className="text-slate-500 font-medium animate-pulse">Consulting the English Teacher...</p>
      </div>
    );
  }

  if (!details) return null;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-100 p-4 flex items-center z-10">
        <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-600">
          <ArrowLeft size={24} />
        </button>
        <h1 className="flex-1 text-center font-semibold text-slate-800">Word Details</h1>
        <div className="w-10"></div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center max-w-lg mx-auto w-full">
        {/* Main Word Card */}
        <div className="w-full bg-blue-600 rounded-3xl p-8 text-white shadow-xl shadow-blue-200 mb-8 transform transition-transform hover:scale-[1.01]">
          <div className="flex flex-col items-center text-center">
            <h2 className="text-5xl font-bold mb-2 capitalize tracking-tight">{details.word}</h2>
            {details.phonetic && (
              <p className="text-blue-100 text-xl font-mono opacity-80 mb-6">/{details.phonetic}/</p>
            )}
            
            <button 
              onClick={handleMainPlay}
              disabled={isMainPlaying || !mainAudioBuffer}
              className={`
                flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all
                ${isMainPlaying 
                  ? 'bg-white text-blue-600 scale-95 shadow-inner' 
                  : 'bg-white text-blue-600 shadow-lg hover:shadow-xl hover:-translate-y-1 active:scale-95'
                }
                ${!mainAudioBuffer ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <Volume2 size={24} className={isMainPlaying ? 'animate-pulse' : ''} />
              {isMainPlaying ? 'Playing...' : 'Pronounce'}
            </button>
          </div>
        </div>

        {/* Sentences */}
        <div className="w-full space-y-4">
          <div className="flex items-center gap-2 text-slate-400 font-semibold uppercase text-sm tracking-wider mb-2">
            <BookOpen size={16} />
            <span>Example Sentences</span>
          </div>
          
          <div className="space-y-3">
            {details.sentences.map((sentence, idx) => (
              <div 
                key={idx} 
                onClick={() => handleSentencePlay(sentence, idx)}
                className={`
                  relative border rounded-xl p-5 transition-all cursor-pointer overflow-hidden
                  ${playingSentenceIdx === idx 
                    ? 'border-blue-400 bg-blue-50 shadow-md ring-1 ring-blue-200' 
                    : 'border-slate-100 bg-slate-50 hover:shadow-md hover:border-blue-300 hover:bg-white'
                  }
                `}
              >
                {/* Loading Indicator for Sentence */}
                {loadingSentenceIdx === idx && (
                  <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-[1px] flex items-center justify-center">
                    <Loader2 className="animate-spin text-blue-600" size={24} />
                  </div>
                )}

                <div className="flex justify-between items-start gap-3">
                  <p className={`text-lg leading-relaxed font-medium transition-colors ${playingSentenceIdx === idx ? 'text-slate-800' : 'text-slate-700'}`}>
                    {highlightWord(sentence, details.word)}
                  </p>
                  
                  <div className={`mt-1 p-2 rounded-full transition-colors ${playingSentenceIdx === idx ? 'bg-blue-100 text-blue-600' : 'bg-transparent text-slate-300'}`}>
                    <Volume2 size={20} className={playingSentenceIdx === idx ? 'animate-pulse' : ''} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};