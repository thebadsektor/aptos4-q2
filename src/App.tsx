import React, { useEffect, useState } from "react";
import "./App.css";
import { WalletSelector } from "@aptos-labs/wallet-adapter-ant-design";
import "@aptos-labs/wallet-adapter-ant-design/dist/index.css";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { AptosClient } from "aptos";
import { Layout, Typography, Menu, Space, Button, Radio, message, Card, Row, Col, Pagination } from "antd";
import { AccountBookOutlined } from "@ant-design/icons";

const { Header } = Layout;
const { Title, Text } = Typography;

const client = new AptosClient("https://fullnode.testnet.aptoslabs.com/v1");

type NFT = {
  id: number;
  owner: string;
  name: string;
  description: string;
  uri: string;
  price: number;
  for_sale: boolean;
  rarity: number;
};

function App() {
  const { connected, account, network } = useWallet();
  const [balance, setBalance] = useState<number | null>(null);
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [rarity, setRarity] = useState<'all' | number>('all'); // Set default to 'all'
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

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

    const fetchMarketplaceResources = async () => {
      const marketplaceAddr = "0x3eb024cc6f42b296ffc6b519ab89782eaa90c0b90bcc5305eb8f3565360a702d";
      try {
        const resources = await client.getAccountResources(marketplaceAddr);
        console.log("Resources available at marketplace address:", resources);
      } catch (error) {
        console.error("Error fetching marketplace resources:", error);
      }
    };

    if (connected) {
      fetchBalance();
      fetchMarketplaceResources();
      handleFetchNfts(undefined); // Fetch all NFTs by default
    }
  }, [account, connected]);

  function hexToUint8Array(hexString: string): Uint8Array {
    const bytes = new Uint8Array(hexString.length / 2);
    for (let i = 0; i < hexString.length; i += 2) {
      bytes[i / 2] = parseInt(hexString.substr(i, 2), 16);
    }
    return bytes;
  }

  const getNftsByRarity = async (marketplaceAddr: string, rarity?: number): Promise<NFT[]> => {
    try {
      const response = await client.getAccountResource(
        marketplaceAddr,
        "0x3eb024cc6f42b296ffc6b519ab89782eaa90c0b90bcc5305eb8f3565360a702d::NFTMarketplace::Marketplace"
      );
      const nftList = (response.data as { nfts: NFT[] }).nfts;
      console.log("All NFTs fetched from marketplace:", nftList);

      const filteredNfts = rarity !== undefined
        ? nftList.filter((nft) => nft.rarity === rarity)
        : nftList;

      return filteredNfts.map((nft) => ({
        ...nft,
        name: new TextDecoder().decode(Uint8Array.from(hexToUint8Array(nft.name.slice(2)))),
        description: new TextDecoder().decode(Uint8Array.from(hexToUint8Array(nft.description.slice(2)))),
        uri: new TextDecoder().decode(Uint8Array.from(hexToUint8Array(nft.uri.slice(2)))),
        price: parseInt(nft.price.toString(), 10),
      }));
    } catch (error) {
      console.error("Error fetching NFTs by rarity:", error);
      return [];
    }
  };

  const handleFetchNfts = async (selectedRarity: number | undefined) => {
    const marketplaceAddr = "0x3eb024cc6f42b296ffc6b519ab89782eaa90c0b90bcc5305eb8f3565360a702d";
    const fetchedNfts = await getNftsByRarity(marketplaceAddr, selectedRarity);
    setNfts(fetchedNfts);
    setCurrentPage(1); // Reset to the first page when a new filter is applied
    message.success(`Fetched NFTs ${selectedRarity ? `with rarity: ${selectedRarity}` : "of all rarities"}`);
  };

  const paginatedNfts = nfts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <Layout>
      <Header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#001529" }}>
        <Title level={3} style={{ color: "#fff", margin: 0 }}>Aptos NFT Marketplace</Title>
        <Space>
          {connected && account ? (
            <Menu theme="dark" mode="horizontal" style={{ backgroundColor: "#001529" }} selectedKeys={[]} defaultSelectedKeys={[]}>
              <Menu.Item key="address" icon={<AccountBookOutlined />}>
                <Text style={{ color: "#fff" }}>Account: {account.address}</Text>
              </Menu.Item>
              <Menu.Item key="network">
                <Text style={{ color: "#fff" }}>Network: {network ? network.name : "Unknown"}</Text>
              </Menu.Item>
              <Menu.Item key="balance">
                <Text style={{ color: "#fff" }}>Balance: {balance !== null ? `${balance} APT` : "Loading..."}</Text>
              </Menu.Item>
            </Menu>
          ) : (
            <Text style={{ color: "#fff" }}>No wallet connected</Text>
          )}
          <WalletSelector />
        </Space>
      </Header>

      {/* Radio Buttons for Rarity Selection */}
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <Radio.Group
          value={rarity}
          onChange={(e) => {
            const selectedRarity = e.target.value;
            setRarity(selectedRarity);
            handleFetchNfts(selectedRarity === 'all' ? undefined : selectedRarity);
          }}
          buttonStyle="solid"
        >
          <Radio.Button value="all">All</Radio.Button>
          <Radio.Button value={1}>Common</Radio.Button>
          <Radio.Button value={2}>Uncommon</Radio.Button>
          <Radio.Button value={3}>Rare</Radio.Button>
          <Radio.Button value={4}>Super Rare</Radio.Button>
        </Radio.Group>
      </div>

      {/* Display NFT Cards */}
      <Row gutter={[16, 16]} style={{ padding: '20px' }}>
        {paginatedNfts.map((nft, index) => (
          <Col span={6} key={index}>
            <Card
              hoverable
              cover={<img alt={nft.name} src={nft.uri} />}
              title={nft.name}
            >
              <p>ID: {nft.id}</p>
              <p>Owner: {nft.owner}</p>
              <p>Description: {nft.description}</p>
              <p>Price: {nft.price} APT</p>
              <p>For Sale: {nft.for_sale ? "Yes" : "No"}</p>
              <p>Rarity: {nft.rarity}</p>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Pagination Component */}
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <Pagination
          current={currentPage}
          pageSize={pageSize}
          total={nfts.length}
          onChange={(page) => setCurrentPage(page)}
        />
      </div>
    </Layout>
  );
}

export default App;
