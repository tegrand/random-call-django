import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Home, VideoCall } from './components';
import { AppProvider } from './context/AppContext';

const App = () => (
    <AppProvider>
        <BrowserRouter>
            <Routes>
                <Route path="/" element={(<Home />)} />
                <Route path="/call" element={(<VideoCall />)} />
            </Routes>
        </BrowserRouter>
    </AppProvider>
);

export default App