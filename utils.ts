
export const SCOPE_COLOR_CONFIG: Record<string, { light: string, dark: string, solidLight: string, solidDark: string }> = {
  blue: { 
    light: 'bg-blue-50 text-blue-700 border-blue-200', 
    dark: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    solidLight: 'bg-blue-600 border-blue-600',
    solidDark: 'bg-blue-500 border-blue-500'
  },
  emerald: { 
    light: 'bg-emerald-50 text-emerald-700 border-emerald-200', 
    dark: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    solidLight: 'bg-emerald-600 border-emerald-600',
    solidDark: 'bg-emerald-500 border-emerald-500'
  },
  violet: { 
    light: 'bg-violet-50 text-violet-700 border-violet-200', 
    dark: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
    solidLight: 'bg-violet-600 border-violet-600',
    solidDark: 'bg-violet-500 border-violet-500'
  },
  amber: { 
    light: 'bg-amber-50 text-amber-700 border-amber-200', 
    dark: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    solidLight: 'bg-amber-600 border-amber-600',
    solidDark: 'bg-amber-500 border-amber-500'
  },
  rose: { 
    light: 'bg-rose-50 text-rose-700 border-rose-200', 
    dark: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    solidLight: 'bg-rose-600 border-rose-600',
    solidDark: 'bg-rose-500 border-rose-500'
  },
  cyan: { 
    light: 'bg-cyan-50 text-cyan-700 border-cyan-200', 
    dark: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    solidLight: 'bg-cyan-600 border-cyan-600',
    solidDark: 'bg-cyan-500 border-cyan-500'
  },
  fuchsia: { 
    light: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200', 
    dark: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30',
    solidLight: 'bg-fuchsia-600 border-fuchsia-600',
    solidDark: 'bg-fuchsia-500 border-fuchsia-500'
  },
  indigo: { 
    light: 'bg-indigo-50 text-indigo-700 border-indigo-200', 
    dark: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    solidLight: 'bg-indigo-600 border-indigo-600',
    solidDark: 'bg-indigo-500 border-indigo-500'
  },
  teal: { 
    light: 'bg-teal-50 text-teal-700 border-teal-200', 
    dark: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
    solidLight: 'bg-teal-600 border-teal-600',
    solidDark: 'bg-teal-500 border-teal-500'
  },
  orange: { 
    light: 'bg-orange-50 text-orange-700 border-orange-200', 
    dark: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    solidLight: 'bg-orange-600 border-orange-600',
    solidDark: 'bg-orange-500 border-orange-500'
  },
  pink: { 
    light: 'bg-pink-50 text-pink-700 border-pink-200', 
    dark: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
    solidLight: 'bg-pink-600 border-pink-600',
    solidDark: 'bg-pink-500 border-pink-500'
  },
  lime: { 
    light: 'bg-lime-50 text-lime-700 border-lime-200', 
    dark: 'bg-lime-500/20 text-lime-300 border-lime-500/30',
    solidLight: 'bg-lime-600 border-lime-600',
    solidDark: 'bg-lime-500 border-lime-500'
  },
  sky: { 
    light: 'bg-sky-50 text-sky-700 border-sky-200', 
    dark: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
    solidLight: 'bg-sky-600 border-sky-600',
    solidDark: 'bg-sky-500 border-sky-500'
  },
  purple: { 
    light: 'bg-purple-50 text-purple-700 border-purple-200', 
    dark: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    solidLight: 'bg-purple-600 border-purple-600',
    solidDark: 'bg-purple-500 border-purple-500'
  }
};

export const getScopeColorConfig = (scope: string, allScopes: string[] = []) => {
  const keys = Object.keys(SCOPE_COLOR_CONFIG);
  
  // Method 1: Index-based (Sequential)
  // If we have the full list, pick based on position to ensure we cycle through colors
  // before reusing them.
  if (allScopes.length > 0) {
    const index = allScopes.indexOf(scope);
    if (index !== -1) {
      return SCOPE_COLOR_CONFIG[keys[index % keys.length]];
    }
  }

  // Method 2: Hash-based (Fallback)
  // Used if we don't have the context of all scopes
  let hash = 0;
  for (let i = 0; i < scope.length; i++) {
    hash = scope.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const index = Math.abs(hash % keys.length);
  return SCOPE_COLOR_CONFIG[keys[index]];
};
