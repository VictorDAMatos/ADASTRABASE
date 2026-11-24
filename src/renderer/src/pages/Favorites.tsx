import { useState } from 'react';
import { Play, Shuffle, Star, ArrowUp, ArrowDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion'; // Framer Motion para animações
import { useFavoritesStore } from '../store/favoritesStore';
import { usePlayerStore } from '../store/playerStore';

export function Favorites() {
  const { favoritos, moverFaixa } = useFavoritesStore();
  const { setFaixaAtual, setIsPlaying } = usePlayerStore();
  const [isOrdering, setIsOrdering] = useState(false);

  // Extrai os artistas únicos com base nas músicas favoritas
  const artistasUnicos = Array.from(new Set(favoritos.map(f => f.artista))).map(nomeArtista => {
    return favoritos.find(f => f.artista === nomeArtista);
  });

  const playFavoritos = () => {
    if (favoritos.length > 0) {
      setFaixaAtual(favoritos[0] as any);
      setIsPlaying(true);
    }
  };

  return (
    <div style={styles.container}>
      {/* FUNDO ANIMADO EXCLUSIVO DE FAVORITOS (Poeira Cósmica e Estrelas) */}
      <div style={styles.pageBackground}>
        <div style={styles.starsOverlay}></div>
        {/* Destaque circular sutil atrás do título */}
        <div style={styles.favoritesHighlight}></div>
      </div>

      {/* CONTEÚDO (Z-Index maior para ficar acima do fundo) */}
      <div style={{ position: 'relative', zIndex: 2 }}>
        {/* CABEÇALHO */}
        <div style={styles.header}>
          <Star size={160} fill="#0d1b2a" color="#0d1b2a" style={styles.bgStar} />
          <h1 style={styles.title}>FAVORITOS</h1>
        </div>

        {/* CONTROLES PLAY E SHUFFLE */}
        <div style={styles.controlsBar}>
          <div style={{ display: 'flex', gap: '15px' }}>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={playFavoritos} style={styles.playBtn}>
              <Play size={24} fill="black" />
            </motion.button>
            <motion.button whileHover={{ color: 'white' }} style={styles.shuffleBtn}>
              <Shuffle size={20} color="#94a3b8" />
            </motion.button>
          </div>
          
          {/* BOTÃO "ORDEM" ESTILIZADO E ANIMADO */}
          <motion.button 
            onClick={() => setIsOrdering(!isOrdering)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            // Animação de pulso luminoso quando está ativo
            animate={isOrdering ? { boxShadow: '0 0 15px rgba(0, 163, 255, 0.7)' } : { boxShadow: 'none' }}
            style={{ 
              ...styles.orderBtn, 
              // Mudança de degradê tático baseado no estado
              background: isOrdering 
                ? 'linear-gradient(135deg, #00A3FF, #0077B6)' 
                : 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))',
              borderColor: isOrdering ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)'
            }}
          >
            {isOrdering ? 'CONCLUIR ORDEM' : 'ORDEM'}
          </motion.button>
        </div>

        {/* ARTISTAS FAVORITOS */}
        {artistasUnicos.length > 0 && !isOrdering && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={styles.section}>
            <h2 style={styles.sectionTitle}>Artistas Favoritos</h2>
            <div style={styles.artistGrid}>
              {artistasUnicos.map((artista, index) => (
                <div key={index} style={styles.artistCard}>
                  <img src={artista?.capa} style={styles.artistImg} alt={artista?.artista} />
                  <span style={styles.artistName}>{artista?.artista}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* LISTA DE FAIXAS */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Faixas Favoritas</h2>
          <div style={styles.trackList}>
            <AnimatePresence mode="popLayout">
              {favoritos.map((faixa, index) => (
                <motion.div 
                  key={faixa.id} 
                  layout 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ backgroundColor: 'rgba(255,255,255,0.04)' }}
                  style={styles.trackItem}
                >
                  {isOrdering ? (
                    <div style={styles.orderControls}>
                      <span style={styles.orderNumber}>{index + 1}</span>
                      <div style={styles.arrowGroup}>
                        <button onClick={() => moverFaixa(index, index - 1)} disabled={index === 0} style={styles.arrowBtn}><ArrowUp size={16} /></button>
                        <button onClick={() => moverFaixa(index, index + 1)} disabled={index === favoritos.length - 1} style={styles.arrowBtn}><ArrowDown size={16} /></button>
                      </div>
                    </div>
                  ) : (
                    <img src={faixa.capa} style={styles.trackCapa} alt="capa" />
                  )}

                  <div style={styles.trackInfo}>
                    <span style={styles.trackTitle}>{faixa.titulo}</span>
                    <span style={styles.trackArtist}>{faixa.artista} / {faixa.album}</span>
                  </div>

                  {!isOrdering && (
                    <button onClick={() => { setFaixaAtual(faixa as any); setIsPlaying(true); }} style={styles.playTrackBtn}>
                      <Play size={18} fill="white" />
                    </button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            {favoritos.length === 0 && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ color: '#64748b', textAlign: 'center', padding: '40px' }}>
                Nenhum tesouro favoritado ainda. Marque suas faixas na PlayerBar!
              </motion.p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { position: 'relative' as const, width: '100%', minHeight: '100vh', paddingBottom: '120px' },
  
  // --- FUNDO ANIMADO EXCLUSIVO ---
  pageBackground: { position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(180deg, #1A0B2E 0%, #0d1b2a 100%)', zIndex: 0 },
  // Reutiliza a animação 'starsMove' que deve estar no index.css
  starsOverlay: { position: 'absolute' as const, top: 0, left: 0, width: '100%', height: '100%', opacity: 0.2, backgroundImage: 'radial-gradient(1.5px 1.5px at 20% 30%, #ffffff, rgba(0,0,0,0)), radial-gradient(2px 2px at 70% 60%, #ffffff, rgba(0,0,0,0))', backgroundSize: '250px 250px', animation: 'starsMove 60s linear infinite' },
  favoritesHighlight: { position: 'absolute' as const, top: '100px', left: '50%', transform: 'translateX(-50%)', width: '600px', height: '300px', background: 'radial-gradient(circle, rgba(0, 163, 255, 0.05) 0%, rgba(0,0,0,0) 70%)', filter: 'blur(50px)', zIndex: 1 },

  header: { position: 'relative' as const, zIndex: 2, height: '180px', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  bgStar: { position: 'absolute' as const, top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: 0.7, zIndex: 0 },
  title: { fontSize: '50px', fontWeight: '900', color: 'white', letterSpacing: '8px', zIndex: 1, textShadow: '0 5px 20px rgba(0,0,0,0.8)' },
  
  controlsBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '20px 0', padding: '0 20px' },
  playBtn: { width: '55px', height: '55px', borderRadius: '50%', backgroundColor: '#00A3FF', border: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', boxShadow: '0 8px 25px rgba(0, 163, 255, 0.3)' },
  shuffleBtn: { background: 'none', border: 'none', cursor: 'pointer', transition: '0.2s' },
  
  // --- BOTÃO ORDEM REESTILIZADO ---
  orderBtn: { 
    padding: '11px 24px', borderRadius: '25px', 
    border: '1px solid', color: 'white', 
    fontWeight: '800', fontSize: '12px', letterSpacing: '1px', 
    cursor: 'pointer', transition: 'background 0.3s, border-color 0.3s',
    boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
  },
  
  section: { marginTop: '30px' },
  sectionTitle: { color: '#94a3b8', fontSize: '16px', fontWeight: 'bold', textTransform: 'uppercase' as const, letterSpacing: '1px', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '10px' },
  
  artistGrid: { display: 'flex', gap: '20px', overflowX: 'auto' as const, paddingBottom: '15px' },
  artistCard: { minWidth: '130px', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '10px' },
  artistImg: { width: '130px', height: '130px', borderRadius: '50%', objectFit: 'cover' as const, border: '3px solid rgba(255,255,255,0.05)', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' },
  artistName: { color: 'white', fontWeight: 'bold', fontSize: '14px', textAlign: 'center' as const, marginTop: '5px' },

  trackList: { display: 'flex', flexDirection: 'column' as const, gap: '6px' },
  trackItem: { display: 'flex', alignItems: 'center', gap: '15px', backgroundColor: 'rgba(255,255,255,0.02)', padding: '12px 18px', borderRadius: '12px', transition: '0.2s', border: '1px solid rgba(255,255,255,0.01)' },
  trackCapa: { width: '45px', height: '45px', borderRadius: '8px', objectFit: 'cover' as const },
  trackInfo: { flex: 1, display: 'flex', flexDirection: 'column' as const },
  trackTitle: { color: 'white', fontWeight: 'bold', fontSize: '15px' },
  trackArtist: { color: '#94a3b8', fontSize: '12px', marginTop: '2px' },
  
  orderControls: { display: 'flex', alignItems: 'center', gap: '15px', width: '80px' },
  orderNumber: { color: '#00A3FF', fontWeight: 'bold', fontSize: '18px', width: '25px', textAlign: 'center' as const },
  arrowGroup: { display: 'flex', flexDirection: 'column' as const, gap: '2px' },
  arrowBtn: { background: 'rgba(255,255,255,0.06)', border: 'none', color: 'white', borderRadius: '4px', cursor: 'pointer', padding: '3px', '&:disabled': { opacity: 0.3 } } as any,
  playTrackBtn: { background: 'none', border: 'none', cursor: 'pointer', opacity: 0.5, '&:hover': { opacity: 1 } } as any
};