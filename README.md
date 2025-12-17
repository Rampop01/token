# Stacks DApp Frontend

A Next.js web application for interacting with Stacks smart contracts on the Stacks Testnet. This DApp provides a user-friendly interface to connect your Stacks wallet and interact with deployed smart contracts.

## 🌟 Features

- **Wallet Integration**: Connect with Leather or Xverse wallet extensions
- **Contract Interactions**: Call smart contract functions directly from the UI
- **Key-Value Storage**: Store and retrieve data using the contract's map functionality
- **Event Testing**: Test contract events including token minting, NFT operations, and STX transfers
- **Responsive Design**: Modern, mobile-friendly interface with dark mode support
- **Real-time Feedback**: Loading states and error handling for all transactions

## 📋 Prerequisites

Before you begin, ensure you have:

- Node.js 18+ installed
- A Stacks wallet extension:
  - [Leather Wallet](https://leather.io/) (recommended)
  - [Xverse Wallet](https://www.xverse.app/)
- Some testnet STX for transaction fees (get from [Stacks Testnet Faucet](https://explorer.hiro.so/sandbox/faucet?chain=testnet))

## 🚀 Getting Started

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd stacks-frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## 🔧 Configuration

The contract configuration is located in `app/context/WalletContext.tsx`:

```typescript
const CONTRACT_ADDRESS = 'ST33Y8RCP74098JCSPW5QHHCD6QN4H3XS9E4PVW1G';
const CONTRACT_NAME = 'blonde-peach-tern';
const NETWORK = STACKS_TESTNET;
```

Update these values if you deploy a new contract.

## 📦 Contract Functions

The DApp supports the following contract interactions:

### **Set Value**
Store a key-value pair in the contract's map (max 32 bytes each)
```clarity
(define-public (set-value (key (buff 32)) (value (buff 32))))
```

### **Get Value**
Retrieve a stored value by its key
```clarity
(define-public (get-value (key (buff 32))))
```

### **Test Event Types**
Execute multiple contract operations:
- Mint 3 fungible tokens
- Mint an NFT
- Transfer 60 STX
- Burn 20 STX
```clarity
(define-public (test-event-types))
```

### **Test Emit Event**
Emit a simple event that prints "Event! Hello world"
```clarity
(define-public (test-emit-event))
```

## 🛠️ Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Blockchain**: Stacks Network
- **Wallet SDK**: @stacks/connect
- **Network**: @stacks/network
- **Transactions**: @stacks/transactions
- **Event Monitoring**: @hirosystems/chainhooks-client
- **HTTP Client**: undici

## 📡 Hiro Chainhooks Integration

This project integrates **Hiro Chainhooks** for real-time blockchain event monitoring:

### Features:
- **Live Event Feed**: Real-time display of contract events (FT mints, NFT transfers, contract calls, etc.)
- **Automatic Polling**: Fetches latest transactions every 15 seconds when monitoring is active
- **Event History**: Shows last 50 contract events with detailed information
- **Hiro API Integration**: Connects to Hiro's testnet API for reliable data
- **Webhook Support**: API endpoint ready to receive chainhook notifications

### Event Monitor:
The EventMonitor component displays:
- 🪙 Fungible token events (mint/transfer)
- 🎨 NFT events (mint/transfer)
- 💰 STX transfer operations
- 📞 Contract function calls
- Transaction details with explorer links

### Chainhook Manager (Advanced):
Optional component (`app/components/ChainhookManager.tsx`) for managing chainhooks:
- Register new chainhooks for specific events
- Monitor FT, NFT, and print events
- Enable/disable/delete registered chainhooks
- Check Hiro API status

## 📁 Project Structure

```
stacks-frontend/
├── app/
│   ├── api/
│   │   └── chainhooks/
│   │       └── webhook/
│   │           └── route.ts        # Webhook endpoint for chainhook events
│   ├── components/
│   │   ├── EventMonitor.tsx        # Real-time event monitor UI
│   │   └── ChainhookManager.tsx    # Chainhook management interface
│   ├── context/
│   │   └── WalletContext.tsx       # Wallet provider & contract functions
│   ├── globals.css                 # Global styles
│   ├── layout.tsx                  # Root layout with providers
│   └── page.tsx                    # Main UI page
├── lib/
│   └── chainhooks.ts               # Chainhook utilities & Hiro API client
├── public/                         # Static assets
├── package.json                    # Dependencies
└── README.md                       # This file
```

## 🔐 Wallet Connection

1. Click "Connect Wallet" button
2. Select your wallet extension (Leather/Xverse)
3. Approve the connection request
4. Your address will be displayed once connected

The wallet connection persists across page refreshes.

## 🧪 Testing Contract Functions

1. **Connect your wallet** first
2. **Ensure you have testnet STX** for gas fees
3. **Fill in required inputs** (for set-value and get-value functions)
4. **Click the function button** to initiate the transaction
5. **Approve the transaction** in your wallet popup
6. **Wait for confirmation** on the blockchain

## 🌐 Network Information

- **Network**: Stacks Testnet
- **Contract Address**: `ST33Y8RCP74098JCSPW5QHHCD6QN4H3XS9E4PVW1G`
- **Contract Name**: `blonde-peach-tern`
- **Explorer**: [Stacks Testnet Explorer](https://explorer.hiro.so/?chain=testnet)

## 🏗️ Build for Production

```bash
npm run build
npm start
```

## 📚 Learn More

- [Stacks Documentation](https://docs.stacks.co/)
- [Stacks.js Documentation](https://stacks.js.org/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Clarity Language Reference](https://docs.stacks.co/clarity)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the MIT License.
