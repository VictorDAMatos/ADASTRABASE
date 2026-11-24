import { useState, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Plus, Trash2, ArrowLeft, Image as ImageIcon, CheckCircle, Edit3 } from 'lucide-react';
import Cropper from 'react-easy-crop';
import { usePlaylistStore, Playlist as IPlaylist } from '../store/playlistStore';
import { useMusicStore, Faixa } from '../store/musicStore';
import { usePlayerStore } from '../store/playerStore';

// ==========================================
// UTILITÁRIO DE RECORTE DE IMAGEM (CANVAS)
// ==========================================
const getCroppedImg = async (imageSrc: string, pixelCrop: any): Promise<string> => {
  const image = new Image();
  image.src = imageSrc;
  await new Promise((resolve) => (image.onload = resolve));

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) return imageSrc;

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return canvas.toDataURL('image/jpeg');
};

// ==========================================
// FUNDO GALÁCTICO DISTORCIDO
// ==========================================
const GalaxyBackground = () => {
  const stars = useMemo(() => Array.from({ length: 100 }).map((_, i) => ({
    id: i, x: Math.random() * 100, y: Math.random() * 100, size: Math.random() * 2 + 1, duration: Math.random() * 4 + 2, delay: Math.random() * 2
  })), []);
  return (
    <div style={styles.spaceBg}>
      <motion.div animate={{ rotate: [0, 360], scale: [1, 1.3, 1], borderRadius: ["40%", "60%", "40%"] }} transition={{ duration: 40, repeat: Infinity, ease: 'linear' }} style={styles.distortedNebula1} />
      <motion.div animate={{ rotate: [360, 0], scale: [1, 1.5, 1], borderRadius: ["60%", "40%", "60%"] }} transition={{ duration: 50, repeat: Infinity, ease: 'linear' }} style={styles.distortedNebula2} />
      {stars.map((s) => (
        <motion.div key={s.id} animate={{ opacity: [0.1, 0.8, 0.1] }} transition={{ duration: s.duration, repeat: Infinity, delay: s.delay }}
          style={{ position: 'absolute', left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size, backgroundColor: '#FFF', borderRadius: '50%' }}
        />
      ))}
    </div>
  );
};

