# Aptos NFT Marketplace

## Features

- **User-Friendly Interface**: Intuitive design for easy navigation and interaction with NFTs.
- **NFT Minting**: Create and mint your own NFTs directly from the platform. (Marketplace Address Ower)
- **Marketplace Listings**: List your NFTs for sale and set custom prices.
- **Purchase NFTs**: Buy NFTs from other users with a simple transaction process.
- **Filter and Search**: Easily filter NFTs by rarity and search for specific items in the marketplace.
- **User Collection Management**: View and manage your personal NFT collection.
- **Responsive Design**: Optimized for both desktop and mobile devices for seamless access.

## Installation

In the project directory, you can run:

### Install Wallet Adapter

```bash
npm i @aptos-labs/wallet-adapter-react @aptos-labs/wallet-adapter-ant-design petra-plugin-wallet-adapter
```

Or use the legacy flag if needed:

```bash
npm i @aptos-labs/wallet-adapter-react @aptos-labs/wallet-adapter-ant-design petra-plugin-wallet-adapter --legacy-peer-deps
```

Install Router
```bash
npm install react-router-dom --legacy-peer-deps
```

### NFT Market Address and Private Key

Update your NFT Marketplace address in the following files:

- MarketView.tsx - Replace with your NFT Market Address on Line 62
- MyNFTs.tsx - Replace with your NFT Market Address on Line 27
- App.tsx - Replace with your NFT Market Address on Line 14

### Available Scripts

In the project directory, you can run:

```npm start```

Runs the app in development mode.
Open `http://localhost:3000` to view it in the browser.
The page will reload if you make edits, and you will also see any lint errors in the console.

### Sample Data Inputs for Minting:

- Name: Eternal Cascade
- Description: A waterfall that flows endlessly, reflecting the infinite beauty of nature.
- https://fastly.picsum.photos/id/572/200/200.jpg?hmac=YFsNUCQc2Dfz_5O0HY8HmDfquz04XrdcpJ0P4Z7plRY