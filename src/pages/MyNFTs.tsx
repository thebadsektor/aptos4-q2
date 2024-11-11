// src/pages/MyNFTs.tsx

import React from "react";
import { Typography } from "antd";

const { Title } = Typography;

const MyNFTs: React.FC = () => {
  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <Title level={2}>My NFTs</Title>
      <p>This is a placeholder page for displaying user-owned NFTs.</p>
    </div>
  );
};

export default MyNFTs;
