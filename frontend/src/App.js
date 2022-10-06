import './App.css';
import {useEffect, useState} from 'react'
import {Connection, PublicKey, clusterApiUrl} from "@solana/web3.js";
import {Program, Provider, web3, utils, BN} from "@project-serum/anchor";
import idl from "./idl.json"
const network = clusterApiUrl("devnet")
const programId = new PublicKey(idl.metadata.address)
const opts = {
  // another option is "finalized"
  // This option is a little more secure
  // this signifies how long we will wait for us to say a transacion has gone through
  preflightCommitment: "processed"
}
const {SystemProgram} = web3

const TEST_GIFS = [
  "https://media.giphy.com/media/ZV6feeTgThqPyjEG5c/giphy.gif",
  "https://media.giphy.com/media/HggxGlGAWFkbK/giphy.gif",
  "https://media.giphy.com/media/MfmRTpIZWorO1UFvte/giphy.gif"
]

const App = () => {

  const [walletAddress, setWalletAddress] = useState(null)
  const [inputValue, setInputValue] = useState("")
  const [gifList, setGifList] = useState([])

  useEffect(() => {
    if (walletAddress) {
      console.log("Fetching the GIF List...")

      async function checkIfStartedAsyncAndSetGifListAsync(){
        await checkIfStartedAsyncAndSetGifList()
      }
      checkIfStartedAsyncAndSetGifListAsync()
    }
  }, [walletAddress])

  useEffect(() => {
    const onLoad = async() => {
      await checkWalletConnected();
    }
    window.addEventListener("load", onLoad)
    // this return will clean up the listner 
    return () => window.removeEventListener("load", onLoad);
  }, [])

  useEffect(() => {}, [gifList])

  // Getting authenticated connection to solana (provider)
  const getProvider = () => {
    // const connection = new Connection(network, opts.preflightCommitment)
    // const provider = new AnchorProvider(connection, window.solana, opts.preflightCommitment)
    // return provider
    const rpcHost = "https://api.devnet.solana.com"
    const connection = new Connection(rpcHost)
    const provider = new Provider(connection, window.solana, opts.preflightCommitment)
    return provider
  }

  const checkWalletConnected = async() => {
    try {
      // solana wallet is in window then it will inject the solana object
      // we can grab the solana object like so
      const {solana} = window;
      if (solana) {
        if (solana.isPhantom) {
          console.log("Found phantom wallet")
          // checking if the user gave us authorization to use their wallet
          const response = await solana.connect({
            // onlyIfTrusted when true means that a user who has already been connected will automatically connect
            onlyIfTrusted: true,
          })
          console.log("Connected with pubkey: ", response.publicKey.toString())
          setWalletAddress(response.publicKey.toString())
        } else {
          alert("Get a Phantom Wallet")
        }
      }
    } catch (error) {
      alert("Solana Object not found! \nGet a Phantom Wallet")
      console.error(error)
    }
  }

  const connectWallet = async() => {
    const {solana} = window
    if (solana) {
      const response = await solana.connect()
      console.log("Connected with public key: ", response.publicKey.toString())
      setWalletAddress(response.publicKey.toString())
    }
  }

  const checkIfStartedAsyncAndSetGifList = async () => {
    const connection = new Connection(network, opts.preflightCommitment)
    const provider = getProvider()
    const program = new Program(idl, programId, provider)

    const accounts = await connection.getProgramAccounts(programId)
    const baseAccount = accounts[0]
    console.log(baseAccount)
    
    const baseAccountData = await program.account.baseAccount.fetch(baseAccount.pubkey)

    console.log(baseAccountData.totalGifs.toNumber())
    console.log("gifList: ", baseAccountData.gifList)

    if (baseAccountData.totalGifs.toNumber() === 1) {
      console.log("It hasn't started yet")
      await startOff()
    }
    
    setGifList(baseAccountData.gifList)
  }

  const renderNotConnectedContainer = () => {
    return <button onClick={connectWallet}>Connect to Wallet</button>
  }

  const sendGif = async() => {
    if (inputValue.length > 0) {
      console.log("Gif Link: ", inputValue)
      console.log(gifList.push(inputValue))
      setGifList(gifList)
      setInputValue("")
    } else {
      console.log("Gif Link is empty")
    }
  }

  const onInputChange = event => {
    const {value} = event.target
    setInputValue(value)
  }

  const startOff = async () => {
    try {
      const provider = getProvider()
      const program = new Program(idl, programId, provider)
      const [baseAccount] = await PublicKey.findProgramAddress(
        [],
        program.programId
      )
      console.log(baseAccount)
      console.log(program.rpc)
      await program.rpc.startStuffOff({
        accounts: {
          baseAccount,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId
        },
        singers: [baseAccount]
      })
      console.log("Created a new campaign w addres: ", baseAccount.toString())
    } catch (err) {
      console.error("Error In the starting off function: ", err)
    }
  }

  // const addGif = () => {
  //   try {
  //     const provider = getProvider()
  //     const program = new Program(idl, programId, provider)
  //     const [baseAccount] = await PublicKey.findProgramAddress(
  //       [],
  //       program.programId
  //     )
  //     console.log(baseAccount)
  //     console.log(program.rpc)
  //     await program.rpc.startStuffOff({
  //       accounts: {
  //         baseAccount,
  //         user: provider.wallet.publicKey,
  //         systemProgram: SystemProgram.programId
  //       },
  //       singers: [baseAccount]
  //     })
  //     console.log("Created a new campaign w addres: ", baseAccount.toString())
  //   } catch (err) {
  //     console.error("Error In the starting off function: ", err)
  //   }
  // }

  const renderConnectedContainer = () => {
    console.log("the gifList: ", gifList)
    return (
      <div className='connected-container'>
        <form
          onSubmit={event => {
            event.preventDefault()
            sendGif()
          }}>
            <input type="text" placeholder="Enter gif link!" onChange={
              // We don't use the parentheses because we are just passing a reference to the input element
              // When the input element is translated to pure react we don't want the function being called
              onInputChange
              }/>
            <button type="submit" className="cta-button submit-gif-button">Submit</button>
        </form>
        <div className='gif-grid'>
          {gifList.map( gif => (
              <div className='gif-item' key={gif.gifLink}>
                <img src={gif.gifLink} alt={gif.gifLink}></img>
                <p>{gif.userAddress.toString()}</p>
              </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="App">
      {!walletAddress && renderNotConnectedContainer()}
      <div className="container">
        <div className="header-container">
          <p className="header">🖼 GIF Portal</p>
          <p className="sub-text">
            View your GIF collection in the metaverse ✨
          </p>
          {walletAddress && renderConnectedContainer()}
        </div>
      </div>
    </div>
  );
};

export default App;
