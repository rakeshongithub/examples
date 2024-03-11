import './App.css';
import envConfig from './environments/environment';

function App() {
  return (
    <div className="App">
      Selected Environment name is: <strong>{envConfig.name?.toUpperCase()}</strong>
    </div>
  );
}

export default App;
