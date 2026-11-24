// src/renderer/src/pages/index.tsx

const pageStyles = {
  container: { width: '100%', height: '100%', display: 'flex', flexDirection: 'column' as const, gap: '20px' },
  title: { fontSize: '32px', fontWeight: 'bold', color: 'var(--text-primary)' },
  subtitle: { color: 'var(--text-secondary)' }
}

export function Home() {
  return (
    <div style={pageStyles.container}>
      <h1 style={pageStyles.title}>Início</h1>
      <p style={pageStyles.subtitle}>Bem-vindo de volta ao AD ASTRA.</p>
    </div>
  )
}

export function Albums() {
  return (
    <div style={pageStyles.container}>
      <h1 style={pageStyles.title}>Álbuns</h1>
      <p style={pageStyles.subtitle}>Sua coleção de discos.</p>
    </div>
  )
}

export function Favorites() {
  return (
    <div style={pageStyles.container}>
      <h1 style={pageStyles.title}>Favoritos</h1>
      <p style={pageStyles.subtitle}>Músicas e artistas que você curtiu.</p>
    </div>
  )
}

export function Playlists() {
  return (
    <div style={pageStyles.container}>
      <h1 style={pageStyles.title}>Playlists</h1>
      <p style={pageStyles.subtitle}>Suas seleções personalizadas.</p>
    </div>
  )
}

export function Profile() {
  return (
    <div style={pageStyles.container}>
      <h1 style={pageStyles.title}>Perfil</h1>
      <p style={pageStyles.subtitle}>Gerencie sua conta e customizações.</p>
    </div>
  )
}