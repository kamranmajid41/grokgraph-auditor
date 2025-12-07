import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Header } from './components/Header';
import { HomePage } from './pages/HomePage';
import { ArticlePage } from './pages/ArticlePage';
import './App.css';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-[#0a0a0a] text-[#e5e5e5]">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/article" element={<><Header /><ArticlePage /></>} />
          </Routes>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
