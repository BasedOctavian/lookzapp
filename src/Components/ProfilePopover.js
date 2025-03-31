import React from "react";
import { Text } from "@chakra-ui/react";
import { Popover, PopoverTrigger, PopoverContent, PopoverBody } from "@chakra-ui/popover";
import { Avatar } from "@mui/material";

const ProfilePopover = ({ name, photoUrl, rank, children }) => {
  return (
    <Popover trigger="hover" placement="top" gutter={12} openDelay={150} closeDelay={300}>
      <PopoverTrigger>{children}</PopoverTrigger>
      <PopoverContent
        style={{
          width: "220px",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
          border: "1px solid rgba(0, 0, 0, 0.1)",
          backgroundColor: "#ffffff",
          overflow: "hidden",
          transition: "all 0.2s ease-in-out",
        }}
      >
        <PopoverBody
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
            gap: "12px",
            background: "linear-gradient(to bottom, #fafafa, #ffffff)",
          }}
        >
          <Avatar
            src={photoUrl}
            style={{
              width: "90px",
              height: "90px",
              borderRadius: "50%",
              border: "3px solid #ffffff",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
              objectFit: "cover",
            }}
          />
          <Text
            style={{
              fontWeight: 600,
              fontSize: "16px",
              color: "#2d3748",
              textAlign: "center",
              borderRadius: "4px",
              padding: "4px 8px",
              backgroundColor: "rgba(237, 242, 247, 0.5)",
              maxWidth: "100%",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {name}
          </Text>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <Text
              style={{
                fontSize: "12px", // Approx 'sm'
                color: "#718096", // gray.500
                textAlign: "center",
                fontWeight: 500, // Medium weight
                fontFamily: "Matt Light", // Match InfluencerProfile
              }}
            >
              Global Rank
            </Text>
            <Text
              style={{
                fontSize: "36px", // Approx '3xl'
                fontWeight: "900", // Black/bold
                color: rank && rank !== "N/A" ? "#3182ce" : "#718096", // blue.500 or gray.500
                textAlign: "center",
                fontFamily: "Matt Bold", // Match InfluencerProfile
              }}
            >
              {rank && rank !== "N/A" ? rank : "N/A"}
            </Text>
          </div>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
};

export default ProfilePopover;