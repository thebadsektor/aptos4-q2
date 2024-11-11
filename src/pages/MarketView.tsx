// src/pages/MarketView.tsx

import React, { useState, useEffect } from "react";
import { Typography, Radio, message, Card, Row, Col, Pagination } from "antd";
import { AptosClient } from "aptos";

const { Text } = Typography;

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

interface MarketViewProps {
  marketplaceAddr: string;
}

const MarketView: React.FC<MarketViewProps> = ({ marketplaceAddr }) => {
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [rarity, setRarity] = useState<'all' | number>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  useEffect(() => {
    handleFetchNfts(undefined);
  }, []);

  const handleFetchNfts = async (selectedRarity: number | undefined) => {
    try {
      const response = await client.getAccountResource(
        marketplaceAddr,
        "0x3eb024cc6f42b296ffc6b519ab89782eaa90c0b90bcc5305eb8f3565360a702d::NFTMarketplace::Marketplace"
      );
      const nftList = (response.data as { nfts: NFT[] }).nfts;

      const hexToUint8Array = (hexString: string): Uint8Array => {
        const bytes = new Uint8Array(hexString.length / 2);
        for (let i = 0; i < hexString.length; i += 2) {
          bytes[i / 2] = parseInt(hexString.substr(i, 2), 16);
        }
        return bytes;
      };

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
      setCurrentPage(1);
    } catch (error) {
      console.error("Error fetching NFTs by rarity:", error);
      message.error("Failed to fetch NFTs.");
    }
  };

  const paginatedNfts = nfts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div>
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
    </div>
  );
};

export default MarketView;
