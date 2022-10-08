import {useEffect, useState} from 'react';
import './App.css';
import {Connection, PublicKey, clusterApiUrl} from '@solana/web3.js';
import {Program, AnchorProvider, web3, utils, BN} from '@project-serum/anchor';
import idl from './idl.json';
import {Buffer} from 'buffer';
window.Buffer = Buffer;

const network = clusterApiUrl('devnet');
const programId = new PublicKey(idl.metadata.address);
const opts = {
  preflightCommitment: 'processed', //get txn confirmation when the node we are connected to approves the txn
};
const {SystemProgram} = web3;

const App = () => {
  //state to store user's account's public key if wallet is connected to the website
  const [walletAddress, setWalletAddress] = useState(null);

  //getter function for provider: provider represents an authenticated connection to blockchain
  const getProvider = () => {
    const connection = new Connection(network, opts.preflightCommitment);
    const provider = new AnchorProvider(connection, window.solana, opts.preflightCommitment);
    return provider;
  };

  //function to check whether wallet is connected to the website on every page render
  const checkIfWalletIsConnected = async () => {
    try {
      const {solana} = window;
      if (solana) {
        if (solana.isPhantom) {
          console.log('Phantom wallet found!')
          const response = await solana.connect({
            onlyIfTrusted: true
          });
          console.log('connected with publickey', response.publicKey.toString());
          setWalletAddress(response.publicKey.toString());
        } else {
          console.log('Get phantom wallet!');
        }
      } else {
        alert('Solana object not found! Get phantom wallet!');
      }
    } catch (err) {
      console.error(err);
    }
  };

  //function to connect the user's wallet to the website
  const connectWallet = async () => {
    try {
      const {solana} = window;
      const response = await solana.connect();
      setWalletAddress(response.publicKey.toString());
      console.log('connected to public key', response.publicKey.toString());
    } catch (err) {
      console.error(err);
    }
  };

  //function to create a new campaign
  const createCampaign = async () => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programId, provider);
      const [campaign] = await PublicKey.findProgramAddress(
        [
          utils.bytes.utf8.encode('CAMPAIGN_DEMO'),
          provider.wallet.publicKey.toBuffer()
        ],
        program.programId
      );
      await program.rpc.create('Campaign Name', 'Campaign Description', {
        accounts: {
          campaign,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId
        }
      });
      console.log('created a new campaign with address', campaign.toString());
    } catch (err) {
      console.error(err);
    }
  };

  //connect wallet button component
  const renderIfNotConnected = () => {
    return (
      <button onClick={connectWallet}>Connect to Wallet</button>
    );
  };

  //create campaign button component
  const renderIfConnected = () => {
    return (
      <button onClick={createCampaign}>Create a Campaign</button>
    );
  };

  //checking whether wallet is connected or not on every page render
  useEffect(() => {
    const onLoad = async() => {
      await checkIfWalletIsConnected();
    };
    window.addEventListener('load', onLoad);
    return () => window.removeEventListener('load', onLoad);
  }, []);

  return (
    <div className="App">
      {!walletAddress && renderIfNotConnected()}
      {walletAddress && renderIfConnected()}
    </div>
  );

};

export default App;
