// Import required libraries
const Primus = require('primus');
const Emitter = require('primus-emit');
const Latency = require('primus-spark-latency');
const WebsocketProvider = require('web3-providers-ws').default || require('web3-providers-ws');
let Web3;

try {
  Web3 = require('web3').default; // For newer versions
} catch (e) {
  Web3 = require('web3'); // Fallback for older versions
}

const os = require('os');
const _ = require('lodash');

const STATS_SERVER_URL = process.env.STATS_SERVER_URL;
const GETH_URL = process.env.GETH_URL;
const INSTANCE_NAME = process.env.INSTANCE_NAME;
const WS_SECRET = process.env.WS_SECRET;
const BEACON_NODE_API = process.env.BEACON_NODE_API;

// Define stats object
const stats = {
  active: false,
  peers: 0,
  pending: 0,
  gasPrice: 0,
  block: {
    number: 0,
    difficulty: 0,
    gasUsed: 0,
    hash: '0x0000000000000000000000000000000000000000000000000000000000000000',
    totalDifficulty: 0,
    transactions: [],
    uncles: [],
    blockTransactionCount: 0
  },
  syncing: false,
  uptime: 0,
  blockUncleCount: 0,
  validator: {
    balance: 0,
    status: 'unknown',
    effectiveBalance: 0,
    slashed: false,
    activation_eligibility_epoch: 0,
    activation_epoch: 0,
    exit_epoch: 0,
    withdrawable_epoch: 0
  }
};

// Utility function to convert BigInt to string
function convertBigIntToString(obj) {
  return JSON.parse(
    JSON.stringify(obj, (key, value) => (typeof value === 'bigint' ? value.toString() : value))
  );
}

