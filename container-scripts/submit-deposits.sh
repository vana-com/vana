#!/usr/bin/env sh

apt-get -qq update && apt-get install -qq -y jq

# Check DEPOSIT_RPC_URL
if [ -z "$DEPOSIT_RPC_URL" ]; then
    echo "Error: DEPOSIT_RPC_URL is not set."
    echo "Please set a valid RPC URL for deposits in your .env file."
    exit 1
fi

echo "DEPOSIT_RPC_URL check passed"

# Check DEPOSIT_CONTRACT_ADDRESS
if [ -z "$DEPOSIT_CONTRACT_ADDRESS" ]; then
    echo "Error: DEPOSIT_CONTRACT_ADDRESS is not set."
    echo "Please set a valid deposit contract address in your .env file."
    exit 1
fi

echo "DEPOSIT_CONTRACT_ADDRESS check passed"

for deposit_data_file in /validator_keys/deposit_data-*.json; do
  for deposit_data in $(jq -c '.[]' $deposit_data_file); do
    PUBKEY=$(echo $deposit_data | jq -r '.pubkey')
    WITHDRAWAL_CREDENTIALS=$(echo $deposit_data | jq -r '.withdrawal_credentials')
    SIGNATURE=$(echo $deposit_data | jq -r '.signature')
    DEPOSIT_DATA_ROOT=$(echo $deposit_data | jq -r '.deposit_data_root')
    echo "Submitting deposit for validator 0x$PUBKEY"
    cast send $DEPOSIT_CONTRACT_ADDRESS \
      "deposit(bytes,bytes,bytes,bytes32)" \
      "0x$PUBKEY" \
      "0x$WITHDRAWAL_CREDENTIALS" \
      "0x$SIGNATURE" \
      "0x$DEPOSIT_DATA_ROOT" \
      --value 35000ether \
      --private-key $(cat /run/secrets/deposit_private_key) \
      --rpc-url $DEPOSIT_RPC_URL \
      --gas-price 200gwei \
      --priority-gas-price 200gwei
  done
done