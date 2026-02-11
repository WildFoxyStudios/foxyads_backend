module.exports = () => {
  return (req, res, next) => {

    const key = req.headers["key"];
    const envSecret = process.env.secretKey;

    if (!envSecret) {
      console.error("❌ CRITICAL: process.env.secretKey is NOT defined. Check your .env file.");
      return res.status(500).json({ status: false, error: "Server misconfiguration" });
    }

    if (key) {
      if (key.trim() === envSecret.trim()) {
        next();
      } else {
        console.warn("Invalid secret key provided.");
        return res.status(400).json({ status: false, error: "Unpermitted infiltration" });
      }
    } else {
      console.warn("Missing secret key in request.");
      return res.status(400).json({ status: false, error: "Unpermitted infiltration" });
    }
  };
};
