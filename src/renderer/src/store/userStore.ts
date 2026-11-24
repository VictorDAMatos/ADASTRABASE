import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserState {
  nome: string;
  descricao: string;
  fotoUrl: string;
  setNome: (nome: string) => void;
  setDescricao: (descricao: string) => void;
  setFotoUrl: (url: string) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      nome: 'Comandante Victor',
      descricao: 'Explorador de novas galáxias musicais. 🚀',
      fotoUrl: 'https://github.com/identicons/adastra.png',
      
      setNome: (nome) => set({ nome }),
      setDescricao: (descricao) => set({ descricao }),
      setFotoUrl: (fotoUrl) => set({ fotoUrl }),
    }),
    {
      name: 'user-adastra-storage', // Chave única para salvar no LocalStorage
    }
  )
);