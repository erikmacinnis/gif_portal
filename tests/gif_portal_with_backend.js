const anchor = require("@project-serum/anchor");

const main = async() => {
  console.log("Starting Test")
  // to what env you have set in the Anchor Toml
  provider = anchor.AnchorProvider.env()
  anchor.setProvider(provider);
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

  console.log("Gif Link: ", account.gifList[0])
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
