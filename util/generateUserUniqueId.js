const crypto = require("crypto");
const User = require("../models/user.model");

function generateRandomId(length = 10) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let id = "";

  while (id.length < length) {
    const byte = crypto.randomBytes(1)[0];
    const index = byte % chars.length;
    id += chars.charAt(index);
  }

  return id;
}

async function generateUniqueProfileId() {
  let unique = false;
  let profileId = "";

  while (!unique) {
    profileId = generateRandomId();

    const exists = await User.exists({ profileId });
    if (!exists) {
      unique = true;
    }
  }

  return profileId;
}

module.exports = { generateUniqueProfileId };
