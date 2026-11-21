// src/App.jsx
import AppRoutes from './routes/AppRoutes';
import ReloadPrompt from './components/common/ReloadPrompt';

function App() {
  return (
    <div className="App">
      <AppRoutes />
      <ReloadPrompt />
    </div>
  );
}

export default App;
