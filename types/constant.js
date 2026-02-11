exports.LOGIN_TYPE = {
  MOBILENO: 1,
  GOOGLE: 2,
  APPLE: 3,
  EMAIL_PASSWORD: 4,
};

exports.CHAT_TYPE = {
  SELLING: 1,
  BUYING: 2,
};

exports.MESSAGE_TYPE = {
  MESSAGE: 1,
  IMAGE: 2,
  AUDIO: 3,
  VIDEO_CALL: 4,
  ADS: 5,
};

exports.CALL_TYPE = {
  RECEIVED: 1,
  DECLINED: 2,
  MISCALLED: 3,
};

exports.VERIFICATION_STATUS = {
  PENDING: 1,
  ACCEPTED: 2,
  DECLINED: 3,
};

exports.AD_LISTING_TYPE = {
  PENDING: 1,
  APPROVED: 2, //Live
  PERMANENT_REJECTED: 3, //Don't Right To Resubmit The Ads
  SOFT_REJECTED: 4, //Right To Resubmit The Ads
  SOLD_OUT: 5,
  RESUBMITTED: 6,
  EXPIRED: 7,
};

exports.SALE_TYPE = {
  BUY_NOW: 1,
  AUCTION: 2,
  NOT_FOR_SALE: 3,
};

exports.REPORT_STATUS = {
  PENDING: 1,
  SOLVED: 2,
};

exports.REPORT_TYPE = {
  AD: 1,
  USER: 2,
  AD_VIDEO: 3,
};
