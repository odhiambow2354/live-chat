import React, { useContext, useState } from "react";
import "./LeftSidebar.css";
import assets from "../../assets/assets";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  collection,
  query,
  where,
  getDocs,
  setDoc,
  serverTimestamp,
  updateDoc,
  arrayUnion,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "../../config/Firebase";
import { AppContext } from "../../context/AppContext";

const LeftSidebar = () => {
  const navigate = useNavigate();
  const {
    userData,
    chatData,
    chatUser,
    setChatUser,
    setMessagesId,
    messagesId,
    chatVisible,
    setChatVisible,
  } = useContext(AppContext);
  const [user, setUser] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [loading, setLoading] = useState(false); // Loading state

  const inputHandler = async (e) => {
    const input = e.target.value;
    setShowSearch(!!input); // Show search when there's input
    setUser(null); // Reset user before fetching new data

    if (!input) return;

    setLoading(true); // Start loading
    try {
      const userRef = collection(db, "users");
      const q = query(userRef, where("username", "==", input.toLowerCase()));
      const querySnap = await getDocs(q);

      if (!querySnap.empty && querySnap.docs[0].data().id !== userData.id) {
        const foundUser = querySnap.docs[0].data();
        const userExistsInChat = chatData.some(
          (chat) => chat.rId === foundUser.id
        );
        if (!userExistsInChat) {
          setUser(foundUser);
        } else {
          toast.info("Chat already exists with this user");
        }
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      dev;
      toast.error("Error fetching user");
    } finally {
      setLoading(false); // End loading
    }
  };

  const addChat = async () => {
    if (!user) return;
    const messagesRef = collection(db, "messages");
    const chatsRef = collection(db, "chats");

    try {
      // Create a new document in the messages collection
      const newMessageRef = doc(messagesRef);
      await setDoc(newMessageRef, {
        createdAt: serverTimestamp(),
        messages: [],
      });

      const chatDataEntry = {
        messageId: newMessageRef.id,
        lastMessage: "",
        rId: user.id,
        updatedAt: Date.now(),
        messageSeen: false,
        userData: {
          name: user.name,
          avatar: user.avatar || assets.profile_img,
        },
      };

      // Update the chat for the other user
      await updateDoc(doc(chatsRef, user.id), {
        chatsData: arrayUnion({ ...chatDataEntry, rId: userData.id }),
      });

      // Update the chat for the current user
      await updateDoc(doc(chatsRef, userData.id), {
        chatsData: arrayUnion({ ...chatDataEntry, rId: user.id }),
      });

      // Immediately open the chat after adding
      setMessagesId(newMessageRef.id);
      setChatUser({
        userData: {
          name: user.name,
          avatar: user.avatar || assets.profile_img,
        },
        rId: user.id,
      });
      setChatVisible(true);

      // Reset search input and close search
      setUser(null);
      setShowSearch(false);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const setChat = async (item) => {
    try {
      setMessagesId(item.messageId);
      setChatUser(item);
      const userChatsRef = doc(db, "chats", userData.id);
      const userChatsSnapshot = await getDoc(userChatsRef);
      const userChatsData = userChatsSnapshot.data();
      const chatIndex = userChatsData.chatsData.findIndex(
        (c) => c.messageId === item.messageId
      );
      userChatsData.chatsData[chatIndex].messageSeen = true;
      await updateDoc(userChatsRef, {
        chatsData: userChatsData.chatsData,
      });
      setChatVisible(true);
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className={`ls ${chatVisible ? "hidden" : ""}`}>
      <div className="ls-top">
        <div className="ls-nav">
          <div className="logo-container">
            <img className="logo" src={assets.logo} alt="Logo" />
            <span className="lc">Let's Chat</span>
          </div>

          <div className="menu">
            <img src={assets.menu_icon} alt="Menu" />
            <div className="sub-menu">
              <p onClick={() => navigate("/profile")}>Edit profile</p>
              <hr />
              <p onClick={() => navigate("/checkContent")}>Content</p>
            </div>
          </div>
        </div>
        <div className="ls-search">
          <img src={assets.search_icon} alt="Search" />
          <input
            onChange={inputHandler}
            type="text"
            placeholder="Search here"
          />
        </div>
      </div>

      <div className="ls-list">
        {loading ? (
          <p>Loading...</p>
        ) : showSearch && user ? (
          <div onClick={addChat} className="friends add-user">
            <img src={user.avatar || assets.profile_img} alt="User Avatar" />
            <div>
              <p>{user.name}</p>
            </div>
          </div>
        ) : (
          chatData.map((item, index) => (
            <div
              onClick={() => setChat(item)}
              key={index}
              className={`friends ${
                item.messageSeen || item.messageId === messagesId
                  ? ""
                  : "border"
              }`}
            >
              <img src={item.userData.avatar} alt="Profile" />
              <div>
                <p>{item.userData.name}</p>
                <span>{item.lastMessage}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LeftSidebar;
