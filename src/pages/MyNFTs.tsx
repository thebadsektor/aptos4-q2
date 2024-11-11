import React, { useEffect, useState, useCallback } from "react";
import { Typography, Card, Row, Col, Pagination, message, Button, Input, Modal } from "antd";
import { AptosClient } from "aptos";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { EditOutlined } from "@ant-design/icons";

const { Title } = Typography;
const { Meta } = Card;

const client = new AptosClient("https://fullnode.testnet.aptoslabs.com/v1");

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
    const [nfts, setNfts] = useState<NFT[]>([]);
    const [totalNFTs, setTotalNFTs] = useState(0);
    const { account } = useWallet();
    const marketplaceAddr = "0x3eb024cc6f42b296ffc6b519ab89782eaa90c0b90bcc5305eb8f3565360a702d";

    // State for the Sell modal
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedNft, setSelectedNft] = useState<NFT | null>(null);
    const [salePrice, setSalePrice] = useState<number | string>("");

    const fetchUserNFTs = useCallback(async () => {
    if (!account) return;

    try {
        console.log("Fetching NFT IDs for owner:", account.address);

        // Fetch NFT IDs with pagination
        const nftIdsResponse = await client.view({
        function: `${marketplaceAddr}::NFTMarketplace::get_all_nfts_for_owner`,
        arguments: [marketplaceAddr, account.address, "100", "0"], // Fetch all for debugging
        type_arguments: [],
        });

        const nftIds = Array.isArray(nftIdsResponse[0]) ? nftIdsResponse[0] : nftIdsResponse;

        // Set total NFT count
        setTotalNFTs(nftIds.length);

        if (nftIds.length === 0) {
        console.log("No NFTs found for the owner.");
        setNfts([]);
        return;
        }

        console.log("Fetching details for each NFT ID:", nftIds);

        // Fetch details for each NFT ID
        const userNFTs = (await Promise.all(
        nftIds.map(async (id) => {
            console.log(`Fetching details for NFT ID: ${id}`);
            try {
            const nftDetails = await client.view({
                function: `${marketplaceAddr}::NFTMarketplace::get_nft_details`,
                arguments: [marketplaceAddr, id], // Pass ID as a string
                type_arguments: [],
            });

            console.log(`NFT details for ID ${id}:`, nftDetails);

            const [nftId, owner, name, description, uri, price, forSale, rarity] = nftDetails as [
                number,
                string,
                string,
                string,
                string,
                number,
                boolean,
                number
            ];

            const hexToUint8Array = (hexString: string): Uint8Array => {
                const bytes = new Uint8Array(hexString.length / 2);
                for (let i = 0; i < hexString.length; i += 2) {
                    bytes[i / 2] = parseInt(hexString.substr(i, 2), 16);
                }
                return bytes;
                };

            return {
                id: nftId,
                name: new TextDecoder().decode(hexToUint8Array(name.slice(2))),
                description: new TextDecoder().decode(hexToUint8Array(description.slice(2))),
                uri: new TextDecoder().decode(hexToUint8Array(uri.slice(2))),
                rarity,
                price,
                for_sale: forSale,
            };
            } catch (error) {
            console.error(`Error fetching details for NFT ID ${id}:`, error);
            return null; // Return null if fetching details fails
            }
        })
        )).filter((nft): nft is NFT => nft !== null); // Filter out null values

        console.log("User NFTs:", userNFTs);
        setNfts(userNFTs);
    } catch (error) {
        console.error("Error fetching NFTs:", error);
        message.error("Failed to fetch your NFTs.");
    }
    }, [account, marketplaceAddr, currentPage]);

    // Open the modal when "Sell" button is clicked
    const handleSellClick = (nft: NFT) => {
    setSelectedNft(nft);
    setIsModalVisible(true);
    };

    // Close the modal
    const handleCancel = () => {
    setIsModalVisible(false);
    setSelectedNft(null);
    setSalePrice("");
    };

  // Call fetchUserNFTs on component mount and when `account` or `currentPage` changes
  useEffect(() => {
    fetchUserNFTs();
  }, [fetchUserNFTs, currentPage]);

  // Paginate the NFTs
  const paginatedNFTs = nfts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div style={{ padding: "30px 0", textAlign: "center" }}>
      <Title level={2}>My Collection</Title>
      <p>Your personal collection of NFTs.</p>

      <Row gutter={[24, 24]} justify="center" style={{ marginTop: 40, maxWidth: "100%" }}>
        {paginatedNFTs.map((nft) => (
          <Col key={nft.id} xs={24} sm={12} md={8} lg={6} xl={6}>
            <Card
              hoverable
              style={{ width: 240, margin: "0 auto" }}
              cover={<img alt={nft.name} src={nft.uri} />}
              actions={[
                <Button type="link" onClick={() => handleSellClick(nft)}>
                  Sell
                </Button>
              ]}
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
          total={totalNFTs}
          onChange={(page) => setCurrentPage(page)}
          style={{ display: "flex", justifyContent: "center" }}
        />
      </div>

      {/* Sell Modal */}
      <Modal
        title="Sell NFT"
        visible={isModalVisible}
        onCancel={handleCancel}
        footer={[
          <Button key="cancel" onClick={handleCancel}>
            Cancel
          </Button>,
          <Button key="confirm" type="primary">
            Confirm Listing
          </Button>,
        ]}
      >
        {selectedNft && (
          <>
            <p><strong>NFT ID:</strong> {selectedNft.id}</p>
            <p><strong>Name:</strong> {selectedNft.name}</p>
            <p><strong>Description:</strong> {selectedNft.description}</p>
            <p><strong>Rarity:</strong> {selectedNft.rarity}</p>
            <p><strong>Current Price:</strong> {selectedNft.price} APT</p>

            <Input
              type="number"
              placeholder="Enter sale price"
              value={salePrice}
              onChange={(e) => setSalePrice(e.target.value)}
              style={{ marginTop: 10 }}
            />
          </>
        )}
      </Modal>
    </div>
  );
};

export default MyNFTs;
