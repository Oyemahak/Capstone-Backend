export async function listFiles(_req, res) {
  res.json({ files: [] }); // hook in later (multer/Drive/Cloudinary)
}