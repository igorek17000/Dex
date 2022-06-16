import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Box, Button, SvgIcon, Typography, Popper, Paper, Divider, Link, Slide, Fade } from "@material-ui/core";
import { ReactComponent as ArrowUpIcon } from "../../assets/icons/arrow-up.svg";
import { ReactComponent as CaretDownIcon } from "../../assets/icons/caret-down.svg";
import { useWeb3Context } from "../../hooks/web3Context";
import { NetworkIds, networks } from "../../networks";

const ConnectButton = () => {
  const { provider,disconnect, connect, web3Modal,connected, address, chainId } = useWeb3Context();
  // const { connect } = useWeb3Context();
  let buttonText = "Connect Wallet";
  let clickFunc = connect;
  const [isConnected, setConnected] = useState(connected);
  if (isConnected) {
    buttonText = "Disconnect";
    clickFunc = disconnect;
  }
  useEffect(() => {
    setConnected(connected);
  }, [web3Modal, connected]);
  return (
    <div>
    <Button
        // className={buttonStyles}
        variant="contained"
        color="secondary"
        size="large"
        // style={pendingTransactions.length > 0 ? { color: primaryColor } : {}}
        onClick={clickFunc}
        // onMouseOver={() => setIsHovering(true)}
        // onMouseLeave={() => setIsHovering(false)}
        key={1}
        disableElevation={false}
      >
        {buttonText}
        {/* {pendingTransactions.length > 0 && (
          <Slide direction="left" in={isHovering} {...{ timeout: 333 }}>
            <SvgIcon className="caret-down" component={CaretDownIcon} htmlColor={primaryColor} />
          </Slide>
        )} */}
      </Button>
      <div>{address}</div>
      <div>{chainId}</div>
    </div>
  );
};

export default ConnectButton;
