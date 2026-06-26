const ARC = {
  chainId: "0x4CF4B2",
  rpc: "https://rpc.testnet.arc.network",
  name: "Arc Testnet",
  explorer: "https://testnet.arcscan.app/tx/"
};

const USDC = {
  address: "0x3600000000000000000000000000000000000000",
  decimals: 6,
  abi: [
    "function transfer(address to, uint256 amount) returns (bool)"
  ]
};

const ui = {
  connect: document.getElementById("connectBtn"),
  wallet: document.getElementById("walletBox"),
  recipient: document.getElementById("recipient"),
  amount: document.getElementById("amount"),
  purpose: document.getElementById("purpose"),
  generate: document.getElementById("generateBtn"),
  send: document.getElementById("sendBtn"),
  memo: document.getElementById("memoBox"),
  status: document.getElementById("status"),
  txLink: document.getElementById("txLink")
};

const state = {
  provider: null,
  signer: null,
  account: null
};

function setStatus(message, type = "info") {
  ui.status.textContent = message;
  ui.status.className = `status ${type}`;
}

function shortAddress(address) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function hideTransaction() {
  if (ui.txLink) ui.txLink.style.display = "none";
}

function showTransaction(hash) {
  if (!ui.txLink) return;

  ui.txLink.href = `${ARC.explorer}${hash}`;
  ui.txLink.textContent = "View Transaction";
  ui.txLink.style.display = "inline-block";
}

async function switchToArc() {
  try {
    await ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: ARC.chainId }]
    });
  } catch (error) {
    if (error.code !== 4902) throw error;

    await ethereum.request({
      method: "wallet_addEthereumChain",
      params: [{
        chainId: ARC.chainId,
        chainName: ARC.name,
        rpcUrls: [ARC.rpc],
        nativeCurrency: {
          name: "USDC",
          symbol: "USDC",
          decimals: 6
        },
        blockExplorerUrls: [
          "https://testnet.arcscan.app"
        ]
      }]
    });
  }
}

async function connectWallet() {
  if (!window.ethereum) {
    return setStatus("Please install MetaMask.", "error");
  }

  try {
    setStatus("Connecting wallet...", "info");

    await ethereum.request({
      method: "eth_requestAccounts"
    });

    await switchToArc();

    state.provider = new ethers.BrowserProvider(window.ethereum);
    state.signer = await state.provider.getSigner();
    state.account = await state.signer.getAddress();

    ui.wallet.textContent = shortAddress(state.account);
    ui.connect.textContent = "Wallet Connected";

    setStatus("Connected to Arc Testnet.", "success");

  } catch (error) {
    console.error(error);

    setStatus(
      error.shortMessage ||
      error.message ||
      "Wallet connection failed.",
      "error"
    );
  }
}

ui.connect.addEventListener("click", connectWallet);

hideTransaction();
