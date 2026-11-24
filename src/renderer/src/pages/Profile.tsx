import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { Camera, ArrowLeft, PlayCircle, Star, Download, Settings, X, Award, BarChart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Cropper from 'react-easy-crop';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserStore } from '../store/userStore';
import { useMusicStore } from '../store/musicStore';
import { useFavoritesStore } from '../store/favoritesStore';
import { usePlaylistStore } from '../store/playlistStore';
import { useArtistStore } from '../store/artistaStore';

// =========================================================================
// O BURACO NEGRO 2D - MINIMALISTA (APENAS ESFERA E ESTRELAS)
// =========================================================================

const BlackHoleMinimalist2D = () => {
  const stars = useMemo(() => Array.from({ length: 250 }).map((_, i) => ({
    id: i,
    top: Math.random() * 100,
    left: Math.random() * 100,
    size: Math.random() * 2 + 0.5,
    duration: Math.random() * 3 + 2,
    delay: Math.random() * 5
  })), []);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, backgroundColor: '#020305', pointerEvents: 'none', overflow: 'hidden' }}>
      
      {/* Campo de Estrelas */}
      {stars.map(s => (
        <motion.div key={s.id}
          animate={{ opacity: [0.1, 0.8, 0.1] }}
          transition={{ duration: s.duration, repeat: Infinity, delay: s.delay, ease: 'easeInOut' }}
          style={{ position: 'absolute', top: `${s.top}vh`, left: `${s.left}vw`, width: s.size, height: s.size, backgroundColor: '#FFF', borderRadius: '50%' }}
        />
      ))}

      <style>{`
        .singularity-container {
          position: absolute;
          top: 35%;
          left: 30%;
          transform: translate(-50%, -50%);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 10;
        }

        /* O HORIZONTE DE EVENTOS (A Esfera Preta Central Pura) */
        .event-horizon {
          position: absolute;
          width: 220px; 
          height: 220px;
          background: #000; /* Preto absoluto */
          border-radius: 50%;
          z-index: 2;
          
          /* O ANEL GRUDADO (Contorno brilhante polido) */
          border: 4px solid #FFF; 
          box-shadow: 
            0 0 40px 10px rgba(255, 255, 255, 0.9),
            inset 0 0 25px 3px rgba(255, 255, 255, 0.5);
        }

        /* Halo suave apenas para espalhar a luz no fundo */
        .ambient-glow {
          position: absolute;
          width: 400px;
          height: 400px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(200,230,255,0.1) 0%, transparent 60%);
          z-index: 0;
        }
      `}</style>

      <div className="singularity-container">
        <div className="ambient-glow"></div>
        <div className="event-horizon"></div>
      </div>

      <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '40%', background: 'linear-gradient(0deg, #020305 0%, transparent 100%)', zIndex: 5 }}></div>
    </div>
  );
};

// =========================================================================
// PÁGINA DO PERFIL (INTERFACE DO UTILIZADOR)
// =========================================================================

