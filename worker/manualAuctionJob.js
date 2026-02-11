const Bull = require("bull");

const AuctionBid = require("../models/auctionBid.model");
const User = require("../models/user.model");
const AdListing = require("../models/adListing.model");
const Notification = require("../models/notification.model");

const admin = require("../util/privateKey");

const manualAuctionQueue = new Bull("manual-auction-queue", {
  redis: { host: "127.0.0.1", port: 6379 },
});

manualAuctionQueue.process("closeManualAuction", async (job) => {
  console.log(`closeManualAuction Data:`, job.data);

  const { adId, sessionId } = job.data;

  //sessionId: currentAuctionSession

  const [ad, topBid] = await Promise.all([
    AdListing.findOne({ _id: adId, saleType: 2 }).select("seller title primaryImage shippingCharges attributes isAuctionEnabled saleType").lean(),
    AuctionBid.findOne({ ad: adId, auctionSessionId: sessionId }).sort({ currentBid: -1 }).limit(1).lean(),
  ]);

  if (!ad || !ad.isAuctionEnabled || ad.saleType !== 2) {
    console.log(`Invalid ad or auction for adId: ${adId}`);
    return;
  }

  if (!topBid) {
    await AdListing.findByIdAndUpdate(adId, {
      saleType: 3, // Not for sale
      status: 7, // Expired
      isAuctionEnabled: false,
      currentAuctionSession: null,
    });
    console.log("No bids. Marked as Not for Sale");
    return;
  }

  await Promise.all([
    AuctionBid.updateMany({ ad: adId, auctionSessionId: sessionId }, { $set: { isWinningBid: false } }),
    AuctionBid.findByIdAndUpdate(topBid._id, { $set: { isWinningBid: true } }),
    AdListing.findByIdAndUpdate(adId, {
      saleType: 3, // Not for sale
      status: 5, // Sold Out
      availableUnits: 0,
      isAuctionEnabled: false,
      currentAuctionSession: null,
    }),
  ]);

  const buyer = await User.findById(topBid.user).lean();

  if (buyer?.fcmToken !== null && !buyer?.isBlocked && buyer?.isNotificationsAllowed) {
    const payload = {
      token: buyer.fcmToken,
      data: {
        title: "🏆 Congratulations!",
        body: `You've won the auction for “${String(ad.title)}” at ₹${String(topBid.currentBid)}.`,
        type: "AUCTION_SUCCESS",
        adId: String(adId),
        bidId: String(topBid._id),
        productName: String(ad.title || ""),
        mainImage: String(ad.primaryImage || ""),
        amount: String(topBid.currentBid || 0),
        productAttributes: JSON.stringify(ad.attributes || []),
      },
    };

    try {
      const adminApp = await admin;
      const res = await adminApp.messaging().send(payload);
      console.log("Notification sent:", res);

      await Notification.create({
        sendType: "single",
        user: buyer._id,
        ad: adId,
        title: payload.data.title,
        message: payload.data.body,
        //image: ad.primaryImage || "",
        date: new Date().toISOString(),
      });

      console.log("Notification saved in DB");
    } catch (err) {
      console.error("Error sending notification:", err);
    }
  }
});

manualAuctionQueue.on("completed", (job) => {
  console.log(`Manual Auction Job ${job.id} completed`);
});

manualAuctionQueue.on("failed", (job, err) => {
  console.error(`Manual Auction Job ${job.id} failed: ${err.message}`);
});
