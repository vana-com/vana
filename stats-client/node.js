// Import required libraries
const Primus = require('primus');
const Emitter = require('primus-emit');
const Latency = require('primus-spark-latency');
const WebsocketProvider = require('web3-providers-ws').default || require('web3-providers-ws');
const fetch = require('node-fetch');

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
const PUBLIC_KEY = process.env.PUBLIC_KEY;

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
  },
  beacon: {
    headSlot: 0,
    finalizedEpoch: 0,
    currentEpoch: 0
  },
  containers: {
    geth: { cpuPercentage: 0, memoryUsage: '0MB', memoryLimit: '0MB', osPlatform: '', osVersion: '' },
    validator: { cpuPercentage: 0, memoryUsage: '0MB', memoryLimit: '0MB', osPlatform: '', osVersion: '' },
    beacon: { cpuPercentage: 0, memoryUsage: '0MB', memoryLimit: '0MB', osPlatform: '', osVersion: '' }
  }
};

let lastPingTimestamp = 0; // For latency calculation

// Utility function to convert BigInt to string
function convertBigIntToString(obj) {
  return JSON.parse(
    JSON.stringify(obj, (key, value) => (typeof value === 'bigint' ? value.toString() : value))
  );
}

const Docker = require('dockerode');
const docker = new Docker();

// Function to fetch container stats
async function getContainerStats(containerName) {
  try {
    const container = docker.getContainer(containerName);
    const stats = await container.stats({ stream: false });

    const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
    const systemDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
    const cpuPercentage = (cpuDelta / systemDelta) * stats.cpu_stats.online_cpus * 100;

    const memoryUsage = stats.memory_stats.usage / (1024 * 1024); // Convert to MB
    const memoryLimit = stats.memory_stats.limit / (1024 * 1024); // Convert to MB

    const osInfo = await getContainerOsInfo(containerName); // Fetch OS info

    return {
      cpuPercentage: cpuPercentage.toFixed(2),
      memoryUsage: `${memoryUsage.toFixed(2)}MB`,
      memoryLimit: `${memoryLimit.toFixed(2)}MB`,
      osPlatform: osInfo.platform,
      osVersion: osInfo.version
    };
  } catch (err) {
    console.error(`Error fetching stats for container ${containerName}:`, err);
    return null;
  }
}

// Function to fetch OS info from the container
async function getContainerOsInfo(containerName) {
  try {
    const container = docker.getContainer(containerName);
    const exec = await container.exec({
      Cmd: ['cat', '/etc/os-release'],
      AttachStdout: true,
      AttachStderr: true
    });

    const stream = await exec.start();
    let output = '';

    // Collect output from the command
    stream.on('data', (data) => {
      output += data.toString();
    });

    // Return OS platform and version after the stream finishes
    return new Promise((resolve, reject) => {
      stream.on('end', () => {
        const platform = output.match(/NAME="(.+)"/)?.[1] || 'Unknown';
        const version = output.match(/VERSION="(.+)"/)?.[1] || 'Unknown';
        resolve({ platform, version });
      });

      stream.on('error', (err) => {
        console.error(`Error fetching OS info for container ${containerName}:`, err);
        reject(err);
      });
    });
  } catch (err) {
    console.error(`Error executing command in container ${containerName}:`, err);
    return { platform: 'Unknown', version: 'Unknown' };
  }
}

// Function to fetch beacon node stats
async function getBeaconNodeStats() {
  try {
    const response = await fetch(`${BEACON_NODE_API}`);
    if (!response.ok) {
      throw new Error(`Beacon node API request failed with status ${response.status}`);
    }
    const data = await response.json();

    return {
      headSlot: data.head_slot,
      finalizedEpoch: data.finalized_epoch,
      currentEpoch: data.current_epoch,
    };
  } catch (err) {
    console.error('Error fetching beacon node stats:', err);
    return null;
  }
}

// Function to fetch validator data
async function getValidatorData() {
  try {
    const validatorResponse = await fetch(`${BEACON_NODE_API}/validators`);
    if (!validatorResponse.ok) {
      throw new Error(`Beacon node API request failed with status ${validatorResponse.status}`);
    }
    const validatorJson = await validatorResponse.json();

    if (validatorJson.data && validatorJson.data.length > 0) {
      const matchingValidator = validatorJson.data.find(v => v.validator.pubkey === PUBLIC_KEY);

      if (matchingValidator) {
        const { validator } = matchingValidator;
        return {
          balance: matchingValidator.balance,
          status: matchingValidator.status,
          effectiveBalance: validator.effective_balance,
          slashed: validator.slashed,
          activation_eligibility_epoch: validator.activation_eligibility_epoch,
          activation_epoch: validator.activation_epoch,
          exit_epoch: validator.exit_epoch,
          withdrawable_epoch: validator.withdrawable_epoch,
        };
      } else {
        console.error('Validator with public key not found.');
      }
    }
    return null;
  } catch (error) {
    console.error('Error fetching validator data:', error);
    return null;
  }
}

