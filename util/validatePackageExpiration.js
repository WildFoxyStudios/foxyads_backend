const moment = require("moment");

const validatePackageExpiration = async (user) => {
  const now = moment();

  // --- Subscription Package ---
  if (user.subscriptionPackage?.packageId) {
    const subPkg = user.subscriptionPackage;

    if (subPkg.days === -1) {
      user.isSubscriptionExpired = false; // Lifetime package
    } else if (!subPkg.endDate || now.isSameOrAfter(moment(subPkg.endDate))) {
      user.subscriptionPackage = null;
      user.isSubscriptionExpired = true;
    } else {
      user.isSubscriptionExpired = false;
    }
  } else {
    user.isSubscriptionExpired = true;
  }

  // --- Feature Package ---
  if (user.featurePackage?.packageId) {
    const featurePkg = user.featurePackage;

    if (featurePkg.days === -1) {
      user.isFeaturePackageExpired = false; // Lifetime package
    } else if (!featurePkg.endDate || now.isSameOrAfter(moment(featurePkg.endDate))) {
      user.featurePackage = null;
      user.isFeaturePackageExpired = true;
    } else {
      user.isFeaturePackageExpired = false;
    }
  } else {
    user.isFeaturePackageExpired = true;
  }

  await user.save();
};

module.exports = validatePackageExpiration;
