import React, { useContext, useEffect, useState } from "react";
import "./ChatBox.css";
import upload from "../../lib/upload";
import assets from "../../assets/assets";
import { AppContext } from "../../context/AppContext";
import {
  doc,
  onSnapshot,
  updateDoc,
  arrayUnion,
  getDoc,
} from "firebase/firestore";
import { db } from "../../config/Firebase"; // Assuming Firebase config is already set up
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Client } from "@gradio/client";

const ChatBox = () => {
  const {
    userData,
    messagesId,
    chatUser,
    messages,
    setMessages,
    chatVisible,
    setChatVisible,
  } = useContext(AppContext);

  const [input, setInput] = useState("");
  const [imageFile, setImageFile] = useState(null); // New state for image file

  const analyzeContent = async (text) => {
    const client = await Client.connect(
      "dairyproductseshop/gradio-hate-Analyzer"
    );
    const response = await client.predict("/predict", { new_tweet: text });
    return response.data[0]; // Assuming the first element indicates if the content is hateful
  };

  const sendMessage = async () => {
    try {
      if (input && messagesId) {
        const analysisResult = await analyzeContent(input);

        if (
          analysisResult.includes("Hateful") ||
          analysisResult.includes("Offensive")
        ) {
          toast.error(analysisResult);
          return; // Stop the function if the content is offensive
        }

        await updateDoc(doc(db, "messages", messagesId), {
          messages: arrayUnion({
            sId: userData.id,
            text: input,
            createdAt: new Date(),
          }),
        });

        const userIDs = [chatUser.rId, userData.id];
        userIDs.forEach(async (id) => {
          const userChatsRef = doc(db, "chats", id);
          const userChatsSnapshot = await getDoc(userChatsRef);

          if (userChatsSnapshot.exists()) {
            const userChatData = userChatsSnapshot.data();
            const chatIndex = userChatData.chatsData.findIndex(
              (c) => c.messageId === messagesId
            );
            userChatData.chatsData[chatIndex].lastMessage = input.slice(0, 30);
            userChatData.chatsData[chatIndex].updatedAt = Date.now();

            if (userChatData.chatsData[chatIndex].rId === userData.id) {
              userChatData.chatsData[chatIndex].messageSeen = false;
            }
            await updateDoc(userChatsRef, {
              chatsData: userChatData.chatsData,
            });
          }
        });
      }

      // Handle image sending if an image is selected
      if (imageFile) {
        const maxSize = 2 * 1024 * 1024; // 2MB max size limit

        // Check for file size
        if (imageFile.size > maxSize) {
          toast.error(
            "Image is too large. Please upload an image smaller than 2MB."
          );
          return;
        }

        // Placeholder message to indicate the image is uploading
        const placeholderMessage = {
          sId: userData.id,
          image: "uploading",
          createdAt: new Date(),
        };

        // Add the placeholder to the messages state immediately
        setMessages((prevMessages) => [placeholderMessage, ...prevMessages]);

        // Upload the image and get the URL
        const fileUrl = await upload(imageFile);

        // After successful upload, update the message document with the actual image URL
        if (fileUrl && messagesId) {
          await updateDoc(doc(db, "messages", messagesId), {
            messages: arrayUnion({
              sId: userData.id,
              image: fileUrl,
              createdAt: new Date(),
            }),
          });

          const userIDs = [chatUser.rId, userData.id];
          userIDs.forEach(async (id) => {
            const userChatsRef = doc(db, "chats", id);
            const userChatsSnapshot = await getDoc(userChatsRef);

            if (userChatsSnapshot.exists()) {
              const userChatData = userChatsSnapshot.data();
              const chatIndex = userChatData.chatsData.findIndex(
                (c) => c.messageId === messagesId
              );
              userChatData.chatsData[chatIndex].lastMessage = "image";
              userChatData.chatsData[chatIndex].updatedAt = Date.now();

              if (userChatData.chatsData[chatIndex].rId === userData.id) {
                userChatData.chatsData[chatIndex].messageSeen = false;
              }
              await updateDoc(userChatsRef, {
                chatsData: userChatData.chatsData,
              });
            }
          });
        }

        // Replace the placeholder message with the actual image message in state
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.image === "uploading" ? { ...msg, image: fileUrl } : msg
          )
        );
      }
    } catch (error) {
      toast.error(error.message);
    }
    // Clear the input and image file after sending the message
    setInput("");
    setImageFile(null); // Reset the image file
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImageFile(file); // Save the image file to state
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  useEffect(() => {
    if (messagesId) {
      const unSub = onSnapshot(doc(db, "messages", messagesId), (res) => {
        setMessages(res.data().messages.reverse());
      });
      return () => {
        unSub();
      };
    }
  }, [messagesId]);

  return chatUser ? (
    <div className={`chat-box ${chatVisible ? "" : "hidden"}`}>
      <ToastContainer />
      <div className="chat-user">
        <img src={chatUser.userData.avatar} alt="" />
        <p>
          {chatUser.userData.name}
          {Date.now() - chatUser.userData.lastSeen <= 70000 ? (
            <img className="dot" src={assets.green_dot} />
          ) : null}
        </p>
        <img src={assets.help_icon} alt="Help" className="help" />
        <img
          onClick={() => setChatVisible(false)}
          src={assets.arrow_icon}
          className="arrow"
        />
      </div>

      <div className="chat-msg">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={msg.sId === userData.id ? "sender-msg" : "receiver-msg"}
          >
            {msg["image"] ? (
              <img className="msg-img" src={msg.image} />
            ) : (
              <p className="msg">{msg.text}</p>
            )}
            <div>
              <img
                src={
                  msg.sId === userData.id
                    ? userData.avatar
                    : chatUser.userData.avatar
                }
                alt=""
              />
              <p>
                {msg.createdAt?.seconds
                  ? new Date(msg.createdAt.seconds * 1000).toLocaleTimeString(
                      "en-US",
                      { hour: "numeric", minute: "numeric", hour12: true }
                    )
                  : "Just now"}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="chat-input">
        <input
          onChange={handleInputChange}
          value={input}
          type="text"
          placeholder="Send message"
        />
        <input
          onChange={handleImageChange}
          type="file"
          id="image"
          accept="image/png, image/jpeg"
          hidden
        />
        <label htmlFor="image">
          <img src={assets.gallery_icon} alt="Upload Image" />
        </label>
        <img
          onClick={sendMessage}
          src={assets.send_button}
          alt="Send"
          className="send-button"
        />
      </div>
    </div>
  ) : (
    <div className={`chat-welcome ${chatVisible ? "" : "hidden"}`}>
      <img src={assets.logo} alt="Welcome" />
      <p>Let's connect, Anytime</p>
    </div>
  );
};

export default ChatBox;
