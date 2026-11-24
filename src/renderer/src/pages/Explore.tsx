import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Download, CheckCircle, Radio, XCircle } from 'lucide-react';
import { useMusicStore } from '../store/musicStore';

// ==========================================
// FUNDO GALÁCTICO: VERDE, ROXO, AZUL E PRETO
// ==========================================
const DeepSpaceBackground = () => {
  const stars = useMemo(() => Array.from({ length: 150 }).map((_, i) => ({
    id: i, x: Math.random() * 100, y: Math.random() * 100, size: Math.random() * 2 + 0.5, duration: Math.random() * 5 + 3, delay: Math.random() * 5
  })), []);

  return (
    <div style={styles.spaceBg}>
      {/* Nebulosa Azul */}
      <motion.div animate={{ rotate: [0, 360], scale: [1, 1.2, 1] }} transition={{ duration: 60, repeat: Infinity, ease: 'linear' }} style={styles.nebulaBlue} />
      {/* Nebulosa Roxa */}
      <motion.div animate={{ rotate: [360, 0], scale: [1, 1.3, 1] }} transition={{ duration: 70, repeat: Infinity, ease: 'linear' }} style={styles.nebulaPurple} />
      {/* Nebulosa Verde */}
      <motion.div animate={{ x: ['-10%', '10%', '-10%'], y: ['-10%', '10%', '-10%'] }} transition={{ duration: 40, repeat: Infinity, ease: 'linear' }} style={styles.nebulaGreen} />
      
      {stars.map((s) => (
        <motion.div key={s.id} animate={{ opacity: [0.1, 1, 0.1] }} transition={{ duration: s.duration, repeat: Infinity, delay: s.delay }}
          style={{ position: 'absolute', left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size, backgroundColor: '#FFF', borderRadius: '50%' }}
        />
      ))}
    </div>
  );
};