export function Playlists() {
  const { playlists, addPlaylist, removerPlaylist, updatePlaylist, addFaixa, removeFaixa } = usePlaylistStore();
  const { biblioteca, registrarOuvida } = useMusicStore();
  const { setFaixaAtual, setIsPlaying } = usePlayerStore();
  
  const [playlistAtivaId, setPlaylistAtivaId] = useState<string | null>(null);
  const [isCriando, setIsCriando] = useState(false);
  const [novaNome, setNovaNome] = useState("");
  const [novaCapa, setNovaCapa] = useState("https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=300");
  const [isAdicionandoMusica, setIsAdicionandoMusica] = useState(false);

  const [isEditandoNome, setIsEditandoNome] = useState(false);
  const [nomeTemp, setNomeTemp] = useState("");

  const [imagemSelecionada, setImagemSelecionada] = useState<string | null>(null);
  const [uploadTarget, setUploadTarget] = useState<'nova' | string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const playlistAtiva = playlists.find(p => p.id === playlistAtivaId);

  const onCropComplete = useCallback((_area: any, pixels: any) => { setCroppedAreaPixels(pixels); }, []);
  
  // CORREÇÃO: AGORA O RECORTE É APLICADO DE VERDADE
  const salvarRecorte = async () => {
    if (imagemSelecionada && croppedAreaPixels) {
      try {
        const imagemCortada = await getCroppedImg(imagemSelecionada, croppedAreaPixels);
        
        if (uploadTarget === 'nova') {
          setNovaCapa(imagemCortada);
        } else if (uploadTarget) {
          updatePlaylist(uploadTarget, { capa: imagemCortada });
        }
      } catch (e) {
        console.error("Erro ao cortar a imagem", e);
      } finally {
        setImagemSelecionada(null);
        setUploadTarget(null);
      }
    }
  };

  const criar = () => {
    if (novaNome.trim()) { 
      addPlaylist(novaNome, novaCapa); 
      setIsCriando(false); setNovaNome(""); setNovaCapa("https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=300");
    }
  };

  const playMusic = (faixa: Faixa) => { 
    setFaixaAtual(faixa); 
    setIsPlaying(true); 
    registrarOuvida(faixa); 
  };

  return (
    <>
      <style>{`
        .custom-scroll::-webkit-scrollbar { width: 8px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { background: rgba(0, 163, 255, 0.4); border-radius: 10px; }
        .custom-scroll::-webkit-scrollbar-thumb:hover { background: rgba(0, 163, 255, 0.8); }
        .editable-hover:hover .edit-icon { opacity: 1 !important; }
      `}</style>
      
      <div style={styles.container} className="custom-scroll">
        <GalaxyBackground />

        <input type="file" ref={fileInputRef} accept="image/*" style={{display: 'none'}} onChange={(e) => {
           const file = e.target.files?.[0];
           if(file) { const reader = new FileReader(); reader.onload = () => setImagemSelecionada(reader.result as string); reader.readAsDataURL(file); }
           e.target.value = '';
        }}/>

        <AnimatePresence>
          {imagemSelecionada && (
            <div style={styles.modalOverlayCorte}>
              <div style={styles.modalContentCorte}>
                <Cropper image={imagemSelecionada} crop={crop} zoom={zoom} aspect={1} cropShape="rect" onCropChange={setCrop} onCropComplete={onCropComplete} onZoomChange={setZoom} />
                <div style={{position: 'absolute', bottom: '20px', left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: '20px', zIndex: 10}}>
                   <button onClick={() => { setImagemSelecionada(null); setUploadTarget(null); }} style={styles.btnCancelarCorte}>CANCELAR</button>
                   <button onClick={salvarRecorte} style={styles.btnConfirmarCorte}>CONFIRMAR</button>
                </div>
              </div>
            </div>
          )}
        </AnimatePresence>

        {!playlistAtiva && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={styles.content}>
            <div style={styles.header}>
              <h1 style={styles.title}>MINHA FROTA</h1>
              <motion.button whileHover={{ scale: 1.05 }} onClick={() => setIsCriando(true)} style={styles.btnAcao}>
                <Plus size={18} /> NOVA DIRETRIZ
              </motion.button>
            </div>

            <div style={styles.grid}>
              {playlists.map(p => (
                <motion.div key={p.id} whileHover={{ y: -5 }} onClick={() => setPlaylistAtivaId(p.id)} style={styles.card}>
                  <img src={p.capa} style={styles.cardImg} alt="Capa" />
                  <div style={styles.cardInfo}>
                    <h3 style={styles.cardTitle}>{p.nome}</h3>
                    <p style={styles.cardSub}>{p.faixas.length} transmissões</p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); removerPlaylist(p.id); }} style={styles.btnRemover}>
                     <Trash2 size={16} />
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {playlistAtiva && (
          <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} style={styles.content}>
            <button onClick={() => { setPlaylistAtivaId(null); setIsAdicionandoMusica(false); }} style={styles.btnVoltar}>
               <ArrowLeft size={24} color="#00A3FF" /> VOLTAR AO HANGAR
            </button>
            
            <div style={styles.playlistHeader}>
              <div style={styles.imageSelector} onClick={() => { setUploadTarget(playlistAtiva.id); fileInputRef.current?.click(); }}>
                <img src={playlistAtiva.capa} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                <div style={styles.imageOverlay}><ImageIcon size={30} /> <span>ALTERAR CAPA</span></div>
              </div>
              
              <div style={{flex: 1}}>
                <div className="editable-hover" style={{display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer'}} onClick={() => { setNomeTemp(playlistAtiva.nome); setIsEditandoNome(true); }}>
                  {isEditandoNome ? (
                    <input autoFocus value={nomeTemp} onChange={(e) => setNomeTemp(e.target.value)} 
                           onBlur={() => { if(nomeTemp.trim()) updatePlaylist(playlistAtiva.id, { nome: nomeTemp }); setIsEditandoNome(false); }}
                           onKeyDown={(e) => { if(e.key === 'Enter') e.currentTarget.blur() }}
                           style={styles.inputNomeEditavel} />
                  ) : (
                    <>
                      <h1 style={styles.playlistNomeText}>{playlistAtiva.nome}</h1>
                      <Edit3 className="edit-icon" size={20} color="#00A3FF" style={{opacity: 0, transition: '0.2s'}} />
                    </>
                  )}
                </div>

                <p style={{color: '#94a3b8', margin: '0 0 20px 0', fontSize: '16px'}}>{playlistAtiva.faixas.length} frequências anexadas</p>
                <div style={{display: 'flex', gap: '15px'}}>
                  <motion.button whileHover={{ scale: 1.05 }} onClick={() => { if(playlistAtiva.faixas[0]) playMusic(playlistAtiva.faixas[0]) }} style={styles.btnPlayBig}>
                    <Play fill="#000" size={24} style={{marginLeft: '4px'}} /> INICIAR
                  </motion.button>
                  {!isAdicionandoMusica && (
                    <motion.button whileHover={{ scale: 1.05 }} onClick={() => setIsAdicionandoMusica(true)} style={styles.btnAddMusica}>
                      <Plus size={18} /> ANEXAR FAIXAS
                    </motion.button>
                  )}
                </div>
              </div>
            </div>

            <div style={styles.trackAreaContainer}>
              <AnimatePresence mode="wait">
                {!isAdicionandoMusica ? (
                  <motion.div key="lista" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} style={styles.trackList}>
                    {playlistAtiva.faixas.map((f, idx) => (
                      <div key={f.id} style={styles.trackItem} onClick={() => playMusic(f)}>
                          <div style={styles.trackNum}>{idx + 1}</div>
                          <img src={f.capa} style={styles.trackImg} />
                          <div style={{flex: 1}}>
                            <div style={{fontWeight: 'bold', color: '#FFF'}}>{f.titulo}</div>
                            <div style={{fontSize: '13px', color: '#94a3b8'}}>{f.artista}</div>
                          </div>
                          <div style={{color: '#64748b', fontSize: '14px', fontFamily: 'monospace'}}>{f.duracao}</div>
                          <button onClick={(e) => { e.stopPropagation(); removeFaixa(playlistAtiva.id, f.id); }} style={styles.btnTrash}>
                            <Trash2 size={18} />
                          </button>
                      </div>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div key="adicionar" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} style={styles.addTrackPanel}>
                    <div style={styles.addTrackHeader}>
                      <button onClick={() => setIsAdicionandoMusica(false)} style={styles.btnVoltarPainel}>
                        <ArrowLeft size={20} /> CANCELAR / VOLTAR
                      </button>
                      <span style={{color: '#00A3FF', fontWeight: 'bold', fontSize: '14px', letterSpacing: '2px'}}>ARQUIVO CENTRAL</span>
                    </div>

                    <div className="custom-scroll" style={styles.libraryList}>
                      {biblioteca.map(faixa => {
                        const isAdded = playlistAtiva.faixas.some(f => f.id === faixa.id);
                        return (
                          <motion.div whileHover={{ backgroundColor: 'rgba(0, 163, 255, 0.05)' }} key={faixa.id} style={styles.libraryItem} onClick={() => { if(!isAdded) addFaixa(playlistAtiva.id, faixa); }}>
                            <img src={faixa.capa} style={styles.trackImg} />
                            <div style={{flex: 1}}>
                              <div style={{fontWeight: 'bold', fontSize: '15px'}}>{faixa.titulo}</div>
                              <div style={{fontSize: '13px', color: '#64748b'}}>{faixa.artista}</div>
                            </div>
                            {isAdded ? (
                              <div style={styles.badgeAdded}><CheckCircle size={16} /> ANEXADO</div>
                            ) : (
                              <button style={styles.btnAnexar}><Plus size={16}/> ANEXAR</button>
                            )}
                          </motion.div>
                        )
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        <AnimatePresence>
          {isCriando && !imagemSelecionada && (
            <div style={styles.modalOverlay}>
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} style={styles.modalBox}>
                <h2 style={{marginTop: 0, letterSpacing: '2px', color: '#FFF'}}>NOVA DIRETRIZ</h2>
                <div style={styles.imageSelectorNovo} onClick={() => { setUploadTarget('nova'); fileInputRef.current?.click(); }}>
                   <img src={novaCapa} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                   <div style={styles.imageOverlay}><ImageIcon size={30} /> <span style={{fontWeight: 'bold'}}>SELECIONAR CAPA</span></div>
                </div>
                <input autoFocus placeholder="Nome da Operação" value={novaNome} onChange={(e) => setNovaNome(e.target.value)} style={styles.inputModal} />
                <div style={{display: 'flex', gap: '15px', marginTop: '30px', width: '100%'}}>
                  <button onClick={() => setIsCriando(false)} style={styles.btnCancelarModal}>CANCELAR</button>
                  <button onClick={criar} style={styles.btnConfirmarModal}>INICIAR</button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

const styles = {
  container: { position: 'relative' as const, width: '100%', minHeight: '100vh', color: 'white', overflowY: 'auto' as const, paddingBottom: '120px' },
  spaceBg: { position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#020205', zIndex: 0 },
  distortedNebula1: { position: 'absolute' as const, top: '5%', left: '10%', width: '70vw', height: '70vw', background: 'radial-gradient(circle, rgba(0, 163, 255, 0.12) 0%, transparent 60%)', filter: 'blur(90px)', transformOrigin: 'center center' },
  distortedNebula2: { position: 'absolute' as const, bottom: '5%', right: '10%', width: '60vw', height: '60vw', background: 'radial-gradient(circle, rgba(255, 255, 255, 0.05) 0%, rgba(0, 163, 255, 0.08) 30%, transparent 70%)', filter: 'blur(100px)', transformOrigin: 'center center' },
  content: { position: 'relative' as const, zIndex: 1, padding: '50px 60px', maxWidth: '1200px', margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '50px' },
  title: { fontSize: '42px', fontWeight: '900', margin: 0, letterSpacing: '2px', textShadow: '0 0 20px rgba(0,163,255,0.3)' },
  btnAcao: { backgroundColor: '#00A3FF', color: '#000', border: '1px solid #FFF', padding: '12px 24px', borderRadius: '30px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', letterSpacing: '1px', boxShadow: '0 0 15px rgba(0, 163, 255, 0.4)' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '30px' },
  card: { backgroundColor: 'rgba(0,0,0,0.4)', border: '1px solid rgba(0, 163, 255, 0.2)', borderRadius: '15px', padding: '15px', cursor: 'pointer', position: 'relative' as const, backdropFilter: 'blur(10px)', transition: 'border-color 0.3s', '&:hover': { borderColor: '#00A3FF' } } as any,
  cardImg: { width: '100%', aspectRatio: '1/1', borderRadius: '10px', objectFit: 'cover' as const, marginBottom: '15px', boxShadow: '0 10px 30px rgba(0,0,0,0.8)' },
  cardInfo: { display: 'flex', flexDirection: 'column' as const },
  cardTitle: { margin: 0, fontSize: '18px', fontWeight: 'bold', whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis' },
  cardSub: { margin: '5px 0 0 0', fontSize: '13px', color: '#00A3FF' },
  btnRemover: { position: 'absolute' as const, top: '25px', right: '25px', width: '35px', height: '35px', borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#FFF', opacity: 0, transition: '0.3s', cursor: 'pointer', '&:hover': { backgroundColor: '#ef4444', borderColor: '#ef4444' } } as any, 
  btnVoltar: { background: 'none', border: 'none', color: '#FFF', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '900', marginBottom: '30px', fontSize: '14px', letterSpacing: '2px' },
  playlistHeader: { display: 'flex', alignItems: 'flex-end', gap: '40px', marginBottom: '50px' },
  imageSelector: { width: '280px', height: '280px', borderRadius: '15px', overflow: 'hidden', position: 'relative' as const, cursor: 'pointer', boxShadow: '0 20px 60px rgba(0,0,0,0.8)', border: '2px solid rgba(0, 163, 255, 0.3)', flexShrink: 0 },
  imageSelectorNovo: { width: '220px', height: '220px', borderRadius: '15px', overflow: 'hidden', position: 'relative' as const, cursor: 'pointer', marginBottom: '30px', border: '2px dashed rgba(0, 163, 255, 0.5)' },
  imageOverlay: { position: 'absolute' as const, inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', flexDirection: 'column' as const, justifyContent: 'center', alignItems: 'center', gap: '10px', opacity: 0, transition: '0.3s', '&:hover': { opacity: 1 } } as any,
  playlistNomeText: { fontSize: '50px', margin: '0 0 10px 0', textTransform: 'uppercase' as const, textShadow: '0 4px 20px rgba(0,0,0,0.5)', fontWeight: '900', letterSpacing: '1px' },
  inputNomeEditavel: { fontSize: '50px', fontWeight: '900', background: 'rgba(0,0,0,0.5)', border: 'none', borderBottom: '2px solid #00A3FF', color: '#FFF', outline: 'none', width: '100%', textTransform: 'uppercase' as const, margin: '0 0 10px 0', letterSpacing: '1px' },
  btnPlayBig: { backgroundColor: '#00A3FF', color: '#000', border: '1px solid #FFF', padding: '15px 30px', borderRadius: '40px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px', letterSpacing: '2px', boxShadow: '0 0 20px rgba(0, 163, 255, 0.4)' },
  btnAddMusica: { backgroundColor: '#05050A', color: '#FFF', border: '1px solid rgba(0, 163, 255, 0.5)', padding: '15px 30px', borderRadius: '40px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px', letterSpacing: '2px' },
  trackAreaContainer: { minHeight: '400px', position: 'relative' as const },
  trackList: { display: 'flex', flexDirection: 'column' as const, gap: '8px' },
  trackItem: { display: 'flex', alignItems: 'center', gap: '20px', padding: '15px 20px', backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: '12px', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.03)', backdropFilter: 'blur(5px)', transition: '0.2s', '&:hover': { backgroundColor: 'rgba(0, 163, 255, 0.1)', borderColor: 'rgba(0, 163, 255, 0.3)' } } as any,
  trackNum: { width: '30px', color: '#00A3FF', fontWeight: '900', fontSize: '16px', textAlign: 'center' as const },
  trackImg: { width: '50px', height: '50px', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.5)' },
  btnTrash: { background: 'none', border: 'none', color: '#475569', cursor: 'pointer', transition: '0.2s', '&:hover': { color: '#FFF' } } as any,
  emptyBox: { padding: '40px', textAlign: 'center' as const, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '12px', border: '1px dashed rgba(0, 163, 255, 0.2)' },
  addTrackPanel: { backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(20px)', borderRadius: '15px', border: '1px solid rgba(0, 163, 255, 0.3)', padding: '30px', display: 'flex', flexDirection: 'column' as const, gap: '20px', boxShadow: '0 20px 60px rgba(0,0,0,0.8)' },
  addTrackHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '20px' },
  btnVoltarPainel: { background: 'none', border: 'none', color: '#FFF', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '900', fontSize: '13px', letterSpacing: '1px' },
  libraryList: { display: 'flex', flexDirection: 'column' as const, gap: '10px', maxHeight: '500px', overflowY: 'auto' as const, paddingRight: '10px' },
  libraryItem: { display: 'flex', alignItems: 'center', gap: '20px', padding: '12px 15px', backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' },
  btnAnexar: { display: 'flex', alignItems: 'center', gap: '6px', background: '#00A3FF', color: '#000', border: '1px solid #FFF', padding: '8px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '900', cursor: 'pointer' },
  badgeAdded: { display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent', color: '#FFF', padding: '8px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '900', border: '1px solid #FFF' },
  modalOverlay: { position: 'fixed' as const, inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(15px)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center' },
  modalBox: { backgroundColor: '#020205', padding: '40px', borderRadius: '24px', border: '1px solid rgba(0, 163, 255, 0.3)', width: '450px', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', boxShadow: '0 0 80px rgba(0,163,255,0.2)' },
  inputModal: { width: '100%', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', color: '#FFF', padding: '18px', borderRadius: '12px', fontSize: '16px', outline: 'none', textAlign: 'center' as const, fontWeight: 'bold' },
  btnConfirmarModal: { flex: 1, backgroundColor: '#00A3FF', color: '#000', border: '1px solid #FFF', padding: '15px', borderRadius: '12px', fontWeight: '900', cursor: 'pointer', fontSize: '14px', letterSpacing: '2px' },
  btnCancelarModal: { flex: 1, backgroundColor: 'transparent', color: '#FFF', border: '1px solid rgba(255,255,255,0.3)', padding: '15px', borderRadius: '12px', fontWeight: '900', cursor: 'pointer', fontSize: '14px', letterSpacing: '2px' },
  modalOverlayCorte: { position: 'fixed' as const, inset: 0, backgroundColor: 'rgba(0,0,0,0.95)', zIndex: 3000, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(10px)' },
  modalContentCorte: { width: '450px', height: '550px', position: 'relative' as const, backgroundColor: '#020205', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(0, 163, 255, 0.3)' },
  btnConfirmarCorte: { backgroundColor: '#00A3FF', color: '#000', border: '1px solid #FFF', padding: '12px 24px', fontWeight: '900', borderRadius: '30px', cursor: 'pointer', letterSpacing: '1px' },
  btnCancelarCorte: { backgroundColor: 'transparent', color: '#FFF', border: '1px solid rgba(255,255,255,0.3)', padding: '12px 24px', fontWeight: '900', borderRadius: '30px', cursor: 'pointer', letterSpacing: '1px' }
};