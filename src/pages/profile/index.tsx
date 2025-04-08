import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Avatar,
  Heading,
  Text,
  Input,
  Button,
  InputGroup,
  InputRightElement,
  IconButton,
  useToast,
  FormControl,
  FormLabel,
  Stack,
  HStack,
  Flex,
  Spinner,
  Center,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useColorModeValue
} from '@chakra-ui/react';
import { FaEye, FaEyeSlash, FaSignOutAlt, FaUserEdit, FaArrowLeft } from 'react-icons/fa';
import AllLayout from '@/components/LoginLayout';
import { RepeatIcon } from '@chakra-ui/icons';
import { signOut } from 'next-auth/react';

interface UserData {
  id: string;
  name: string;
  email: string;
  image: string;
  tier: string;
  walletAddress?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // Color mode values
  const bgColor = useColorModeValue("gray.50", "gray.800");
  const inputBg = useColorModeValue("white", "gray.600");
  const iconColor = useColorModeValue("gray.400", "gray.300");

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Load user data from localStorage on component mount
  // useEffect(() => {
  //   const loadUserData = () => {
  //     try {
  //       const storedUser = localStorage.getItem('user');
  //       console.log("initial data:", storedUser);
  //       if (storedUser) {
  //         const parsedUser = JSON.parse(storedUser);
  //         setName(parsedUser.name || '');
  //         setEmail(parsedUser.email || '');
  //         setUserData({
  //           id: parsedUser.id || '',
  //           name: parsedUser.name || '',
  //           email: parsedUser.email || '',
  //           image: parsedUser.image || '',
  //           tier: parsedUser.tier || 'Free',
  //           walletAddress: parsedUser.walletAddress || null
  //         });
  //       } else {
          
  //         router.push('/signin');
  //       }
  //     } catch (error) {
  //       console.error('Error loading user data:', error);
  //       router.push('/signin');
  //     } finally {
  //       setIsLoading(false);
  //     }
  //   };

  //   loadUserData();
  // }, [router]);

