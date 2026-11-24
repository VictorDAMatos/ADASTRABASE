import { Home, Disc, Heart, ListMusic, Library, Rocket, LibrarySquare } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';

export function Sidebar() {
  const menuItems = [
    { path: '/', label: 'Início', icon: <Home size={18} /> },
    { path: '/explore', label: 'Explorar', icon: <Rocket size={18} /> },
    { path: '/library', label: 'Biblioteca', icon: <Library size={18} /> },
    { path: '/favorites', label: 'Favoritos', icon: <Heart size={18} /> },
    { path: '/playlists', label: 'Playlists', icon: <ListMusic size={18} /> },
    { path: '/artistas', label: 'Artistas', icon: <Disc size={18} /> },
    { path: '/albuns', label: 'Álbuns', icon: <LibrarySquare size={18} /> }, // NOVA ABA DE ÁLBUNS
  ];

  const getNavItemStyle = ({ isActive }: { isActive: boolean }) => ({
    ...styles.navItem,
    color: isActive ? '#ffffff' : '#94a3b8',
    backgroundColor: isActive ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
    borderRight: isActive ? '3px solid #ffffff' : '3px solid transparent',
    boxShadow: isActive ? 'inset -10px 0 25px rgba(255, 255, 255, 0.05)' : 'none',
  });

  return (
    <aside style={styles.sidebarContainer}>
      <style>{`
        @keyframes starsMove {
          from { background-position: 0 0; }
          to { background-position: 150px 300px; }
        }
        @keyframes pulseGlowWhite {
          0%, 100% { opacity: 0.7; filter: drop-shadow(0 0 4px rgba(255,255,255,0.3)); }
          50% { opacity: 1; filter: drop-shadow(0 0 12px rgba(255,255,255,0.8)); }
        }
        .nav-item-hover:hover {
          background-color: rgba(255, 255, 255, 0.06) !important;
          color: #ffffff !important;
        }
        .nav-item-hover:hover svg {
          color: #ffffff !important;
          transform: scale(1.08);
        }
      `}</style>

      {/* ANIMAÇÃO DA GALÁXIA AO FUNDO */}
      <div style={styles.galaxyBackground}></div>

      {/* CONTEÚDO DA SIDEBAR */}
      <div style={styles.contentWrapper}>
        <div style={styles.logoContainer}>
          <h2 style={styles.logo}>
            <span style={{ color: '#94a3b8', fontWeight: 300, letterSpacing: '2px' }}>AD </span>
            <span style={{ color: '#ffffff', fontWeight: 900, letterSpacing: '4px', animation: 'pulseGlowWhite 4s infinite ease-in-out' }}>ASTRA</span>
          </h2>
        </div>

        <nav style={styles.navMenu}>
          {menuItems.map((item) => (
            <NavLink key={item.path} to={item.path} style={getNavItemStyle} className="nav-item-hover">
              {({ isActive }) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', width: '100%', position: 'relative' }}>
                  <span style={{ color: isActive ? '#ffffff' : '#64748b', display: 'flex', alignItems: 'center', transition: '0.2s' }}>
                    {item.icon}
                  </span>
                  <span style={{ transition: 'color 0.2s ease' }}>{item.label}</span>
                  
                  {isActive && (
                    <motion.div 
                      layoutId="sidebarActiveIndicator"
                      style={{ position: 'absolute', right: '-16px', width: '4px', height: '18px', backgroundColor: '#ffffff', borderRadius: '4px 0 0 4px', boxShadow: '0 0 10px #ffffff' }}
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        <div style={{ marginTop: 'auto', paddingLeft: '16px', fontSize: '9px', color: '#64748b', fontWeight: 'bold', letterSpacing: '3px', userSelect: 'none' }}>
          SYS OP V5.0 // ONLINE
        </div>
      </div>
    </aside>
  );
}

const styles = {
  sidebarContainer: {
    width: '260px', minWidth: '260px', flexShrink: 0, 
    backgroundColor: 'rgba(8, 8, 10, 0.8)',
    backdropFilter: 'blur(25px)', WebkitBackdropFilter: 'blur(25px)',
    borderRight: '1px solid rgba(255, 255, 255, 0.05)',
    height: '100vh', position: 'relative' as const, overflow: 'hidden',
    boxShadow: '10px 0 40px rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column' as const, zIndex: 100 
  },
  galaxyBackground: {
    position: 'absolute' as const, top: 0, left: 0, right: 0, bottom: 0,
    backgroundImage: `radial-gradient(1px 1px at 10% 10%, #ffffff, rgba(0,0,0,0)), radial-gradient(1px 1px at 30% 40%, #cccccc, rgba(0,0,0,0)), radial-gradient(2px 2px at 60% 70%, #ffffff, rgba(0,0,0,0)), radial-gradient(1.5px 1.5px at 80% 20%, #999999, rgba(0,0,0,0))`,
    backgroundSize: '150px 150px', opacity: 0.22, animation: 'starsMove 40s linear infinite', zIndex: 0, pointerEvents: 'none' as const
  },
  contentWrapper: { position: 'relative' as const, zIndex: 1, display: 'flex', flexDirection: 'column' as const, padding: '45px 20px 30px 20px', height: '100%', boxSizing: 'border-box' as const },
  logoContainer: { marginBottom: '50px', paddingLeft: '16px' },
  logo: { fontSize: '24px', margin: 0, userSelect: 'none' as const },
  navMenu: { display: 'flex', flexDirection: 'column' as const, gap: '6px' },
  navItem: { display: 'flex', alignItems: 'center', padding: '14px 16px', borderRadius: '12px', textDecoration: 'none', fontWeight: 'bold' as const, fontSize: '14px', transition: 'background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease', cursor: 'pointer' }
};