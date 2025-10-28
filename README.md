# Solana Meme Coin Airdrop

Lightweight Node.js script to batch-send SPL token transfers (airdrops) on Solana. This project provides a simple bulk-transfer utility (`main_update.js`) that batches recipients, creates associated token accounts as needed, and sends transfers in grouped transactions.

## Features
- Batch transfers to multiple recipient addresses
- Automatically creates associated token accounts when missing
- Simple bulk size configuration and compact output reports

## Requirements
- Node.js (16+ recommended)
- A funded Solana wallet (sender) with enough SOL for transaction fees and enough token balance of the target mint

## Install

1. Create or open a project directory and copy the files (already present in this repo).
2. Install dependencies:

```powershell
npm install @solana/web3.js @solana/spl-token bs58 dotenv
```

## Environment variables
Create a `.env` file in the project root with the following values:

```env
# RPC endpoint (use devnet for testing)
RPC_URL="https://api.devnet.solana.com"

# Sender private key (base58-encoded secret key). KEEP THIS SAFE.
SENDER_PRIVATE_KEY="<base58_secret_key_here>"

# Token mint address (SPL token mint public key)
TOKEN_MINT_ADDRESS="<token_mint_pubkey>"

# Number of recipients to send per bulk transaction (integer)
BULK_SIZE=10
```

Notes:
- `SENDER_PRIVATE_KEY` is expected to be Base58-encoded secret key as used in the repository script. Do not commit this file or share it.
- Use a devnet RPC and test tokens while testing.

## Usage

1. Prepare a list of recipient addresses. The script reads recipients from the `RECEIPIENTS` array (see `main_update.js`). You can modify the script to load recipients from a file or other source.
2. Configure `.env` as above.
3. Run the script:

```powershell
node main_update.js
# or the updated script
node main_update.js
```

The script will perform batched transfers and produce two output files in the project root:
- `success_wallets.json` — list of recipient addresses that were transferred to successfully
- `failure_wallets.json` — list of recipient addresses that failed

## How it works (brief)
- Connects to the RPC specified by `RPC_URL`
- Builds the sender token account for `TOKEN_MINT_ADDRESS`
- Batches recipients in groups specified by `BULK_SIZE`
- For each recipient in a batch, ensures the recipient associated token account exists and adds a transfer instruction to a transaction
- Signs and sends the transaction, waits a short delay (2s) between batches

Important implementation detail: The transfer amount in the script is a hard-coded value `BigInt(10 ** 4)` (i.e. 10000 in the smallest token units). Adjust this if your token uses a specific decimal count or you want a different amount.

## Safety and best practices
- NEVER hard-code or commit private keys. Use a secure secret manager or environment variables with restricted access.
- Test on `devnet` before running on `mainnet-beta`.
- Ensure the sender wallet has SOL to pay transaction fees and enough of the SPL token to cover all transfers.
- Consider rate-limiting RPC usage or switching to a more reliable RPC provider for large airdrops.
- For large airdrops, split across multiple funded wallets or use infrastructure that handles retries and backoff.

## Troubleshooting
- Invalid address errors: the script logs invalid recipient addresses and adds them to `failure_wallets.json`.
- Insufficient funds or token balance: transactions will fail; check the console error and confirm balances.
- Slow RPC or timeouts: try another RPC endpoint or increase timeouts in the script.

## Next steps / improvements
- Load recipients from a CSV or text file and avoid editing the script.
- Add per-transfer configurable amount and token decimal awareness.
- Add retry logic with exponential backoff for failed transactions.
- Add a dry-run mode that validates recipients and balances without sending tokens.

## License
This repository includes utility scripts — add an appropriate license if you plan to share or publish (e.g., MIT).

## Contact / Attribution
Use the repo owner and commit history for attribution and questions.
