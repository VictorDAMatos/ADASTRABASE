import { useState, useMemo } from 'react';
import { Play, Trash2, Plus, Shuffle, Clock, RefreshCw, Music } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMusicStore, Faixa } from '../store/musicStore'; 
import { usePlayerStore } from '../store/playerStore';

declare global {
  interface Window { [key: string]: any; }
}

const EstrelasBackground = () => {
  const estrelas = useMemo(() => {
    return Array.from({ length: 50 }).map((_, i) => ({
      id: i, size: Math.random() * 3 + 1, x: Math.random() * 100, y: Math.random() * 100,
      duration: Math.random() * 3 + 2, delay: Math.random() * 2
    }));
  }, []);

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', zIndex: 1 }}>
      {estrelas.map((estrela) => (
        <motion.div key={estrela.id} animate={{ opacity: [0.1, 0.8, 0.1] }}
          transition={{ duration: estrela.duration, repeat: Infinity, delay: estrela.delay, ease: "easeInOut" }}
          style={{
            position: 'absolute', left: `${estrela.x}%`, top: `${estrela.y}%`, width: `${estrela.size}px`, height: `${estrela.size}px`,
            backgroundColor: '#FFF', borderRadius: '50%', boxShadow: '0 0 10px rgba(255, 255, 255, 0.5)'
          }}
        />
      ))}
    </div>
  );
};

