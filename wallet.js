<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Simple USDT Wallet (BSC)</title>
  <script src="https://unpkg.com/qr-code-styling@1.6.0-rc.1/lib/qr-code-styling.js"></script>
  <script src="https://unpkg.com/jsqr@1.4.0/dist/jsqr.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/web3@4.0.3/dist/web3.min.js"></script>
  <style>
    :root{--primary:#10b981;--success:#059669;--bg:#f8f9fc;--card:#ffffff}
    body{font-family:'Inter',system-ui,sans-serif;background:var(--bg);margin:0;padding:20px;min-height:100vh;display:flex;align-items:center;justify-content:center}
    .container{max-width:420px;width:100%;background:var(--card);padding:32px;border-radius:24px;box-shadow:0 25px 50px rgba(0,0,0,.1);text-align:center;position:relative;overflow:hidden}
    h1{font-size:28px;margin:0 0 8px;color:#111}
    p.subtitle{color:#64748b;margin-bottom:16px}
    #qrcode{margin:24px auto}
    .address-box{position:relative;background:#f1f5f9;padding:16px;border-radius:16px;font-family:monospace;margin:20px 0;word-break:break-all;font-size:15px;color:#1e40af}
    .copy-btn{position:absolute;right:10px;top:10px;background:#3b82f6;color:white;border:none;padding:8px 12px;border-radius:10px;cursor:pointer;font-size:13px}
    .copy-btn:hover{background:#2563eb}
    .status{padding:18px;border-radius:16px;font-weight:700;font-size:19px;margin-top:20px;transition:all .5s}
    .waiting{background:#fef3c7;color:#92400e}
    .success{background:#d1fae5;color:#065f46;border:2px solid #86efac}
    .spinner{display:inline-block;width:18px;height:18px;border:4px solid #f3f3f3;border-top:4px solid var(--primary);border-radius:50%;animation:s 1s linear infinite;margin-right:10px}
    @keyframes s{to{transform:rotate(360deg)}}
    .amount-input-group{margin:24px 0 16px}
    .amount-input-group label{display:block;margin-bottom:8px;font-weight:600;color:#374151}
    .amount-input-group input{width:100%;padding:14px;font-size:17px;border:1px solid #d1d5db;border-radius:12px;box-sizing:border-box}
    .update-qr-btn{margin-top:12px;background:var(--primary);color:white;border:none;padding:14px 28px;border-radius:12px;font-size:16px;font-weight:600;cursor:pointer}
    .update-qr-btn:hover{background:#059669}
    .tab-buttons {display: flex; justify-content: space-around; margin-bottom: 20px;}
    .tab-btn {background: #e5e7eb; border: none; padding: 12px 20px; border-radius: 12px; cursor: pointer; font-weight: 600;}
    .tab-btn.active {background: var(--primary); color: white;}
    .tab-content {display: none;}
    .tab-content.active {display: block;}
    #video {width: 100%; max-width: 300px; margin: 20px auto; display: block;}
    #scan-result {margin-top: 20px; color: #065f46;}
    .hidden {display: none;}
    .warning {color: #ef4444; font-weight: bold; margin: 20px 0;}
  </style>
  <link href="https://rsms.me/inter/inter.css" rel="stylesheet">
</head>
<body>

<div class="container">
  <h1>Simple USDT Wallet (BSC)</h1>
  <p class="subtitle">Manage USDT on Binance Smart Chain. Warning: This is a client-side wallet - use at your own risk! Never share your private key.</p>

  <div class="warning" id="securityWarning">Security Note: Private keys are handled in memory only. Do not use large amounts. Refreshing the page will lose your wallet unless you export the private key.</div>

  <div class="amount-input-group">
    <label for="privateKey">Import Private Key (or generate new):</label>
    <input type="text" id="privateKey" placeholder="Enter private key (hex)">
    <button class="update-qr-btn" onclick="generateWallet()">Generate New Wallet</button>
    <button class="update-qr-btn" onclick="importWallet()">Import Wallet</button>
  </div>

  <div id="walletInfo" class="hidden">
    <p>Your Address: <span id="userAddress"></span></p>
    <p>USDT Balance: <span id="userBalance">0</span> USDT</p>
    <button class="copy-btn" onclick="copyUserAddress()">Copy Address</button>
    <button class="update-qr-btn" onclick="checkBalance()">Refresh Balance</button>
  </div>

  <div class="tab-buttons">
    <button class="tab-btn active" onclick="openTab('receive')">Receive</button>
    <button class="tab-btn" onclick="openTab('send')">Send</button>
    <button class="tab-btn" onclick="openTab('scan')">Scan</button>
  </div>

  <div id="receive" class="tab-content active">
    <div class="amount-input-group">
      <label for="receiveAmount">Amount to Receive (USDT):</label>
      <input type="number" id="receiveAmount" placeholder="e.g. 100" step="0.01" min="0.01">
      <button class="update-qr-btn" onclick="updateReceiveQR()">Update QR Code</button>
    </div>
    <div id="qrcode"></div>
  </div>

  <div id="send" class="tab-content">
    <div class="amount-input-group">
      <label for="sendTo">Recipient Address:</label>
      <input type="text" id="sendTo" placeholder="0x...">
      <label for="sendAmount">Amount (USDT):</label>
      <input type="number" id="sendAmount" placeholder="e.g. 10" step="0.01" min="0.01">
      <button class="update-qr-btn" onclick="sendUSDT()">Send USDT</button>
    </div>
    <div id="sendStatus" class="status waiting hidden">
      <span class="spinner"></span>
      <span id="sendStatusText">Processing...</span>
    </div>
  </div>

  <div id="scan" class="tab-content">
    <button class="update-qr-btn" onclick="startScanner()">Start Scanner</button>
    <video id="video" class="hidden"></video>
    <canvas id="canvas" class="hidden"></canvas>
    <div id="scan-result"></div>
    <button class="update-qr-btn hidden" id="stopScannerBtn" onclick="stopScanner()">Stop Scanner</button>
  </div>

</div>

<script>
  const USDT_CONTRACT = "0x55d398326f99059ff775485246999027b3197955";
  const CHAIN_ID = "56";
  const BSC_RPC = "https://bsc-dataseed.binance.org/";
  const web3 = new Web3(BSC_RPC);
  let userAccount = null;

  const usdtABI = [
    { "constant": true, "inputs": [{ "name": "_owner", "type": "address" }], "name": "balanceOf", "outputs": [{ "name": "balance", "type": "uint256" }], "type": "function" },
    { "inputs": [{ "name": "_to", "type": "address" }, { "name": "_value", "type": "uint256" }], "name": "transfer", "outputs": [{ "name": "success", "type": "bool" }], "type": "function" }
  ];
  const usdt = new web3.eth.Contract(usdtABI, USDT_CONTRACT);

  function generateWallet() {
    userAccount = web3.eth.accounts.create();
    document.getElementById('userAddress').textContent = userAccount.address;
    document.getElementById('privateKey').value = userAccount.privateKey;
    document.getElementById('walletInfo').classList.remove('hidden');
    checkBalance();
    alert('New wallet generated. Private Key: ' + userAccount.privateKey + '\nSave it securely!');
  }

  function importWallet() {
    const pk = document.getElementById('privateKey').value.trim();
    if (!pk) return alert('Enter a private key');
    try {
      userAccount = web3.eth.accounts.privateKeyToAccount(pk);
      document.getElementById('userAddress').textContent = userAccount.address;
      document.getElementById('walletInfo').classList.remove('hidden');
      checkBalance();
    } catch (e) {
      alert('Invalid private key');
    }
  }

  function copyUserAddress() {
    navigator.clipboard.writeText(userAccount.address);
    alert('Address copied!');
  }

  async function checkBalance() {
    if (!userAccount) return;
    try {
      const balanceWei = await usdt.methods.balanceOf(userAccount.address).call();
      const balance = web3.utils.fromWei(balanceWei, 'ether');
      document.getElementById('userBalance').textContent = parseFloat(balance).toFixed(6);
    } catch (e) {
      console.error(e);
    }
  }

  function updateReceiveQR() {
    if (!userAccount) return alert('Create or import wallet first');
    const amount = parseFloat(document.getElementById('receiveAmount').value) || 0;
    let uri = userAccount.address;
    if (amount > 0) {
      const amountWei = web3.utils.toWei(amount.toString(), 'ether');
      uri = `${USDT_CONTRACT}@${CHAIN_ID}/transfer?address=${userAccount.address}&uint256=${amountWei}`;
    }
    document.getElementById('qrcode').innerHTML = '';
    new QRCodeStyling({
      width: 280,
      height: 280,
      data: uri,
      margin: 10,
      qrOptions: { errorCorrectionLevel: "H" },
      dotsOptions: { color: "#000", type: "rounded" },
      backgroundOptions: { color: "#fff" }
    }).append(document.getElementById('qrcode'));
  }

  async function sendUSDT() {
    if (!userAccount) return alert('Create or import wallet first');
    const to = document.getElementById('sendTo').value.trim();
    const amount = parseFloat(document.getElementById('sendAmount').value);
    if (!to || isNaN(amount) || amount <= 0) return alert('Enter valid address and amount');

    const sendStatus = document.getElementById('sendStatus');
    const sendStatusText = document.getElementById('sendStatusText');
    sendStatus.classList.remove('hidden');
    sendStatusText.textContent = 'Processing...';

    try {
      const data = usdt.methods.transfer(to, web3.utils.toWei(amount.toString(), 'ether')).encodeABI();
      const gas = await usdt.methods.transfer(to, web3.utils.toWei(amount.toString(), 'ether')).estimateGas({ from: userAccount.address });
      const gasPrice = await web3.eth.getGasPrice();

      const tx = {
        from: userAccount.address,
        to: USDT_CONTRACT,
        gas: gas,
        gasPrice: gasPrice,
        data: data
      };

      const signedTx = await web3.eth.accounts.signTransaction(tx, userAccount.privateKey);
      const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

      sendStatus.className = 'status success';
      sendStatusText.textContent = 'Success! Tx: ' + receipt.transactionHash;
      checkBalance();
    } catch (e) {
      sendStatus.className = 'status waiting';
      sendStatusText.textContent = 'Error: ' + e.message;
    }
  }

  let videoStream;
  let scanning = false;
  const video = document.getElementById('video');
  const canvas = document.getElementById('canvas');
  const scanResult = document.getElementById('scan-result');

  async function startScanner() {
    try {
      videoStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      video.srcObject = videoStream;
      video.classList.remove('hidden');
      document.getElementById('stopScannerBtn').classList.remove('hidden');
      scanning = true;
      requestAnimationFrame(scanQR);
    } catch (e) {
      alert('Camera access denied or error: ' + e.message);
    }
  }

  function stopScanner() {
    if (videoStream) {
      videoStream.getTracks().forEach(track => track.stop());
    }
    video.classList.add('hidden');
    document.getElementById('stopScannerBtn').classList.add('hidden');
    scanning = false;
    scanResult.textContent = '';
  }

  function scanQR() {
    if (!scanning) return;
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.height = video.videoHeight;
      canvas.width = video.videoWidth;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      if (code) {
        scanResult.textContent = 'Scanned: ' + code.data;
        parseScannedQR(code.data);
        stopScanner();
        return;
      }
    }
    requestAnimationFrame(scanQR);
  }

  function parseScannedQR(data) {
    // Simple parse: if it's address, set to sendTo. If URI, extract address and amount.
    if (data.startsWith('0x')) {
      document.getElementById('sendTo').value = data;
      openTab('send');
    } else if (data.includes('/transfer?')) {
      const params = new URLSearchParams(data.split('?')[1]);
      const to = params.get('address');
      const amountWei = params.get('uint256');
      if (to && amountWei) {
        const amount = parseFloat(web3.utils.fromWei(amountWei, 'ether'));
        document.getElementById('sendTo').value = to;
        document.getElementById('sendAmount').value = amount;
        openTab('send');
      }
    } else {
      alert('Invalid QR code for USDT transfer');
    }
  }

  function openTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    document.getElementById(tabName).classList.add('active');
    document.querySelector(`.tab-btn[onclick="openTab('${tabName}')"]`).classList.add('active');
  }
</script>
</body>
</html>