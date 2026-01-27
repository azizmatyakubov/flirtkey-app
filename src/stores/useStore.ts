import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Girl, User, Culture } from '../types';

interface AppState {
  // User
  user: User | null;
  setUser: (user: User) => void;
  
  // Girls
  girls: Girl[];
  selectedGirl: Girl | null;
  addGirl: (girl: Omit<Girl, 'id' | 'messageCount'> & { relationshipStage?: Girl['relationshipStage'] }) => void;
  updateGirl: (id: number, data: Partial<Girl>) => void;
  deleteGirl: (id: number) => void;
  selectGirl: (girl: Girl | null) => void;
  
  // Settings
  userCulture: Culture;
  setUserCulture: (culture: Culture) => void;
  
  // API
  apiKey: string;
  setApiKey: (key: string) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // User
      user: null,
      setUser: (user) => set({ user }),
      
      // Girls
      girls: [],
      selectedGirl: null,
      
      addGirl: (girlData) => {
        const girls = get().girls;
        const newGirl: Girl = {
          ...girlData,
          id: Date.now(),
          messageCount: 0,
          relationshipStage: girlData.relationshipStage || 'just_met',
        };
        set({ girls: [...girls, newGirl], selectedGirl: newGirl });
      },
      
      updateGirl: (id, data) => {
        const girls = get().girls.map(g => 
          g.id === id ? { ...g, ...data } : g
        );
        const selectedGirl = get().selectedGirl;
        set({ 
          girls,
          selectedGirl: selectedGirl?.id === id 
            ? { ...selectedGirl, ...data } 
            : selectedGirl
        });
      },
      
      deleteGirl: (id) => {
        set({ 
          girls: get().girls.filter(g => g.id !== id),
          selectedGirl: get().selectedGirl?.id === id ? null : get().selectedGirl
        });
      },
      
      selectGirl: (girl) => set({ selectedGirl: girl }),
      
      // Settings
      userCulture: 'universal',
      setUserCulture: (culture) => set({ userCulture: culture }),
      
      // API
      apiKey: '',
      setApiKey: (key) => set({ apiKey: key }),
    }),
    {
      name: 'flirtkey-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
