export interface Theme {
  id: string;
  name: string;
  category: 'dark' | 'light' | 'special';
  colors: {
    bg: string;
    surface: string;
    surfaceBorder: string;
    main: string;
    sub: string;
    caret: string;
    error: string;
    errorExtra: string;
    accent: string;
  };
}

export const THEMES: Theme[] = [
  {
    id: 'serika-dark',
    name: 'Serika Dark',
    category: 'dark',
    colors: {
      bg: '#323437',
      surface: '#2c2e31',
      surfaceBorder: '#44474b',
      main: '#d1d0c5',
      sub: '#646669',
      caret: '#e2b714',
      error: '#ca4754',
      errorExtra: '#7e2a33',
      accent: '#e2b714'
    }
  },
  {
    id: 'matrix',
    name: 'Matrix',
    category: 'dark',
    colors: {
      bg: '#0d1117',
      surface: '#161b22',
      surfaceBorder: '#238636',
      main: '#00ff66',
      sub: '#0e7030',
      caret: '#00ff66',
      error: '#ff3333',
      errorExtra: '#8b0000',
      accent: '#00ff66'
    }
  },
  {
    id: 'dracula',
    name: 'Dracula',
    category: 'dark',
    colors: {
      bg: '#282a36',
      surface: '#21222c',
      surfaceBorder: '#44475a',
      main: '#f8f8f2',
      sub: '#6272a4',
      caret: '#ff79c6',
      error: '#ff5555',
      errorExtra: '#9e2b2b',
      accent: '#bd93f9'
    }
  },
  {
    id: 'nord',
    name: 'Nord',
    category: 'dark',
    colors: {
      bg: '#2e3440',
      surface: '#3b4252',
      surfaceBorder: '#4c566a',
      main: '#eceff4',
      sub: '#7b88a1',
      caret: '#88c0d0',
      error: '#bf616a',
      errorExtra: '#8b3840',
      accent: '#81a1c1'
    }
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    category: 'dark',
    colors: {
      bg: '#120b24',
      surface: '#1c1335',
      surfaceBorder: '#ff007f',
      main: '#00fff5',
      sub: '#794d9b',
      caret: '#ff007f',
      error: '#ff2a6d',
      errorExtra: '#990033',
      accent: '#ffe600'
    }
  },
  {
    id: 'carbon',
    name: 'Carbon',
    category: 'dark',
    colors: {
      bg: '#1c1c1c',
      surface: '#242424',
      surfaceBorder: '#383838',
      main: '#f5f5f5',
      sub: '#606060',
      caret: '#f66e0d',
      error: '#e74c3c',
      errorExtra: '#922b21',
      accent: '#f66e0d'
    }
  },
  {
    id: 'botanical',
    name: 'Botanical',
    category: 'dark',
    colors: {
      bg: '#1b2624',
      surface: '#233230',
      surfaceBorder: '#394d4a',
      main: '#eaf3f1',
      sub: '#6f8d87',
      caret: '#93b5aa',
      error: '#d16a6a',
      errorExtra: '#7a3131',
      accent: '#93b5aa'
    }
  },
  {
    id: 'moonlight',
    name: 'Moonlight',
    category: 'dark',
    colors: {
      bg: '#191b28',
      surface: '#212337',
      surfaceBorder: '#3b3f58',
      main: '#c8d3f5',
      sub: '#656d9a',
      caret: '#82aaff',
      error: '#ff757f',
      errorExtra: '#a83c44',
      accent: '#c099ff'
    }
  },
  {
    id: 'lavender',
    name: 'Lavender',
    category: 'dark',
    colors: {
      bg: '#201c2e',
      surface: '#29243b',
      surfaceBorder: '#433c60',
      main: '#e6e1f7',
      sub: '#7b729e',
      caret: '#b8a6e8',
      error: '#f26d7d',
      errorExtra: '#8b323e',
      accent: '#c7b8f5'
    }
  },
  {
    id: 'sunset',
    name: 'Sunset',
    category: 'dark',
    colors: {
      bg: '#1a162b',
      surface: '#241f3d',
      surfaceBorder: '#3f366b',
      main: '#f7d3ba',
      sub: '#8a79a8',
      caret: '#ff7e67',
      error: '#ff4d6d',
      errorExtra: '#991e36',
      accent: '#ffa600'
    }
  },
  {
    id: 'chalk',
    name: 'Chalk',
    category: 'dark',
    colors: {
      bg: '#2b2d42',
      surface: '#232538',
      surfaceBorder: '#3d405b',
      main: '#edf2f4',
      sub: '#8d99ae',
      caret: '#06d6a0',
      error: '#ef233c',
      errorExtra: '#8b0f1f',
      accent: '#06d6a0'
    }
  },
  {
    id: 'bento',
    name: 'Bento',
    category: 'dark',
    colors: {
      bg: '#2d3142',
      surface: '#242735',
      surfaceBorder: '#41465d',
      main: '#ffffff',
      sub: '#778299',
      caret: '#ff6b6b',
      error: '#e63946',
      errorExtra: '#80151f',
      accent: '#4ecdc4'
    }
  },
  {
    id: 'olivia',
    name: 'Olivia',
    category: 'dark',
    colors: {
      bg: '#1c1b1d',
      surface: '#262529',
      surfaceBorder: '#3e3b43',
      main: '#f2efed',
      sub: '#6d6973',
      caret: '#deaf9d',
      error: '#d45d6a',
      errorExtra: '#7d2e37',
      accent: '#deaf9d'
    }
  },
  {
    id: 'paper-light',
    name: 'Paper Light',
    category: 'light',
    colors: {
      bg: '#eeeeee',
      surface: '#e0e0e0',
      surfaceBorder: '#cccccc',
      main: '#222222',
      sub: '#777777',
      caret: '#e05d06',
      error: '#d32f2f',
      errorExtra: '#ff8a80',
      accent: '#e05d06'
    }
  }
];

export function applyTheme(themeId: string) {
  const theme = THEMES.find(t => t.id === themeId) || THEMES[0];
  const root = document.documentElement;

  root.style.setProperty('--color-bg', theme.colors.bg);
  root.style.setProperty('--color-surface', theme.colors.surface);
  root.style.setProperty('--color-surface-border', theme.colors.surfaceBorder);
  root.style.setProperty('--color-main', theme.colors.main);
  root.style.setProperty('--color-sub', theme.colors.sub);
  root.style.setProperty('--color-caret', theme.colors.caret);
  root.style.setProperty('--color-error', theme.colors.error);
  root.style.setProperty('--color-error-extra', theme.colors.errorExtra);
  root.style.setProperty('--color-accent', theme.colors.accent);

  document.body.setAttribute('data-theme', theme.id);
  document.body.setAttribute('data-category', theme.category);
}
