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
  ui.txLink.style.display = "block";
  ui.txLink.textContent = "View Transaction";
}

function hideTransaction() {
  ui.txLink.style.display = "none";
}
