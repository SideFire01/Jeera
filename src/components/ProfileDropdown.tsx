import React, { useState, useEffect, useRef } from 'react';

interface ProfileDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  currentUsername?: string;
  userEmail?: string;
  onUpdateProfile: (username: string) => Promise<void>;
  darkMode: boolean;
  toggleTheme: () => void;
  onSignOut: () => void;
}

const ProfileDropdown: React.FC<ProfileDropdownProps> = ({
  isOpen,
  onClose,
  currentUsername,
  userEmail,
  onUpdateProfile,
  darkMode,
  toggleTheme,
  onSignOut
}) => {
  const [username, setUsername] = useState(currentUsername || '');
  const [isEditing, setIsEditing] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setUsername(currentUsername || '');
  }, [currentUsername]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (dropdownRef.current && !dropdownRef.current.contains(target) && !target.closest('#profile-trigger-btn')) {
        onClose();
        setIsEditing(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleSaveUsername = async () => {
    if (username.trim() && username !== currentUsername) {
       await onUpdateProfile(username);
    }
    setIsEditing(false);
  };

  if (!isOpen) return null;

  return (
    <div 
      ref={dropdownRef}
      className={`absolute top-full right-0 mt-1 w-72 rounded-xl border z-50 overflow-hidden transform transition-all origin-top-right animate-in fade-in zoom-in-95 duration-200 p-1.5 ${
        darkMode ? 'bg-[#1D2125] border-[#38414A] shadow-2xl shadow-black/50' : 'bg-white border-slate-200 shadow-xl'
      }`}
    >
      {/* Header / User Info */}
      {/* Header / User Info */}
      {/* Header / User Info */}
      <div className={`px-2 py-1.5 mb-1 relative ${darkMode ? 'text-[#B6C2CF]' : 'text-slate-800'}`}>
        <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 opacity-50 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Signed in as</p>
        <p className="text-xs font-bold truncate pr-16">
          {userEmail || 'No Email'}
        </p>

        {/* Theme Toggle - Top Right */}
        <button 
           onClick={toggleTheme}
           className={`absolute top-2 right-2 flex items-center gap-2 p-1 rounded-lg transition-colors border shadow-sm ${
              darkMode ? 'bg-[#22272B] border-[#38414A] hover:bg-[#2C333A]' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
           }`}
           title="Toggle Theme"
         >
               <div className={`p-1 rounded-full ${darkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-amber-100 text-amber-500'}`}>
                  {darkMode ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                      </svg>
                  ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                      </svg>
                  )}
               </div>
               
               <div className={`relative w-7 h-3.5 rounded-full transition-colors flex items-center ${darkMode ? 'bg-indigo-500' : 'bg-slate-300'}`}>
                    <div className={`absolute w-2.5 h-2.5 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${darkMode ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
               </div>
         </button>
      </div>

      {/* Username Section */}
      <div className="px-2 py-1.5 mb-1">
          <div className={`text-[10px] font-bold uppercase tracking-widest mb-1 opacity-50 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Profile Name
          </div>
          
          {isEditing ? (
             <div className="flex gap-2">
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={`flex-1 px-2 py-1 text-xs rounded border outline-none focus:ring-2 focus:ring-blue-500 ${
                     darkMode ? 'bg-[#22272B] border-[#38414A] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                  autoFocus
                  onKeyDown={(e) => {
                      if(e.key === 'Enter') handleSaveUsername();
                      if(e.key === 'Escape') { setUsername(currentUsername||''); setIsEditing(false); }
                  }}
                />
                <button 
                  onClick={handleSaveUsername}
                  className="px-2 py-1 bg-blue-600 text-white text-[10px] font-bold uppercase rounded hover:bg-blue-700"
                >
                  Save
                </button>
             </div>
          ) : (
             <div className="flex items-center justify-between group">
                 <div className={`text-xs font-bold ${darkMode ? 'text-white' : 'text-slate-700'}`}>
                    {currentUsername || userEmail?.split('@')[0] || 'User'}
                 </div>
                 <button 
                  onClick={() => setIsEditing(true)}
                  className={`text-[10px] font-bold hover:underline opacity-0 group-hover:opacity-100 transition-opacity ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}
                >
                  EDIT
                </button>
             </div>
          )}
      </div>

      <div className={`h-px w-full ${darkMode ? 'bg-[#38414a]' : 'bg-slate-100'}`} />

      {/* Theme Toggle */}
      <div className="p-2">
         {/* Sign Out Button */}
         <button 
           onClick={onSignOut}
           className={`w-full flex items-center justify-center gap-2 px-2 py-1.5 rounded-lg transition-colors text-red-500 border shadow-sm ${
              darkMode ? 'bg-red-900/10 border-red-900/20 hover:bg-red-900/20' : 'bg-red-50 border-red-100 hover:bg-red-100'
           }`}
         >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="text-xs font-bold uppercase tracking-wide">Sign Out</span>
         </button>
      </div>

    </div>
  );
};

export default ProfileDropdown;
