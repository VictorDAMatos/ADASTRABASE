import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, Disc3, Music, RefreshCw, Play, Star } from 'lucide-react';
import { SpaceBackground } from './ArtistasGrid';
import { useArtistStore } from '../store/artistaStore';
import { usePlayerStore } from '../store/playerStore';
import { useMusicStore } from '../store/musicStore'; 
import { useState, useEffect } from 'react';


export function ArtistaPage() {
  const { nome } = useParams<{ nome: string }>();
  const nomeArtista = decodeURIComponent(nome || '').trim();
  
  // ==========================================
  // CONEXÃO COM OS MOTORES DA NAVE
  // ==========================================
  const { artistas, atualizarDadosArtista } = useArtistStore();
  const { setFaixaAtual, setIsPlaying } = usePlayerStore();
  
  // AQUI ESTAVA O ERRO! A variável correta no seu sistema é 'biblioteca', e não 'musicas'
  const { biblioteca } = useMusicStore(); 
  
  const [loading, setLoading] = useState(false);
  const [albumsFiltrados, setAlbumsFiltrados] = useState<any[]>([]);

  // ==========================================
  // PROCESSAMENTO DE TELEMETRIA E FAIXAS
  // ==========================================
  const dadosLocais = artistas[nomeArtista] || { reproducoesTotais: 0, faixasOuvidas: {}, albumsOuvidos: {} };
  const albumsLocaisKeys = Object.keys(dadosLocais.albumsOuvidos || {});

  // Filtra as músicas da sua biblioteca que pertencem a este artista
  const musicasInstaladas = (biblioteca || []).filter(
    (m: any) => (m.artista || '').trim().toLowerCase() === nomeArtista.toLowerCase()
  );

  // Calcula o Top 5 baseado nas vezes que a faixa foi tocada
  const top5Faixas = [...musicasInstaladas]
    .map(faixa => ({ ...faixa, plays: dadosLocais.faixasOuvidas[faixa.titulo] || 0 }))
    .sort((a, b) => b.plays - a.plays)
    .slice(0, 5);

  const topAlbumEntry = Object.entries(dadosLocais.albumsOuvidos || {})
    .sort(([, a], [, b]) => (b as number) - (a as number))[0];

  // ==========================================
  // PAINEL DE DIAGNÓSTICO
  // ==========================================
  useEffect(() => {
    console.log("=== RELATÓRIO DO ARTISTA: " + nomeArtista + " ===");
    console.log("Músicas totais carregadas na nave (biblioteca):", biblioteca?.length || 0);
    console.log("Músicas encontradas deste artista:", musicasInstaladas.length);
    console.log("Histórico de Plays:", dadosLocais.faixasOuvidas);
  }, [nomeArtista, biblioteca]);

  // ==========================================
  // RADAR DO ITUNES (Apenas para Metadados HD)
  // ==========================================
  const buscarDadosNoRadar = async () => {
    setLoading(true);
    try {
      const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(nomeArtista)}&entity=album&limit=200`);
      const data = await response.json();
      
      if (data.results.length > 0) {
        const albumMaisAntigo = data.results.reduce((antigo: any, atual: any) => 
          new Date(atual.releaseDate) < new Date(antigo.releaseDate) ? atual : antigo
        );

        const albunsLocaisEncontrados = data.results.filter((apiAlbum: any) =>
          albumsLocaisKeys.some(localName => apiAlbum.collectionName.toLowerCase().includes(localName.toLowerCase()))
        );

        const albunsUnicos = Array.from(new Map(albunsLocaisEncontrados.map((item: any) => [item.collectionName, item])).values());
        setAlbumsFiltrados(albunsUnicos);

        atualizarDadosArtista(nomeArtista, {
          capa: data.results[0].artworkUrl100.replace('100x100bb', '1400x1400bb'),
          dataInicio: albumMaisAntigo.releaseDate.split('-')[0]
        });
      }
    } catch (error) {
      console.error("Erro no radar:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { buscarDadosNoRadar(); }, [nomeArtista]);

  // ==========================================
  // INTERFACE DE USUÁRIO (O DESIGN ÉPICO)
  // ==========================================
  return (
    <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
      {/* SCROLLBAR CIBERNÉTICA */}
      <style>{`
        .custom-scroll::-webkit-scrollbar { width: 6px !important; }
        .custom-scroll::-webkit-scrollbar-track { background: rgba(0,0,0,0.2) !important; border-radius: 10px; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #fb923c !important; border-radius: 10px; }
      `}</style>

      {/* 1. FUNDO ANIMADO (O SOL E AS ESTRELAS) */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <SpaceBackground />
      </div>

      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}
        style={{ position: 'relative', zIndex: 1, paddingBottom: '120px' }}
      >
        
        {/* 2. CABEÇALHO DO ARTISTA */}
        <div style={{
          height: '450px',
          backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.9) 100%), url(${dadosLocais.capa || 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=100&w=2000'})`,
          backgroundSize: 'cover', backgroundPosition: 'center 20%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', position: 'relative', boxShadow: 'inset 0 -50px 100px #000'
        }}>
          {/* Botão de Refresh */}
          <button onClick={buscarDadosNoRadar} title="Atualizar Radar" style={{ position: 'absolute', top: '30px', right: '30px', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '12px', borderRadius: '50%', cursor: 'pointer' }}>
            <motion.div animate={{ rotate: loading ? 360 : 0 }} transition={{ repeat: loading ? Infinity : 0, duration: 1, ease: "linear" }}><RefreshCw size={22} /></motion.div>
          </button>

          {/* Nome e Data */}
          <h1 style={{ fontSize: '90px', fontWeight: '900', color: 'white', margin: 0, textTransform: 'uppercase', textShadow: '0 10px 40px rgba(0,0,0,0.8)', textAlign: 'center', letterSpacing: '-2px' }}>
            {nomeArtista}
          </h1>
          <p style={{ color: '#fb923c', fontWeight: 'bold', fontSize: '18px', letterSpacing: '5px', marginTop: '10px', textShadow: '0 2px 10px #000' }}>
            SINAL ATIVO DESDE {dadosLocais.dataInicio || '----'}
          </p>

          {/* Cantos Inferiores: Lados Opostos */}
          <div style={{ position: 'absolute', bottom: '25px', left: '40px', display: 'flex', alignItems: 'center', gap: '10px', color: '#94a3b8', fontSize: '14px', fontWeight: 'bold' }}>
            <Music size={20} color="#fb923c" /> {musicasInstaladas.length} FAIXAS NA NAVE
          </div>
          <div style={{ position: 'absolute', bottom: '25px', right: '40px', display: 'flex', alignItems: 'center', gap: '10px', color: '#94a3b8', fontSize: '14px', fontWeight: 'bold' }}>
            {albumsLocaisKeys.length} ÁLBUNS EXPLORADOS <Disc3 size={20} color="#fb923c" />
          </div>
        </div>

        <div style={{ padding: '0 50px', marginTop: '40px' }}>
          
          {/* 3. ÁLBUNS RECENTES (Abaixo do Cabeçalho) */}
          <div style={{ marginBottom: '50px' }}>
  <h2 style={{ color: 'white', fontSize: '22px', marginBottom: '20px', letterSpacing: '1px' }}>SETORES (ÁLBUNS) SINCRONIZADOS</h2>
  <div className="custom-scroll" style={{ display: 'flex', gap: '20px', overflowX: 'auto', paddingBottom: '20px' }}>
    {albumsFiltrados.length === 0 && <p style={{ color: '#64748b' }}>Nenhum setor escaneado. Comece a ouvir para registrar.</p>}
    {albumsFiltrados.map((alb, i) => (
      <Link 
        key={i} 
        to={`/album/${encodeURIComponent(nomeArtista)}/${encodeURIComponent(alb.collectionName)}`}
        style={{ textDecoration: 'none' }}
      >
        <motion.div whileHover={{ y: -5 }} style={{ minWidth: '160px', maxWidth: '160px', background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center', cursor: 'pointer' }}>
          <img src={alb.artworkUrl100.replace('100x100bb', '400x400bb')} style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', borderRadius: '8px', boxShadow: '0 10px 20px rgba(0,0,0,0.5)' }} alt={alb.collectionName} />
          <p style={{ color: 'white', fontSize: '13px', marginTop: '15px', marginBottom: '5px', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{alb.collectionName}</p>
          <span style={{ color: '#fb923c', fontSize: '12px', fontWeight: 'bold' }}>{alb.releaseDate.split('-')[0]}</span>
        </motion.div>
      </Link>
    ))}
  </div>
</div>

          {/* 4. DIVISÃO VERTICAL (TOP FAIXAS | TOP ÁLBUM) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '60px' }}>
            
            {/* ESQUERDA: AS FAIXAS (Com número de plays) */}
            <div>
              <h2 style={{ color: '#fb923c', fontSize: '20px', marginBottom: '25px', letterSpacing: '1px' }}>TOP INTERCEPTAÇÕES LOCAIS</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {top5Faixas.length > 0 ? top5Faixas.map((faixa: any, i: number) => (
                  <motion.div 
                    whileHover={{ scale: 1.02, backgroundColor: 'rgba(251, 146, 60, 0.1)' }}
                    key={i} 
                    onClick={() => { setFaixaAtual(faixa); setIsPlaying(true); }}
                    style={{ display: 'flex', alignItems: 'center', padding: '12px 20px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}
                  >
                    <span style={{ color: '#475569', fontWeight: 'bold', width: '30px' }}>{i + 1}</span>
                    <img src={faixa.capa} style={{ width: '45px', height: '45px', borderRadius: '6px', marginRight: '15px', objectFit: 'cover' }} alt="" />
                    
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <h4 style={{ margin: 0, fontSize: '15px', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{faixa.titulo}</h4>
                      <span style={{ color: '#64748b', fontSize: '12px' }}>{faixa.album || 'Single'}</span>
                    </div>
                    
                    {/* AQUI MOSTRA O NÚMERO DE VEZES QUE A FAIXA FOI TOCADA */}
                    <div style={{ marginRight: '20px', textAlign: 'right', display: 'flex', flexDirection: 'column' }}>
                      <span style={{ color: '#fb923c', fontSize: '15px', fontWeight: '900' }}>{faixa.plays}</span>
                      <span style={{ color: '#94a3b8', fontSize: '10px', letterSpacing: '1px' }}>PLAYS</span>
                    </div>
                    
                    <Play size={18} color="#fb923c" fill="#fb923c" />
                  </motion.div>
                )) : (
                  <p style={{ color: '#475569' }}>Sem dados de reprodução suficientes.</p>
                )}
              </div>
            </div>

            {/* DIREITA: ÁLBUM MAIS OUVIDO */}
            <div>
              <h2 style={{ color: '#fb923c', fontSize: '20px', marginBottom: '25px', letterSpacing: '1px' }}>SETOR MAIS EXPLORADO</h2>
              {topAlbumEntry ? (
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  style={{ background: 'linear-gradient(145deg, #111, #000)', padding: '40px', borderRadius: '30px', border: '1px solid #fb923c44', position: 'relative', overflow: 'hidden', textAlign: 'center', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}
                >
                  <Star size={150} color="#fb923c" style={{ position: 'absolute', top: '-30px', right: '-30px', opacity: 0.05 }} />
                  
                  <img 
                    src={albumsFiltrados.find(a => a.collectionName === topAlbumEntry[0])?.artworkUrl100.replace('100x100bb', '600x600bb') || dadosLocais.capa} 
                    style={{ width: '200px', height: '200px', objectFit: 'cover', borderRadius: '20px', marginBottom: '25px', boxShadow: '0 15px 30px rgba(0,0,0,0.6)' }} 
                    alt="Álbum Mais Ouvido"
                  />
                  
                  <h3 style={{ color: 'white', fontSize: '26px', margin: '0 0 15px 0' }}>{topAlbumEntry[0]}</h3>
                  
                  {/* CONTADOR DE HORAS */}
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', background: 'rgba(251, 146, 60, 0.1)', padding: '12px 25px', borderRadius: '50px', color: '#fb923c' }}>
                    <Clock size={20} />
                    <span style={{ fontSize: '18px', fontWeight: 'bold' }}>
                      {(Number(topAlbumEntry[1]) / 3600000).toFixed(1)}h DE VOO
                    </span>
                  </div>
                </motion.div>
              ) : (
                <div style={{ padding: '40px', background: 'rgba(255,255,255,0.02)', borderRadius: '30px', border: '1px dashed rgba(255,255,255,0.1)', textAlign: 'center' }}>
                  <Disc3 size={40} color="#475569" style={{ marginBottom: '15px' }} />
                  <p style={{ color: '#475569', margin: 0 }}>Aguardando telemetria de voo...</p>
                </div>
              )}
            </div>

          </div>
        </div>
      </motion.div>
    </div>
  );
}