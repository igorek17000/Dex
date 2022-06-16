import {
  Box,
  Typography,
  Zoom,
  Paper,
  Button, Grid, Tooltip,
} from "@material-ui/core";
import HelpOutlineIcon from "@material-ui/icons/HelpOutline";
import { useEffect, useState, memo } from "react";
import { useDispatch, useSelector } from "react-redux";
import ConnectButton from '../../components/Wallet/ConnectBtn'
import { useWeb3Context, getSavedNetworkId} from "../../hooks/web3Context";
import { NetworkIds, networks } from "../../networks";
import { RANGO_API_KEY, RANGO_AFFILIATE_REF_ID } from "../../constants";
import { swapNetworks, modalType } from "../../core/data/SwapNetwork";
import { ethers } from "ethers";
import {
  RangoClient,
  TransactionStatus,
} from "rango-sdk";
import {
  BestRouteResponse,
  EvmTransaction
} from "rango-sdk";
import {
  formatAmount,
  getDownRate,
  expectSwapErrors,
  sliceList,
  requireAssetMessage, prepareEvmTransaction, checkApprovalSync, sortTokenList, setIsDexLoading,
} from "../../helpers/Dex";
import ReactLoading from "react-loading";
import useDebounce from "../../hooks/Debounce";
import BestRoute from "../../components/Dex/BestRoute";
import FromTokenSection from "../../components/Dex/FromTokenSection";
import ToTokenSection from "../../components/Dex/ToTokenSection";
import BondSection from "../../components/Dex/BondSection";

import NetworkModal from "../../components/Modal/NetworkModal";
import TokenModal from "../../components/Modal/TokenModal";
import BondModal from "../../components/Modal/BondModal";
import useBonds from "../../hooks/Bonds";
import { BondType } from "../../lib/Bond";

type NetworkType =
{
  blockchain: string;
  name: string;
  chainId: number;
  id: string;
  logo: string;
}

type TokenType =
{
  blockchain: string;
  symbol: string;
  address: string;
  amount: number;
  decimals: number;
}

