const anchor = require("@project-serum/anchor");
const {BN, web3} = require("@project-serum/anchor");
const { SplTokenTypesCoder } = require("@project-serum/anchor/dist/cjs/coder/spl-token/types");
const {Connection} = require("@solana/web3.js")

const main = async() => {
  console.log("Starting Test")
  // to what env you have set in the Anchor Toml
  provider = anchor.AnchorProvider.env()
  anchor.setProvider(provider);

  const rpcHost = "https://api.devnet.solana.com"
  const connection = new Connection(rpcHost)

  const program = anchor.workspace.GifPortalWithBackend

  const baseAccount = anchor.web3.Keypair.generate()

  const tx = await program.methods.startStuffOff()
  .accounts({
    baseAccount: baseAccount.publicKey,
    user: provider.wallet.publicKey,
    systemProgram: anchor.web3.SystemProgram.programId,
  })
  .signers([baseAccount])
  .rpc();

  console.log("Your transaction signature: ", tx)

  let account = await program.account.baseAccount.fetch(
    baseAccount.publicKey
  )
  console.log("Gif Count: ", account.totalGifs.toString())

  await program.methods.addGif("https://media.giphy.com/media/BI0NvISfNMTa6Ey99x/giphy.gif")
  .accounts({
    baseAccount: baseAccount.publicKey,
    user: provider.wallet.publicKey
  })
  .rpc()

  account = await program.account.baseAccount.fetch(
    baseAccount.publicKey,
  )
  console.log("Gif Count: ", account.totalGifs.toString())

  item = account.gifList[0]

  console.log("GifLinks: ", account.gifList)

  let balance = await connection.getBalance(item.userAddress)
  console.log("Balance before tip: ", balance)

  console.log("Item: ", item)

  const tipTx = await program.methods.tip(new BN(0.5 * web3.LAMPORTS_PER_SOL))
  .accounts({
    user: provider.wallet.publicKey,
    owner: item.userAddress,
    systemProgram: anchor.web3.SystemProgram.programId,
  })
  .rpc()

  console.log("Money sent to: ", item.userAddress.toString(), " from: ", provider.wallet.publicKey.toString())
  console.log("tip transaction signature: ", tipTx)

  balance = await connection.getBalance(item.userAddress)
  console.log("Balance after tip: ", balance)

  console.log("Attempting to upvote")

  console.log("gifLink param: ", item.gifLink)

  index = 0;

  const tx1 = await program.methods.upVote(new BN(0))
  .accounts({
    baseAccount: baseAccount.publicKey,
    user: provider.wallet.publicKey
  })
  .rpc()

  console.log("Upvote signature: ", tx1)

  setTimeout(function() {}, 20000)

  account = await program.account.baseAccount.fetch(
    baseAccount.publicKey
  )

  item = account.gifList[0]
  console.log("item: ", item)
  console.log("The number of upvotes should be one: ", item.upvotes.toNumber())
  console.log("The upvoters should have one as well: ", item.upvoters[0])

  account = await program.account.baseAccount.fetch(
    baseAccount.publicKey
  )
  
  item = account.gifList[0]
  console.log("item: ", item)
  console.log("The number of upvotes should be one: ", item.upvotes.toNumber())
  console.log("The upvoters should have one as well: ", item.upvoters[0])
}

const runMain = async() => {
  try {
    await main()
    process.exit(0)
  } catch(error) {
    console.log(error)
    process.exit(1)
  }
}

runMain()
