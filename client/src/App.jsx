import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Chat from './pages/Chat';
import Summarizer from './pages/Summarizer';
import Quiz from './pages/Quiz';
import Planner from './pages/Planner';
import About from './pages/About';
import NotFound from './pages/NotFound';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="chat" element={<Chat />} />
          <Route path="summarizer" element={<Summarizer />} />
          <Route path="quiz" element={<Quiz />} />
          <Route path="planner" element={<Planner />} />
          <Route path="about" element={<About />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
