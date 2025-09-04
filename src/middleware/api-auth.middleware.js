export function apiAuth(req, res, next) {
  const apiKey = req.headers["x-api-key"];
  if (apiKey !== process.env.X_API_KEY) {
    return res.status(401).json({ message: "X_API_Key ไม่ถูกต้อง" });
  }
  next();
}
