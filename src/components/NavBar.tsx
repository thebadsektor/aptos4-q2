// src/components/NavBar.tsx

import React, { useEffect, useState } from "react";
import { Layout, Typography, Menu, Space, Button } from "antd";
import { WalletSelector } from "@aptos-labs/wallet-adapter-ant-design";
import "@aptos-labs/wallet-adapter-ant-design/dist/index.css";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { AptosClient } from "aptos";
import { AccountBookOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";

const { Header } = Layout;
const { Text } = Typography;

const client = new AptosClient("https://fullnode.testnet.aptoslabs.com/v1");

interface NavBarProps {
  onMintNFTClick: () => void;
}

const NavBar: React.FC<NavBarProps> = ({ onMintNFTClick }) => {
  const { connected, account, network } = useWallet();
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    const fetchBalance = async () => {
      if (account) {
        try {
          const resources: any[] = await client.getAccountResources(account.address);
          const accountResource = resources.find(
            (r) => r.type === "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>"
          );
          if (accountResource) {
            const balanceValue = (accountResource.data as any).coin.value;
            setBalance(balanceValue ? parseInt(balanceValue) / 100000000 : 0);
          } else {
            setBalance(0);
          }
        } catch (error) {
          console.error("Error fetching balance:", error);
        }
      }
    };

    if (connected) {
      fetchBalance();
    }
  }, [account, connected]);

  return (
    <Header
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#001529",
        padding: "0 20px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center" }}>
        <img src="/Aptos_Primary_WHT.png" alt="Aptos Logo" style={{ height: "30px", marginRight: 16 }} />
        <Menu theme="dark" mode="horizontal" defaultSelectedKeys={["marketplace"]} style={{ backgroundColor: "#001529" }}>
          <Menu.Item key="marketplace">
            <Link to="/" style={{ color: "#fff" }}>Marketplace</Link>
          </Menu.Item>
          <Menu.Item key="my-collection">
            <Link to="/my-nfts" style={{ color: "#fff" }}>My Collection</Link>
          </Menu.Item>
        </Menu>
      </div>
  
      <Space style={{ alignItems: "center" }}>
        {connected && account ? (
          <Menu theme="dark" mode="horizontal" style={{ backgroundColor: "#001529" }} selectable={false}>
            <Menu.Item key="address" icon={<AccountBookOutlined />}>
              <Text style={{ color: "#fff" }}>Account: {account.address}</Text>
            </Menu.Item>
            <Menu.Item key="network">
              <Text style={{ color: "#fff" }}>Network: {network ? network.name : "Unknown"}</Text>
            </Menu.Item>
            <Menu.Item key="balance">
              <Text style={{ color: "#fff" }}>Balance: {balance !== null ? `${balance} APT` : "Loading..."}</Text>
            </Menu.Item>
            <Menu.Item key="mint">
              <Button type="primary" onClick={onMintNFTClick}>Mint NFT</Button>
            </Menu.Item>
          </Menu>
        ) : (
          <Text style={{ color: "#fff" }}>No wallet connected</Text>
        )}
        <WalletSelector />
      </Space>
    </Header>
  );
};

export default NavBar;
