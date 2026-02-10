import React, { useState, useRef, useEffect } from 'react';
import { AppState, DetectedObject } from './types';
import { Camera } from './components/Camera';
import { DetailView } from './components/DetailView';
import { Auth } from './components/Auth';
import { WordBook } from './components/WordBook';
import { Profile } from './components/Profile';
import { auth } from './services/firebase';
import { saveWord } from './services/storage';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { detectObjectsInImage } from './services/geminiService';
import { Camera as CameraIcon, Upload, Image as ImageIcon, Sparkles, AlertCircle, LogOut, Loader2, Mail, Book, User as UserIcon } from 'lucide-react';

const App: React.FC = () => {
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // App State
  const [appState, setAppState] = useState<AppState>(AppState.HOME);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [detectedObjects, setDetectedObjects] = useState<DetectedObject[]>([]);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageSize, setImageSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  const processImage = async (base64: string) => {
    setAppState(AppState.ANALYZING);
    setAnalyzing(true);
    // Remove data URL prefix for API
    const base64Data = base64.split(',')[1];
    
    const objects = await detectObjectsInImage(base64Data);
    setDetectedObjects(objects);
    setAnalyzing(false);
    setAppState(AppState.RESULTS);
  };

  const handleCapture = (src: string) => {
    setImageSrc(src);
    setAppState(AppState.ANALYZING); // Temporary state before processing
    // Slight delay to allow UI to update
    setTimeout(() => processImage(src), 100);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImageSrc(result);
        setTimeout(() => processImage(result), 100);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    setImageSize({ width: naturalWidth, height: naturalHeight });
  };

  const handleWordSelect = (word: string) => {
    if (user) {
      saveWord(user.uid, word);
    }
    setSelectedWord(word);
    setAppState(AppState.DETAIL);
  };

  const reset = () => {
    setAppState(AppState.HOME);
    setImageSrc(null);
    setDetectedObjects([]);
    setSelectedWord(null);
  };

  const handleSignOut = () => {
    signOut(auth);
    reset();
  };

  if (loadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  if (!user.emailVerified) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden p-8 text-center animate-in fade-in zoom-in duration-300">
          <div className="mx-auto bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mb-6">
             <Mail className="text-blue-600 w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Verify your email</h2>
          <p className="text-slate-600 mb-8 leading-relaxed">
            We have sent you a verification email to <br/>
            <span className="font-bold text-slate-800">{user.email}</span>.
            <br/><br/>
            Please verify your email address and then log in to continue.
          </p>
          <button
            onClick={() => handleSignOut()}
            className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-[0.98] transition-all"
          >
            Log In
          </button>
        </div>
      </div>
    );
  }

  // --- RENDERERS ---

  if (appState === AppState.DETAIL && selectedWord) {
    return (
      <DetailView 
        word={selectedWord} 
        onBack={() => {
          // Return to Results if we have an image, otherwise go back to Home or Wordbook
          if (imageSrc && detectedObjects.length > 0) {
            setAppState(AppState.RESULTS);
          } else {
            setAppState(AppState.WORDBOOK);
          }
        }} 
      />
    );
  }

  if (appState === AppState.CAMERA) {
    return <Camera onCapture={handleCapture} onClose={() => setAppState(AppState.HOME)} />;
  }

  if (appState === AppState.WORDBOOK) {
    return (
      <WordBook 
        userId={user.uid} 
        onSelectWord={handleWordSelect} 
        onBack={() => setAppState(AppState.HOME)} 
      />
    );
  }

  if (appState === AppState.PROFILE) {
    return <Profile onBack={() => setAppState(AppState.HOME)} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setAppState(AppState.HOME)}>
          <div className="bg-blue-600 text-white p-1.5 rounded-lg">
            <Sparkles size={20} />
          </div>
          <span className="font-bold text-xl text-slate-800 tracking-tight">SnapLearn</span>
        </div>
        
        <div className="flex items-center gap-4">
          {(appState === AppState.RESULTS || appState === AppState.ANALYZING) && (
            <button 
              onClick={reset}
              className="text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors"
            >
              New Photo
            </button>
          )}

          <button 
            onClick={() => setAppState(AppState.WORDBOOK)}
            className="text-slate-500 hover:text-blue-600 transition-colors flex items-center gap-1.5 text-sm font-medium"
            title="My Word Book"
          >
            <Book size={20} />
            <span className="hidden sm:inline">My Words</span>
          </button>

          <button 
            onClick={() => setAppState(AppState.PROFILE)}
            className="text-slate-500 hover:text-blue-600 transition-colors flex items-center gap-1.5 text-sm font-medium"
            title="Profile"
          >
            <UserIcon size={20} />
          </button>
          
          <div className="h-5 w-px bg-slate-200 mx-1"></div>

          <button
            onClick={handleSignOut}
            className="text-slate-400 hover:text-slate-700 transition-colors"
            title="Sign Out"
          >
            <LogOut size={20} />
          </button>
        </div>
      </nav>

      <main className="flex-1 flex flex-col relative max-w-3xl mx-auto w-full">
        
        {/* HOME STATE */}
        {appState === AppState.HOME && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-12 animate-in fade-in zoom-in duration-300">
            <div className="text-center space-y-4 max-w-md">
              <h1 className="text-4xl font-extrabold text-slate-800 leading-tight">
                Welcome, <span className="text-blue-600">{user.displayName || 'Learner'}</span>!
              </h1>
              <p className="text-lg text-slate-500">
                Take a photo or upload an image. AI will find objects and teach you their names.
              </p>
            </div>

            <div className="grid gap-4 w-full max-w-xs">
              <button
                onClick={() => setAppState(AppState.CAMERA)}
                className="group relative flex items-center justify-center gap-3 w-full p-4 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-200 hover:bg-blue-700 hover:scale-[1.02] active:scale-95 transition-all duration-200"
              >
                <div className="bg-white/20 p-2 rounded-full">
                   <CameraIcon size={24} />
                </div>
                <span className="font-bold text-lg">Take Photo</span>
              </button>

              <div className="relative">
                 <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  ref={fileInputRef}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-center gap-3 w-full p-4 bg-white text-slate-700 border-2 border-slate-100 rounded-2xl hover:border-blue-100 hover:bg-blue-50 hover:text-blue-700 active:scale-95 transition-all duration-200"
                >
                   <div className="bg-slate-100 p-2 rounded-full group-hover:bg-blue-100 transition-colors">
                     <Upload size={24} />
                   </div>
                  <span className="font-bold text-lg">Upload Image</span>
                </button>
              </div>

              <button
                  onClick={() => setAppState(AppState.WORDBOOK)}
                  className="flex items-center justify-center gap-3 w-full p-4 bg-white text-slate-700 border-2 border-slate-100 rounded-2xl hover:border-blue-100 hover:bg-blue-50 hover:text-blue-700 active:scale-95 transition-all duration-200"
                >
                   <div className="bg-slate-100 p-2 rounded-full group-hover:bg-blue-100 transition-colors">
                     <Book size={24} />
                   </div>
                  <span className="font-bold text-lg">My Word Book</span>
                </button>
            </div>
          </div>
        )}

        {/* RESULTS / ANALYZING STATE */}
        {(appState === AppState.RESULTS || appState === AppState.ANALYZING) && imageSrc && (
          <div className="flex-1 bg-black flex flex-col relative overflow-hidden">
            {/* Image Container */}
            <div className="relative w-full h-full flex items-center justify-center bg-zinc-900">
              <div className="relative w-full max-h-full">
                <img 
                  src={imageSrc} 
                  alt="Analyzed" 
                  onLoad={handleImageLoad}
                  className="w-full h-auto max-h-[80vh] object-contain mx-auto"
                />
                
                {/* Overlays */}
                {!analyzing && detectedObjects.map((obj) => {
                  const [ymin, xmin, ymax, xmax] = obj.box2d;
                  // Convert normalized 0-1000 coordinates to percentages
                  const top = (ymin / 1000) * 100;
                  const left = (xmin / 1000) * 100;
                  const height = ((ymax - ymin) / 1000) * 100;
                  const width = ((xmax - xmin) / 1000) * 100;

                  return (
                    <button
                      key={obj.id}
                      onClick={() => handleWordSelect(obj.label)}
                      className="absolute border-2 border-blue-400 bg-blue-500/20 hover:bg-blue-500/40 hover:border-blue-300 transition-colors group cursor-pointer z-10"
                      style={{
                        top: `${top}%`,
                        left: `${left}%`,
                        height: `${height}%`,
                        width: `${width}%`,
                      }}
                    >
                      {/* Label Tag */}
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-sm whitespace-nowrap z-20 group-hover:scale-110 transition-transform">
                        {obj.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Analysis Loading Overlay */}
            {analyzing && (
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                  <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-300 animate-pulse" size={24} />
                </div>
                <p className="mt-4 text-white font-medium text-lg animate-pulse">Scanning objects...</p>
              </div>
            )}
            
            {/* Empty State / Hints */}
            {!analyzing && detectedObjects.length === 0 && (
               <div className="absolute bottom-10 left-0 right-0 flex justify-center z-20 px-4">
                 <div className="bg-slate-800/90 backdrop-blur text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 max-w-sm">
                   <AlertCircle className="text-yellow-400 shrink-0" />
                   <p className="text-sm">No objects detected clearly. Try a different photo with better lighting.</p>
                 </div>
               </div>
            )}
             
            {!analyzing && detectedObjects.length > 0 && (
                <div className="absolute bottom-8 left-0 right-0 flex justify-center z-20 pointer-events-none">
                  <div className="bg-black/50 backdrop-blur-md text-white text-sm font-medium px-4 py-2 rounded-full animate-bounce">
                    Tap a blue box to learn!
                  </div>
                </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
};

export default App;