// Create a function to initialize Primus connection
function initializePrimus() {
  // Create a Primus socket connection using createSocket
  const Socket = Primus.createSocket({
    transformer: 'websockets',
    pathname: '/api',
    strategy: 'disconnect,online,timeout',
    reconnect: {
      retries: 30
    },
    plugin: {
      emitter: Emitter,
      sparkLatency: Latency
    }
  });

  const primus = new Socket(STATS_SERVER_URL);

  // Function to initialize Web3 connection
  let web3;
  let wsProvider;

  function initializeWeb3() {
    console.log('Attempting to connect to WebSocket provider...');
    wsProvider = new WebsocketProvider(GETH_URL);

    wsProvider.on('connect', async () => {
      console.log('WebSocket provider connected');

      try {
        // Create Web3 instance with the WebSocket provider
        web3 = new Web3(wsProvider);

        // Validate readiness by trying a simple method
        const isListening = await web3.eth.net.isListening();
        if (isListening) {
          console.log('Web3 provider connected successfully');
        }
      } catch (err) {
        console.error('Web3 provider connection failed:', err);
      }
    });

    wsProvider.on('error', (error) => {
      console.error('WebSocket provider error:', error);
    });

    wsProvider.on('end', () => {
      console.error('WebSocket provider disconnected');
      // Attempt to reconnect after a delay
      setTimeout(() => {
        console.log('Attempting to reconnect WebSocket provider...');
        initializeWeb3();
      }, 5000);
    });
  }

  initializeWeb3();

  // Function to update stats from Geth and Beacon Node
  async function updateStats() {
    try {
      if (!web3) {
        console.error('Web3 instance is not available yet. Skipping stats update.');
        return;
      }

      // Check if the Web3 provider is ready by calling a simple method
      const isListening = await web3.eth.net.isListening();
      if (!isListening) {
        console.error('Web3 provider is not connected. Skipping stats update.');
        return;
      }

      // Fetch peer count
      stats.peers = await web3.eth.net.getPeerCount();

      // Fetch gas price
      stats.gasPrice = await web3.eth.getGasPrice();

      // Fetch syncing status
      const syncing = await web3.eth.isSyncing();
      stats.syncing = !!syncing;

      // Fetch latest block
      const latestBlock = await web3.eth.getBlock('latest');

      stats.block.number = latestBlock.number;
      stats.block.difficulty = latestBlock.difficulty;
      stats.block.gasUsed = latestBlock.gasUsed;
      stats.block.hash = latestBlock.hash;
      stats.block.totalDifficulty = latestBlock.totalDifficulty;
      stats.block.transactions = latestBlock.transactions;
      stats.block.uncles = latestBlock.uncles;
      stats.block.blockTransactionCount = latestBlock.transactions.length;

      // Update uptime
      stats.uptime = process.uptime();

      const validatorData = await fetch(`${BEACON_NODE_API}/validators`);
      if (!validatorData.ok) {
        throw new Error(`Beacon node API request failed with status ${validatorData.status}`);
      }

      const validatorJson = await validatorData.json();
      if (validatorJson.data && validatorJson.data.length > 0) {
        const validatorData = validatorJson.data[0]; // Assuming single validator monitoring
        const { validator } = validatorData; // Extract the nested validator object

        // Assign the correct properties from the nested validator object
        stats.validator.balance = validatorData.balance;
        stats.validator.status = validatorData.status;
        stats.validator.effectiveBalance = validator.effective_balance;
        stats.validator.slashed = validator.slashed;
        stats.validator.activation_eligibility_epoch = validator.activation_eligibility_epoch;
        stats.validator.activation_epoch = validator.activation_epoch;
        stats.validator.exit_epoch = validator.exit_epoch;
        stats.validator.withdrawable_epoch = validator.withdrawable_epoch;
      }
    } catch (error) {
      console.error('Error updating stats:', error);
    }
  }

  async function sendStats() {
    await updateStats();
    const sanitizedStats = convertBigIntToString(stats); // Sanitize BigInt values

    const statsMessage = {
      method: 'stats',
      params: {
        id: INSTANCE_NAME,
        stats: sanitizedStats
      }
    };

    primus.write(statsMessage); // Use write to send the message
  }

  // When the connection opens, send a hello message
  primus.on('open', () => {
    console.log('Connected to the server');

    // Construct and emit the hello message
    const helloMessage = {
      id: INSTANCE_NAME, // Unique client identifier
      name: INSTANCE_NAME, // Add a name for identification
      info: {
          os: os.platform(),
          os_v: os.release(),
      },
      secret: WS_SECRET,
      spark: primus.id,
      latency: primus.latency || 0
  };
    primus.emit('hello', helloMessage);

    // Emit a ready event after hello
    primus.emit('ready');

    // Set up latency pings
    setInterval(() => {
      const now = _.now();
      primus.emit('node-ping', {
        id: helloMessage.id,
        clientTime: now
      });
    }, 3000); // Ping every 3 seconds

    // Send stats periodically
    setTimeout(() => {
      sendStats();
      setInterval(() => {
        sendStats();
      }, 10000); // Send stats every 10 seconds
    }, 5000); // Wait 5 seconds for WebSocket to be ready
  });

  // Listen for incoming messages from the server
  primus.on('data', (data) => {
    try {
      console.log('Received:', data);
    } catch (e) {
      console.error('Error parsing incoming message:', e);
    }
  });

  // Handle any errors
  primus.on('error', (err) => {
    console.error('Primus error:', err);
  });

  // Handle connection close
  primus.on('end', () => {
    console.log('Connection closed');
  });

  // Handle reconnect events
  primus.on('reconnect', () => {
    console.log('Reconnect attempt started');
  });

  primus.on('reconnect scheduled', (opts) => {
    console.warn('Reconnecting in', opts.scheduled, 'ms');
    console.warn('This is attempt', opts.attempt, 'out of', opts.retries);
  });

  primus.on('reconnected', (opts) => {
    console.log('Socket reconnected successfully after', opts.duration, 'ms');
  });
}

// Initialize Primus connection
initializePrimus();
