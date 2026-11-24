import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Faixa {
  id: string;
  titulo: string;
  artista: string;
  album: string;
  capa: string;
  url: string;
  duracao: string;
  adicionadoEm: number;
  letra?: string;
}

interface MusicState {
  biblioteca: Faixa[];
  recentes: Faixa[];
  addMusica: (faixa: Faixa) => void;
  removerMusica: (id: string) => void;
  registrarOuvida: (faixa: Faixa) => void;
  updateFaixa: (id: string, dados: Partial<Faixa>) => void;
}

export const useMusicStore = create<MusicState>()(
  persist(
    (set) => ({
      biblioteca: [],
      recentes: [],
      addMusica: (track) => set((state) => ({ biblioteca: [track, ...state.biblioteca] })),
      removerMusica: (id) => set((state) => ({ biblioteca: state.biblioteca.filter(t => t.id !== id) })),
      registrarOuvida: (track) => set((state) => {
        const filtrados = state.recentes.filter(t => t.id !== track.id);
        return { recentes: [track, ...filtrados].slice(0, 10) };
      }),
      updateFaixa: (id, updates) => set((state) => ({
        biblioteca: state.biblioteca.map(t => t.id === id ? { ...t, ...updates } : t)
      })),
    }),
    { name: 'adastra-music-library-v5' }
  )
);