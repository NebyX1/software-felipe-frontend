import { Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { motion } from 'framer-motion';
import NavBar from './components/common/navbar/NavBar';
import Footer from './components/common/footer/Footer';

const App = () => (
  <>
    <NavBar />
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      style={{ minHeight: 'calc(100vh - 112px)', backgroundColor: 'var(--bg)' }}
    >
      <Outlet />
    </motion.main>
    <Footer />
    <Toaster
      position="bottom-right"
      toastOptions={{
        style: {
          background: 'var(--surface)',
          color: 'var(--text)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          fontSize: '13px',
          fontFamily: 'system-ui, sans-serif',
        },
        success: { iconTheme: { primary: '#22c55e', secondary: 'var(--surface)' } },
        error: { iconTheme: { primary: '#ef4444', secondary: 'var(--surface)' } },
      }}
    />
  </>
);

export default App;

