import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface FaixaFavorita {
  id: string;
  titulo: string;
  artista: string;
  album: string;
  url: string;
  capa: string;
  dataAdicao: number;
}

interface FavoritesState {
  favoritos: FaixaFavorita[];
  toggleFavorito: (faixa: FaixaFavorita) => void;
  moverFaixa: (indexAtual: number, novoIndex: number) => void;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favoritos: [],
      
      toggleFavorito: (faixa) => {
        const { favoritos } = get();
        const jaExiste = favoritos.find((f) => f.id === faixa.id);
        
        if (jaExiste) {
          // Remove se já for favorito
          set({ favoritos: favoritos.filter((f) => f.id !== faixa.id) });
        } else {
          // Adiciona no final da lista com a data atual
          set({ favoritos: [...favoritos, { ...faixa, dataAdicao: Date.now() }] });
        }
      },

      moverFaixa: (indexAtual, novoIndex) => {
        const { favoritos } = get();
        if (novoIndex < 0 || novoIndex >= favoritos.length) return; // Limites

        const novaLista = [...favoritos];
        const [faixaMovida] = novaLista.splice(indexAtual, 1);
        novaLista.splice(novoIndex, 0, faixaMovida);
        
        set({ favoritos: novaLista });
      }
    }),
    { name: 'ad-astra-favorites' } // Salva no local storage do usuário
  )
);