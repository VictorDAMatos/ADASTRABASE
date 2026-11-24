import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Clock, ArrowLeft, Disc, Award } from 'lucide-react';
import { SpaceBackground } from './ArtistasGrid';
import { useMusicStore } from '../store/musicStore';
import { usePlayerStore } from '../store/playerStore';
import { useArtistStore } from '../store/artistaStore';

export function AlbumPage() {
  const { artista, album } = useParams<{ artista: string; album: string }>();
  const nomeArtista = decodeURIComponent(artista || '').trim();
  const nomeAlbum = decodeURIComponent(album || '').trim();

  const { biblioteca } = useMusicStore();
  const { setFaixaAtual, setIsPlaying } = usePlayerStore();
  const { artistas } = useArtistStore();

  // Coleta dados de telemetria do artista
  const dadosArtista = artistas[nomeArtista] || { faixasOuvidas: {}, albumsOuvidos: {} };
  
  // Filtra apenas as faixas deste álbum específico
  const faixasDoAlbum = (biblioteca || []).filter(
    (m: any) => 
      (m.artista || '').trim().toLowerCase() === nomeArtista.toLowerCase() &&
      (m.album || '').trim().toLowerCase() === nomeAlbum.toLowerCase()
  );

  // Mapeia os plays e ordena por frequência (Mais ouvidas primeiro)
  const faixasOrdenadasPorFrequencia = [...faixasDoAlbum]
    .map(faixa => ({
      ...faixa,
      plays: dadosArtista.faixasOuvidas[faixa.titulo] || 0
    }))
    .sort((a, b) => b.plays - a.plays);

  const capaAlbum = faixasDoAlbum[0]?.capa || 'https://images.unsplash.com/photo-1614149162883-504ce4d13909?q=80&w=500';
  const tempoTotalMs = dadosArtista.albumsOuvidos[nomeAlbum] || 0;
  const horasDeVoo = (tempoTotalMs / 3600000).toFixed(1);

  return (
    <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden', paddingBottom: '100px' }}>
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <SpaceBackground />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        style={{ position: 'relative', zIndex: 1, padding: '40px 50px' }}
      >
        {/* BOTÃO VOLTAR */}
        <Link to={`/artista/${encodeURIComponent(nomeArtista)}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#64748b', textDecoration: 'none', fontWeight: 'bold', marginBottom: '30px', transition: '0.2s' }}>
          <ArrowLeft size={18} /> VOLTAR PARA {nomeArtista.toUpperCase()}
        </Link>

        {/* CABEÇALHO DO ÁLBUM */}
        <div style={{ display: 'flex', gap: '40px', alignItems: 'flex-end', marginBottom: '50px' }}>
          <img 
            src={capaAlbum} 
            style={{ width: '240px', height: '240px', objectFit: 'cover', borderRadius: '20px', boxShadow: '0 25px 50px rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.1)' }} 
            alt={nomeAlbum} 
          />
          <div>
            <span style={{ color: '#fb923c', fontWeight: '900', fontSize: '12px', letterSpacing: '3px' }}>SETOR DE ARQUIVOS (ÁLBUM)</span>
            <h1 style={{ color: 'white', fontSize: '56px', fontWeight: '900', margin: '5px 0 15px 0', letterSpacing: '-1px' }}>{nomeAlbum}</h1>
            <p style={{ color: '#94a3b8', margin: 0, fontSize: '16px', fontWeight: 'bold' }}>
              Artista: <span style={{ color: 'white' }}>{nomeArtista}</span>
            </p>
            <div style={{ display: 'flex', gap: '20px', marginTop: '15px', color: '#64748b', fontSize: '13px', fontWeight: 'bold' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Disc size={16} color="#fb923c" /> {faixasDoAlbum.length} FAIXAS</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={16} color="#fb923c" /> {horasDeVoo}H DE VOO NESTE SETOR</span>
            </div>
          </div>
        </div>

        {/* LISTA DE FAIXAS (DESTAQUE PARA AS MAIS FREQUENTES) */}
        <div>
          <h2 style={{ color: 'white', fontSize: '20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Award size={22} color="#fb923c" /> FAIXAS POR ORDEM DE ACESSO FREQUENTE
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {faixasOrdenadasPorFrequencia.length > 0 ? faixasOrdenadasPorFrequencia.map((faixa: any, idx: number) => {
              const IsTopTrack = idx === 0 && faixa.plays > 0;
              return (
                <motion.div
                  key={faixa.id}
                  whileHover={{ scale: 1.01, backgroundColor: 'rgba(255,255,255,0.04)' }}
                  onClick={() => { setFaixaAtual(faixa); setIsPlaying(true); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '14px 24px',
                    background: IsTopTrack ? 'linear-gradient(90deg, rgba(251,146,60,0.1) 0%, rgba(0,0,0,0.2) 100%)' : 'rgba(0,0,0,0.2)',
                    borderRadius: '14px',
                    border: IsTopTrack ? '1px solid rgba(251,146,60,0.3)' : '1px solid rgba(255,255,255,0.03)',
                    cursor: 'pointer'
                  }}
                >
                  <span style={{ width: '40px', color: IsTopTrack ? '#fb923c' : '#475569', fontWeight: 'bold' }}>
                    {IsTopTrack ? '★' : idx + 1}
                  </span>
                  
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: 0, color: 'white', fontSize: '15px' }}>{faixa.titulo}</h4>
                    <span style={{ color: '#64748b', fontSize: '12px' }}>{nomeArtista}</span>
                  </div>

                  <div style={{ marginRight: '30px', textAlign: 'right' }}>
                    <span style={{ color: IsTopTrack ? '#fb923c' : '#94a3b8', fontSize: '14px', fontWeight: '900' }}>{faixa.plays}</span>
                    <span style={{ color: '#475569', fontSize: '10px', marginLeft: '5px', letterSpacing: '1px' }}>PLAYS</span>
                  </div>

                  <Play size={16} color="#fb923c" fill="#fb923c" />
                </motion.div>
              );
            }) : (
              <p style={{ color: '#475569' }}>Nenhuma órbita encontrada para este álbum na biblioteca.</p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}