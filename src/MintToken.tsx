import {
    clusterApiUrl,
    Connection,
    PublicKey,
    Keypair,
    LAMPORTS_PER_SOL
} from "@solana/web3.js"
import {
    createMint,
    getOrCreateAssociatedTokenAccount,
    mintTo,
    transfer,
    Account,
    getMint,
    getAccount
} from "@solana/spl-token"

// Special setup to add a Buffer class, because it's missing
window.Buffer = window.Buffer || require("buffer").Buffer;

function MintToken() {

    const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
    const fromWallet = Keypair.generate();
    let mint: PublicKey;
    let fromTokenAccount: Account;
    // 4y5V48GwrwepSkCbJgquPmYvbCodpPENhUvKyorbQTih
    const toWallet = new PublicKey("Ek31enXJM2C49XXFa8vFT8ZLRvSZARRNjsCERu9dZwTX")

    async function createToken() {
        const fromAirdropSignature = await connection.requestAirdrop(fromWallet.publicKey, LAMPORTS_PER_SOL);
        await connection.confirmTransaction(fromAirdropSignature);
        console.log(`fromWallet: ${fromWallet.publicKey.toString()}`);


        //create new token mint
        mint = await createMint(
            connection,
            fromWallet,
            fromWallet.publicKey,
            null,
            9 // 9 here means we have a decimal of 9 0's
        );
        console.log(`Create token: ${mint.toBase58()}`);

        // get the token account of the fromWallet address, and if it does not exist, create it
        fromTokenAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            fromWallet,
            mint,
            fromWallet.publicKey
        )
        console.log(`create token account: ${fromTokenAccount.address.toBase58()}`);

    }

    async function mintToken() {
        // Mint 1 new token to the "fromTokenAccount" account we just created
        const signature = await mintTo(
            connection,
            fromWallet,
            mint,
            fromTokenAccount.address,
            fromWallet.publicKey,
            1000000000
        );
        console.log(`Mint signature: ${signature}`);
    }

    async function checkBalance() {
        // get the supply of tokens we have minted into existance
        const mintInfo = await getMint(connection, mint);
        console.log(mintInfo.supply);

        //get the amount of tokens left in the account
        const tokenAccountInfo = await getAccount(connection, fromTokenAccount.address)
        console.log(tokenAccountInfo.amount);
    }

    async function sendToken() {
        //get the token account of the toWallet address, and if it does not exist, create it
        const toTokenAccount = await getOrCreateAssociatedTokenAccount(connection, fromWallet, mint, toWallet);
        console.log(`toTokenAccount ${toTokenAccount.address}`);

        const signature = await transfer(
            connection,
            fromWallet,
            fromTokenAccount.address,
            toTokenAccount.address,
            fromWallet.publicKey,
            1000000000
        );
        console.log(`finished transfer with ${signature}`);

    }

    return (
        <div>
            Mint Token Section
            <div>
                <button onClick={createToken}>Create token</button>
                <button onClick={mintToken}>Mint token</button>
                <button onClick={checkBalance}>Check balance</button>
                <button onClick={sendToken}>Send token</button>
            </div>
        </div>
    );
}

export default MintToken;