  useEffect(() => {
    const loadUserData = async () => {
      setIsLoading(true);
      try {
        // 1. First check localStorage
        const storedUser = localStorage.getItem('user');
        console.log("stored user:", storedUser);
        
        if (!storedUser) {
          router.push('/signin');
          return;
        }

        const parsedUser = JSON.parse(storedUser);
        
        // 2. Verify with server to get fresh data
        const response = await fetch('/api/user/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: parsedUser.email }),
        });

        if (!response.ok) {
          throw new Error('Session verification failed');
        }

        const serverUser = await response.json();
        
        // 3. Merge server data with local data
        const mergedUser = {
          ...parsedUser,
          ...serverUser, // Server data takes precedence
          tier: serverUser.tier || parsedUser.tier || 'Free'
        };

        // 4. Update both state and localStorage
        setName(mergedUser.name || '');
        setEmail(mergedUser.email || '');
        setUserData(mergedUser);
        localStorage.setItem('user', JSON.stringify(mergedUser));
        
      } catch (error) {
        console.error('Error loading user data:', error);
        localStorage.removeItem('user');
        router.push('/signin');
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, [router]);

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/GetUserStatus');
      const data = await response.json();

      // Update both state and localStorage
      const updatedUser = {
        ...userData!,
        tier: data.tier || userData?.tier || 'Free'
      };
      
      setUserData(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      toast({
        title: 'Status refreshed',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Refresh failed',
        description: 'Could not fetch latest status',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNameUpdate = async () => {
    try {
      setIsUpdating(true);
      
      // 1. Update the database first
      const updateResponse = await fetch('/api/user/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: userData?.id,
          name 
        }),
      });
  
      if (!updateResponse.ok) {
        throw new Error('Failed to update profile');
      }

      const updatedUser = await updateResponse.json();
      
      // 2. Create the new user object with updated data
      const newUserData = {
        ...userData!,
        name: updatedUser.name || name,
        email: updatedUser.email || userData?.email || ''
      };

      // 3. Update both state and localStorage atomically
      setUserData(newUserData);
      localStorage.setItem('user', JSON.stringify(newUserData));
  
      toast({
        title: 'Profile updated',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setIsEditingName(false);
    } catch (error) {
      console.error('Update error:', error);
      toast({
        title: 'Error updating profile',
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePasswordUpdate = async () => {
    if (!newPassword) {
      toast({
        title: 'Password cannot be empty',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Passwords do not match',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setIsUpdating(true);
      const response = await fetch('/api/user/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: newPassword }),
      });

      if (response.ok) {
        toast({
          title: 'Password updated successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        setShowPasswordForm(false);
        setNewPassword('');
        setConfirmPassword('');
      } else {
        throw new Error('Failed to update password');
      }
    } catch (error) {
      toast({
        title: 'Error updating password',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = async () => {
    try {
      // 1. Clear localStorage
      localStorage.removeItem('user');
      await signOut({ redirect: false });
      
      // fetch('/api/auth/logout', { method: 'POST' })
      //   .catch(error => console.error('Logout API error:', error));
      
      // 3. Close the modal
      onClose();
      
      // 4. Show success message
      toast({
        title: 'Logged out successfully',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
      
      // 5. Redirect to signin page after a brief delay
      setTimeout(() => router.push('/signin'), 500);
      
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: 'Logout failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const [isCancelling, setIsCancelling] = useState(false);

  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      const response = await fetch('/api/stripe/cancel-subscription', {
        method: 'POST'
      });
      const result = await response.json();

      const storedUser = localStorage.getItem('user');
      const parsedUser = storedUser?JSON.parse(storedUser):"";



      if (response.ok) {

        const mergedUser = {
          ...parsedUser,
          tier: 'Free'
        };

        setUserData(mergedUser);
        localStorage.setItem('user', JSON.stringify(mergedUser));

        
        toast({
          title: 'Subscription cancelled',
          description: `You'll retain premium access until ${new Date(result.endDate * 1000).toLocaleDateString()}`,
          status: 'success',
          duration: 8000,
          isClosable: true,
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: 'Cancellation failed',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading || !userData) {
    return (
      <Center h="100vh" bg={bgColor}>
        <Spinner size="xl" />
      </Center>
    );
  }

  return (
    <AllLayout>
    <Box minH="100vh" bg={bgColor} position="relative">
      {/* Absolute positioned navigation buttons */}
      <IconButton
        aria-label="Go back"
        icon={<FaArrowLeft />}
        size="lg"
        position="fixed"
        top={4}
        left={4}
        zIndex={10}
        variant="ghost"
        colorScheme="teal"
        onClick={() => router.push("/")}
        fontSize="24px"
        _hover={{
          transform: "scale(1.1)",
          bg: "transparent"
        }}
      />
      
      <Button
        colorScheme="red"
        leftIcon={<FaSignOutAlt />}
        onClick={onOpen}
        size="sm"
        position="fixed"
        top={4}
        right={4}
        zIndex={10}
        _hover={{
          transform: "scale(1.05)"
        }}
      >
        Logout
      </Button>

      <Box maxW="md" mx="auto" py={20} px={4}>
        {/* Profile Header */}
        <Flex direction="column" align="center" mb={8}>
          <Avatar
            size="2xl"
            src={userData.image}
            name={userData.name}
            mb={4}
            border="4px solid"
            borderColor="black"
          />
          <Heading size="lg" mb={2} color="black">
            {userData.name}
          </Heading>
          <Text color="black">{userData.email}</Text>
          {userData.walletAddress && (
            <Text fontSize="sm" color="gray.500" mt={2}>
              Wallet: {userData.walletAddress}
            </Text>
          )}
        </Flex>

        {/* Profile Details */}
        <Stack spacing={6}>
          {/* Name Field */}
          <FormControl>
            <FormLabel color="black">Username</FormLabel>
            {isEditingName ? (
              <Flex>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  mr={2}
                  bg={inputBg}
                  color="black"
                  borderColor="black"
                />
                <Button
                  colorScheme="teal"
                  onClick={handleNameUpdate}
                  isLoading={isUpdating}
                >
                  Save
                </Button>
                <Button
                  ml={2}
                  variant="outline"
                  borderColor="black"
                  color="black"
                  _hover={{ bg: "gray.100" }}
                  onClick={() => {
                    setIsEditingName(false);
                    setName(userData.name);
                  }}
                >
                  Cancel
                </Button>
              </Flex>
            ) : (
              <Flex align="center">
                <Input 
                  value={userData.name} 
                  bg={inputBg} 
                  color="black"
                  borderColor="black"
                />
                <Button
                  size="sm"
                  ml={4}
                  variant="outline"
                  borderColor="black"
                  color="black"
                  bg="gray.100"
                  leftIcon={<FaUserEdit />}
                  _hover={{ bg: "gray.200" }}
                  onClick={() => setIsEditingName(true)}
                >
                  Edit
                </Button>
              </Flex>
            )}
          </FormControl>

          {/* Email Field */}
          <FormControl>
            <FormLabel color="black">Email</FormLabel>
            <Input 
              value={userData.email} 
              isReadOnly 
              bg={inputBg} 
              color="black"
              borderColor="black"
            />
          </FormControl>

          <FormControl>
            <FormLabel color="black">Tier</FormLabel>
            <HStack spacing={4} align="center">
              <Input 
                value={userData.tier} 
                isReadOnly 
                bg="white" 
                color="black"
                borderColor="black"
                width="auto"
              />
              
              <IconButton
                aria-label="Refresh status"
                icon={<RepeatIcon />}
                colorScheme="blue"
                onClick={handleRefresh}
                isLoading={isLoading}
              />
            </HStack>
          </FormControl>

          {/* Password Field */}
          <FormControl>
            <FormLabel color="black">Password</FormLabel>
            <Button
              colorScheme="teal"
              variant="outline"
              borderColor="black"
              color="black"
              onClick={() => setShowPasswordForm(!showPasswordForm)}
            >
              Change Password
            </Button>
            {showPasswordForm && (
              <Box mt={4} p={4} borderWidth="1px" borderRadius="md" bg={inputBg} borderColor="black">
                <Stack spacing={4}>
                  <InputGroup>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="New Password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      bg={inputBg}
                      color="black"
                      borderColor="black"
                    />
                    <InputRightElement>
                      <IconButton
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        icon={showPassword ? <FaEyeSlash /> : <FaEye />}
                        variant="ghost"
                        color={iconColor}
                        onClick={() => setShowPassword(!showPassword)}
                      />
                    </InputRightElement>
                  </InputGroup>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    bg={inputBg}
                    color="black"
                    borderColor="black"
                  />
                  <Flex>
                    <Button
                      colorScheme="teal"
                      onClick={handlePasswordUpdate}
                      isLoading={isUpdating}
                    >
                      Save Password
                    </Button>
                    <Button
                      ml={2}
                      variant="outline"
                      borderColor="black"
                      color="black"
                      _hover={{ bg: "gray.100" }}
                      onClick={() => {
                        setShowPasswordForm(false);
                        setNewPassword('');
                        setConfirmPassword('');
                      }}
                    >
                      Cancel
                    </Button>
                  </Flex>
                </Stack>
              </Box>
            )}
          </FormControl>

          {userData.tier === 'Free' && (
            <Button 
              as="a"
              href="https://buy.stripe.com/test_7sI7sXdHu9SL8JG001"
              target="_blank"
              rel="noopener noreferrer"
              colorScheme="green" 
              mt={4}
              w="full"
            >
              Upgrade to Premium
            </Button> 
          )}
          {userData.tier === 'Premium' && (
            <Button
              colorScheme="red"
              variant="outline"
              onClick={handleCancel}
              isLoading={isCancelling}
              loadingText="Cancelling..."
              mt={2}
            >
              Cancel Premium
            </Button>
          )}
        </Stack>

        {/* Logout Confirmation Modal */}
        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Confirm Logout</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              Are you sure you want to logout?
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onClose}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={handleLogout}>
                Logout
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Box>
    </Box>
    </AllLayout>
  );
}