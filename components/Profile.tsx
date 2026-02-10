import React, { useEffect, useState } from 'react';
import { auth, db } from '../services/firebase';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { updateProfile, deleteUser } from 'firebase/auth';
import { UserProfile } from '../types';
import { ArrowLeft, User, Mail, Image, Save, Trash2, Loader2, AlertTriangle, CheckCircle } from 'lucide-react';

interface ProfileProps {
  onBack: () => void;
}

export const Profile: React.FC<ProfileProps> = ({ onBack }) => {
  const [profile, setProfile] = useState<UserProfile>({ name: '', email: '', photoFileName: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!auth.currentUser) return;
      try {
        const docRef = doc(db, 'users', auth.currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
        } else {
          // Fallback if doc is missing for some reason
          setProfile({
            name: auth.currentUser.displayName || '',
            email: auth.currentUser.email || '',
            photoFileName: ''
          });
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
        setMessage({ type: 'error', text: 'Failed to load profile.' });
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    setSaving(true);
    setMessage(null);

    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        name: profile.name,
        photoFileName: profile.photoFileName,
      });
      
      // Update Auth Profile as well for consistency
      await updateProfile(auth.currentUser, {
        displayName: profile.name,
      });

      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err) {
      console.error("Error updating profile:", err);
      setMessage({ type: 'error', text: 'Failed to update profile.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!auth.currentUser) return;
    if (!window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) return;
    
    setSaving(true);
    try {
      // 1. Delete Firestore Document
      await deleteDoc(doc(db, 'users', auth.currentUser.uid));
      // 2. Delete Auth User
      await deleteUser(auth.currentUser);
      // App state will handle logout automatically
    } catch (err: any) {
      console.error("Error deleting account:", err);
      if (err.code === 'auth/requires-recent-login') {
        setMessage({ type: 'error', text: 'Please sign out and sign in again to delete your account.' });
      } else {
        setMessage({ type: 'error', text: 'Failed to delete account.' });
      }
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="animate-spin text-blue-600 mb-4" size={32} />
      </div>
    );
  }

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
        <h1 className="font-bold text-xl text-slate-800">Edit Profile</h1>
      </div>

      <div className="flex-1 p-6 max-w-lg mx-auto w-full">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <form onSubmit={handleSave} className="p-6 space-y-6">
            
            {/* Display Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                <User size={16} />
                Full Name
              </label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder="Your Name"
              />
            </div>

            {/* Email (Read Only) */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                <Mail size={16} />
                Email Address
              </label>
              <input
                type="email"
                value={profile.email}
                disabled
                className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed"
              />
              <p className="text-xs text-slate-400 mt-1">Email cannot be changed.</p>
            </div>

            {/* Photo File Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                <Image size={16} />
                Photo File Name
              </label>
              <input
                type="text"
                value={profile.photoFileName}
                onChange={(e) => setProfile({ ...profile, photoFileName: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder="e.g. profile.jpg"
              />
            </div>

            {/* Messages */}
            {message && (
              <div className={`flex items-center gap-2 p-3 rounded-lg text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                {message.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                {message.text}
              </div>
            )}

            {/* Actions */}
            <div className="pt-4 flex flex-col gap-3">
              <button
                type="submit"
                disabled={saving}
                className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="animate-spin" size={20} /> : (
                  <>
                    <Save size={20} />
                    Save Changes
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={saving}
                className="w-full bg-white text-red-600 font-bold py-3 rounded-xl border border-red-100 hover:bg-red-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                 <Trash2 size={20} />
                 Delete Account
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};