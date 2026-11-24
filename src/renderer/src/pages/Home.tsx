import { useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useMusicStore, Faixa } from '../store/musicStore';
import { usePlayerStore } from '../store/playerStore';
import { Play, ChevronLeft, ChevronRight } from 'lucide-react';

const SpaceBackground = () => {
  const stars = useMemo(() => Array.from({ length: 60 }).map((_, i) => ({
    id: i, x: Math.random() * 100, y: Math.random() * 100, size: Math.random() * 2 + 1, duration: Math.random() * 4 + 2, delay: Math.random() * 2
  })), []);

  return (
    <div style={styles.spaceBg}>
      <motion.div animate={{ opacity: [0.1, 0.3, 0.1] }} transition={{ duration: 10, repeat: Infinity, ease: 'linear' }} style={styles.nebula1} />
      <motion.div animate={{ opacity: [0.1, 0.2, 0.1] }} transition={{ duration: 15, repeat: Infinity, ease: 'linear' }} style={styles.nebula2} />
      {stars.map((s) => (
        <motion.div key={s.id} animate={{ opacity: [0.2, 0.8, 0.2] }} transition={{ duration: s.duration, repeat: Infinity, delay: s.delay, ease: "easeInOut" }}
          style={{ position: 'absolute', left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size, backgroundColor: '#FFF', borderRadius: '50%', boxShadow: '0 0 8px rgba(255,255,255,0.8)' }}
        />
      ))}
    </div>
  );
};

const ScrollableRow = ({ children }: { children: React.ReactNode }) => {
  const rowRef = useRef<HTMLDivElement>(null);
  const scroll = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const scrollAmount = 600;
      rowRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div style={styles.carouselContainer}>
      <button onClick={() => scroll('left')} style={{ ...styles.scrollBtn, left: '-20px' }}>
        <ChevronLeft size={28} color="white" />
      </button>
      <div ref={rowRef} className="hide-horizontal-scroll" style={styles.rowWrapper}>
        {children}
      </div>
      <button onClick={() => scroll('right')} style={{ ...styles.scrollBtn, right: '-20px' }}>
        <ChevronRight size={28} color="white" />
      </button>
    </div>
  );
};

