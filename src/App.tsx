// src/App.tsx
import React, { useEffect, useState } from "react";
import "./App.css";
import { AptosClient, Types } from "aptos";
import { Typography, Layout, Radio, message, Card, Row, Col, Pagination, Modal, Form, Input, Select, Button } from "antd";
import NavBar from "./components/NavBar";
import { useWallet } from "@aptos-labs/wallet-adapter-react";

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
  const { connected, account, signAndSubmitTransaction } = useWallet();
  const [balance, setBalance] = useState<number | null>(null);
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [rarity, setRarity] = useState<'all' | number>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const pageSize = 8;

  const marketplaceAddr = "0x3eb024cc6f42b296ffc6b519ab89782eaa90c0b90bcc5305eb8f3565360a702d";

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
      handleFetchNfts(undefined);
    }
  }, [account, connected]);

  // Helper function to convert hex to Uint8Array
  function hexToUint8Array(hexString: string): Uint8Array {
    const bytes = new Uint8Array(hexString.length / 2);
    for (let i = 0; i < hexString.length; i += 2) {
      bytes[i / 2] = parseInt(hexString.substr(i, 2), 16);
    }
    return bytes;
  }

  const handleMintNFTClick = () => setIsModalVisible(true);

  const handleMintNFT = async (values: { name: string; description: string; uri: string; rarity: number }) => {
    try {
      // Validate input data
      if (!values.name || !values.description || !values.uri || values.rarity === undefined) {
        message.error("All fields (Name, Description, URI, and Rarity) are required.");
        return;
      }

      // Prepare transaction payload
      const nameVector = Array.from(new TextEncoder().encode(values.name));
      const descriptionVector = Array.from(new TextEncoder().encode(values.description));
      const uriVector = Array.from(new TextEncoder().encode(values.uri));

      const entryFunctionPayload = {
        type: "entry_function_payload",
        function: `${marketplaceAddr}::NFTMarketplace::mint_nft`,
        type_arguments: [],
        arguments: [nameVector, descriptionVector, uriVector, values.rarity],
      };

      const txnResponse = await (window as any).aptos.signAndSubmitTransaction(entryFunctionPayload);
      await client.waitForTransaction(txnResponse.hash);

      message.success("NFT minted successfully!");
      setIsModalVisible(false);
      handleFetchNfts(undefined); // Refresh NFT list
    } catch (error) {
      console.error("Error minting NFT:", error);
      message.error("Failed to mint NFT.");
    }
  };

  const handleFetchNfts = async (selectedRarity: number | undefined) => {
    try {
      const response = await client.getAccountResource(
        marketplaceAddr,
        "0x3eb024cc6f42b296ffc6b519ab89782eaa90c0b90bcc5305eb8f3565360a702d::NFTMarketplace::Marketplace"
      );
      const nftList = (response.data as { nfts: NFT[] }).nfts;

      // Apply decoding to each NFT's fields
      const decodedNfts = nftList.map((nft) => ({
        ...nft,
        name: new TextDecoder().decode(hexToUint8Array(nft.name.slice(2))),
        description: new TextDecoder().decode(hexToUint8Array(nft.description.slice(2))),
        uri: new TextDecoder().decode(hexToUint8Array(nft.uri.slice(2))),
      }));

      const filteredNfts = selectedRarity !== undefined
        ? decodedNfts.filter((nft) => nft.rarity === selectedRarity)
        : decodedNfts;

      setNfts(filteredNfts);
      setCurrentPage(1); // Reset to the first page when a new filter is applied
      // message.success(`Fetched NFTs ${selectedRarity ? `with rarity: ${selectedRarity}` : "of all rarities"}`);
    } catch (error) {
      console.error("Error fetching NFTs by rarity:", error);
      message.error("Failed to fetch NFTs.");
    }
  };

  const paginatedNfts = nfts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <Layout>
      {/* Use NavBar Component */}
      <NavBar onMintNFTClick={handleMintNFTClick} />
      
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
          <Radio.Button value={1}>Rarity 1</Radio.Button>
          <Radio.Button value={2}>Rarity 2</Radio.Button>
          <Radio.Button value={3}>Rarity 3</Radio.Button>
          <Radio.Button value={4}>Rarity 4</Radio.Button>
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

      {/* Mint NFT Modal */}
      <Modal
        title="Mint New NFT"
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <Form layout="vertical" onFinish={handleMintNFT}>
          <Form.Item label="Name" name="name" rules={[{ required: true, message: 'Please enter a name!' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Description" name="description" rules={[{ required: true, message: 'Please enter a description!' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="URI" name="uri" rules={[{ required: true, message: 'Please enter a URI!' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Rarity" name="rarity" rules={[{ required: true, message: 'Please select a rarity!' }]}>
            <Select>
              <Select.Option value={1}>Common</Select.Option>
              <Select.Option value={2}>Uncommon</Select.Option>
              <Select.Option value={3}>Rare</Select.Option>
              <Select.Option value={4}>Epic</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Mint NFT
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
}

export default App;
