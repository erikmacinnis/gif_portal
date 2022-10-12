import './App.css';
import {useEffect, useState} from 'react'
import {Connection, PublicKey, clusterApiUrl, LAMPORTS_PER_SOL} from "@solana/web3.js";
import {Program, Provider, web3, utils, BN} from "@project-serum/anchor";
import idl from "./idl.json"
import kp from "./keypair.json"
const arr = Object.values(kp._keypair.secretKey)
const secret = new Uint8Array(arr)
const baseAccount = web3.Keypair.fromSecretKey(secret)

const programId = new PublicKey(idl.metadata.address)
const opts = {
  // another option is "finalized"
  // This option is a little more secure
  // this signifies how long we will wait for us to say a transacion has gone through
  preflightCommitment: "processed"
}
const {SystemProgram} = web3

const App = () => {

  const [walletAddress, setWalletAddress] = useState(null)
  const [inputValue, setInputValue] = useState("")
  const [gifList, setGifList] = useState(null)
  const [amount, setAmount] = useState('')

  const handleChange = event => {
    setAmount(event.target.value)
    console.log('value is:', event.target.value);
  }

  useEffect(() => {
    if (walletAddress) {
      console.log("Fetching the GIF List...")

      getGifList()
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

  const getGifList = async() => {
    try {
      const provider = getProvider()
      const program = new Program(idl, programId, provider)
      const account = await program.account.baseAccount.fetch(baseAccount.publicKey)

      console.log("Got the account: ", account)
      setGifList(account.gifList)
    } catch (error) {
      console.log("Error in getGifList: ", error)
    }
  }

  const startStuffOff = async() => {
    try {
      const provider = getProvider()
      const program = new Program(idl, programId, provider)
      await program.rpc.startStuffOff({
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId
        },
        signers: [baseAccount]
      })
      console.log("Create a new BaseAccount w address: ", baseAccount.publicKey.toString())
      await getGifList()
    } catch(error) {
      console.error("Error in createGifAccount: ", error)
    }
  }

  const tip = async(event, pubkey) => {
    try {
      event.preventDefault()
      console.log("value: ", amount)
      console.log("address: ", pubkey.toString())
      const tip = Number(amount)
      if (isNaN(tip)) {
        throw NaN
      }
      const provider = getProvider()
      const program = new Program(idl, programId, provider)

      const tx = await program.rpc.tip(new BN(tip * LAMPORTS_PER_SOL), {
        accounts: {
          owner: pubkey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        }
      })

      console.log("Send tx: ", tx)
    } catch(err) {
      console.log("Error adding tip: ", err)
    }
  }

  const upVote = async(index) => {
    try {
      const provider = getProvider()
      const program = new Program(idl, programId, provider)
      const i = gifList.length - index - 1
      console.log("Index: ", i)
      await program.rpc.upVote(new BN(i), {
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
        }
      })

      console.log("Upvoted the gif")
    } catch(err) {
      console.log("Error upvoting: ", err)
    }
  }

  const renderNotConnectedContainer = () => {
    return (
      <button 
        className="cta-button connect-wallet-button" 
        onClick={connectWallet}>
        Connect to Wallet
      </button>
    )
  }

  const sendGif = async() => {
    if (inputValue.length > 0) {
      console.log("Gif Link: ", inputValue)
      try {
        const provider = getProvider()
        const program = new Program(idl, programId, provider)
        await program.rpc.addGif(inputValue, {
          accounts: {
            baseAccount: baseAccount.publicKey,
            user: provider.wallet.publicKey
          }
        })
        console.log("Gif sent to program: ", inputValue)
        await getGifList()
        setInputValue("")
      } catch(err) {
        console.error("Error in send gif: ", err)
      }
    } else {
      console.log("Gif Link is empty")
    }
  }

  const onInputChange = event => {
    const {value} = event.target
    setInputValue(value)
  }

  const renderConnectedContainer = () => {
    if (gifList === null) {
      console.log("Inside null gif list")
      return (
        <div className="connected-container">
          <button className="cta-button submit-gif-button" onClick={startStuffOff}>
            Do One-time initialization for Gif Program Account
          </button>
        </div>
      )
    }
    else {
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
            {gifList.slice(0).reverse().map((item, index) => (
                <div className='gif-item' key={index}>
                  <img src={item.gifLink} alt={item.gifLink}></img>
                  <p>{item.userAddress.toString()}</p>
                  <p>Number of Upvotes: {item.upvotes.toString()}</p>
                  <form onSubmit={event => tip(event, item.userAddress)}>
                    <label htlmfor="tip">Add a tip: </label>
                    <input type="text" id="tip" name="tip" onChange={handleChange}></input>
                    <input type="submit"></input>
                  </form>
                <button  onClick={() => upVote(index)}>
                Upvote this Gif
              </button>
                </div>
            ))}
          </div>
        </div>
      )
    }
  }

  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          <p className="header">🖼 GIF Portal</p>
          <p className="sub-text">
            View your GIF collection in the metaverse ✨
          </p>
          {!walletAddress && renderNotConnectedContainer()}
          {walletAddress && renderConnectedContainer()}
        </div>
      </div>
    </div>
  );
};

export default App;
