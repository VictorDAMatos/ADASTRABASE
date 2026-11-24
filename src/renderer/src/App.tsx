import { HashRouter, Routes, Route, Link } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { PlayerBar } from './components/PlayerBar';
import { Home } from './pages/Home';
import { Profile } from './pages/Profile';
import { Library } from './pages/Library';
import { Favorites } from './pages/Favorites'; // <--- ADICIONE ESTA LINHA AQUI!
import { Playlists } from './pages/Playlists';
import { Explore } from './pages/Explore';
import { useUserStore } from './store/userStore';
import { ArtistaPage } from './pages/ArtistaPage';
import { ArtistasGrid } from './pages/ArtistasGrid';
import { AlbumPage } from './pages/AlbumPage';



export default function App() {
  const { nome, fotoUrl } = useUserStore();

  return (
    <HashRouter>
      <div style={styles.appContainer}>
        <div style={styles.topSection}>
          <Sidebar />
          
          {/* BOTÃO DE PERFIL COM FUNDO ESTRELADO ANIMADO */}
          <Link to="/profile" style={{ textDecoration: 'none' }}>
            <div style={styles.profileTrigger}>
              <div style={styles.starsOverlay}></div> {/* Camada da animação */}
              <span style={styles.userName}>{nome}</span>
              <img src={fotoUrl} alt="Perfil" style={styles.profileImg} />
            </div>
          </Link>

          <main style={styles.mainContent}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/library" element={<Library />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/favorites" element={<Favorites />} /> {/* <--- E ADICIONE ESTA LINHA AQUI! */}
              <Route path="/playlists" element={<Playlists />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/artistas" element={<ArtistasGrid />} />
              <Route path="/artista/:nome" element={<ArtistaPage />} /> 
              <Route path="/album/:artista/:album" element={<AlbumPage />} />
            </Routes>
          </main>
        </div>
        
        <div style={styles.playerWrapper}>
          <PlayerBar />
        </div>
      </div>
    </HashRouter>
  );
}

const styles = {
  appContainer: { display: 'flex', flexDirection: 'column' as const, height: '100vh', width: '100vw', backgroundColor: 'var(--bg-primary)', overflow: 'hidden' },
  topSection: { display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' as const },
  
  // Widget de Perfil Reformulado
  profileTrigger: { 
    position: 'absolute' as const, top: '20px', right: '40px', zIndex: 50,
    display: 'flex', alignItems: 'center', gap: '15px',
    backgroundColor: '#0f172a', // Cor de fundo base
    padding: '6px 6px 6px 20px',
    borderRadius: '40px',
    border: '1px solid rgba(255,255,255,0.1)',
    cursor: 'pointer',
    overflow: 'hidden', // Para a animação não vazar
    boxShadow: '0 4px 15px rgba(0,0,0,0.5)'
  },
  // O truque da animação de estrelas no fundo do botão
  starsOverlay: {
    position: 'absolute' as const, top: 0, left: 0, right: 0, bottom: 0,
    backgroundImage: 'radial-gradient(2px 2px at 20px 30px, #ffffff, rgba(0,0,0,0)), radial-gradient(2px 2px at 40px 70px, #ffffff, rgba(0,0,0,0)), radial-gradient(2px 2px at 50px 10px, #ffffff, rgba(0,0,0,0))',
    backgroundSize: '100px 100px',
    opacity: 0.4,
    animation: 'starsMove 20s linear infinite',
    zIndex: 0
  },
  userName: { color: 'white', fontWeight: 'bold', fontSize: '15px', zIndex: 1, textShadow: '0px 2px 4px rgba(0,0,0,0.9)' },
  profileImg: { width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' as const, border: '2px solid #3b82f6', zIndex: 1 },
  
  mainContent: { flex: 1, overflowY: 'auto' as const, padding: '20px', paddingTop: '90px' },
  
  // --- CORREÇÃO DEFINITIVA AQUI ---
  playerWrapper: { 
    height: '110px', // Mantemos a altura para o scroll não "bater" na barra flutuante
    width: '100%', 
    backgroundColor: 'transparent', // TOTALMENTE INVISÍVEL
    border: 'none',               // SEM BORDAS
    boxShadow: 'none',           // SEM SOMBRAS
    pointerEvents: 'none' as const // Para garantir que cliques passem direto para a PlayerBar flutuante
  }
};