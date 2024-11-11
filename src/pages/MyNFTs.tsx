// src/pages/MyNFTs.tsx

import React, { useState } from "react";
import { Typography, Card, Row, Col, Pagination } from "antd";

const { Title } = Typography;
const { Meta } = Card;

type NFT = {
  id: number;
  name: string;
  description: string;
  uri: string;
  rarity: number;
  price: number;
  for_sale: boolean;
};

const MyNFTs: React.FC = () => {
  const pageSize = 8;
  const [currentPage, setCurrentPage] = useState(1);

  // Static array of mock NFTs
  const mockNFTs: NFT[] = Array.from({ length: 20 }, (_, i) => ({
    id: i + 1,
    name: `NFT ${i + 1}`,
    description: `Description of NFT ${i + 1}`,
    uri: "https://via.placeholder.com/150",
    rarity: (i % 4) + 1, // Mock rarity levels 1-4
    price: (i + 1) * 0.1, // Incremental mock price
    for_sale: i % 2 === 0, // Alternate for_sale status
  }));

  // Paginate the NFTs
  const paginatedNFTs = mockNFTs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div style={{ padding: "30px 0", textAlign: "center" }}>
      <Title level={2}>My Collection</Title>
      <p>This is a placeholder page for displaying user-owned NFTs.</p>

      <Row gutter={[24, 24]} justify="center" style={{ marginTop: 40, maxWidth: "100%" }}>
        {paginatedNFTs.map((nft) => (
          <Col key={nft.id} xs={24} sm={12} md={8} lg={6} xl={6}>
            <Card
              hoverable
              style={{ width: 240, margin: "0 auto" }}
              cover={<img alt={nft.name} src={nft.uri} />}
            >
              <Meta title={nft.name} description={`Rarity: ${nft.rarity}, Price: ${nft.price} APT`} />
              <p>ID: {nft.id}</p>
              <p>{nft.description}</p>
              <p style={{ margin: "10px 0" }}>For Sale: {nft.for_sale ? "Yes" : "No"}</p>
            </Card>
          </Col>
        ))}
      </Row>

      <div style={{ marginTop: 20 }}>
        <Pagination
          current={currentPage}
          pageSize={pageSize}
          total={mockNFTs.length}
          onChange={(page) => setCurrentPage(page)}
          style={{ display: "flex", justifyContent: "center" }}
        />
      </div>
    </div>
  );
};

export default MyNFTs;
