import {
    clusterApiUrl,
    Connection,
    PublicKey,
    Keypair,
    LAMPORTS_PER_SOL,
    Transaction,
    sendAndConfirmTransaction,
    SystemProgram
} from "@solana/web3.js"
import {
    getAccount,
    getAssociatedTokenAddress,
    NATIVE_MINT,
    createAssociatedTokenAccountInstruction,
    createSyncNativeInstruction,
    transfer,
    getOrCreateAssociatedTokenAccount,
    closeAccount
} from "@solana/spl-token"

// Special setup to add a Buffer class, because it's missing
window.Buffer = window.Buffer || require("buffer").Buffer;

function SendSol() {
    const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
    const fromWallet = Keypair.generate();
    let associatedTokenAccount: PublicKey;
    // 4y5V48GwrwepSkCbJgquPmYvbCodpPENhUvKyorbQTih
    const toWallet = new PublicKey("Ek31enXJM2C49XXFa8vFT8ZLRvSZARRNjsCERu9dZwTX")

    async function wrapSol() {
        const airdropSignature = await connection.requestAirdrop(
            fromWallet.publicKey,
            2 * LAMPORTS_PER_SOL,
        );

        await connection.confirmTransaction(airdropSignature);
        associatedTokenAccount = await getAssociatedTokenAddress(
            NATIVE_MINT, // sol1111111
            fromWallet.publicKey
        );

        console.log(associatedTokenAccount.toBase58());


        // create token account to hold your wrapped SOL
        const ataTransaction = new Transaction().add(
            createAssociatedTokenAccountInstruction(
                fromWallet.publicKey,
                associatedTokenAccount,
                fromWallet.publicKey,
                NATIVE_MINT
            )
        );

        await sendAndConfirmTransaction(
            connection,
            ataTransaction,
            [fromWallet]
        );

        //Transfer SOL to associated token account and use SyncNative to update wrapped Sol balance
        const solTransferTransaction = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: fromWallet.publicKey,
                toPubkey: associatedTokenAccount,
                lamports: LAMPORTS_PER_SOL // the SOL that we're sending over
            }),
            createSyncNativeInstruction(
                associatedTokenAccount
            )
        );

        await sendAndConfirmTransaction(connection, solTransferTransaction, [fromWallet]);
        const accountInfo = await getAccount(connection, associatedTokenAccount);
        console.log(`Native: ${accountInfo.isNative}, Lamports: ${accountInfo.amount}`);

    }

    async function unwrapSol() {
        const walletBalance = await connection.getBalance(fromWallet.publicKey);
        console.log(`Balance before unwrapping WSOL: ${walletBalance}`);

        await closeAccount(
            connection,
            fromWallet,
            associatedTokenAccount,
            fromWallet.publicKey,
            fromWallet
        );

        const walletBalancePostClose = await connection.getBalance(fromWallet.publicKey);
        console.log(`Balance after unwrapping WSOL ${walletBalancePostClose}`);

    }

    async function sendSol() {
        // airdrop SOL to send
        const fromAirdropSignature = await connection.requestAirdrop(fromWallet.publicKey, LAMPORTS_PER_SOL);

        // wait for airdrop comfirmation
        await connection.confirmTransaction(fromAirdropSignature);

        //generate a new wallet to receive newly minted token
        const toWallet = new PublicKey("Ek31enXJM2C49XXFa8vFT8ZLRvSZARRNjsCERu9dZwTX")

        //get the token naccount of the fromWallet address, and if it does not exist, create it
        const fromTokenAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            fromWallet,
            NATIVE_MINT,
            fromWallet.publicKey
        )

        //get the token account if the toWallet address, and if it does not exist, create it
        const toTokenAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            fromWallet,
            NATIVE_MINT,
            toWallet
        )

        //transfer the new token to the "toTokenAccount" we just created
        const signature = await transfer(
            connection,
            fromWallet,
            fromTokenAccount.address,
            toTokenAccount.address,
            fromWallet.publicKey,
            LAMPORTS_PER_SOL
        );
        console.log(`Transfer tx: ${signature}`);

    }

    return (
        <div>
            Send Sol Section
            <div>
                <button onClick={wrapSol}>Wrap SOL</button>
                <button onClick={unwrapSol}>Unwrap SOL</button>
                <button onClick={sendSol}>Send SOL</button>
            </div>
        </div>
    );
}

export default SendSol;
