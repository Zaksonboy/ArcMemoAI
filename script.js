const ARC = {
  chainId: "0x4CF4B2",
  rpc: "https://rpc.testnet.arc.network",
  name: "Arc Testnet",
  explorer: "https://testnet.arcscan.app/tx/"
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

function showTransaction(hash) {
  ui.txLink.href = `${ARC.explorer}${hash}`;
  ui.txLink.textContent = "View Transaction";
  ui.txLink.style.display = "block";
}

function hideTransaction() {
  ui.txLink.style.display = "none";
}

async function switchToArc() {
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: ARC.chainId }]
    });
  } catch (error) {
    if (error.code === 4902) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
      params: [{
  chainId: ARC.chainId,
  chainName: ARC.name,
  rpcUrls: [ARC.rpc],
  nativeCurrency: {
    name: "ETH",
    symbol: "ETH",
    decimals: 18
  },
  blockExplorerUrls: [
    "https://testnet.arcscan.app"
  ]
}]
      });
    } else {
      throw error;
    }
  }
}

async function connectWallet() {
  if (!window.ethereum) {
    setStatus("Please install MetaMask.", "error");
    return;
  }

  try {
    await window.ethereum.request({
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
    setStatus("Failed to connect wallet.", "error");
  }
}

ui.connect.addEventListener("click", connectWallet);

hideTransaction();
async function generateMemo() {
  const recipient = ui.recipient.value.trim();
  const amount = ui.amount.value.trim();
  const purpose = ui.purpose.value.trim();

  if (!recipient || !amount || !purpose) {
    setStatus("Please fill in all fields.", "error");
    return;
  }

  try {
    ui.generate.disabled = true;
    setStatus("Generating AI memo...", "info");

    const response = await fetch("/api/generateMemo", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        recipient,
        amount,
        purpose
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to generate memo.");
    }

    ui.memo.textContent = data.memo;
    setStatus("AI memo generated successfully.", "success");

  } catch (error) {
    console.error(error);
    setStatus(error.message || "Failed to generate memo.", "error");
  } finally {
    ui.generate.disabled = false;
  }
}

ui.generate.addEventListener("click", generateMemo);
const USDC = {
  address: "0x3600000000000000000000000000000000000000",
  decimals: 6,
  abi: [
    "function transfer(address to, uint256 amount) returns (bool)"
  ]
};

async function sendPayment() {
  if (!state.signer) {
    setStatus("Please connect your wallet first.", "error");
    return;
  }

  const recipient = ui.recipient.value.trim();
  const amount = ui.amount.value.trim();

  if (!ethers.isAddress(recipient)) {
    setStatus("Please enter a valid recipient address.", "error");
    return;
  }

  if (!amount || Number(amount) <= 0) {
    setStatus("Please enter a valid amount.", "error");
    return;
  }

  try {
    ui.send.disabled = true;
    hideTransaction();
    setStatus("Preparing transaction...", "info");

    const usdc = new ethers.Contract(
      USDC.address,
      USDC.abi,
      state.signer
    );

    const tx = await usdc.transfer(
      recipient,
      ethers.parseUnits(amount, USDC.decimals)
    );

    setStatus("Waiting for transaction confirmation...", "info");

    await tx.wait();

    showTransaction(tx.hash);

    setStatus("USDC payment sent successfully.", "success");

  } catch (error) {
    console.error(error);

    const message =
      error.reason ||
      error.shortMessage ||
      error.message ||
      "Transaction failed.";

    setStatus(message, "error");

  } finally {
    ui.send.disabled = false;
  }
}

ui.send.addEventListener("click", sendPayment);
