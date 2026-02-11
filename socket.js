///import model
const User = require("./models/user.model");
const ChatTopic = require("./models/chatTopic.model");
const Chat = require("./models/chat.model");
const Block = require("./models/block.model");
const AdListing = require("./models/adListing.model");
const Offer = require("./models/offer.model");
const Notification = require("./models/notification.model");
const ChatAdView = require("./models/chatAdView.model");

//private key
const admin = require("./util/privateKey");

//mongoose
const mongoose = require("mongoose");

io.on("connection", async (socket) => {
  console.log("Socket Connection done Client ID: ", socket.id);
  console.log("Current Rooms Before Join:", Array.from(socket.rooms));

  const { globalRoom } = socket.handshake.query;
  const id = globalRoom?.split(":")[1];
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    console.warn("Invalid or missing ID from globalRoom:", globalRoom);
    return;
  }

  if (globalRoom && globalRoom.includes(":")) {
    console.log("Socket connected with userId:", id);

    try {
      const user = await User.findById(id).select("_id").lean();
      if (user) {
        if (!socket.rooms.has(globalRoom)) {
          socket.join(globalRoom);
          console.log(`Socket joined room: ${globalRoom}`);
        } else {
          console.log(`User ${id} is already in room: ${globalRoom}, skipping rejoin.`);
        }

        console.log("Updated Rooms After Join:", Array.from(socket.rooms));

        await User.findByIdAndUpdate(user._id, { $set: { isOnline: true } }, { new: true });
        console.log(`User ${id} set to online`);
      }
    } catch (error) {
      console.error("Error updating user status:", error);
    }
  } else {
    console.warn("Invalid globalRoom format:", globalRoom);
  }

  socket.on("messageSent", async (data) => {
    const parseData = data;
    console.log("🔹 Data in messageSent:", parseData);

    const [sender, receiver, chatTopic] = await Promise.all([
      User.findById(parseData?.senderId).lean().select("_id name profileImage fcmToken isBlocked isOnline"),
      User.findById(parseData?.receiverId).lean().select("_id name profileImage fcmToken isBlocked"),
      ChatTopic.findById(parseData?.chatTopicId).lean().select("_id senderId receiverId chatId"),
    ]);

    if (!chatTopic) {
      console.log("❌ Chat topic not found");
      return;
    }

    if (parseData?.messageType == 1 || parseData?.messageType == 5) {
      const rawMessage = typeof parseData.message === "string" ? parseData.message : JSON.stringify(parseData.message);
      console.log("rawMessage:  ", rawMessage);

      const chat = new Chat({
        messageType: parseData?.messageType,
        senderId: parseData?.senderId,
        message: rawMessage,
        image: parseData?.image || "",
        chatTopicId: chatTopic._id,
        date: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
      });

      const eventData = {
        data,
        messageId: chat._id.toString(),
      };

      io.in("globalRoom:" + chatTopic?.senderId?.toString()).emit("messageSent", eventData);
      io.in("globalRoom:" + chatTopic?.receiverId?.toString()).emit("messageSent", eventData);

      await Promise.all([
        chat.save(),
        ChatTopic.updateOne(
          { _id: chatTopic._id },
          {
            $set: { chatId: chat._id },
          }
        ),
      ]);

      if (receiver && receiver.fcmToken) {
        const isBlocked = await Block.findOne({
          $or: [
            { blockerId: sender._id, blockedId: receiver._id },
            { blockerId: receiver._id, blockedId: sender._id },
          ],
        });

        if (!isBlocked) {
          const payload = {
            token: receiver.fcmToken,
            data: {
              title: `${sender?.name} sent you a message 💌`,
              body: `🗨️ ${chat?.message}`,
              type: "CHAT",
              chatTopicId: String(chatTopic._id),
              senderId: String(sender._id),
              isOnline: String(sender.isOnline),
              receiverId: String(receiver._id),
              senderName: String(sender.name),
              receiverName: String(receiver.name),
              senderImage: String(sender.profileImage || ""),
              receiverImage: String(receiver.profileImage || ""),
              adId: String(parseData.adId || ""),
              price: String(parseData.price || ""),
              title: String(parseData.title || ""),
              primaryImage: String(parseData.primaryImage || ""),
              view: String(parseData?.view || ""),
            },
          };

          console.log("payload: ", payload);

          try {
            const adminInstance = await admin;
            const response = await adminInstance.messaging().send(payload);
            console.log("✅ Successfully sent FCM notification: ", response);
          } catch (error) {
            console.log("❌ Error sending FCM message:", error);
          }
        } else {
          console.log("🚫 Notification not sent. Block exists between sender and receiver.");
        }
      }
    } else {
      console.log("ℹ️ Other message type received");

      const eventData = {
        data,
        messageId: parseData?.messageId?.toString() || "",
      };

      io.in("globalRoom:" + chatTopic?.senderId?.toString()).emit("messageSent", eventData);
      io.in("globalRoom:" + chatTopic?.receiverId?.toString()).emit("messageSent", eventData);
    }

    // 🟡 Create ad view only once per ad per user
    if (parseData?.view === true && parseData?.adId) {
      try {
        const existingView = await ChatAdView.findOne({
          ad: parseData.adId,
          user: parseData.senderId,
        });

        if (!existingView) {
          await ChatAdView.create({
            ad: parseData.adId,
            user: parseData.senderId,
          });
          console.log("✅ ChatAdView created.");
        } else {
          console.log("ℹ️ ChatAdView already exists. Skipping creation.");
        }
      } catch (err) {
        console.error("❌ Error creating ChatAdView:", err);
      }
    }
  });

  socket.on("messageSeen", async (data) => {
    try {
      const parsedData = data;
      console.log("🔹 Data in messageSeen event:", parsedData);

      const updated = await Chat.findByIdAndUpdate(parsedData.messageId, { $set: { isRead: true } }, { new: true, lean: true, select: "_id isRead" });

      if (!updated) {
        console.log(`No message found with ID ${parsedData.messageId}`);
      } else {
        console.log(`Updated isRead to true for message with ID: ${updated._id}`);

        // io.in("globalRoom:" + parsedData?.senderId?.toString()).emit("messageSeen", parsedData);
      }
    } catch (error) {
      console.error("Error updating messageSeen:", error);
    }
  });

  socket.on("offerPlaced", async (data) => {
    try {
      const parsedData = data;
      console.log("🔹 Data in offerPlaced event:", parsedData);

      const { userId, adId, offerAmount, message } = parsedData;

      const ad = await AdListing.findById(adId).select("seller title");
      if (!ad) {
        return socket.emit("offerError", "Ad not found.");
      }

      const receiverId = ad.seller.toString(); // Seller's user ID

      let [sender, receiver, chatTopic] = await Promise.all([
        User.findById(userId).select("name profileImage fcmToken"),
        User.findById(receiverId).select("name profileImage fcmToken isBlocked isNotificationsAllowed"),
        ChatTopic.findOne({
          senderId: userId,
          receiverId: receiverId,
          adId: adId,
        }),
      ]);

      if (!sender) {
        return socket.emit("offerError", "Sender not found.");
      }

      // ✅ Notify sender
      socket.emit("offerConfirmed", data);

      // ✅ Notify receiver
      io.in("globalRoom:" + receiverId).emit("offerReceived", data);

      const offer = await Offer.create({
        user: userId,
        ad: adId,
        offerAmount,
      });

      console.log(`✅ Offer placed by user ${userId} on ad ${adId}`);

      if (!chatTopic) {
        chatTopic = new ChatTopic({
          senderId: userId,
          receiverId: receiverId,
          adId: adId,
        });
        await chatTopic.save();
      }

      const chat = new Chat({
        senderId: userId,
        chatTopicId: chatTopic._id,
        messageType: 1,
        //message: `💰 I have placed an offer of ₹${offerAmount} on your ad "${ad.title}"`,
        message: message,
        date: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
      });

      await chat.save();

      if (receiver.isNotificationsAllowed && !receiver.isBlocked && receiver?.fcmToken !== null) {
        const payload = {
          token: receiver.fcmToken,
          data: {
            title: `💰 New Offer Received!`,
            body: `📢 ${sender.name} offered ₹${offerAmount} on your ad "${ad.title}"`,
            type: "OFFER",
            senderId: String(userId),
            receiverId: String(receiverId),
            senderName: String(sender.name),
            receiverName: String(receiver.name),
            senderImage: String(sender.profileImage || ""),
            receiverImage: String(receiver.profileImage || ""),
            adId: String(adId),
            offerId: String(offer._id),
          },
        };

        try {
          const adminInstance = await admin;
          await adminInstance.messaging().send(payload);

          await Notification.create({
            sendType: "single",
            user: receiverId,
            ad: adId,
            title: "💰 New Offer Received!",
            message: `📢 ${sender.name} offered ₹${offerAmount} on your ad "${ad.title}"`,
            date: new Date().toISOString(),
          });
        } catch (fcmError) {
          console.error("❌ FCM Offer Notification Error:", fcmError);
        }
      }
    } catch (error) {
      if (error.code === 11000) {
        console.warn(`⚠️ Duplicate offer from user on ad`);
        socket.emit("offerError", "You already placed an offer on this ad.");
      } else {
        console.error("❌ Error placing offer:", error);
        socket.emit("offerError", "Something went wrong. Please try again.");
      }
    }
  });
});
