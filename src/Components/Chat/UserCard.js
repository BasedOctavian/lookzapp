import { Button, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody } from "@chakra-ui/react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { firestore } from "firebase-config";

const UserCard = ({ user, isPaid, currentUserId }) => {
  const navigate = useNavigate();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const handlePayToMessage = () => {
    setIsPaymentModalOpen(true);
    setTimeout(() => {
      const sortedIds = [currentUserId, user.id].sort();
      const conversationId = `${sortedIds[0]}_${sortedIds[1]}`;
      firestore.collection("conversations").doc(conversationId).set({
        participants: sortedIds,
        paid: true,
        timestamp: new Date(),
      }, { merge: true });
      setIsPaymentModalOpen(false);
      navigate(`/message/${user.id}`);
    }, 2000);
  };

  return (
    <>
      <Box>
        <Text>{user.displayName}</Text>
        <Button onClick={isPaid ? () => navigate(`/message/${user.id}`) : handlePayToMessage}>
          {isPaid ? "Message" : "Pay to Message"}
        </Button>
      </Box>
      <Modal isOpen={isPaymentModalOpen} onClose={() => {}}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Simulating Payment</ModalHeader>
          <ModalBody>Processing your payment...</ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};