const Dex = () => {
  const { provider, chainId, connect, switchEthereumChain, address } = useWeb3Context();
  const dispatch = useDispatch();
  const { bonds } = useBonds(chainId);
  const bonds44 = bonds.filter((bond:any) => bond.type === BondType.Bond_44 && !bond.isLP);
  let messageDetail: { details: any; step: any; type?: string; title?: string; };
  
  const [fromNetworkModalOpen, setFromNetworkModalOpen] = useState(false);
  const [fromTokenModalOpen, setFromTokenModalOpen] = useState(false);
  const [fromNetwork, setFromNetwork] = useState<NetworkType>({blockchain: "", name: "", chainId: 0, id: "", logo: "" });
  const [fromTokenList, setFromTokenList] = useState([]);
  const [fromSearchTokenList, setFromSearchTokenList] = useState([]);
  const [fromToken, setFromToken] = useState<any>(null);
  const [fromTokenAmount, setFromTokenAmount] = useState("");

  const [toNetworkModalOpen, setToNetworkModalOpen] = useState(false);
  const [toTokenModalOpen, setToTokenModalOpen] = useState(false);
  const [toNetwork, setToNetwork] = useState<NetworkType>({ blockchain: "", name: "", chainId: 0, id: "", logo: "" });
  const [toTokenList, setToTokenList] = useState([]);
  const [toSearchTokenList, setToSearchTokenList] = useState([]);
  const [toToken, setToToken] = useState<any>(null);
  const [toTokenAmount, setToTokenAmount] = useState("");

  const [bond, setBond] = useState(null);
  const [bondModalOpen, setBondModalOpen] = useState(false);
  const [bondInitialized, setBondInitialized] = useState(false);

  const [initialized, setInitialized] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [fromUpdateTokenLoading, setFromUpdateTokenLoading] = useState(false);
  const [toUpdateTokenLoading, setToUpdateTokenLoading] = useState(false);
  const [routeLoading, setRouteLoading] = useState(false);
  const [swapLoading, setSwapLoading] = useState(false);
  const [bestRoute, setBestRoute] = useState<any>(null);
  const [requiredAssets, setRequiredAssets] = useState<any>([]);
  const [slippage, setSlippage] = useState(1);
  const [forceBondLoading, setForceBondLoading] = useState(false);
  const fromTokenAmountDebounce = useDebounce(fromTokenAmount, 1000);
  const rangoClient = new RangoClient(RANGO_API_KEY);

//Bond


  const changeNetworks = async (chainId : number) => {
    const result = await switchEthereumChain(chainId);
    if (!result) {
      const message = "Unable to switch networks. Please change network using provider.";
      // dispatch(error(message));
    }
    return result;
  };

  const metaData = useSelector((state:any) => {
    console.log("meatadata");
    console.log(state?.swap?.value);
    return state?.swap?.value;
  });


  //helper function
  const sleep = (seconds: number) => {
    return new Promise(resolve => setTimeout(() => resolve(null), seconds * 1000));
  };
  const sliceList = (data: any[], length: number) => {
    return data.slice(0, length);
  }

  const getDownRate = (fromToken: any, toToken: any, fromTokenAmount: number, toTokenAmount: number) => {
    if (fromTokenAmount == 0 || toTokenAmount == 0 || !fromToken || !toToken) {
      return 0;
    }
    const to = toTokenAmount * toToken.usdPrice;
    const from = fromTokenAmount * fromToken.usdPrice;
    return (to / from * 100 - 100);
  };

  function trim(number = 0, precision = 0) {
    // why would number ever be undefined??? what are we trimming?
    const array = number.toString().split(".");
    if (array.length === 1) return number.toString();
    if (precision === 0) return array[0].toString();
  
    const poppedNumber = array.pop() || "0";
    array.push(poppedNumber.substring(0, precision));
    const trimmedNumber = array.join(".");
    return trimmedNumber;
  }

  const setIsDexLoading = (value: string) => {
    window.localStorage.setItem("is-dex-loading", value);
  }

  //bond modal
  const openBondModal = () => {
    setBondModalOpen(true);
  };
  const closeBondModal = (bond: any) => {
    closeAllModal();
    if (!bond) {
      return;
    }
    setBond(bond);
  };

  //select tokenlist when select fromnetwork
  const fromNetworkDetails = async (fromNetwork:NetworkType) => {
    setFromUpdateTokenLoading(true);
    console.log("tokenblockchain");
    console.log(fromNetwork?.blockchain);
    let fromTokenList = metaData.tokens.filter((token:any) => token?.blockchain === fromNetwork?.blockchain);
    if (fromTokenList.length) {
      fromTokenList = fromTokenList.map((token:any) => {
        return { ...token, amount: 0 };
      });
    }
    setFromTokenList(fromTokenList);
    setFromSearchTokenList(fromTokenList);
    if (!address) {
      // sortTokenList(fromNetwork, fromTokenList);
      setFromToken(fromTokenList[0]);
      setFromUpdateTokenLoading(false);
      return;
    }
    const walletDetails = await rangoClient.getWalletsDetails([{
      blockchain: fromNetwork?.blockchain,
      address: address,
    }]);
    walletDetails.wallets.forEach(wallet => {
      if (wallet.balances) {
        wallet.balances.forEach(balance => {
          const index = fromTokenList.findIndex((token:any) => token.address === balance?.asset?.address);
          if (index>=0) {
            fromTokenList[index].amount = Number(balance?.amount.amount) || 0;
          }
        });
      } else {
        outOfService(wallet.blockChain);
      }
    });
    // fromTokenList.sort((a, b) => b.amount - a.amount);
    sortTokenList(fromNetwork, fromTokenList);
    setFromTokenList(fromTokenList);
    setFromSearchTokenList(fromTokenList);
    setFromToken(fromTokenList[0]);
    setFromUpdateTokenLoading(false);
  };

  const toNetworkDetails = async (toNetwork :NetworkType) => {
    setToUpdateTokenLoading(true);
    let toTokenList = metaData.tokens.filter((token:any) => token.blockchain === toNetwork?.blockchain);
    if (toTokenList.length) {
      toTokenList = toTokenList.map((token:any) => {
        return { ...token, amount: 0 };
      });
    }
    setToTokenList(toTokenList);
    setToSearchTokenList(toTokenList);
    if (!address) {
      // sortTokenList(toNetwork, toTokenList);
      if (fromNetwork?.blockchain === toNetwork?.blockchain) {
        setToToken(toTokenList[1]);
      } else {
        setToToken(toTokenList[0]);
      }
      setToUpdateTokenLoading(false);
      return;
    }
    const walletDetails = await rangoClient.getWalletsDetails([{
      blockchain: toNetwork?.blockchain,
      address: address,
    }]);
    walletDetails.wallets.forEach(wallet => {
      if (wallet.balances) {
        wallet.balances.forEach(balance => {
          const index = toTokenList.findIndex((token:any) => token.address === balance?.asset?.address);
          if (index>=0) {
            toTokenList[index].amount = Number(balance?.amount.amount) || 0;
          }
        });
      } else {
        outOfService(wallet.blockChain);
      }
    });
    // toTokenList.sort((a, b) => b.amount - a.amount);
    sortTokenList(toNetwork, toTokenList);
    setToTokenList(toTokenList);
    setToSearchTokenList(toTokenList);
    if (fromNetwork?.chainId == 0 && fromNetwork?.blockchain === toNetwork?.blockchain) {
      setToToken(toTokenList[1]);
    } else {
      setToToken(toTokenList[0]);
    }
    setToUpdateTokenLoading(false);
  };

  // Networkd Modal open Flag
  const opeNetworkModal = (type : string) => {
    if (type === modalType.from) {
      setFromNetworkModalOpen(true);
    } else {
      setToNetworkModalOpen(true);
    }
  }

  const closeNetworkModal = (type :string, network:NetworkType) => {
    closeAllModal();
    console.log("get network data");
    console.log(network);
    if (network.chainId == 0) {
      return;
    }
    if (type === modalType.from) {
      setFromNetwork(network);
      fromNetworkDetails(network);
    } else {
      setToNetwork(network);
      toNetworkDetails(network);
    }
    setBestRoute(null);
  }

  // close all token and network model opened flag
  const closeAllModal = () => {
    setFromNetworkModalOpen(false);
    setToNetworkModalOpen(false);
    setFromTokenModalOpen(false);
    setToTokenModalOpen(false);
    setBondModalOpen(false);
  };

  // manage token model flag

  const openTokenModal = (type :string) => {
    if (type === modalType.from) {
      setFromTokenModalOpen(true);
    } else {
      setToTokenModalOpen(true);
    }
  };

  const closeTokenModal = (type :string , token :any) => {
    closeAllModal();
    if (!token) {
      return;
    }
    if (type === modalType.from) {
      setFromToken(token);
    } else {
      setToToken(token);
    }
    setToTokenAmount("");
    setBestRoute(null);
  };


  const getBestRoute = async () => {
    setRouteLoading(true);
    setToTokenAmount("");
    let connectedWallets: { blockchain: string; addresses: string[]; }[] = [];
    const selectedWallets :any = {};
    if (address) {
      connectedWallets = swapNetworks.map(network => {
        return {
          blockchain: network?.blockchain,
          addresses: [address],
        };
      });
      selectedWallets[fromNetwork?.blockchain] = address;
      if (fromNetwork?.chainId !== toNetwork?.chainId) {
        selectedWallets[toNetwork?.blockchain] = address;
      }
    }
    const from = {
      blockchain: fromToken?.blockchain,
      symbol: fromToken?.symbol,
      address: fromToken?.address?.toLowerCase(),
    };
    const to = {
      blockchain: toToken?.blockchain,
      symbol: toToken?.symbol,
      address: toToken?.address == null ? toToken?.address : toToken?.address?.toLowerCase(),
    };
    const bestRoute = await rangoClient.getBestRoute({
      amount: fromTokenAmount,
      affiliateRef: RANGO_AFFILIATE_REF_ID,
      checkPrerequisites: true,
      connectedWallets,
      from,
      selectedWallets,
      to,
    });
    messageDetail = {
      details: [],
      step: 0,
      type: "swap",
      title: `Swap ${ fromTokenAmount } ${ fromToken.symbol } to ${ toToken.symbol }`,
    };
    if (bestRoute?.result?.swaps?.length) {
      bestRoute.result.swaps = bestRoute.result.swaps.map(swap => {
        return {
          ...swap,
          logo: metaData?.swappers.find((sw:any) => sw.id === swap.swapperId)?.logo,
        };
      });
      bestRoute.result.swaps.forEach((swap, index) => {
        messageDetail.details.push({
          text: "",
          txStatus: null,
          txHash: null,
          step: index,
          swap,
        });
      });
    }
    setBestRoute(bestRoute);
    setToTokenAmount(trim(Number(bestRoute?.result?.outputAmount), 4) || "0");
    setRouteLoading(false);
    const requiredAssets = bestRoute.validationStatus?.flatMap(v => v.wallets.flatMap(w => w.requiredAssets)) || [];
    setRequiredAssets(requiredAssets);
  };


 

  //Effect
  useEffect(() => {
    initialize().then();
    setIsDexLoading("false");
  }, [metaData, address]);

  useEffect(() => {
    if (!fromNetwork || !toNetwork) {
      return;
    }
    fromNetworkDetails(fromNetwork).then();
    toNetworkDetails(toNetwork).then();
  }, [address]);

  useEffect(() => {
    if (!fromNetwork || !initialized) {
      return;
    }
    fromNetworkDetails(fromNetwork).then();
  }, [fromNetwork]);

  useEffect(() => {
    if (!toNetwork || !initialized) {
      return;
    }
    toNetworkDetails(toNetwork).then();
  }, [toNetwork]);

  useEffect(() => {
    if (!fromTokenAmount || Number(fromTokenAmount) === 0 || !fromToken || !toToken || !initialized) {
      setBestRoute(null);
      setToTokenAmount("");
      return;
    }
    getBestRoute().then();
  }, [fromToken, toToken, fromTokenAmountDebounce]);

  const beforeUnloadListener = (event : any) => {
    event.preventDefault();
    return event.returnValue = "Are you sure you want to cancel swap and leave it not complete?";
  };

  const preventLeave = (prevent: any) => {

    const root = document.documentElement;

    // if(prevent) {
    //   root.style.cursor = "progress";
    //   document.body.setAttribute("is-paralyzed", "");
    //   addEventListener("beforeunload", beforeUnloadListener, {capture: true});
    // } else {
    //   root.style.removeProperty("cursor");
    //   document.body.removeAttribute("is-paralyzed");
    //   removeEventListener("beforeunload", beforeUnloadListener, {capture: true});
    // }
  }

  const swap = async () => {
    let currentStep = 0;
    messageDetail.step = currentStep;
    if (messageDetail.details.length>=0) {
      messageDetail.details[currentStep].text = "Swap process started";
    }
    // dispatch(multiChainSwap(JSON.parse(JSON.stringify(messageDetail))));
    setRequiredAssets([]);
    setForceBondLoading(false);
    if (!fromToken || !toToken) {
      return;
    }
    setSwapLoading(true);
    preventLeave(true);
    setIsDexLoading("true");
    try {
      while (true) {
        const txStatus = await executeRoute(bestRoute, currentStep);
        if (!txStatus || txStatus?.status !== TransactionStatus.SUCCESS || currentStep>=bestRoute.result.swaps.length - 1) {
          break;
        }
        currentStep++;
      }
    } catch (e) {
      console.log("error", e);
    } finally {
      setIsDexLoading("false");
    }
    preventLeave(false);
  };

  const executeRoute = async (routeResponse: any, step: any) => {
    if (routeResponse.result.swaps[step]) {
      const network:any = swapNetworks.find(network => network.blockchain === routeResponse.result.swaps[step].from.blockchain);
      if (network.chainId !== getSavedNetworkId()) {
        messageDetail.details[step].text = `Please change your wallet network to ${ network.blockchain }`;
        const result = await changeNetworks(network?.chainId);
        // if (!result) {
        //   dispatch(closeAll());
        //   return;
        // }
      }
    }
    messageDetail.details[step].text = `Sending request to ${ routeResponse.result.swaps[step].swapperId } for ${ routeResponse.result.swaps[step].from?.blockchain }.${ routeResponse.result.swaps[step].from?.symbol } token`;
    messageDetail.step = step;
    // dispatch(multiChainSwap(JSON.parse(JSON.stringify(messageDetail))));
    const signer = provider?.getSigner();

    let evmTransaction: any;
    try {
      while (true) {
        const transactionResponse = await rangoClient.createTransaction({
          requestId: routeResponse.requestId,
          step: step + 1,
          userSettings: { slippage: slippage.toString() },
          validations: { balance: true, fee: true },
        });

        evmTransaction = transactionResponse.transaction;
        if (evmTransaction?.isApprovalTx) {
          const finalTx = prepareEvmTransaction(evmTransaction);
          await signer?.sendTransaction(finalTx);
          await checkApprovalSync(routeResponse, rangoClient);
        } else {
          break;
        }
      }
      const finalTx = prepareEvmTransaction(evmTransaction);
      const txHash = (await signer?.sendTransaction(finalTx))?.hash;
      messageDetail.details[step].text = `Request sent to ${ routeResponse.result.swaps[step].swapperId } for ${ routeResponse.result.swaps[step].from?.blockchain }.${ routeResponse.result.swaps[step].from?.symbol } token`;
      messageDetail.details[step].txHash = txHash;
      // dispatch(multiChainSwap(JSON.parse(JSON.stringify(messageDetail))));
      const txStatus = await checkTransactionStatusSync(txHash, routeResponse, rangoClient, step);
      if (txStatus?.step>=routeResponse.result.swaps.length - 1) {
        if (fromNetwork?.chainId === NetworkIds.FantomOpera || toNetwork?.chainId === NetworkIds.FantomOpera) {
          setForceBondLoading(true);
        }
        setSwapLoading(false);
        setBestRoute(null);
        setFromTokenAmount("");
        setToTokenAmount("");
        // dispatch(closeAll());
        await fromNetworkDetails(fromNetwork);
        await toNetworkDetails(toNetwork);
      }
      return txStatus;
    } catch (e) {
      setSwapLoading(false);
      const rawMessage = JSON.stringify(e).substring(0, 90) + "...";
      await rangoClient.reportFailure({
        data: { message: rawMessage },
        eventType: "TX_FAIL",
        requestId: routeResponse.requestId,
      });
      // dispatch(closeAll());
      setBestRoute(null);
      await fromNetworkDetails(fromNetwork);
      await toNetworkDetails(toNetwork);
      return {
        status: TransactionStatus.FAILED,
      };
    }
  };

  const checkTransactionStatusSync = async (txHash: any, bestRoute: any, rangoClient: any, step: any) => {
    while (true) {
      let txStatus = await rangoClient.checkStatus({
        requestId: bestRoute.requestId,
        step: step + 1,
        txId: txHash,
      });
      txStatus = { ...txStatus, step };
      messageDetail.details[step].txStatus = txStatus;
      // dispatch(multiChainSwap(JSON.parse(JSON.stringify(messageDetail))));

      if (!!txStatus.status && [TransactionStatus.FAILED, TransactionStatus.SUCCESS].includes(txStatus.status)) {
        return txStatus;
      }
      await sleep(3);
    }
  };
  const outOfService = (chainName :any) => {
    // dispatch(info(`Swap on ${chainName} chain is currently out of service.`));
  };

  const isSwappable = () => {
    return (bestRoute && bestRoute?.result) && expectSwapErrors(bestRoute?.result?.swaps).length === 0 && requireAssetMessage(requiredAssets).length === 0;
  };

  const isPriceImpact = () => {
    return isSwappable() && getDownRate(fromToken, toToken, Number(fromTokenAmount), Number(toTokenAmount))< -5;
  };

  const changeTokenModalList = (name : string, type : string) => {
    if (type === modalType.from) {
      const list = fromTokenList.filter((token:any) => token.symbol.toLowerCase().indexOf(name.toLowerCase())>=0);
      setFromSearchTokenList(list);
    } else {
      const list = toTokenList.filter((token:any) => token.symbol.toLowerCase().indexOf(name.toLowerCase())>=0);
      setToSearchTokenList(list);
    }
  };
  const setMaxFromTokenAmount = () => {
    setFromTokenAmount(formatAmount(fromToken?.amount, fromToken?.decimals, 2, fromToken?.symbol).toString());
  };
  const initialize = async () => {
    if (!metaData) {
      return;
    }
    setInitialLoading(true);
    const toNetwork = swapNetworks[2];
    let fromNetwork;
    fromNetwork = swapNetworks[0];
    setFromNetwork(fromNetwork);
    setToNetwork(toNetwork);
    console.log(metaData);
    setInitialLoading(false);
    await fromNetworkDetails(fromNetwork);
    await toNetworkDetails(toNetwork);
    setInitialized(true);
  };

  return (
    <div className="w-full h-full">
      <div>      
        <span className="text-black">Dex</span>
        <ConnectButton/>
      </div>
      <div id="swap-view">
        <NetworkModal type={ modalType.from } open={ fromNetworkModalOpen } onClose={ closeNetworkModal } />
        <NetworkModal type={ modalType.to } open={ toNetworkModalOpen } onClose={ closeNetworkModal } />
        <TokenModal type={ modalType.from } open={ fromTokenModalOpen } tokenCount={ fromTokenList.length }
                    tokenList={ fromSearchTokenList } searchList={ sliceList(fromTokenList, 20) }
                    onChange={ changeTokenModalList } onClose={ closeTokenModal } />
        <TokenModal type={ modalType.to } open={ toTokenModalOpen } tokenCount={ toTokenList.length }
                    tokenList={ toSearchTokenList } searchList={ sliceList(toTokenList, 20) }
                    onChange={ changeTokenModalList } onClose={ closeTokenModal } />
        <BondModal type={ modalType.bond } open={ bondModalOpen } bonds={ bonds44 }
                  onClose={ closeBondModal } />

        <Grid container spacing={ 1 }>
          <Grid item xs={ 12 } sm={ 12 } md={ 6 } key="multichain-swap" className="justify-box">
            <Zoom in={ true }>
              <Box className="multichain-swap-banner" borderRadius="10px" mb="10px" />
            </Zoom>
            <Zoom in={ true }>
              <Paper className="ohm-card w-full">
                {
                  initialLoading ?
                    <Box display="flex" justifyContent="center" alignItems="center">
                      <ReactLoading type="spinningBubbles" color="#fff" />
                    </Box> : (
                      <Box>
                        <div className="pair">
                          <FromTokenSection fromToken={ fromToken } fromTokenAmount={ fromTokenAmount }
                                            fromNetwork={ fromNetwork }
                                            setFromTokenAmount={ setFromTokenAmount }
                                            setMaxFromTokenAmount={ setMaxFromTokenAmount }
                                            fromUpdateTokenLoading={ fromUpdateTokenLoading }
                                            openTokenModal={ openTokenModal }
                                            opeNetworkModal={ opeNetworkModal } />
                          <ToTokenSection fromToken={ fromToken } fromTokenAmount={ fromTokenAmount } toToken={ toToken }
                                          toTokenAmount={ toTokenAmount } toNetwork={ toNetwork }
                                          openTokenModal={ openTokenModal } opeNetworkModal={ opeNetworkModal }
                                          toUpdateTokenLoading={ toUpdateTokenLoading } />
                        </div>

                        <Box my="20px" bgcolor="#3c434ecc" p="10px" borderRadius="5px">
                          <Typography variant="h6" className="font-weight-bolder">Swap consists of multiple transactions on
                            multiple chains. Please stay on screen and confirm all transactions.
                          </Typography>
                        </Box>
                        <BestRoute bestRoute={ bestRoute } routeLoading={ routeLoading } slippage={ slippage }
                                  setSlippage={ setSlippage } metaData={ metaData }
                                  fromTokenAmount={ fromTokenAmount } toTokenAmount={ toTokenAmount }
                                  fromToken={ fromToken }
                                  toToken={ toToken } requiredAssets={ requiredAssets } />
                        <Box mt="20px" display="flex" justifyContent="center">
                          {
                            !address && <Button
                              variant="contained"
                              color="primary"
                              onClick={ connect }
                            >
                              Connect Wallet
                            </Button>
                          }
                          {
                            address && !isPriceImpact() && <Button
                              variant="contained"
                              color="primary"
                              disabled={ !isSwappable() || swapLoading }
                              onClick={ () => swap() }
                            >
                              SWAP
                            </Button>
                          }
                          {
                            address && isPriceImpact() && <Box className="price-impact">
                              <Button
                                variant="contained"
                                className="price-impact"
                                disabled={ !isPriceImpact() || swapLoading }
                                onClick={ () => swap() }
                              >
                                <Box display="flex" alignItems="center">
                                  Price impact is too high!
                                  <Box ml="10px" display="flex" alignItems="center">
                                    <Tooltip
                                      arrow
                                      title={ `The estimated output is ${ getDownRate(fromToken, toToken, Number(fromTokenAmount), Number(toTokenAmount)).toFixed(2) }% lower than input amount. Please be careful.` }
                                    >
                                      <HelpOutlineIcon viewBox="0 0 25 25" />
                                    </Tooltip>
                                  </Box>
                                </Box>
                              </Button>
                            </Box>
                          }
                        </Box>
                      </Box>
                    )
                }
              </Paper>
            </Zoom>
          </Grid>
          <Grid item xs={ 12 } sm={ 12 } md={ 6 } key="bond" className="justify-box">
            <Zoom in={ true }>
              <Box className="bonding-banner" borderRadius="10px" mb="10px" />
            </Zoom>
            <Zoom in={ true }>
              <Paper className="ohm-card w-full">
                { !address ? (
                  <Box display="flex" justifyContent="center">
                    <Button variant="contained" color="primary" onClick={ connect }>
                      Connect Wallet
                    </Button>
                  </Box>) : (chainId === NetworkIds.FantomOpera ? (
                    <BondSection bond={ bond } address={ address } openBondModal={ openBondModal }
                                forceBondLoading={ forceBondLoading }
                                opeNetworkModal={ opeNetworkModal } />
                  ) : (<Box display="flex" flexDirection="column" alignItems="center" justifyContent="center">
                    <Typography variant="h5">Bonding is available on Fantom Network.</Typography>
                    <Box mt="20px">
                      <Button variant="contained" color="primary"
                              onClick={ () => changeNetworks(NetworkIds.FantomOpera).then() }>
                        Switch Network
                      </Button>
                    </Box>
                  </Box>)
                ) }
              </Paper> 
            </Zoom>
          </Grid>
        </Grid>
      </div>
    </div>
  )
}

export default Dex;