export function Home() {
  // IMPORTANTE: Adicionámos o registrarOuvida aqui também
  const { biblioteca, recentes, registrarOuvida } = useMusicStore();
  const { setFaixaAtual, setIsPlaying } = usePlayerStore();
  const adicionadasRecentemente = biblioteca.slice(0, 6);

  // AGORA ATUALIZA O PERFIL AO TOCAR DA HOME!
  const playMusic = (faixa: Faixa) => { 
    setFaixaAtual(faixa); 
    setIsPlaying(true); 
    registrarOuvida(faixa); 
  };

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } } };

  return (
    <>
      <style>{`
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(0, 163, 255, 0.3); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(0, 163, 255, 0.8); }
        .hide-horizontal-scroll::-webkit-scrollbar { display: none; }
        .hide-horizontal-scroll { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <SpaceBackground />

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} style={styles.container}>
        <motion.h1 initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} style={styles.saudacao}>
          Sistemas Operacionais, Comandante
        </motion.h1>

        <motion.div variants={containerVariants} initial="hidden" animate="show" style={styles.quickGrid}>
          {adicionadasRecentemente.map((m) => (
            <motion.div key={m.id} variants={itemVariants}>
              <QuickCard track={m} onPlay={() => playMusic(m)} />
            </motion.div>
          ))}
        </motion.div>

        <HomeSection title="Sinais Recentes Captados">
          <ScrollableRow>
            {recentes.map(m => <SquareCard key={m.id} track={m} onPlay={() => playMusic(m)} />)}
            {recentes.length === 0 && <span style={styles.emptyText}>Nenhuma transmissão recente...</span>}
          </ScrollableRow>
        </HomeSection>

        <HomeSection title="Arquivo da Frota">
          <ScrollableRow>
            {biblioteca.map(m => <SquareCard key={m.id} track={m} onPlay={() => playMusic(m)} />)}
            {biblioteca.length === 0 && <span style={styles.emptyText}>Biblioteca vazia...</span>}
          </ScrollableRow>
        </HomeSection>
        
      </motion.div>
    </>
  );
}

const QuickCard = ({ track, onPlay }: any) => (
  // ONCLICK ATIVADO
  <motion.div whileHover="hover" onClick={onPlay} style={styles.quickCard}>
    <img src={track.capa} style={styles.quickImg} alt="Capa" />
    <span style={styles.quickTitle}>{track.titulo}</span>
    <motion.div variants={{ hover: { opacity: 1, scale: 1 } }} initial={{ opacity: 0, scale: 0.8 }} style={styles.quickPlay}>
      <Play fill="black" size={20} style={{ marginLeft: '4px' }} />
    </motion.div>
  </motion.div>
);

const SquareCard = ({ track, onPlay }: any) => (
  // ONCLICK ATIVADO
  <motion.div whileHover="hover" onClick={onPlay} style={styles.squareCard}>
    <div style={styles.imgWrapper}>
      <img src={track.capa} style={styles.squareImg} alt="Capa" />
      <motion.button variants={{ hover: { opacity: 1, y: 0 } }} initial={{ opacity: 0, y: 10 }} style={styles.floatPlay}>
        <Play fill="black" size={22} style={{ marginLeft: '2px' }} />
      </motion.button>
    </div>
    <span style={styles.cardTitle}>{track.titulo}</span>
    <span style={styles.cardSub}>{track.artista}</span>
  </motion.div>
);

const HomeSection = ({ title, children }: any) => (
  <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={styles.sectionMargin}>
    <h2 style={styles.sectionTitle}>{title}</h2>
    {children}
  </motion.section>
);

const styles = {
  spaceBg: { position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#05050A', zIndex: 0, overflow: 'hidden' },
  nebula1: { position: 'absolute' as const, top: '-20%', left: '-10%', width: '60vw', height: '60vw', background: 'radial-gradient(circle, rgba(0, 163, 255, 0.15) 0%, transparent 60%)', filter: 'blur(80px)' },
  nebula2: { position: 'absolute' as const, bottom: '-20%', right: '-10%', width: '70vw', height: '70vw', background: 'radial-gradient(circle, rgba(168, 85, 247, 0.1) 0%, transparent 60%)', filter: 'blur(100px)' },
  
  container: { padding: '40px', position: 'relative' as const, zIndex: 1, paddingBottom: '120px', color: 'white' },
  saudacao: { fontSize: '42px', marginBottom: '30px', fontWeight: '900', letterSpacing: '-1px' },
  
  quickGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' },
  quickCard: { height: '85px', display: 'flex', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', overflow: 'hidden', cursor: 'pointer', position: 'relative' as const, transition: 'background-color 0.3s' },
  quickImg: { width: '85px', height: '85px', objectFit: 'cover' as const, boxShadow: '5px 0 15px rgba(0,0,0,0.5)' },
  quickTitle: { padding: '0 20px', fontWeight: 'bold', fontSize: '16px', flex: 1, whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis' },
  quickPlay: { position: 'absolute' as const, right: '20px', width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#00A3FF', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 8px 20px rgba(0, 163, 255, 0.4)' },
  
  sectionMargin: { marginTop: '50px' },
  sectionTitle: { fontSize: '24px', marginBottom: '20px', fontWeight: '800', letterSpacing: '0.5px' },
  
  carouselContainer: { position: 'relative' as const, display: 'flex', alignItems: 'center', group: 'hover' },
  scrollBtn: { position: 'absolute' as const, zIndex: 10, width: '44px', height: '44px', borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,0,0,0.5)', transition: 'transform 0.2s, background-color 0.2s', '&:hover': { backgroundColor: 'rgba(0, 163, 255, 0.8)', transform: 'scale(1.1)' } } as any,
  rowWrapper: { display: 'flex', gap: '25px', overflowX: 'auto' as const, padding: '10px 0', scrollBehavior: 'smooth' as const, width: '100%' },
  
  squareCard: { width: '200px', padding: '15px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', cursor: 'pointer', transition: 'background-color 0.3s', flexShrink: 0 },
  imgWrapper: { position: 'relative' as const, marginBottom: '15px' },
  squareImg: { width: '100%', aspectRatio: '1/1', borderRadius: '8px', boxShadow: '0 10px 30px rgba(0,0,0,0.6)', objectFit: 'cover' as const },
  floatPlay: { position: 'absolute' as const, bottom: '10px', right: '10px', width: '50px', height: '50px', borderRadius: '50%', backgroundColor: '#00A3FF', border: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 8px 20px rgba(0, 163, 255, 0.5)' },
  cardTitle: { display: 'block', fontWeight: '800', fontSize: '15px', marginBottom: '6px', whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis' },
  cardSub: { fontSize: '13px', color: '#94a3b8', fontWeight: '500', whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis' },
  
  emptyText: { color: '#64748b', fontStyle: 'italic', padding: '20px 0' }
};