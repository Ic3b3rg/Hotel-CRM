// [APP] Root component with routing
// Gestisce il routing principale dell'applicazione

import { Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { Sidebar } from '@/components/sidebar';

// Pages
import Dashboard from '@/routes/index';
import Compratori from '@/routes/compratori';
import Venditori from '@/routes/venditori';
import Immobili from '@/routes/immobili';
import Trattative from '@/routes/trattative';

function App() {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar di navigazione */}
      <Sidebar />

      {/* Area contenuto principale */}
      <main className="flex-1 overflow-auto">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/compratori" element={<Compratori />} />
          <Route path="/venditori" element={<Venditori />} />
          <Route path="/immobili" element={<Immobili />} />
          <Route path="/trattative" element={<Trattative />} />
        </Routes>
      </main>

      {/* Toast notifications */}
      <Toaster position="bottom-right" />
    </div>
  );
}

export default App;
