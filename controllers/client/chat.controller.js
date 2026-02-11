
const supabase = require("../../util/supabase");
const admin = require("../../util/privateKey");
const { deleteFiles } = require("../../util/deletefile");
const fs = require("fs");
const path = require("path");

// Helper to upload file to Supabase Storage
async function uploadToSupabase(file, folder = "chats") {
  try {
    const fileExt = path.extname(file.originalname);
    const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substr(2, 9)}${fileExt}`;
    const fileContent = await fs.promises.readFile(file.path);

    const { data, error } = await supabase.storage
      .from('chat-assets')
      .upload(fileName, fileContent, {
        contentType: file.mimetype,
        upsert: false
      });

    if (error) throw error;

    const { data: publicUrlData } = supabase.storage
      .from('chat-assets')
      .getPublicUrl(fileName);

    return publicUrlData.publicUrl;
  } catch (err) {
    console.error("Upload error:", err);
    return null;
  }
}

// Send product wise message ( image or audio )
exports.sendChatMessage = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      if (req.files) deleteFiles(req.files);
      return res.status(401).json({ status: false, message: "Unauthorized access. Invalid token." });
    }

    const { receiverId, adId, messageType } = req.body;
    if (!adId || !receiverId || !messageType) {
      if (req.files) deleteFiles(req.files);
      return res.status(200).json({ status: false, message: "Missing or invalid request parameters." });
    }

    const parsedMessageType = Number(messageType);
    if ((parsedMessageType === 2 && (!req.files?.image || req.files.image.length === 0)) || (parsedMessageType === 3 && (!req.files?.audio || req.files.audio.length === 0))) {
      if (req.files) deleteFiles(req.files);
      return res.status(200).json({ status: false, message: "Missing file for specified message type." });
    }

    const senderId = req.user.userId;

    // Fetch Sender, Receiver, Product
    const { data: sender } = await supabase.from('profiles').select('id, name, profile_image').eq('id', senderId).single();
    const { data: receiver } = await supabase.from('profiles').select('id, name, profile_image, fcm_token, is_blocked').eq('id', receiverId).single();
    const { data: product } = await supabase.from('ad_listings').select('id, seller_id').eq('id', adId).single();

    if (!sender || !receiver || !product) {
      if (req.files) deleteFiles(req.files);
      return res.status(200).json({ status: false, message: "Sender, receiver or product not found." });
    }

    // Check Topic
    const { data: existingTopic } = await supabase
      .from('chat_topics')
      .select('*')
      .eq('ad_id', adId)
      .or(`and(sender_id.eq.${senderId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${senderId})`)
      .single();

    let topicId = existingTopic?.id;

    if (!topicId) {
      // Create Topic
      const { data: newTopic, error: createError } = await supabase
        .from('chat_topics')
        .insert({
          sender_id: senderId,
          receiver_id: receiverId,
          ad_id: adId,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) throw createError;
      topicId = newTopic.id;
    }

    // Prepare Message
    let messageText = "";
    let imagePath = "";
    let audioPath = "";

    if (parsedMessageType === 2) {
      messageText = "📸 Image";
      const imageUrl = await uploadToSupabase(req.files.image[0], "images");
      if (imageUrl) imagePath = imageUrl;
    } else if (parsedMessageType === 3) {
      messageText = "🎤 Audio";
      const audioUrl = await uploadToSupabase(req.files.audio[0], "audio");
      if (audioUrl) audioPath = audioUrl;
    } else {
      messageText = req.body.message || ""; // Basic text
    }

    // Clean up local files
    if (req.files) deleteFiles(req.files);

    const chatPayload = {
      chat_topic_id: topicId,
      sender_id: senderId,
      message_type: parsedMessageType,
      message: messageText,
      image: imagePath,
      audio: audioPath,
      date: new Date().toISOString(),
      is_read: false
    };

    // Insert Chat
    const { data: chatData, error: chatError } = await supabase
      .from('chats')
      .insert(chatPayload)
      .select()
      .single();

    if (chatError) throw chatError;

    // Update Topic with last message
    await supabase.from('chat_topics').update({ last_message_id: chatData.id, updated_at: new Date().toISOString() }).eq('id', topicId);

    // Response
    const chatResponse = {
      _id: chatData.id,
      senderId: chatData.sender_id,
      chatTopicId: chatData.chat_topic_id,
      messageType: chatData.message_type,
      message: chatData.message,
      image: chatData.image,
      audio: chatData.audio,
      date: chatData.date,
      createdAt: chatData.created_at
    };

    res.status(200).json({
      status: true,
      message: "Message sent successfully.",
      chat: chatResponse,
    });


    // Push Notification
    if (receiver && !receiver.is_blocked && receiver.fcm_token) {
      const payload = {
        token: receiver.fcm_token,
        data: {
          title: `${sender.name} sent you a message 📩`,
          body: `🗨️ ${messageText}`,
          type: "CHAT",
          senderId: String(senderId),
          receiverId: String(receiverId),
          senderName: String(sender.name),
          receiverName: String(receiver.name),
          senderImage: String(sender.profile_image || ""),
          receiverImage: String(receiver.profile_image || ""),
        },
      };

      try {
        const adminPromise = await admin;
        await adminPromise.messaging().send(payload);
        // console.log("FCM sent");
      } catch (e) {
        console.error("FCM Error", e);
      }
    }

  } catch (error) {
    if (req.files) deleteFiles(req.files);
    console.error("pushChatMessage error:", error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

// Get old chat
exports.getChatHistory = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ status: false, message: "Unauthorized access. Invalid token." });
    }

    const { receiverId, adId } = req.query;
    const start = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;

    if (!receiverId || !adId) {
      return res.status(200).json({ status: false, message: "Missing receiverId or adId." });
    }

    const senderId = req.user.userId;
    if (senderId === receiverId) {
      return res.status(200).json({ status: false, message: "Sender and receiver can't be the same." });
    }

    // Check Product
    const { data: product } = await supabase.from('ad_listings').select('id').eq('id', adId).single();
    if (!product) {
      return res.status(200).json({ status: false, message: "Product not found." });
    }

    // Find Topic
    const { data: topic } = await supabase
      .from('chat_topics')
      .select('*')
      .eq('ad_id', adId)
      .or(`and(sender_id.eq.${senderId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${senderId})`)
      .single();

    let topicId = topic?.id;
    let finalChatTopic = topic;

    if (!topicId) {
      // Create if not exists
      const { data: newTopic } = await supabase.from('chat_topics').insert({
        sender_id: senderId,
        receiver_id: receiverId,
        ad_id: adId,
        updated_at: new Date().toISOString()
      }).select().single();
      topicId = newTopic.id;
      finalChatTopic = newTopic;
    }

    // Mark as read
    await supabase.from('chats')
      .update({ is_read: true })
      .eq('chat_topic_id', topicId)
      .neq('sender_id', senderId)
      .eq('is_read', false);

    // Fetch History
    const from = (start - 1) * limit;
    const to = from + limit - 1;

    const { data: history, error } = await supabase
      .from('chats')
      .select('*')
      .eq('chat_topic_id', topicId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    // Map
    const mappedHistory = history.map(c => ({
      _id: c.id,
      senderId: c.sender_id,
      chatTopicId: c.chat_topic_id,
      messageType: c.message_type,
      message: c.message,
      image: c.image,
      audio: c.audio,
      date: c.date,
      createdAt: c.created_at,
      isRead: c.is_read
    }));

    return res.status(200).json({
      status: true,
      message: "Chat history retrieved successfully.",
      chatTopic: topicId,
      chat: mappedHistory,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};
