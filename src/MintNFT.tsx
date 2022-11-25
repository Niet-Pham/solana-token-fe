import {
    clusterApiUrl,
    Connection,
    PublicKey,
    Keypair,
    LAMPORTS_PER_SOL,
    Transaction,
    sendAndConfirmTransaction
} from "@solana/web3.js"
import {
    createMint,
    getOrCreateAssociatedTokenAccount,
    mintTo,
    Account,
    createSetAuthorityInstruction,
    AuthorityType
} from "@solana/spl-token"

// Special setup to add a Buffer class, because it's missing
window.Buffer = window.Buffer || require("buffer").Buffer;

function MintNFT() {
    const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
    const fromWallet = Keypair.generate();
    let mint: PublicKey;
    let fromNFTAccount: Account;
    // 4y5V48GwrwepSkCbJgquPmYvbCodpPENhUvKyorbQTih
    const toWallet = new PublicKey("Ek31enXJM2C49XXFa8vFT8ZLRvSZARRNjsCERu9dZwTX")

    async function createNFT() {
        const fromAirdropSignature = await connection.requestAirdrop(fromWallet.publicKey, LAMPORTS_PER_SOL)
        await connection.confirmTransaction(fromAirdropSignature)

        //create new NFT mint
        mint = await createMint(
            connection,
            fromWallet,
            fromWallet.publicKey,
            null,
            0 // only allow whole tokens
        );
        console.log(`Create NFT: ${mint.toBase58()}`);

        fromNFTAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            fromWallet,
            mint,
            fromWallet.publicKey,
        );

        console.log(`Create NFT account: ${fromNFTAccount.address}`);

    }

    async function mintNFT() {
        // Mint 1 new token to the "fromNFTAccount" account we just create
        const signature = await mintTo(
            connection,
            fromWallet,
            mint,
            fromNFTAccount.address,
            fromWallet.publicKey,
            1
        );
        console.log(`Mint signature: ${signature}`);

    }

    async function lockNFT() {
        // create our transaction to change minting permissions
        let transaction = new Transaction().add(createSetAuthorityInstruction(
            mint,
            fromWallet.publicKey,
            AuthorityType.MintTokens,
            null
        ))

        // Send transaction
        const signature = await sendAndConfirmTransaction(
            connection,
            transaction,
            [fromWallet]
        )
        console.log(`Lock signature: ${signature}`);


    }

    return (
        <div>
            Mint NFT Section
            <div>
                <button onClick={createNFT}>Create NFT</button>
                <button onClick={mintNFT}>Mint NFT</button>
                <button onClick={lockNFT}>Lock NFT</button>
            </div>
        </div>
    );
}

export default MintNFT;
