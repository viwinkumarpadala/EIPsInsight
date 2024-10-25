import { Box, Text, Flex, useColorModeValue } from "@chakra-ui/react";
import InsightsLeaderboard from "@/components/InsightsLeaderboard";
import InsightsOpenPrsIssues from "@/components/InsightOpenPrsIssues";
import InsightSummary from "@/components/InsightSummaryTable";
import { usePathname } from "next/navigation";

const MyComponent = () => {
  const bg = useColorModeValue("#f6f6f7", "#171923");
  const path = usePathname();

  let year = "";
  let month = "";

  if (path) {
    const pathParts = path.split("/");
    year = pathParts[2];
    month = pathParts[3];
  }

  return (
    <Box
      padding="2rem"
      bgColor={bg}
      borderRadius="0.55rem"
      _hover={{
        border: "1px",
        borderColor: "#30A0E0",
      }}
    >
      <Flex
        direction={{ base: "column", md: "row" }} // Stack on small screens, side by side on medium and larger screens
        justifyContent="space-between"
        wrap="wrap" // Allow items to wrap on smaller screens
      >
        {/* Left Side: Full-height Insight Summary Table */}
        <Box flex="1" marginRight={{ base: "0", md: "1rem" }} marginBottom={{ base: "1rem", md: "0" }}>
          <InsightSummary /> 
        </Box>

        {/* Right Side: Two smaller charts with fixed heights */}
        <Box flex="1" display="flex" flexDirection="column" justifyContent="space-between">
          {/* First Chart Box with fixed height and heading */}
          <Box
            bgColor={bg}
            padding="1rem"
            borderRadius="0.55rem"
            minHeight="470px" // Set minimum height
            marginBottom="1rem"
          >
            <Text color={"#30A0E0"} fontSize="2xl" fontWeight="bold" textAlign="center" marginBottom="0.5rem">
              Editors Leaderboard
            </Text>
            <InsightsLeaderboard /> {/* First chart */}
          </Box>

          {/* Second Chart Box with fixed height and heading */}
          <Box
            bgColor={bg}
            padding="1rem"
            borderRadius="0.55rem"
            minHeight="400px" // Set minimum height
          >
            <Text color={"#30A0E0"} fontSize="2xl" fontWeight="bold" textAlign="center" marginBottom="0.5rem">
              {`Open PRs and Issues (${year})`}
            </Text>
            <InsightsOpenPrsIssues /> {/* Second chart */}
          </Box>
        </Box>
      </Flex>
    </Box>
  );
};

export default MyComponent;