const { Keypair } = require('@solana/web3.js');
const bs58 = require('bs58');
const fs = require('fs');

const NUMBER_OF_WALLETS = 5;

const main = () => {
  let address = [];
  let privateKey = [];

  for (let i = 0; i < NUMBER_OF_WALLETS; i++) {
    const wallet = Keypair.generate();

    address.push(wallet.publicKey.toBase58());
    privateKey.push(bs58.default.encode(wallet.secretKey));
  }

  fs.writeFileSync('addresses.txt', address.join('\n'));
  fs.writeFileSync('privateKeys.txt', privateKey.join('\n'));
}

main();