import React, { useState, useEffect } from 'react';
import { getSavedWords, deleteWord } from '../services/storage';
import { ArrowLeft, Trash2, Volume2, BookOpen, Search } from 'lucide-react';

interface WordBookProps {
  userId: string;
  onSelectWord: (word: string) => void;
  onBack: () => void;
}

export const WordBook: React.FC<WordBookProps> = ({ userId, onSelectWord, onBack }) => {
  const [words, setWords] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setWords(getSavedWords(userId));
  }, [userId]);

  const handleDelete = (e: React.MouseEvent, word: string) => {
    e.stopPropagation();
    if (confirm(`Remove "${word}" from your word book?`)) {
      const updated = deleteWord(userId, word);
      setWords(updated);
    }
  };

  const filteredWords = words.filter(w => 
    w.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-6 py-4 flex items-center sticky top-0 z-20">
        <button 
          onClick={onBack}
          className="mr-4 p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="flex items-center gap-2">
          <div className="bg-blue-100 text-blue-600 p-1.5 rounded-lg">
            <BookOpen size={20} />
          </div>
          <h1 className="font-bold text-xl text-slate-800 tracking-tight">My Word Book</h1>
        </div>
      </div>

      <main className="flex-1 p-6 max-w-3xl mx-auto w-full">
        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-3.5 text-slate-400 h-5 w-5" />
          <input 
            type="text" 
            placeholder="Search your words..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
          />
        </div>

        {/* List */}
        {words.length === 0 ? (
          <div className="text-center py-20 opacity-60">
            <BookOpen size={48} className="mx-auto mb-4 text-slate-300" />
            <p className="text-lg text-slate-500">Your word book is empty.</p>
            <p className="text-sm text-slate-400 mt-2">Snap photos to start learning!</p>
          </div>
        ) : filteredWords.length === 0 ? (
          <div className="text-center py-10 opacity-60">
            <p className="text-slate-500">No words match your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredWords.map((word) => (
              <div 
                key={word}
                onClick={() => onSelectWord(word)}
                className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group flex justify-between items-center"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-blue-50 text-blue-600 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg">
                    {word.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-bold text-slate-700 capitalize text-lg">{word}</span>
                </div>
                
                <button
                  onClick={(e) => handleDelete(e, word)}
                  className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                  title="Remove word"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};