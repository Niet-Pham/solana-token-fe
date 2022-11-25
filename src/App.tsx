import './App.css';
import MintNFT from './MintNFT';
import MintToken from './MintToken';
import SendSol from './SendSol';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <MintToken />
        <MintNFT />
        <SendSol />
      </header>
    </div>
  );
}

export default App;
