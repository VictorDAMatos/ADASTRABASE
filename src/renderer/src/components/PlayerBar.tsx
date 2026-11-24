import { useState, useRef, useEffect, useMemo } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Shuffle, Repeat, Star, X, ScrollText, ListPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { usePlayerStore } from '../store/playerStore';
import { useFavoritesStore } from '../store/favoritesStore';
import { useArtistStore } from '../store/artistaStore';
import { useMusicStore } from '../store/musicStore';
import { usePlaylistStore } from '../store/playlistStore';

const PlayerStars = () => {
  const stars = useMemo(() => Array.from({ length: 40 }).map((_, i) => ({
    id: i, x: Math.random() * 100, y: Math.random() * 100, size: Math.random() * 3 + 1, duration: Math.random() * 2 + 1, delay: Math.random() * 2
  })), []);
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
      {stars.map(s => (
        <motion.div key={s.id} animate={{ opacity: [0.1, 0.8, 0.1], scale: [0.8, 1.2, 0.8] }} transition={{ duration: s.duration, repeat: Infinity, ease: "easeInOut", delay: s.delay }}
          style={{ position: 'absolute', left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size, backgroundColor: '#FFF', borderRadius: '50%', boxShadow: '0 0 8px rgba(255,255,255,0.8)' }}
        />
      ))}
    </div>
  );
};