export function Library() {
  const { biblioteca, addMusica, removerMusica, registrarOuvida, updateFaixa } = useMusicStore() as any;
  const { setFaixaAtual, setIsPlaying, faixaAtual } = usePlayerStore() as any;

  const [sortKey, setSortKey] = useState<any>(null);
  const [sortOrder, setSortOrder] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSort = (key: any) => {
    if (sortKey !== key) { setSortKey(key); setSortOrder('asc'); } 
    else {
      if (sortOrder === 'asc') setSortOrder('desc');
      else { setSortKey(null); setSortOrder(null); }
    }
  };

  const listaOrdenada = useMemo(() => {
    if (!sortKey || !sortOrder) return biblioteca;
    return [...biblioteca].sort((a: any, b: any) => {
      const fieldA = String(a[sortKey as keyof Faixa] || '').toLowerCase();
      const fieldB = String(b[sortKey as keyof Faixa] || '').toLowerCase();
      if (sortOrder === 'asc') return fieldA > fieldB ? 1 : -1;
      return fieldA < fieldB ? 1 : -1;
    });
  }, [biblioteca, sortKey, sortOrder]);

  const importarMusica = async () => {
    try {
      // @ts-ignore
      const filePaths = await window.electron.ipcRenderer.invoke('dialog:openFile');
      if (!filePaths || filePaths.length === 0) return;

      for (const caminho of filePaths) {
        const nomeArquivo = caminho.split('\\').pop()?.split('/').pop() || 'Desconhecido';
        const nomeSemExtensao = nomeArquivo.replace(/\.[^/.]+$/, "");
        
        let artistaParsed = "Artista Desconhecido";
        let tituloParsed = nomeSemExtensao;
        if (nomeSemExtensao.includes(' - ')) {
          const partes = nomeSemExtensao.split(' - ');
          artistaParsed = partes[0].trim();
          tituloParsed = partes.slice(1).join(' - ').trim();
        }

        const caminhoTratado = caminho.replace(/\\/g, '/');
        const urlFinal = `file:///${encodeURI(caminhoTratado)}`;

        const duracaoReal = await new Promise<string>((resolve) => {
          const audioTemp = document.createElement('audio');
          audioTemp.src = urlFinal;
          audioTemp.preload = 'metadata';
          
          audioTemp.onloadedmetadata = () => {
            if (!audioTemp.duration || !isFinite(audioTemp.duration)) { resolve("0:00"); return; }
            const min = Math.floor(audioTemp.duration / 60);
            const seg = Math.floor(audioTemp.duration % 60);
            resolve(`${min}:${seg < 10 ? '0' : ''}${seg}`);
          };
          audioTemp.onerror = () => resolve("0:00");
        });
        
        const novaFaixa = {
          id: Math.random().toString(36).substr(2, 9),
          titulo: tituloParsed,
          artista: artistaParsed,
          album: "Desconhecido",
          capa: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=400",
          url: urlFinal, 
          duracao: duracaoReal, 
          adicionadoEm: Date.now(),
        };
        addMusica(novaFaixa);
      }
    } catch (error) { console.error("Erro ao importar:", error); }
  };

  // ==========================================
  // MOTOR DE BUSCA DE METADADOS: DEEZER API
  // ==========================================
  const buscarMetadadosDeezer = (faixa: Faixa): Promise<any> => {
    return new Promise((resolve) => {
      let tituloLimpo = faixa.titulo.replace(/\.(mp3|wav|flac|m4a|ogg)$/i, '');
      tituloLimpo = tituloLimpo.replace(/\[.*?\]|\(.*?\)/g, ' ').trim(); 
      tituloLimpo = tituloLimpo.replace(/official|video|audio|lyric|lyrics|amv|hd|hq/ig, ' ').trim();

      const query = faixa.artista !== 'Desconhecido' && faixa.artista !== 'Artista Desconhecido' ? `${tituloLimpo} ${faixa.artista}` : tituloLimpo;
      
      const callbackName = 'deezerCb_' + Math.floor(Math.random() * 1000000);
      const script = document.createElement('script');
      script.src = `https://api.deezer.com/search?q=${encodeURIComponent(query)}&output=jsonp&callback=${callbackName}`;
      
      window[callbackName] = (data: any) => {
        delete window[callbackName];
        document.body.removeChild(script);
        if (data && data.data && data.data.length > 0) {
          const originais = data.data.filter((t: any) => 
            !t.title.toLowerCase().includes('cover') && 
            !t.title.toLowerCase().includes('karaoke') &&
            !t.artist.name.toLowerCase().includes('cover')
          );
          const match = originais.length > 0 ? originais[0] : data.data[0];
          
          resolve({
            titulo: match.title,
            artista: match.artist.name,
            album: match.album.title,
            capa: match.album.cover_xl || match.album.cover_big || match.album.cover
          });
        } else {
          resolve(null);
        }
      };
      
      script.onerror = () => {
        delete window[callbackName];
        document.body.removeChild(script);
        resolve(null);
      };
      
      document.body.appendChild(script);
    });
  };

  const sincronizarBiblioteca = async () => {
    setIsSyncing(true);
    for (const faixa of biblioteca) {
      try {
        let novaLetra = faixa.letra || "";
        let novosDadosDeezer = await buscarMetadadosDeezer(faixa);
        
        try {
          const resLrc = await fetch(`https://lrclib.net/api/search?track_name=${encodeURIComponent(novosDadosDeezer ? novosDadosDeezer.titulo : faixa.titulo)}&artist_name=${encodeURIComponent(novosDadosDeezer ? novosDadosDeezer.artista : faixa.artista)}`);
          const dataLrc = await resLrc.json();
          if (dataLrc && dataLrc.length > 0) {
            novaLetra = dataLrc[0].syncedLyrics || dataLrc[0].plainLyrics || novaLetra;
          }
        } catch (e) { console.log("Erro ao buscar letra"); }

        if (novosDadosDeezer) {
          const updates = { ...novosDadosDeezer, letra: novaLetra };
          updateFaixa(faixa.id, updates);
          if (faixaAtual?.id === faixa.id) setFaixaAtual({ ...faixa, ...updates });
        } else if (novaLetra !== faixa.letra) {
          updateFaixa(faixa.id, { letra: novaLetra });
          if (faixaAtual?.id === faixa.id) setFaixaAtual({ ...faixa, letra: novaLetra });
        }
        
      } catch (error) { console.error(error); }
    }
    setIsSyncing(false);
  };

  const playFaixa = (faixa: Faixa) => {
    setFaixaAtual(faixa);
    setIsPlaying(true);
    if (registrarOuvida) registrarOuvida(faixa);
  };

  return (
    <div style={styles.container}>
      <div style={styles.pageBackground}>
        {/* BLOBS MONOCROMÁTICOS (CINZA/BRANCO) */}
        <motion.div animate={{ x: [0, 50, 0], y: [0, 30, 0] }} transition={{ duration: 15, repeat: Infinity, ease: 'linear' }} style={styles.animatedBlob1} />
        <motion.div animate={{ x: [0, -40, 0], y: [0, -50, 0] }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }} style={styles.animatedBlob2} />
        <EstrelasBackground />
      </div>

      <header style={styles.headerArea}>
        <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={styles.pageTitle}>Minha Biblioteca</motion.h1>

        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={styles.mainControls}>
          <motion.button whileHover={{ scale: 1.1, color: '#FFF' }} style={styles.iconBtn} title="Aleatório"><Shuffle size={24} /></motion.button>

          <div style={styles.playWrapper}>
            <motion.button 
              whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(255, 255, 255, 0.5)' }} whileTap={{ scale: 0.95 }} style={styles.bigPlayButton}
              onClick={() => { if (listaOrdenada.length > 0) playFaixa(listaOrdenada[0]); }}
            >
              <Play fill="black" size={34} color="black" style={{ marginLeft: '4px' }} />
            </motion.button>
            <span style={styles.tocarTudoText}>TOCAR TUDO</span>
            
            <motion.button 
              whileHover={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
              onClick={sincronizarBiblioteca} style={styles.adSyncBtn}
            >
              {isSyncing ? <RefreshCw size={14} style={{ animation: 'spin 2s linear infinite' }} /> : "AD"}
            </motion.button>
          </div>

          <motion.button whileHover={{ scale: 1.1, color: '#FFF' }} style={styles.iconBtn} onClick={importarMusica} title="Adicionar Músicas"><Plus size={28} /></motion.button>
        </motion.div>
      </header>

      <div style={styles.contentArea}>
        <div style={styles.listHeader}>
          <div style={{ ...styles.headerCol, flex: 2 }} onClick={() => handleSort('titulo')}>
            <span># TÍTULO</span>{sortKey === 'titulo' && <span style={styles.sortIndicator}>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
          </div>
          <div style={{ ...styles.headerCol, flex: 1.5 }} onClick={() => handleSort('artista')}>
            <span>ARTISTA</span>{sortKey === 'artista' && <span style={styles.sortIndicator}>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
          </div>
          <div style={{ ...styles.headerCol, flex: 0.5, justifyContent: 'flex-end', paddingRight: '20px' }} onClick={() => handleSort('duracao')}>
            <Clock size={14} />{sortKey === 'duracao' && <span style={styles.sortIndicator}>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
          </div>
        </div>

        <motion.div layout style={styles.trackList}>
          <AnimatePresence mode="popLayout">
            {listaOrdenada.map((faixa: any, index: number) => {
              const isActive = faixaAtual?.id === faixa.id;
              return (
                <motion.div 
                  key={faixa.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                  whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                  style={{
                    ...styles.trackItem, backgroundColor: isActive ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                    borderLeft: isActive ? '3px solid #FFF' : '3px solid transparent',
                  }}
                  onClick={() => playFaixa(faixa)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flex: 2 }}>
                    <div style={styles.playIconWrapper} onClick={() => playFaixa(faixa)}>
                      <Play size={16} fill={isActive ? "#FFF" : "white"} color={isActive ? "#FFF" : "white"} />
                    </div>
                    <span style={{ color: isActive ? '#FFF' : '#888', width: '20px', fontWeight: 'bold', fontSize: '14px', textAlign: 'center' }}>{index + 1}</span>
                    <img src={faixa.capa} style={styles.trackThumb} alt={faixa.titulo} />
                    <span style={{...styles.trackTitle, color: isActive ? '#FFF' : 'white'}}>{faixa.titulo}</span>
                  </div>
                  <div style={{ flex: 1.5, color: '#aaa', fontSize: '14px', fontWeight: '500' }}>{faixa.artista}</div>
                  <div style={styles.rightActions}>
                    <span style={{ fontSize: '14px', fontFamily: 'monospace', color: '#888' }}>{faixa.duracao}</span>
                    <motion.button whileHover={{ color: '#FFF', scale: 1.1 }} style={styles.removeBtn} onClick={(e) => { e.stopPropagation(); removerMusica(faixa.id); }}><Trash2 size={18} /></motion.button>
                  </div>
                </motion.div>
              );
            })}
            {listaOrdenada.length === 0 && (
              <div style={{ padding: '60px 0', textAlign: 'center', color: '#555' }}>
                <Music size={48} style={{ margin: '0 auto 15px auto', opacity: 0.5 }} />
                <p>O vácuo espacial. Importe músicas para iniciar a viagem.</p>
              </div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
      <style>{`
        .spin-anim { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

const styles = {
  container: { position: 'relative' as const, width: '100%', minHeight: '100vh', color: 'white', paddingBottom: '140px' },
  pageBackground: { position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#000', overflow: 'hidden', zIndex: 0 },
  animatedBlob1: { position: 'absolute' as const, top: '-20%', left: '-10%', width: '50vw', height: '50vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255, 255, 255, 0.05) 0%, transparent 60%)', filter: 'blur(60px)', zIndex: 0 },
  animatedBlob2: { position: 'absolute' as const, bottom: '-20%', right: '-10%', width: '60vw', height: '60vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(200, 200, 200, 0.05) 0%, transparent 60%)', filter: 'blur(80px)', zIndex: 0 },
  headerArea: { position: 'relative' as const, zIndex: 2, padding: '60px 20px 20px 20px', display: 'flex', flexDirection: 'column' as const, alignItems: 'center' },
  pageTitle: { fontSize: '48px', fontWeight: '900', marginBottom: '40px', letterSpacing: '-1px', background: 'linear-gradient(to right, #fff, #888)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  mainControls: { display: 'flex', alignItems: 'center', gap: '50px', marginBottom: '20px' },
  iconBtn: { background: 'none', border: 'none', color: '#888', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  playWrapper: { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '12px' },
  bigPlayButton: { width: '75px', height: '75px', borderRadius: '50%', backgroundColor: '#FFF', border: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' },
  tocarTudoText: { color: '#888', fontSize: '10px', fontWeight: 'bold', letterSpacing: '2px' },
  adSyncBtn: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.2)', color: '#FFF', padding: '6px 16px', borderRadius: '20px', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '6px' },
  contentArea: { position: 'relative' as const, zIndex: 2, padding: '0 50px', maxWidth: '1200px', margin: '0 auto' },
  listHeader: { display: 'flex', padding: '15px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#888', fontSize: '12px', fontWeight: '700', letterSpacing: '1px', marginBottom: '10px' },
  headerCol: { cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'color 0.2s' } as any,
  sortIndicator: { color: '#FFF' },
  trackList: { display: 'flex', flexDirection: 'column' as const, gap: '4px' },
  trackItem: { display: 'flex', alignItems: 'center', padding: '10px 20px', borderRadius: '12px', transition: 'background-color 0.2s', cursor: 'pointer' },
  playIconWrapper: { width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' },
  trackThumb: { width: '44px', height: '44px', borderRadius: '6px', objectFit: 'cover' as const, boxShadow: '0 4px 10px rgba(0,0,0,0.5)' },
  trackTitle: { fontWeight: '700' as const, fontSize: '15px', letterSpacing: '0.3px' },
  rightActions: { flex: 0.5, display: 'flex', alignItems: 'center', gap: '30px', justifyContent: 'flex-end' },
  removeBtn: { background: 'none', border: 'none', color: '#555', cursor: 'pointer', display: 'flex', alignItems: 'center' }
};