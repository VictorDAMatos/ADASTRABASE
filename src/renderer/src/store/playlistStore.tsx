import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Faixa } from './musicStore';

export interface Playlist {
  id: string;
  nome: string;
  capa: string;
  faixas: Faixa[];
  criadaEm: number;
}

interface PlaylistStore {
  playlists: Playlist[];
  addPlaylist: (nome: string, capa: string) => void;
  removerPlaylist: (id: string) => void;
  updatePlaylist: (id: string, updates: Partial<Playlist>) => void;
  addFaixa: (playlistId: string, faixa: Faixa) => void;
  removeFaixa: (playlistId: string, faixaId: string) => void;
}

export const usePlaylistStore = create<PlaylistStore>()(
  persist(
    (set) => ({
      playlists: [],
      
      addPlaylist: (nome, capa) => set((state) => ({
        playlists: [...state.playlists, {
          id: Math.random().toString(36).substr(2, 9),
          nome, capa, faixas: [], criadaEm: Date.now()
        }]
      })),

      removerPlaylist: (id) => set((state) => ({
        playlists: state.playlists.filter(p => p.id !== id)
      })),

      updatePlaylist: (id, updates) => set((state) => ({
        playlists: state.playlists.map(p => p.id === id ? { ...p, ...updates } : p)
      })),

      addFaixa: (playlistId, faixa) => set((state) => ({
        playlists: state.playlists.map(p => {
          if (p.id === playlistId && !p.faixas.find(f => f.id === faixa.id)) {
            return { ...p, faixas: [...p.faixas, faixa] };
          }
          return p;
        })
      })),

      removeFaixa: (playlistId, faixaId) => set((state) => ({
        playlists: state.playlists.map(p => 
          p.id === playlistId ? { ...p, faixas: p.faixas.filter(f => f.id !== faixaId) } : p
        )
      }))
    }),
    { name: 'playlist-storage' }
  )
);