export function PlayerBar() {
  const faixaAtual = usePlayerStore((state: any) => state.faixaAtual);
  const isPlaying = usePlayerStore((state: any) => state.isPlaying);
  const setIsPlaying = usePlayerStore((state: any) => state.setIsPlaying);
  const volume = usePlayerStore((state: any) => state.volume);
  const setVolume = usePlayerStore((state: any) => state.setVolume);
  const showLyrics = usePlayerStore((state: any) => state.showLyrics);
  const setShowLyrics = usePlayerStore((state: any) => state.setShowLyrics);
  const setFaixaAtual = usePlayerStore((state: any) => state.setFaixaAtual);

  const biblioteca = useMusicStore((state: any) => state.biblioteca) || [];
  const favoritos = useFavoritesStore((state: any) => state.favoritos) || [];
  const toggleFavorito = useFavoritesStore((state: any) => state.toggleFavorito);
  const registrarReproducao = useArtistStore((state: any) => state.registrarReproducao);

  const playlists = usePlaylistStore((state: any) => state.playlists) || [];
  const addFaixa = usePlaylistStore((state: any) => state.addFaixa);

  const [tempo, setTempo] = useState({ atual: 0, total: 0 });
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState(0); 
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  
  // Controle de Letras
  const [autoScroll, setAutoScroll] = useState(true);
  const scrollTimeoutRef = useRef<any>(null);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isFavorito = faixaAtual ? favoritos.some((f: any) => f.id === faixaAtual.id) : false;

  const formatarTempo = (segundos: number) => {
    if (!segundos || isNaN(segundos)) return "0:00";
    const min = Math.floor(segundos / 60);
    const seg = Math.floor(segundos % 60);
    return `${min}:${seg < 10 ? '0' : ''}${seg}`;
  };

  const aoMudarTempo = () => {
    if (audioRef.current) {
      setTempo({ atual: audioRef.current.currentTime, total: audioRef.current.duration || 0 });
    }
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
      if (isPlaying) {
        audioRef.current.play().catch(() => setIsPlaying(false));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, faixaAtual, volume, isMuted]);

  const togglePlayPause = () => { if (faixaAtual) setIsPlaying(!isPlaying); };

  const playNext = () => {
    if (!faixaAtual || !biblioteca || biblioteca.length === 0) return;
    if (isShuffle) {
      const idx = Math.floor(Math.random() * biblioteca.length);
      setFaixaAtual(biblioteca[idx]);
    } else {
      const idxAtual = biblioteca.findIndex((f: any) => f.id === faixaAtual.id);
      const proxIdx = idxAtual !== -1 && idxAtual < biblioteca.length - 1 ? idxAtual + 1 : 0;
      setFaixaAtual(biblioteca[proxIdx]);
    }
    setIsPlaying(true);
  };

  const playPrev = () => {
    if (!faixaAtual || !biblioteca || biblioteca.length === 0) return;
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      return;
    }
    const idxAtual = biblioteca.findIndex((f: any) => f.id === faixaAtual.id);
    const antIdx = idxAtual > 0 ? idxAtual - 1 : biblioteca.length - 1;
    setFaixaAtual(biblioteca[antIdx]);
    setIsPlaying(true);
  };

  const onSongEnd = () => {
    if (faixaAtual) {
      const [min, seg] = (faixaAtual.duracao || "0:00").split(':').map(Number);
      registrarReproducao(faixaAtual.artista, faixaAtual.titulo, faixaAtual.album || 'Single', (min * 60 + (seg || 0)) * 1000);
    }
    if (repeatMode === 2) {
      if (audioRef.current) { audioRef.current.currentTime = 0; audioRef.current.play(); }
    } else if (repeatMode === 1) {
      playNext();
    } else {
      const idxAtual = biblioteca.findIndex((f: any) => f.id === faixaAtual.id);
      if (idxAtual === biblioteca.length - 1) setIsPlaying(false);
      else playNext();
    }
  };

  const parsedLyrics = useMemo(() => {
    const letraStr = faixaAtual?.letra || "";
    if (!letraStr) return { isSynced: false, lines: [{ time: -1, text: "Letra não detectada." }] };
    const lines = letraStr.split('\n');
    const parsed: {time: number, text: string}[] = [];
    const timeRegex = /\[(\d{2,}):(\d{2}(?:\.\d{1,3})?)\]/g;
    let hasSync = false;
    for (const line of lines) {
      const matches = [...line.matchAll(timeRegex)];
      if (matches.length > 0) {
        hasSync = true;
        const text = line.replace(timeRegex, '').trim();
        matches.forEach(match => {
          const min = parseInt(match[1], 10);
          const sec = parseFloat(match[2]);
          parsed.push({ time: min * 60 + sec, text });
        });
      } else if (line.trim() !== '') {
        parsed.push({ time: -1, text: line.trim() });
      }
    }
    if (hasSync) parsed.sort((a, b) => a.time - b.time);
    return { isSynced: hasSync, lines: parsed };
  }, [faixaAtual?.letra]);

  let linhaAtiva = -1;
  if (parsedLyrics.isSynced) {
    for (let i = 0; i < parsedLyrics.lines.length; i++) {
      if (tempo.atual + 0.3 >= parsedLyrics.lines[i].time) linhaAtiva = i; else break;
    }
  }

  // Interrompe o foco automático quando o utilizador rola manualmente
  const handleLyricsScroll = () => {
    setAutoScroll(false);
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      setAutoScroll(true);
    }, 3000);
  };

  useEffect(() => {
    if (showLyrics && scrollRef.current && linhaAtiva !== -1 && autoScroll) {
      const el = scrollRef.current.children[linhaAtiva] as HTMLElement;
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [linhaAtiva, showLyrics, autoScroll]);

  // Clicar para pular o áudio
  const clicarNaLetra = (index: number) => {
    if (!audioRef.current || tempo.total === 0) return;
    if (parsedLyrics.isSynced && parsedLyrics.lines[index].time >= 0) {
      const timeToJump = parsedLyrics.lines[index].time;
      audioRef.current.currentTime = timeToJump;
      setTempo(prev => ({ ...prev, atual: timeToJump }));
      if (!isPlaying) setIsPlaying(true); 
      setAutoScroll(true);
    }
  };

  const progressoPercentual = tempo.total > 0 ? (tempo.atual / tempo.total) * 100 : 0;

  return (
    <>
      <style>{`
        /* SEU VISUAL ORIGINAL INTACTO */
        .ad-player-wrapper {
          position: fixed !important; 
          bottom: 0px !important; 
          left: 0px !important; 
          width: 100vw !important; 
          height: 130px !important;
          background-color: #050505 !important; 
          z-index: 10000 !important; 
          box-sizing: border-box !important;
          display: flex !important; 
          align-items: center !important; 
          padding: 0 40px !important;
          margin: 0 !important; 
          border: none !important; 
          box-shadow: none !important; 
          outline: none !important;
        }

        .led-border-top {
          position: absolute; top: 0; left: 0; right: 0; height: 1.5px;
          background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.9) 50%, transparent 100%);
          pointer-events: none; z-index: 10;
        }

        .playing .led-border-top {
          box-shadow: 0 0 15px rgba(255,255,255,0.6);
          animation: pulseLedBar 1.5s infinite alternate ease-in-out;
        }

        @keyframes pulseLedBar {
          0% { opacity: 0.7; }
          100% { opacity: 1; filter: drop-shadow(0 0 8px #FFF); }
        }

        .player-saturn {
          position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
          width: 300px; height: 90px; pointer-events: none; z-index: 1; opacity: 0.15;
          display: flex; justify-content: center; align-items: center;
        }
        .p-sat-planet { width: 60px; height: 60px; background: #000; border-radius: 50%; position: absolute; box-shadow: inset -5px -5px 15px rgba(255,255,255,0.6); }
        .p-sat-rings { width: 180px; height: 50px; position: absolute; border-radius: 50%; border: 3px solid rgba(255,255,255,0.5); border-top: 3px solid transparent; border-bottom: 6px solid rgba(255,255,255,0.8); transform: rotateX(75deg) rotateZ(15deg); }

        .ad-btn { background: none; border: none; cursor: pointer; color: #888; display: flex; align-items: center; justify-content: center; padding: 10px; transition: 0.2s; pointer-events: auto; position: relative; z-index: 50; }
        .ad-btn:hover { color: #FFF; transform: scale(1.1); text-shadow: 0 0 10px #FFF; }
        .ad-btn:active { transform: scale(0.9); }
        
        .ad-btn-small { background: none; border: none; cursor: pointer; color: #888; display: flex; align-items: center; justify-content: center; padding: 5px; transition: 0.2s; pointer-events: auto; z-index: 50; }
        .ad-btn-small:hover { color: #FFF; transform: scale(1.1); }

        .ad-play-btn { width: 50px; height: 50px; border-radius: 50%; background: #FFF; border: none; display: flex; justify-content: center; align-items: center; cursor: pointer; transition: 0.2s; pointer-events: auto; z-index: 50; box-shadow: 0 0 15px rgba(255,255,255,0.2); }
        .ad-play-btn:hover { transform: scale(1.05); box-shadow: 0 0 25px rgba(255,255,255,0.6); }

        .link-hover { color: #888; font-size: 11px; font-weight: bold; text-decoration: none; transition: 0.2s; pointer-events: auto; position: relative; z-index: 50; }
        .link-hover:hover { color: #FFF; text-decoration: underline; text-shadow: 0 0 8px rgba(255,255,255,0.5); }

        .slider-container { position: relative; flex: 1; height: 20px; display: flex; align-items: center; cursor: pointer; pointer-events: auto; z-index: 50; }
        .slider-track { width: 100%; height: 6px; background-color: rgba(255,255,255,0.1); border-radius: 3px; position: relative; pointer-events: none; overflow: hidden; }
        .slider-fill { height: 100%; background-color: #FFF; border-radius: 3px; pointer-events: none; box-shadow: 0 0 10px rgba(255,255,255,0.8); }
        .slider-input { position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; -webkit-appearance: none; z-index: 60; }
      `}</style>

      {/* TELA DE LETRAS (COM POINTER-EVENTS 'ALL' PARA SER INTERAGÍVEL) */}
      <AnimatePresence>
        {showLyrics && faixaAtual && (
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25 }} 
            style={{ position: 'fixed', inset: 0, paddingBottom: '130px', backgroundColor: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(20px)', zIndex: 99999, pointerEvents: 'all', display: 'flex', flexDirection: 'column', padding: '50px 10%' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '30px', marginBottom: '30px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '30px' }}>
              <img src={faixaAtual.capa} style={{ width: '100px', height: '100px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.2)' }} alt="capa" />
              <div>
                <h2 style={{ fontSize: '36px', fontWeight: '900', margin: '0 0 5px 0', color: 'white', textTransform: 'uppercase', textShadow: '0 0 20px rgba(255,255,255,0.3)' }}>{faixaAtual.titulo}</h2>
                <h3 style={{ fontSize: '18px', color: '#888', margin: 0, letterSpacing: '2px' }}>{faixaAtual.artista}</h3>
              </div>
              <button onClick={() => setShowLyrics(false)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#FFF', cursor: 'pointer', textShadow: '0 0 10px #FFF', pointerEvents: 'all' }}><X size={40} /></button>
            </div>
            
            <div 
              style={{ flex: 1, overflowY: 'auto', paddingRight: '20px', pointerEvents: 'all' }} 
              ref={scrollRef}
              onWheel={handleLyricsScroll}
              onTouchMove={handleLyricsScroll}
            >
              {parsedLyrics.lines.map((linhaObj, i) => {
                const isAtiva = linhaAtiva === i;
                const isVazia = linhaObj.text === '';
                return (
                  <p key={i} onClick={() => clicarNaLetra(i)} 
                     style={{ 
                       fontSize: isAtiva ? '38px' : '32px', 
                       fontWeight: '900', 
                       margin: '25px 0', 
                       opacity: isVazia ? 0 : (isAtiva ? 1 : 0.3), 
                       color: isAtiva ? '#FFF' : '#888', 
                       cursor: 'pointer', 
                       transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)', 
                       textShadow: isAtiva ? '0 0 20px rgba(255,255,255,0.5)' : 'none',
                       pointerEvents: 'all'
                     }}>
                    {linhaObj.text || " "}
                  </p>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isPlaylistModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', zIndex: 99999, display: 'flex', justifyContent: 'center', alignItems: 'center', pointerEvents: 'all' }}
            onClick={() => setIsPlaylistModalOpen(false)}
          >
            <div onClick={(e) => e.stopPropagation()} style={{ width: '400px', background: 'linear-gradient(180deg, #111 0%, #050505 100%)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', padding: '25px', pointerEvents: 'all', position: 'relative', boxShadow: '0 20px 50px rgba(0,0,0,0.9)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ color: 'white', fontSize: '18px', margin: 0, fontWeight: '900' }}>ADICIONAR À PLAYLIST</h2>
                <button onClick={() => setIsPlaylistModalOpen(false)} style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer' }}><X size={24} /></button>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto' }}>
                {playlists.length === 0 ? (
                  <p style={{ color: '#888', textAlign: 'center', fontSize: '14px' }}>Nenhuma playlist encontrada.</p>
                ) : (
                  playlists.map((pl: any) => (
                    <button key={pl.id} 
                      onClick={() => {
                        try { if (addFaixa && faixaAtual) addFaixa(pl.id, faixaAtual); } 
                        catch(err) { console.error(err); }
                        finally { setIsPlaylistModalOpen(false); }
                      }}
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', padding: '10px 15px', borderRadius: '12px', color: '#FFF', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '15px', transition: '0.2s', pointerEvents: 'all' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                    >
                      <img src={pl.capa || 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=100'} style={{ width: '45px', height: '45px', borderRadius: '8px', objectFit: 'cover' }} alt="Capa" />
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                         <span style={{ fontWeight: 'bold', fontSize: '15px' }}>{pl.nome}</span>
                         <span style={{ color: '#888', fontSize: '11px', marginTop: '2px' }}>{pl.faixas?.length || 0} músicas</span>
                      </div>
                      <ListPlus size={20} color="#FFF" />
                    </button>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`ad-player-wrapper ${isPlaying ? 'playing' : 'paused'}`}>
        
        <div className="led-border-top"></div>
        <PlayerStars />

        <div className="player-saturn">
          <div className="p-sat-rings"></div>
          <div className="p-sat-planet"></div>
        </div>

        <audio ref={audioRef} src={faixaAtual?.url} onTimeUpdate={aoMudarTempo} onLoadedMetadata={aoMudarTempo} onEnded={onSongEnd} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} />
        
        {/* LADO ESQUERDO */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', position: 'relative', zIndex: 50 }}>
          <img src={faixaAtual?.capa || 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=100'} style={{ width: '60px', height: '60px', borderRadius: '8px', marginRight: '15px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 0 15px rgba(0,0,0,0.5)' }} alt="Capa" />
          
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ color: '#FFF', fontWeight: '900', fontSize: '15px', marginBottom: '4px', letterSpacing: '0.5px' }}>{faixaAtual?.titulo || 'SISTEMA OCIOSO'}</span>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <Link to={`/artista/${encodeURIComponent(faixaAtual?.artista || '')}`} className="link-hover">{faixaAtual?.artista || 'Comandante'}</Link>
              {faixaAtual?.album && (
                <><span style={{ color: '#555', fontSize: '10px' }}>•</span><Link to={`/album/${encodeURIComponent(faixaAtual.artista)}/${encodeURIComponent(faixaAtual.album)}`} className="link-hover">{faixaAtual.album}</Link></>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginLeft: '20px' }}>
            <button onClick={() => faixaAtual && toggleFavorito(faixaAtual)} className="ad-btn-small" title="Favoritar">
              <Star size={18} fill={isFavorito ? "#FFF" : "none"} color={isFavorito ? "#FFF" : "currentColor"} style={{ filter: isFavorito ? 'drop-shadow(0 0 5px #FFF)' : 'none' }} />
            </button>
            <button onClick={() => { if(faixaAtual) setIsPlaylistModalOpen(true); }} className="ad-btn-small" title="Adicionar à Playlist">
              <ListPlus size={18} />
            </button>
          </div>
        </div>

        {/* CENTRO: CONTROLES */}
        <div style={{ flex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', zIndex: 50 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
            <button className="ad-btn" onClick={() => setIsShuffle(!isShuffle)}>
              <Shuffle size={20} color={isShuffle ? '#FFF' : '#888'} />
            </button>
            <button className="ad-btn" onClick={playPrev}>
              <SkipBack size={26} fill="currentColor" color="currentColor" />
            </button>
            
            <button onClick={togglePlayPause} disabled={!faixaAtual} className="ad-play-btn">
              {isPlaying ? <Pause size={24} fill="#000" color="#000" /> : <Play size={24} fill="#000" color="#000" style={{ marginLeft: '4px' }} />}
            </button>
            
            <button className="ad-btn" onClick={playNext}>
              <SkipForward size={26} fill="currentColor" color="currentColor" />
            </button>
            <button className="ad-btn" onClick={() => setRepeatMode((prev) => (prev + 1) % 3)} style={{ position: 'relative' }}>
              <Repeat size={20} color={repeatMode > 0 ? '#FFF' : '#888'} />
              {repeatMode === 2 && <span style={{ position: 'absolute', top: '0px', right: '0px', fontSize: '9px', fontWeight: 'bold', color: '#000', background: '#FFF', borderRadius: '50%', width: '12px', height: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>1</span>}
            </button>
          </div>

          <div style={{ width: '100%', maxWidth: '600px', display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span style={{ fontSize: '11px', color: '#888', width: '40px', textAlign: 'right', fontWeight: 'bold', fontFamily: 'monospace' }}>{formatarTempo(tempo.atual)}</span>
            <div className="slider-container">
              <div className="slider-track">
                <div className="slider-fill" style={{ width: `${progressoPercentual}%` }}></div>
              </div>
              <input type="range" min={0} max={tempo.total || 100} step="any" value={tempo.atual} 
                onChange={(e) => {
                  if(audioRef.current) {
                    const v = Number(e.target.value);
                    audioRef.current.currentTime = v;
                    setTempo({...tempo, atual: v});
                  }
                }} 
                className="slider-input" disabled={!faixaAtual}
              />
            </div>
            <span style={{ fontSize: '11px', color: '#888', width: '40px', textAlign: 'left', fontWeight: 'bold', fontFamily: 'monospace' }}>{formatarTempo(tempo.total)}</span>
          </div>
        </div>

        {/* DIREITA: LETRAS E VOLUME */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '15px', zIndex: 50 }}>
          
          <button onClick={() => setShowLyrics(!showLyrics)} className="ad-btn" title="Letras" disabled={!faixaAtual}>
             <ScrollText size={22} color={showLyrics ? '#FFF' : '#888'} style={{ filter: showLyrics ? 'drop-shadow(0 0 5px #FFF)' : 'none' }} />
          </button>

          <button onClick={() => setIsMuted(!isMuted)} className="ad-btn" title="Volume">
            {isMuted || volume === 0 ? <VolumeX size={22} /> : <Volume2 size={22} />}
          </button>
          
          <div className="slider-container" style={{ maxWidth: '100px' }}>
            <div className="slider-track">
               <div className="slider-fill" style={{ width: `${isMuted ? 0 : volume * 100}%` }}></div>
            </div>
            <input type="range" min={0} max={1} step="any" value={isMuted ? 0 : volume} onChange={(e) => { setVolume(Number(e.target.value)); setIsMuted(false); }} className="slider-input" />
          </div>
        </div>
      </div>
    </>
  );
} 