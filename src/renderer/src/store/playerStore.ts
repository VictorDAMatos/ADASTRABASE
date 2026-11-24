import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface Faixa {
  id: string;
  titulo: string;
  artista: string;
  album: string;
  capa: string;
  url: string;
  letra?: string;
}

interface PlayerState {
  faixaAtual: Faixa | null;
  isPlaying: boolean;
  volume: number;
  showLyrics: boolean;
  setFaixaAtual: (faixa: Faixa) => void;
  setIsPlaying: (status: boolean) => void;
  setVolume: (valor: number) => void;
  setShowLyrics: (status: boolean) => void;
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set) => ({
      faixaAtual: null,
      isPlaying: false,
      volume: 0.5,
      showLyrics: false,
      setFaixaAtual: (faixa) => set({ faixaAtual: faixa, isPlaying: true }),
      setIsPlaying: (status) => set({ isPlaying: status }),
      setVolume: (valor) => set({ volume: valor }),
      setShowLyrics: (status) => set({ showLyrics: status }),
    }),
    {
      name: 'ad-astra-player-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);