const {
  Connection,
  PublicKey,
  Keypair,
  Transaction,
  sendAndConfirmTransaction,
} = require("@solana/web3.js");

const {
  createTransferInstruction,
  TOKEN_PROGRAM_ID,
  getOrCreateAssociatedTokenAccount,
} = require("@solana/spl-token");
const fs = require("fs");
const bs58 = require("bs58");

const dotenv = require("dotenv");
dotenv.config();

const TOKEN_MINT_ADDRESS = process.env.TOKEN_MINT_ADDRESS;
const FAILURE_WALLETS = [];
const RECIPIENT_WALLETS = [];
console.log("start");
const confirmAirdrop = async () => {
  const connection = new Connection(
    process.env.RPC_URL ?? "",
    "confirmed"
  );

  const senderWallet = Keypair.fromSecretKey(
    bs58.default.decode(process.env.SENDER_PRIVATE_KEY ?? "")
  );

  const senderPublicKey = senderWallet.publicKey;
  const senderTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    senderWallet,
    new PublicKey(TOKEN_MINT_ADDRESS),
    senderPublicKey
  );
  // console.log("senderTokenAccount", senderTokenAccount);
  for (let index = 0; index < RECIPIENT_WALLETS.length; index += 8) {
    console.log(`${index + 1} - ${index + 8}`);
    try {
      const transaction = new Transaction();

      for (let i = index; i < index + 8; i++) {
        const receipientPublickKey = new PublicKey(RECIPIENT_WALLETS[i]);
        const receipientTokenAccount = await getOrCreateAssociatedTokenAccount(
          connection,
          senderWallet,
          new PublicKey(TOKEN_MINT_ADDRESS),
          receipientPublickKey
        );
        transaction.add(
          createTransferInstruction(
            senderTokenAccount.address,
            receipientTokenAccount.address,
            senderWallet.publicKey,
            BigInt(10 ** 4),
            [],
            TOKEN_PROGRAM_ID
          ),
        );
      }

      transaction.recentBlockhash = (
        await connection.getLatestBlockhash()
      ).blockhash;
      transaction.feePayer = senderWallet.publicKey;

      await transaction.sign(senderWallet);

      const signature = await sendAndConfirmTransaction(
        connection,
        transaction,
        [senderWallet]
      );
      console.log(
        `${index + 1} - ${index + 8}. Transaction Hash : ${signature}`
      );
      console.log(
        `${index}. Transfer successful to : \n${RECIPIENT_WALLETS[index]}\n${RECIPIENT_WALLETS[index + 1]
        }\n${RECIPIENT_WALLETS[index + 2]}\n${RECIPIENT_WALLETS[index + 3]}\n${RECIPIENT_WALLETS[index + 4]
        }\n${RECIPIENT_WALLETS[index + 5]}\n${RECIPIENT_WALLETS[index + 6]}\n${RECIPIENT_WALLETS[index + 7]
        }`
      );
      console.log("restTime : ", "10s");
      await new Promise((resolve) => setTimeout(resolve, 10000)); // Wait for 2 seconds before retrying
    } catch (error) {
      console.log(`${index + 1} - ${index + 8} error => `, error);
      FAILURE_WALLETS.push(RECIPIENT_WALLETS[index]);
      FAILURE_WALLETS.push(RECIPIENT_WALLETS[index + 1]);
      FAILURE_WALLETS.push(RECIPIENT_WALLETS[index + 2]);
      FAILURE_WALLETS.push(RECIPIENT_WALLETS[index + 3]);
      FAILURE_WALLETS.push(RECIPIENT_WALLETS[index + 4]);
      FAILURE_WALLETS.push(RECIPIENT_WALLETS[index + 5]);
      FAILURE_WALLETS.push(RECIPIENT_WALLETS[index + 6]);
      FAILURE_WALLETS.push(RECIPIENT_WALLETS[index + 7]);
      console.log("restTime : ", "10s");

      await new Promise((resolve) => setTimeout(resolve, 10000)); // Wait for 2 seconds before retrying

      continue;
    }
  }
  console.log("Total: ", RECIPIENT_WALLETS.length);
  console.log("Success: ", RECIPIENT_WALLETS.length - FAILURE_WALLETS.length);
  console.log("Failure: ", FAILURE_WALLETS.length);
  if (FAILURE_WALLETS.length > 0)
    fs.writeFile("FailureWallet.txt", FAILURE_WALLETS.join("\n"), (err) => {
      if (err) {
        console.error(err);
      } else {
        console.log("Failure wallets successful saved!");
      }
    });
};

confirmAirdrop();
