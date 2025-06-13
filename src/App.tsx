import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./layouts/Layout";
import AboutPage from "./pages/AboutPage";
import DragAdvanced from "./components/Drag";

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<DragAdvanced />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/dashboard" element={<DragAdvanced />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
