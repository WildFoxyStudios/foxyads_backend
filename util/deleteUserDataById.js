//private key
const admin = require("../util/privateKey");

//import model
const User = require("../models/user.model");
const AdFavorite = require("../models/adFavorite.model");
const AdLike = require("../models/adLike.model");
const AdListing = require("../models/adListing.model");
const AdVideo = require("../models/adVideo.model");
const AdView = require("../models/adView.model");
const AuctionBid = require("../models/auctionBid.model");
const Block = require("../models/block.model");
const ChatAdView = require("../models/chatAdView.model");
const Chat = require("../models/chat.model");
const ChatTopic = require("../models/chatTopic.model");
const Follow = require("../models/follow.model");
const Notification = require("../models/notification.model");
const Offer = require("../models/offer.model");
const PurchaseHistory = require("../models/purchaseHistory.model");
const Report = require("../models/report.model");
const Review = require("../models/review.model");
const Verification = require("../models/verification.model");
const VideoView = require("../models/videoView.model");
const AdVideoLike = require("../models/adVideoLike.model");

const mongoose = require("mongoose");
const { deleteFile } = require("../util/deletefile");

const deleteUserDataById = async (userId, user) => {
  const [chats, ads, advideos, verifications] = await Promise.all([
    Chat.find({ senderId: userId }).select("image audio").lean(),
    AdListing.find({ seller: userId }).select("primaryImage galleryImages").lean(),
    AdVideo.find({ uploader: userId }).select("videoUrl thumbnailUrl").lean(),
    Verification.find({ user: userId }).select("idProofFrontUrl idProofBackUrl").lean(),
  ]);

  for (const chat of chats) {
    if (chat.image) deleteFile(chat.image);
    if (chat.audio) deleteFile(chat.audio);
  }

  for (const ad of ads) {
    if (ad.primaryImage) deleteFile(ad.primaryImage);

    if (Array.isArray(ad.galleryImages) && ad.galleryImages.length > 0) {
      for (const img of ad.galleryImages) {
        deleteFile(img);
      }
    }

    const adVideos = await AdVideo.find({ ad: ad._id }).select("videoUrl thumbnailUrl").lean();
    for (const adv of adVideos) {
      if (adv.videoUrl) deleteFile(adv.videoUrl);
      if (adv.thumbnailUrl) deleteFile(adv.thumbnailUrl);

      await Promise.all([
        AdVideoLike.deleteMany({ adVideo: adv._id }), 
        Report.deleteMany({ adVideo: adv._id }), 
        VideoView.deleteMany({ video: adv._id }),
      ]);
    }

    await Promise.all([
      ChatTopic.deleteMany({ adId: ad._id }),
      AdVideo.deleteMany({ ad: ad._id }),
      AdFavorite.deleteMany({ ad: ad._id }),
      AdLike.deleteMany({ ad: ad._id }),
      AdView.deleteMany({ ad: ad._id }),
      AuctionBid.deleteMany({ ad: ad._id }),
      ChatAdView.deleteMany({ ad: ad._id }),
      Offer.deleteMany({ ad: ad._id }),
      Report.deleteMany({ ad: ad._id }),
      Notification.deleteMany({ ad: ad._id }),
    ]);
  }

  for (const adv of advideos) {
    if (adv.videoUrl) deleteFile(adv.videoUrl);
    if (adv.thumbnailUrl) deleteFile(adv.thumbnailUrl);
  }

  for (const ver of verifications) {
    if (ver.idProofFrontUrl) deleteFile(ver.idProofFrontUrl);
    if (ver.idProofBackUrl) deleteFile(ver.idProofBackUrl);
  }

  await Promise.all([
    Chat.deleteMany({ senderId: userId }),
    ChatTopic.deleteMany({ $or: [{ senderId: userId }, { receiverId: userId }] }),
    AdFavorite.deleteMany({ user: userId }),
    AdLike.deleteMany({ user: userId }),
    AdVideoLike.deleteMany({ user: userId }),
    AdView.deleteMany({ user: userId }),
    AuctionBid.deleteMany({ user: userId }),
    AuctionBid.deleteMany({ seller: userId }),
    Block.deleteMany({ blockerId: userId }),
    Block.deleteMany({ blockedId: userId }),
    ChatAdView.deleteMany({ user: userId }),
    Follow.deleteMany({ fromUserId: userId }),
    Follow.deleteMany({ toUserId: userId }),
    Offer.deleteMany({ user: userId }),
    PurchaseHistory.deleteMany({ user: userId }),
    Report.deleteMany({ user: userId }),
    Report.deleteMany({ reportedUser: userId }),
    Review.deleteMany({ reviewer: userId }),
    Review.deleteMany({ reviewee: userId }),
    VideoView.deleteMany({ user: userId }),
    Notification.deleteMany({ user: userId }),
    AdListing.deleteMany({ seller: userId }),
    AdVideo.deleteMany({ uploader: userId }),
    Verification.deleteMany({ user: userId }),
  ]);

  if (user.profileImage) {
    deleteFile(user.profileImage);
  }

  if (user.firebaseId) {
    try {
      const adminPromise = await admin;
      await adminPromise.auth().deleteUser(user.firebaseId);
      console.log(`✅ Firebase user deleted: ${user.firebaseId}`);
    } catch (err) {
      console.error(`❌ Failed to delete Firebase user ${user.firebaseId}:`, err.message);
    }
  }

  await User.findByIdAndDelete(userId);
};

module.exports = deleteUserDataById;