// Function to update all stats (Geth, Beacon Node, Validator, and containers)
async function updateStats() {
  try {
    if (!web3) {
      console.error('Web3 instance is not available yet. Skipping stats update.');
      return;
    }

    // Check if the Web3 provider is ready
    const isListening = await web3.eth.net.isListening();
    if (!isListening) {
      console.error('Web3 provider is not connected. Skipping stats update.');
      return;
    }

    // Fetch peer count, gas price, block data
    stats.peers = await web3.eth.net.getPeerCount();
    stats.gasPrice = await web3.eth.getGasPrice();
    const latestBlock = await web3.eth.getBlock('latest');

    stats.block = {
      number: latestBlock.number,
      difficulty: latestBlock.difficulty,
      gasUsed: latestBlock.gasUsed,
      hash: latestBlock.hash,
      totalDifficulty: latestBlock.totalDifficulty,
      transactions: latestBlock.transactions,
      uncles: latestBlock.uncles,
      blockTransactionCount: latestBlock.transactions.length,
    };

    // Update uptime
    stats.uptime = process.uptime();

    // Fetch container stats for Geth, Beacon, and Validator containers
    const gethStats = await getContainerStats('geth');
    const beaconStats = await getContainerStats('beacon');
    const validatorStats = await getContainerStats('validator');

    if (gethStats) stats.containers.geth = gethStats;
    if (beaconStats) stats.containers.beacon = beaconStats;
    if (validatorStats) stats.containers.validator = validatorStats;

    // Fetch beacon node stats
    const beaconNodeStats = await getBeaconNodeStats();
    if (beaconNodeStats) stats.beacon = beaconNodeStats;

    // Fetch validator data
    const validatorData = await getValidatorData();
    if (validatorData) stats.validator = validatorData;

  } catch (error) {
    console.error('Error updating stats:', error);
  }
}

// Function to initialize Primus connection
function initializePrimus() {
  const Socket = Primus.createSocket({
    transformer: 'websockets',
    pathname: '/api',
    strategy: 'disconnect,online,timeout',
    reconnect: {
      retries: 30,
    },
    plugin: {
      emitter: Emitter,
      sparkLatency: Latency,
    },
  });

  const primus = new Socket(STATS_SERVER_URL);

  function initializeWeb3() {
    wsProvider = new WebsocketProvider(GETH_URL);
    wsProvider.on('connect', async () => {
      try {
        web3 = new Web3(wsProvider);
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
      setTimeout(() => {
        initializeWeb3();
      }, 5000);
    });
  }

  initializeWeb3();

  // Function to calculate and send latency
  function pingServer() {
    lastPingTimestamp = Date.now();
    primus.emit('ping');
  }

  primus.on('pong', () => {
    const latency = Date.now() - lastPingTimestamp;
    stats.latency = latency; // Update the stats object with latency
    console.log(`Latency: ${latency} ms`);
  });

  // Function to send stats to monitoring server
  async function sendStats() {
    await updateStats();
    const sanitizedStats = convertBigIntToString(stats);
    const statsMessage = {
      method: 'stats',
      params: {
        id: INSTANCE_NAME,
        stats: sanitizedStats
      },
    };
    primus.write(statsMessage);
  }

  primus.on('open', () => {
    const helloMessage = {
      id: INSTANCE_NAME,
      name: INSTANCE_NAME,
      info: {
        os: os.platform(),
        os_v: os.release(),
      },
      secret: WS_SECRET,
      spark: primus.id,
      latency: primus.latency || 0,
    };
    primus.emit('hello', helloMessage);

    primus.emit('ready');

    setInterval(() => {
      pingServer();
      sendStats();
    }, 10000); // Send stats every 10 seconds
  });

  primus.on('data', (data) => {
    try {
      console.log('Received:', data);
    } catch (e) {
      console.error('Error parsing incoming message:', e);
    }
  });

  primus.on('ping', () => {
    primus.emit('pong'); // Respond with 'pong' when receiving 'ping' from server
  });

  primus.on('error', (err) => {
    console.error('Primus error:', err);
  });

  primus.on('end', () => {
    console.log('Connection closed');
  });

  primus.on('reconnect', () => {
    console.log('Reconnect attempt started');
  });

  primus.on('reconnected', (opts) => {
    console.log('Socket reconnected successfully after', opts.duration, 'ms');
  });
}

// Initialize Primus connection
initializePrimus();
