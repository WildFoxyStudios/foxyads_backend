
const supabase = require("../../util/supabase");
const moment = require("moment");

// Get chat thumb list
exports.getChatList = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ status: false, message: "Unauthorized access. Invalid token." });
    }

    if (!req.query.chatType) {
      return res.status(200).json({ status: false, message: "chatType is required" });
    }

    const userId = req.user.userId;
    const start = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;
    const chatTypeFilter = parseInt(req.query.chatType);

    const from = (start - 1) * limit;
    const to = from + limit - 1;

    // Fetch topics where user is sender OR receiver
    const { data: topics, error } = await supabase
      .from('chat_topics')
      .select(`
            *,
            product:ad_listings!inner(id, title, price, primary_image:ad_images, seller_id), 
            sender:profiles!sender_id(id, name, profile_image, is_online),
            receiver:profiles!receiver_id(id, name, profile_image, is_online),
            last_message:chats!last_message_id(id, message, message_type, created_at, is_read, sender_id, chat_topic_id)
        `)
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .not('ad_id', 'is', null)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    if (!topics || topics.length === 0) {
      return res.status(200).json({ status: true, message: "Success", chatList: [] });
    }

    // Filter by chatType (Buying/Selling)
    // chatType 1 = Selling (User is seller)
    // chatType 0 (or other) = Buying (User is NOT seller)
    let filteredTopics = topics.filter(topic => {
      // product.seller_id should match userId for Selling (1)
      // product.seller_id should NOT match userId for Buying (not 1)

      const isSeller = topic.product && topic.product.seller_id === userId;
      if (chatTypeFilter === 1) return isSeller;
      return !isSeller;
    });

    // Check blocks
    const { data: blocks } = await supabase
      .from('blocks')
      .select('blocker_id, blocked_id')
      .or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`);

    const blockedUserIds = new Set();
    blocks?.forEach(b => {
      if (b.blocker_id === userId) blockedUserIds.add(b.blocked_id);
      if (b.blocked_id === userId) blockedUserIds.add(b.blocker_id);
    });

    filteredTopics = filteredTopics.filter(topic => {
      const otherUserId = topic.sender_id === userId ? topic.receiver_id : topic.sender_id;
      return !blockedUserIds.has(otherUserId);
    });

    // Get Unread Counts
    const topicIds = filteredTopics.map(t => t.id);
    let unreadCounts = {};

    if (topicIds.length > 0) {
      const { data: unreads } = await supabase
        .from('chats')
        .select('chat_topic_id')
        .in('chat_topic_id', topicIds)
        .eq('is_read', false)
        .neq('sender_id', userId);

      unreads?.forEach(u => {
        unreadCounts[u.chat_topic_id] = (unreadCounts[u.chat_topic_id] || 0) + 1;
      });
    }

    // Manual Pagination
    const paginatedTopics = filteredTopics.slice(from, to + 1);

    const chatList = paginatedTopics.map(topic => {
      const otherUser = topic.sender_id === userId ? topic.receiver : topic.sender;
      const lastMsg = topic.last_message;

      // Handle product image handling - ad_images might be array or string? In view_file of listing controller it seemed to vary.
      // Usually ad_images is jsonb array of json objects or strings.
      // If primary_image alias used above:
      let primaryImage = "";
      if (topic.product && topic.product.primary_image) {
        // Check if array or string
        if (Array.isArray(topic.product.primary_image)) {
          if (topic.product.primary_image.length > 0) {
            // if object {image: ...} or string
            const first = topic.product.primary_image[0];
            primaryImage = typeof first === 'object' ? first.image : first;
          }
        } else {
          primaryImage = topic.product.primary_image;
        }
      }

      // Calculate relative time
      let timeStr = "Unknown Day";
      if (lastMsg?.created_at) {
        const msgDate = moment(lastMsg.created_at);
        if (msgDate.isSame(moment(), 'day')) timeStr = "Today";
        else if (msgDate.isSame(moment().subtract(1, 'days'), 'day')) timeStr = "Yesterday";
        else timeStr = msgDate.format('dddd');
      }

      return {
        _id: topic.id,
        receiverId: otherUser?.id,
        adId: topic.ad_id,
        name: otherUser?.name,
        profileImage: otherUser?.profile_image,
        isOnline: otherUser?.is_online,
        chatTopic: topic.id,
        chatType: chatTypeFilter,
        senderId: lastMsg?.sender_id,
        messageType: lastMsg?.message_type,
        message: lastMsg?.message,
        isRead: lastMsg?.is_read,
        lastChatMessageTime: lastMsg?.created_at,
        productTitle: topic.product?.title,
        productImage: primaryImage,
        productPrice: topic.product?.price,
        unreadCount: unreadCounts[topic.id] || 0,
        time: timeStr
      };
    });

    return res.status(200).json({
      status: true,
      message: "Success",
      chatList,
    });

  } catch (error) {
    console.error("Error in fetchChatList:", error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};
