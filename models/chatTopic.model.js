const mongoose = require("mongoose");

const { CHAT_TYPE } = require("../types/constant");

const chatTopicSchema = new mongoose.Schema(
  {
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    adId: { type: mongoose.Schema.Types.ObjectId, ref: "AdListing", required: true },
    chatId: { type: mongoose.Schema.Types.ObjectId, ref: "Chat", default: null },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

chatTopicSchema.index({ senderId: 1, receiverId: 1, adId: 1, chatType: 1 });
chatTopicSchema.index({ chatId: 1 });

module.exports = mongoose.model("ChatTopic", chatTopicSchema);