export function Explore() {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  // Assumindo que a sua store de músicas tem uma função "addMusica" para a biblioteca principal
  // Se tiver outro nome (ex: adicionarFaixa), ajuste aqui!
  const addMusica = useMusicStore((state: any) => state.addMusica);
  const biblioteca = useMusicStore((state: any) => state.biblioteca) || [];

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setError('');
    setResults([]);

    try {
      // Usando a API gratuita do iTunes para buscar dados reais!
     const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=50`);
      const data = await response.json();
      
      if (data.results.length === 0) {
        setError("Nenhuma frequência encontrada nesta coordenada. Tente busca manual.");
      } else {
        setResults(data.results);
      }
    } catch (err) {
      setError("Falha nos satélites de comunicação. Verifique sua conexão.");
    } finally {
      setIsSearching(false);
    }
  };

const handleDownload = async (track: any) => {
    setDownloadingId(track.trackId.toString());
    setError('');

    try {
      // Criamos a query perfeita: "Nome do Artista + Nome da Música + official audio"
      const searchQuery = `${track.artistName} ${track.trackName} official audio`;
      
      // Chamamos o backend para baixar (Pode demorar uns segundos)
      // @ts-ignore - Ignoramos o erro do TS temporariamente para o window.electron
      const localUrl = await (window as any).api.downloadTrack(searchQuery);

      const formatarDuracao = (ms: number) => {
        if (!ms) return '0:00';
        const minutos = Math.floor(ms / 60000);
        const segundos = parseInt(((ms % 60000) / 1000).toFixed(0));
        return `${minutos}:${segundos < 10 ? '0' : ''}${segundos}`;
      };

      const novaFaixa = {
        id: track.trackId.toString(),
        titulo: track.trackName,
        artista: track.artistName,
        album: track.collectionName || 'Single', // Captura o álbum direto do radar!
        capa: track.artworkUrl100.replace('100x100bb', '600x600bb'),
        url: localUrl, 
        duracao: formatarDuracao(track.trackTimeMillis), // Calcula a duração exata!
        adicionadoEm: Date.now()
      };

      if (addMusica) {
        addMusica(novaFaixa);
      }
      
    } catch (err) {
      console.error(err);
      setError("Falha na interceptação. O sinal pode estar protegido ou codificado.");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <>
      <style>{`
        .custom-scroll::-webkit-scrollbar { width: 8px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { background: rgba(16, 185, 129, 0.4); border-radius: 10px; }
        .custom-scroll::-webkit-scrollbar-thumb:hover { background: rgba(16, 185, 129, 0.8); }
        .radar-scan { animation: scan 3s linear infinite; }
        @keyframes scan { 0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); } 100% { box-shadow: 0 0 0 20px rgba(16, 185, 129, 0); } }
      `}</style>

      <div style={styles.container} className="custom-scroll">
        <DeepSpaceBackground />

        <div style={styles.content}>
          <div style={styles.header}>
            <h1 style={styles.title}>RADAR ESPACIAL</h1>
            <p style={styles.subtitle}>Escaneie o cosmos em busca de novas transmissões</p>
          </div>

          <form onSubmit={handleSearch} style={styles.searchBar}>
            <Radio size={24} color="#10B981" />
            <input 
              autoFocus
              style={styles.searchInput}
              placeholder="Digite o nome do artista, música ou coordenada..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button type="submit" disabled={isSearching} style={styles.searchBtn}>
              {isSearching ? 'RASTREANDO...' : 'EXPLORAR'}
            </button>
          </form>

          {error && (
             <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={styles.errorBox}>
               <XCircle size={20} /> {error}
             </motion.div>
          )}

          <div style={styles.grid}>
            <AnimatePresence>
              {results.map((track, index) => {
                const trackIdStr = track.trackId.toString();
                const isDownloading = downloadingId === trackIdStr;
                // Verifica se já existe na biblioteca
                const isAlreadyDownloaded = biblioteca.some((f: any) => f.id === trackIdStr);

                return (
                  <motion.div 
                    key={track.trackId} 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ delay: index * 0.05 }}
                    style={styles.card}
                  >
                    <div style={styles.imageContainer}>
                      <img src={track.artworkUrl100.replace('100x100bb', '300x300bb')} style={styles.cardImg} alt="Capa" />
                      
                      {isDownloading && (
                        <div style={styles.downloadingOverlay}>
                          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                            <Radio size={30} color="#10B981" />
                          </motion.div>
                          <span style={{ fontSize: '12px', fontWeight: 'bold', marginTop: '10px' }}>INTERCEPTANDO...</span>
                        </div>
                      )}
                    </div>
                    
                    <div style={styles.cardInfo}>
                      <h3 style={styles.cardTitle}>{track.trackName}</h3>
                      <p style={styles.cardSub}>{track.artistName}</p>
                    </div>

                    {isAlreadyDownloaded ? (
                      <button disabled style={styles.btnSuccess}>
                        <CheckCircle size={16} /> NO ARQUIVO
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleDownload(track)} 
                        disabled={isDownloading} 
                        style={isDownloading ? styles.btnDownloading : styles.btnDownload}
                      >
                        <Download size={16} /> {isDownloading ? 'BAIXANDO...' : 'BAIXAR SINAL'}
                      </button>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </>
  );
}

const styles = {
  container: { position: 'relative' as const, width: '100%', minHeight: '100vh', color: 'white', overflowY: 'auto' as const, paddingBottom: '120px' },
  spaceBg: { position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#05050A', zIndex: 0, overflow: 'hidden' },
  nebulaBlue: { position: 'absolute' as const, top: '-20%', left: '-10%', width: '70vw', height: '70vw', background: 'radial-gradient(circle, rgba(0, 163, 255, 0.15) 0%, transparent 60%)', filter: 'blur(90px)' },
  nebulaPurple: { position: 'absolute' as const, bottom: '-20%', right: '-10%', width: '80vw', height: '80vw', background: 'radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, transparent 60%)', filter: 'blur(100px)' },
  nebulaGreen: { position: 'absolute' as const, top: '30%', left: '30%', width: '50vw', height: '50vw', background: 'radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 60%)', filter: 'blur(120px)' },
  
  content: { position: 'relative' as const, zIndex: 1, padding: '50px 60px', maxWidth: '1200px', margin: '0 auto' },
  header: { textAlign: 'center' as const, marginBottom: '50px' },
  title: { fontSize: '48px', fontWeight: '900', margin: 0, letterSpacing: '3px', textShadow: '0 0 30px rgba(16, 185, 129, 0.4)', color: '#FFF' },
  subtitle: { color: '#10B981', fontSize: '16px', letterSpacing: '1px', marginTop: '10px', textTransform: 'uppercase' as const, fontWeight: 'bold' },
  
  searchBar: { display: 'flex', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', border: '1px solid rgba(16, 185, 129, 0.4)', padding: '10px 20px', borderRadius: '40px', backdropFilter: 'blur(10px)', marginBottom: '40px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' },
  searchInput: { flex: 1, background: 'transparent', border: 'none', color: '#FFF', fontSize: '18px', padding: '10px 15px', outline: 'none' },
  searchBtn: { backgroundColor: '#10B981', color: '#000', border: 'none', padding: '12px 30px', borderRadius: '30px', fontWeight: '900', cursor: 'pointer', letterSpacing: '1px', fontSize: '14px', transition: '0.2s', boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)' },
  
  errorBox: { backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', padding: '15px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center', marginBottom: '30px', fontWeight: 'bold' },

  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '30px' },
  card: { backgroundColor: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '15px', backdropFilter: 'blur(10px)', display: 'flex', flexDirection: 'column' as const, transition: '0.3s', '&:hover': { borderColor: 'rgba(16, 185, 129, 0.5)', transform: 'translateY(-5px)' } } as any,
  imageContainer: { position: 'relative' as const, width: '100%', aspectRatio: '1/1', marginBottom: '15px', borderRadius: '12px', overflow: 'hidden' },
  cardImg: { width: '100%', height: '100%', objectFit: 'cover' as const, boxShadow: '0 10px 20px rgba(0,0,0,0.5)' },
  downloadingOverlay: { position: 'absolute' as const, inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', flexDirection: 'column' as const, justifyContent: 'center', alignItems: 'center', color: '#10B981' },
  
  cardInfo: { flex: 1, marginBottom: '15px' },
  cardTitle: { margin: 0, fontSize: '16px', fontWeight: 'bold', whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis', color: '#FFF' },
  cardSub: { margin: '5px 0 0 0', fontSize: '13px', color: '#94a3b8', whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis' },
  
  btnDownload: { width: '100%', backgroundColor: 'transparent', color: '#FFF', border: '1px solid rgba(16, 185, 129, 0.5)', padding: '12px', borderRadius: '8px', fontWeight: '900', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontSize: '12px', letterSpacing: '1px', transition: '0.2s', '&:hover': { backgroundColor: 'rgba(16, 185, 129, 0.1)' } } as any,
  btnDownloading: { width: '100%', backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#10B981', border: '1px solid #10B981', padding: '12px', borderRadius: '8px', fontWeight: '900', cursor: 'wait', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontSize: '12px', letterSpacing: '1px' },
  btnSuccess: { width: '100%', backgroundColor: '#10B981', color: '#000', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: '900', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontSize: '12px', letterSpacing: '1px' }
};