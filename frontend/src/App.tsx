import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import SamplePage from './pages/SamplePage';

function App() {
  return (
    <Router>
      <div>
        <Routes>
          <Route
            path="/"
            element={
              <div>
                <h1>Hello World</h1>
                <Link to="/sample">Go to Sample Page</Link>
              </div>
            }
          />
          <Route path="/sample" element={<SamplePage />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