export function Profile() {
  const navigate = useNavigate();
  
  const nome = useUserStore(state => state.nome) || "PILOTO DESCONHECIDO";
  const setNome = useUserStore(state => state.setNome);
  const descricao = useUserStore(state => state.descricao) || "Transmissão de bio ociosa...";
  const setDescricao = useUserStore(state => state.setDescricao);
  const fotoUrl = useUserStore(state => state.fotoUrl) || 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=200';
  const setFotoUrl = useUserStore(state => state.setFotoUrl);

  const biblioteca = useMusicStore(state => state.biblioteca) || [];
  const favoritos = useFavoritesStore((state: any) => state.favoritos) || [];
  const playlists = usePlaylistStore((state: any) => state.playlists) || [];
  const artistas = useArtistStore((state: any) => state.artistas) || {};

  const [isEditandoNome, setIsEditandoNome] = useState(false);
  const [isEditandoDescricao, setIsEditandoDescricao] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isBadgeModalOpen, setIsBadgeModalOpen] = useState(false);
  
  const [tempNome, setTempNome] = useState(nome);
  const [tempDescricao, setTempDescricao] = useState(descricao);

  useEffect(() => { setTempNome(nome); }, [nome]);
  useEffect(() => { setTempDescricao(descricao); }, [descricao]);

  const [imagemSelecionada, setImagemSelecionada] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stats = useMemo(() => {
    const musicasOuvidasGlobais: { titulo: string, artista: string, plays: number, capa: string }[] = [];
    Object.values(artistas).forEach((artista: any) => {
      Object.entries(artista?.faixasOuvidas || {}).forEach(([titulo, plays]) => {
        const infoBiblio = biblioteca.find((m: any) => m.titulo === titulo && m.artista === artista.nome);
        musicasOuvidasGlobais.push({ 
          titulo, artista: artista.nome, plays: Number(plays) || 0, 
          capa: infoBiblio?.capa || 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=100'
        });
      });
    });
    const topMusicas = musicasOuvidasGlobais.sort((a, b) => b.plays - a.plays).slice(0, 5);

    const topArtistasData = Object.values(artistas).map((art: any) => {
        return { nome: art.nome, playsTotais: art.reproducoesTotais || 0 };
    }).sort((a: any, b: any) => b.playsTotais - a.playsTotais).slice(0, 5);

    return { topMusicas, topArtistasData, totalBiblioteca: biblioteca.length, musicasFavoritas: favoritos.length, totalPlaylists: playlists.length };
  }, [biblioteca, favoritos, playlists, artistas]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.onload = () => setImagemSelecionada(reader.result as string);
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const onCropComplete = useCallback((_area: any, pixels: any) => { setCroppedAreaPixels(pixels); }, []);
  const salvarRecorte = async () => {
    if (imagemSelecionada && croppedAreaPixels) {
      const image = new Image();
      image.src = imagemSelecionada;
      await new Promise(res => (image.onload = res));
      const canvas = document.createElement('canvas');
      canvas.width = croppedAreaPixels.width; canvas.height = croppedAreaPixels.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(image, croppedAreaPixels.x, croppedAreaPixels.y, croppedAreaPixels.width, croppedAreaPixels.height, 0, 0, croppedAreaPixels.width, croppedAreaPixels.height);
        setFotoUrl(canvas.toDataURL('image/jpeg'));
      }
      setImagemSelecionada(null);
    }
  };

  const salvarNome = () => {
    const valorFinal = tempNome.trim() || "PILOTO DESCONHECIDO";
    setNome(valorFinal);
    setTempNome(valorFinal);
    setIsEditandoNome(false);
  };

  const salvarDescricao = () => {
    const valorFinal = tempDescricao.trim() || "Transmissão de bio ociosa...";
    setDescricao(valorFinal);
    setTempDescricao(valorFinal);
    setIsEditandoDescricao(false);
  };

  return (
    <div style={{ position: 'relative', minHeight: '100vh', backgroundColor: '#020305', paddingBottom: '120px' }}>
      
      <style>{`
        body, html { overflow-x: hidden; scrollbar-width: none; -ms-overflow-style: none; }
        ::-webkit-scrollbar { display: none !important; }
        .prof-btn { background: none; border: none; cursor: pointer; color: white; transition: 0.2s; display: flex; align-items: center; justify-content: center; }
        .prof-btn:hover { transform: scale(1.1); color: #FFF; }
      `}</style>
      
      {/* O FUNDO MINIMALISTA */}
      <BlackHoleMinimalist2D />

      {/* MODAIS (CROP, SETTINGS, BADGE) */}
      <AnimatePresence>
        {imagemSelecionada && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.95)', zIndex: 3000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ width: '450px', background: '#050505', borderRadius: '16px', padding: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ position: 'relative', width: '100%', height: '400px', marginBottom: '20px' }}>
                <Cropper image={imagemSelecionada} crop={crop} zoom={zoom} aspect={1} cropShape="round" showGrid={false} onCropChange={setCrop} onCropComplete={onCropComplete} onZoomChange={setZoom} />
              </div>
              <div style={{ display: 'flex', gap: '15px' }}>
                 <button onClick={() => setImagemSelecionada(null)} style={{ flex: 1, padding: '15px', background: 'transparent', color: '#FFF', border: '1px solid #333', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>CANCELAR</button>
                 <button onClick={salvarRecorte} style={{ flex: 1, padding: '15px', background: '#FFF', color: '#000', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>SALVAR INSÍGNIA</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isSettingsOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 3000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
             <div style={{ width: '400px', background: '#111', borderRadius: '20px', border: '1px solid #333', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '20px', borderBottom: '1px solid #333' }}>
                   <h2 style={{ color: 'white', margin: 0, fontSize: '18px' }}>CONFIGURAÇÕES GERAIS</h2>
                   <button onClick={() => setIsSettingsOpen(false)} className="prof-btn"><X size={24} /></button>
                </div>
                <div style={{ padding: '30px 20px', color: '#888', fontSize: '14px' }}>
                   Nenhuma calibração extra disponível na versão atual.
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isBadgeModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 3000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
             <div style={{ width: '400px', background: '#111', borderRadius: '20px', border: '1px solid #333', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '20px', borderBottom: '1px solid #333' }}>
                   <h2 style={{ color: 'white', margin: 0, fontSize: '18px', fontWeight: '900' }}>SELECIONAR INSÍGNIA</h2>
                   <button onClick={() => setIsBadgeModalOpen(false)} className="prof-btn"><X size={24} /></button>
                </div>
                <div style={{ padding: '40px 20px', color: '#888', fontSize: '14px', textAlign: 'center' }}>
                   Nenhuma insígnia desbloqueada no momento.
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CONTEÚDO PRINCIPAL (DASHBOARD) */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={{ position: 'relative', zIndex: 10, padding: '40px 50px', maxWidth: '1200px', margin: '0 auto' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '60px' }}>
           <button onClick={() => navigate(-1)} className="prof-btn"><ArrowLeft size={30} /></button>
           <h2 style={{ color: 'white', fontSize: '14px', fontWeight: '900', letterSpacing: '4px', margin: 0, textTransform: 'uppercase' }}>CENTRAL DE COMANDO</h2>
           <button onClick={() => setIsSettingsOpen(true)} className="prof-btn"><Settings size={30} /></button>
        </div>

        <header style={{ display: 'flex', gap: '50px', alignItems: 'flex-end', marginBottom: '80px', flexWrap: 'wrap' }}>
          <div onClick={() => fileInputRef.current?.click()} style={{ position: 'relative', width: '220px', height: '220px', cursor: 'pointer', borderRadius: '50%', border: '4px solid #FFF', boxShadow: '0 10px 40px rgba(0,0,0,0.8)' }}>
            <img src={fotoUrl} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} alt="Avatar" />
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', opacity: 0, transition: '0.3s' }} onMouseEnter={(e) => e.currentTarget.style.opacity = '1'} onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}>
              <Camera size={36} color="white" />
            </div>
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} style={{display: 'none'}} />
          </div>

          <div style={{ flex: 1, minWidth: '300px', zIndex: 10 }}>
             <div onClick={() => setIsBadgeModalOpen(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: '#FFF', color: '#000', padding: '8px 16px', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', marginBottom: '20px', cursor: 'pointer', transition: '0.2s', boxShadow: '0 4px 15px rgba(0,0,0,0.5)' }}>
                <Award size={18} /> PATENTE: COMANDANTE
             </div>
             {isEditandoNome ? (
               <input 
                 autoFocus 
                 value={tempNome} 
                 onChange={(e) => setTempNome(e.target.value)} 
                 onBlur={salvarNome} 
                 onKeyDown={(e) => {
                   if (e.key === 'Enter') salvarNome();
                   if (e.key === 'Escape') { setTempNome(nome); setIsEditandoNome(false); }
                 }}
                 style={{ display: 'block', fontSize: '64px', fontWeight: '900', background: 'none', border: 'none', borderBottom: '2px solid #FFF', color: '#FFF', width: '100%', outline: 'none' }} 
               />
             ) : (
               <h1 onClick={() => { setTempNome(nome); setIsEditandoNome(true); }} style={{ fontSize: '64px', fontWeight: '900', color: 'white', margin: '0 0 10px 0', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '-2px', textShadow: '0 4px 20px rgba(0,0,0,0.8)' }}>{nome}</h1>
             )}
             {isEditandoDescricao ? (
               <textarea 
                 autoFocus 
                 value={tempDescricao} 
                 onChange={(e) => setTempDescricao(e.target.value)} 
                 onBlur={salvarDescricao} 
                 onKeyDown={(e) => {
                   if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); salvarDescricao(); }
                   if (e.key === 'Escape') { setTempDescricao(descricao); setIsEditandoDescricao(false); }
                 }}
                 style={{ width: '100%', maxWidth: '650px', minHeight: '100px', background: 'rgba(255,255,255,0.05)', color: '#FFF', padding: '15px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', outline: 'none', fontSize: '16px' }} 
               />
             ) : (
               <p onClick={() => { setTempDescricao(descricao); setIsEditandoDescricao(true); }} style={{ color: '#DDD', fontSize: '18px', margin: 0, cursor: 'pointer', maxWidth: '650px', lineHeight: '1.6', textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>{descricao}</p>
             )}
          </div>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '25px', marginBottom: '80px' }}>
           <motion.div whileHover={{ scale: 1.05 }} style={{ background: 'rgba(10,10,15,0.4)', backdropFilter: 'blur(15px)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '24px', padding: '35px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
             <Download size={32} color="#FFF" style={{ marginBottom: '15px' }} />
             <span style={{ fontSize: '42px', fontWeight: '900', color: '#FFF', marginBottom: '5px' }}>{stats.totalBiblioteca}</span>
             <span style={{ fontSize: '12px', color: '#AAA', fontWeight: 'bold', letterSpacing: '1.5px' }}>ARQUIVOS LOCAIS</span>
           </motion.div>
           <motion.div whileHover={{ scale: 1.05 }} style={{ background: 'rgba(10,10,15,0.4)', backdropFilter: 'blur(15px)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '24px', padding: '35px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
             <Star size={32} color="#FFF" style={{ marginBottom: '15px' }} />
             <span style={{ fontSize: '42px', fontWeight: '900', color: '#FFF', marginBottom: '5px' }}>{stats.musicasFavoritas}</span>
             <span style={{ fontSize: '12px', color: '#AAA', fontWeight: 'bold', letterSpacing: '1.5px' }}>FAIXAS FAVORITAS</span>
           </motion.div>
           <motion.div whileHover={{ scale: 1.05 }} style={{ background: 'rgba(10,10,15,0.4)', backdropFilter: 'blur(15px)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '24px', padding: '35px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
             <PlayCircle size={32} color="#FFF" style={{ marginBottom: '15px' }} />
             <span style={{ fontSize: '42px', fontWeight: '900', color: '#FFF', marginBottom: '5px' }}>{stats.totalPlaylists}</span>
             <span style={{ fontSize: '12px', color: '#AAA', fontWeight: 'bold', letterSpacing: '1.5px' }}>PLAYLISTS CRIADAS</span>
           </motion.div>
        </div>

        <div style={{ background: 'rgba(10,10,15,0.6)', backdropFilter: 'blur(30px)', borderRadius: '32px', padding: '50px', border: '1px solid rgba(255,255,255,0.04)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '50px', flexWrap: 'wrap', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                 <BarChart size={36} color="#FFF" />
                 <h2 style={{ margin: 0, color: 'white', fontSize: '28px', fontWeight: '900', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>RELATÓRIO DE MISSÃO</h2>
              </div>
              <button onClick={() => alert("Relatório a ser gerado no futuro.")} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#FFF', color: '#000', border: 'none', padding: '16px 32px', borderRadius: '30px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', transition: '0.2s', boxShadow: '0 10px 30px rgba(255,255,255,0.2)' }}>
                 <Download size={18} /> GERAR RELATÓRIO
              </button>
           </div>

           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '60px' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                 <h3 style={{ fontSize: '15px', color: '#AAA', fontWeight: 'bold', letterSpacing: '1.5px', marginBottom: '10px' }}>ELITE ESTELAR (TOP ARTISTAS)</h3>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                   {stats.topArtistasData.length === 0 && <p style={{ color: '#555', fontSize: '15px', fontStyle: 'italic' }}>Nenhuma telemetria registrada.</p>}
                   {stats.topArtistasData.map((art: any, idx: number) => (
                     <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '15px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.04)' }}>
                       <span style={{ color: '#FFF', fontWeight: '900', fontSize: '20px', width: '25px' }}>{idx + 1}</span>
                       <span style={{ flex: 1, color: '#FFF', fontWeight: 'bold', fontSize: '16px' }}>{art.nome}</span>
                       <span style={{ color: '#AAA', fontSize: '13px', fontWeight: 'bold' }}>{art.playsTotais} PLAYS</span>
                     </div>
                   ))}
                 </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                 <h3 style={{ fontSize: '15px', color: '#AAA', fontWeight: 'bold', letterSpacing: '1.5px', marginBottom: '10px' }}>TRANSMISSÕES FREQUENTES (TOP MÚSICAS)</h3>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                   {stats.topMusicas.length === 0 && <p style={{ color: '#555', fontSize: '15px', fontStyle: 'italic' }}>Sem registros de áudio suficientes.</p>}
                   {stats.topMusicas.map((musica, idx) => (
                     <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '12px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.04)' }}>
                       <span style={{ color: '#FFF', fontWeight: '900', fontSize: '20px', width: '25px' }}>{idx + 1}</span>
                       <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '15px' }}>
                         <img src={musica.capa} style={{ width: '45px', height: '45px', borderRadius: '8px', objectFit: 'cover' }} alt=""/>
                         <div>
                           <div style={{ color: 'white', fontWeight: 'bold', fontSize: '15px' }}>{musica.titulo}</div>
                           <div style={{ fontSize: '12px', color: '#AAA' }}>{musica.artista}</div>
                         </div>
                       </div>
                       <span style={{ color: '#AAA', fontSize: '13px', fontWeight: 'bold' }}>{musica.plays} PLAYS</span>
                     </div>
                   ))}
                 </div>
              </div>

           </div>
        </div>
      </motion.div>
    </div>
  );
}