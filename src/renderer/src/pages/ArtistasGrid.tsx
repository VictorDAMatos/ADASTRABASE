import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { usePlayerStore } from '../store/playerStore';
import { useEffect, useState } from 'react';

// Fundo Espacial Reutilizável
export const SpaceBackground = () => (
  <div className="space-background">
    <div className="sun-glow" />
    {/* Gerando 50 estrelas aleatórias */}
    {[...Array(50)].map((_, i) => (
      <div 
        key={i} 
        className="star" 
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          width: `${Math.random() * 3}px`,
          height: `${Math.random() * 3}px`,
          '--duration': `${2 + Math.random() * 4}s`
        } as any}
      />
    ))}
  </div>
);

export function ArtistasGrid() {
  // Aqui você buscaria os artistas agrupados da sua biblioteca
  // Para fins de demonstração da UI, vamos simular:
  const mockArtistas = [
    { nome: 'STARSET', imagem: 'https://images.unsplash.com/photo-1621360811095-d856cb0409a4?w=400' },
    { nome: 'Bring Me The Horizon', imagem: 'https://images.unsplash.com/photo-1598387181032-a3103a2db5b3?w=400' },
    { nome: 'Sleep Token', imagem: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400' },
    { nome: 'Bad Omens', imagem: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400' }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ padding: '40px', paddingBottom: '120px', minHeight: '100vh', position: 'relative' }}
    >
      <SpaceBackground />
      
      <h1 style={{ color: 'white', fontSize: '32px', marginBottom: '30px', fontWeight: 'bold' }}>Sua Constelação de Artistas</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '30px' }}>
        {mockArtistas.map((artista, index) => (
          <Link to={`/artista/${encodeURIComponent(artista.nome)}`} key={index} style={{ textDecoration: 'none' }}>
            <motion.div
              whileHover={{ scale: 1.05, y: -10 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                cursor: 'pointer'
              }}
            >
              <img 
                src={artista.imagem} 
                alt={artista.nome} 
                style={{ width: '140px', height: '140px', borderRadius: '50%', objectFit: 'cover', marginBottom: '15px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }} 
              />
              <h3 style={{ color: 'white', fontSize: '18px', textAlign: 'center', margin: 0 }}>{artista.nome}</h3>
            </motion.div>
          </Link>
        ))}
      </div>
    </motion.div>
  );
}