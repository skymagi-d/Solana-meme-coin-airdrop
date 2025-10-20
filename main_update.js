const {
  Connection,
  Keypair,
  Transaction,
  PublicKey,
  sendAndConfirmTransaction
} = require('@solana/web3.js');
const {
  getOrCreateAssociatedTokenAccount,
  createTransferInstruction,
  TOKEN_PROGRAM_ID
} = require('@solana/spl-token');
const fs = require('fs');
const bs58 = require('bs58');
const dotenv = require('dotenv');
dotenv.config();

const TOKEN_MINT_ADDRESS = process.env.TOKEN_MINT_ADDRESS;
const BULK_SIZE = process.env.BULK_SIZE;
const RECEIPIENTS = [];
const SUCCESS_WALLETS = [];
const FAILURE_WALLETS = [];

const main = async () => {
  console.log("============== Airdrop script started ==============");

  const connection = new Connection(
    process.env.RPC_URL,
    "confirmed"
  );

  const senderWallet = Keypair.fromSecretKey(
    bs58.default.decode(process.env.SENDER_PRIVATE_KEY)
  );

  const senderTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    senderWallet,
    new PublicKey(TOKEN_MINT_ADDRESS),
    senderWallet.publicKey
  );

  let bulkPublicKeyList = [];
  for (let index = 0; index < RECEIPIENTS.length; index ++){
    try {
      const receipientPublicKey = new PublicKey(RECEIPIENTS[index]);
      bulkPublicKeyList.push(receipientPublicKey);
      if (bulkPublicKeyList.length < BULK_SIZE && index !== RECEIPIENTS.length -1) {
        continue;
      }
    } catch (err) {
      console.log(`❌Invalid address at index ${index}: ${RECEIPIENTS[index]}`);
      FAILURE_WALLETS.push(RECEIPIENTS[index]);
      continue;
    }

    try {
      const tx = new Transaction();

      for (let i = 0; i < bulkPublicKeyList.length; i++) {
        const receipientTokenAccount = await getOrCreateAssociatedTokenAccount(
          connection,
          senderWallet,
          new PublicKey(TOKEN_MINT_ADDRESS),
          bulkPublicKeyList[i]
        );
        tx.add(
          createTransferInstruction(
            senderTokenAccount.address,
            receipientTokenAccount.address,
            senderWallet.publicKey,
            BigInt(10 ** 4),
            [],
            TOKEN_PROGRAM_ID
          )
        );
      }

      tx.recentBlockhash = (
        await connection.getLatestBlockhash()
      ).blockhash;
      tx.feePayer = senderWallet.publicKey;

      await tx.sign(senderWallet);

      const signature = await sendAndConfirmTransaction(
        connection,
        tx,
        [senderWallet]
      );

      console.log(`✅Transaction successful: ${signature}`);
      SUCCESS_WALLETS.push(...bulkPublicKeyList.map(pk => pk.toBase58()));
      bulkPublicKeyList = [];

      await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait for 2 seconds before next bulk
    } catch (err) {
      console.log(`❌Transaction failed for bulk ending with index ${index}:`, err);
      FAILURE_WALLETS.push(...bulkPublicKeyList.map(pk => pk.toBase58()));
      bulkPublicKeyList = [];

      await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait for 2 seconds before next bulk
    }
  }
  console.log("============== Airdrop script ended ==============");
  console.log(`✅ Successful transfers: ${SUCCESS_WALLETS.length}`);
  console.log(`❌ Failed transfers: ${FAILURE_WALLETS.length}`);

  fs.writeFileSync('success_wallets.json', JSON.stringify(SUCCESS_WALLETS, null, 2));
  fs.writeFileSync('failure_wallets.json', JSON.stringify(FAILURE_WALLETS, null, 2));
  console.log("The result saved in files: success_wallets.json, failure_wallets.json");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
