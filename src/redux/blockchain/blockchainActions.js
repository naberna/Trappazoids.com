// constants
// import Web3EthContract from "web3-eth-contract";
import Web3 from "web3";
import { DeFiWeb3Connector } from "deficonnect";
import defi from '../../defi.png';
import WalletConnectProvider from "@walletconnect/web3-provider";
import Web3Modal from "web3modal";
import { Web3Provider } from "@ethersproject/providers";

let web3Modal;
if (typeof window !== "undefined") {
  web3Modal = new Web3Modal({
    network: "mainnet", // optional
    cacheProvider: true,
    providerOptions: {
      'custom-defi': {
        display: {
          logo: defi,
          name: 'Defi Wallet',
          description: 'Connect to your Defi Wallet'
        },
        package: DeFiWeb3Connector,
        options: {
          supportedChainIds: [25, 338],
          rpc: {
            1: "https://mainnet.infura.io/v3/88b3ca144c6648df843909df0371ee08",
            25: "https://evm.cronos.org/", // cronos mainet
          },
          pollingInterval: 15000,
        },
        connector: async (ProviderPackage, options) => {
          const connector = new ProviderPackage(options);
          await connector.activate();
          let provider = await connector.getProvider()
          return provider;
        }
      },
      walletconnect: {
        package: WalletConnectProvider,
        options: {
          infuraId: "88b3ca144c6648df843909df0371ee08", // required
          rpc: {
            137: "https://speedy-nodes-nyc.moralis.io/f20199705d9b3bb894f74574/polygon/mainnet", // Polygon mainnet
            80001: "https://speedy-nodes-nyc.moralis.io/f20199705d9b3bb894f74574/polygon/mumbai", // Mumbai Polygon testnet
          },
        },
      },
    }, // required
    theme: "dark",
  });
}

// log
import { fetchData } from "../data/dataActions";

const connectRequest = () => {
  return {
    type: "CONNECTION_REQUEST",
  };
};

const connectSuccess = (payload) => {
  return {
    type: "CONNECTION_SUCCESS",
    payload: payload,
  };
};

const connectFailed = (payload) => {
  return {
    type: "CONNECTION_FAILED",
    payload: payload,
  };
};

const updateAccountRequest = (payload) => {
  return {
    type: "UPDATE_ACCOUNT",
    payload: payload,
  };
};

const disconnectSuccess = (payload) => {
  return {
    type: "DISCONNECT_SUCCESS",
    payload: payload
  };
};

// export const connect = () => {
//   return async (dispatch) => {
//     dispatch(connectRequest());
//     const abiResponse = await fetch("/config/abi.json", {
//       headers: {
//         "Content-Type": "application/json",
//         Accept: "application/json",
//       },
//     });
//     const abi = await abiResponse.json();
//     const configResponse = await fetch("/config/config.json", {
//       headers: {
//         "Content-Type": "application/json",
//         Accept: "application/json",
//       },
//     });
//     const CONFIG = await configResponse.json();
//     const { ethereum } = window;
//     const metamaskIsInstalled = ethereum && ethereum.isMetaMask;
//     if (metamaskIsInstalled) {
//       Web3EthContract.setProvider(ethereum);
//       let web3 = new Web3(ethereum);
//       try {
//         const accounts = await ethereum.request({
//           method: "eth_requestAccounts",
//         });
//         const networkId = await ethereum.request({
//           method: "net_version",
//         });
//         if (networkId == CONFIG.NETWORK.ID) {
//           const SmartContractObj = new Web3EthContract(
//             abi,
//             CONFIG.CONTRACT_ADDRESS
//           );
//           dispatch(
//             connectSuccess({
//               account: accounts[0],
//               smartContract: SmartContractObj,
//               web3: web3,
//             })
//           );
//           // Add listeners start
//           ethereum.on("accountsChanged", (accounts) => {
//             dispatch(updateAccount(accounts[0]));
//           });
//           ethereum.on("chainChanged", () => {
//             window.location.reload();
//           });
//           // Add listeners end
//         } else {
//           dispatch(connectFailed(`Change network to ${CONFIG.NETWORK.NAME}.`));
//         }
//       } catch (err) {
//         dispatch(connectFailed("Something went wrong."));
//       }
//     } else {
//       dispatch(connectFailed("Install Metamask."));
//     }
//   };
// };

export const connect = () => {
  return async (dispatch) => {
    dispatch(connectRequest());
    const abiResponse = await fetch("/config/abi.json", {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
    const abi = await abiResponse.json();
    const configResponse = await fetch("/config/config.json", {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
    const CONFIG = await configResponse.json();
    const { ethereum } = window;
    const metamaskIsInstalled = ethereum && ethereum.isMetaMask;
    if (metamaskIsInstalled) {
      const provider = await web3Modal.connect();
      const connectedProvider = new Web3Provider(provider);
      const chainId = await connectedProvider.getNetwork().then(network => network.chainId);
      const connectedAddress = await connectedProvider.getSigner().getAddress();
      const web3 = new Web3(provider);
      const SmartContractObj = new web3.eth.Contract(abi, CONFIG.CONTRACT_ADDRESS);
      console.log("connectedAddress = ", connectedAddress);
      console.log("smartContract = ", SmartContractObj);
      console.log("web3 = ", web3);
      dispatch(
        connectSuccess({
          account: connectedAddress,
          smartContract: SmartContractObj,
          web3: web3,
        })
      );
    } else {
      dispatch(connectFailed("Install Metamask."));
    }
  };
};

export const disconnect = () => {
  return async (dispatch) => {
    await web3Modal.clearCachedProvider();
    dispatch(disconnectSuccess(""));
  };
}

export const updateAccount = (account) => {
  return async (dispatch) => {
    dispatch(updateAccountRequest({ account: account }));
    dispatch(fetchData(account));
  };
};
