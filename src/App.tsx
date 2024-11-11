import React, { useEffect, useState } from "react";
import "./App.css";
import { WalletSelector } from "@aptos-labs/wallet-adapter-ant-design";
import "@aptos-labs/wallet-adapter-ant-design/dist/index.css";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { AptosClient, Types } from "aptos";
import { Layout, Typography, Menu, Space, Button, Radio, message, Card, Row, Col, Pagination, Modal, Form, Input, Select } from "antd";
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { connected, account, network, signAndSubmitTransaction } = useWallet();
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

  const handleMintNFTClick = () => setIsModalVisible(true);

  const handleMintNFT = async (values: { name: string; description: string; uri: string; rarity: number }) => {
    try {
      console.log("Function called with values:", values); // Log the input values
      // Validate input data
      if (!values.name || !values.description || !values.uri || values.rarity === undefined) {
        console.error("Validation failed: Missing required fields");
        message.error("All fields (Name, Description, URI, and Rarity) are required.");
        return; // Exit the function if validation fails
      }

      console.log("Input validation passed");

      // Step 3: Prepare transaction payload
      // Convert name, description, and URI to byte arrays
      const nameVector = Array.from(new TextEncoder().encode(values.name));
      const descriptionVector = Array.from(new TextEncoder().encode(values.description));
      const uriVector = Array.from(new TextEncoder().encode(values.uri));

      console.log("Encoded name:", nameVector);
      console.log("Encoded description:", descriptionVector);
      console.log("Encoded URI:", uriVector);
      console.log("Rarity:", values.rarity);

      // Step 4: Build the transaction payload
      const entryFunctionPayload = {
        type: "entry_function_payload",
        function: `${marketplaceAddr}::NFTMarketplace::mint_nft`,
        type_arguments: [],
        arguments: [nameVector, descriptionVector, uriVector, values.rarity],
      };

      console.log("Transaction Payload:", entryFunctionPayload);

      // Step 5: Send the transaction using window.aptos
      console.log("Submitting transaction...");
      const txnResponse = await (window as any).aptos.signAndSubmitTransaction(entryFunctionPayload);
      console.log("Transaction response:", txnResponse);

      // Wait for transaction confirmation
      await client.waitForTransaction(txnResponse.hash);
      console.log("Transaction confirmed");

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
      const filteredNfts = selectedRarity !== undefined
        ? nftList.filter((nft) => nft.rarity === selectedRarity)
        : nftList;

      setNfts(filteredNfts);
      setCurrentPage(1); // Reset to the first page when a new filter is applied
      message.success(`Fetched NFTs ${selectedRarity ? `with rarity: ${selectedRarity}` : "of all rarities"}`);
    } catch (error) {
      console.error("Error fetching NFTs by rarity:", error);
      message.error("Failed to fetch NFTs.");
    }
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
              <Menu.Item key="mint">
                <Text style={{ color: "#fff", cursor: "pointer" }} onClick={handleMintNFTClick}>Mint NFT</Text>
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
