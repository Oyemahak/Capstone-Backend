// server/routes/auth.js (example with Express)
router.post("/register", async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "Missing fields" });
    }
    // hash password, validate role in ["client","developer","admin"]
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash: await hash(password),
      role,                  // requested role
      status: "pending",     // <- show up in Admin Approvals
    });
    res.json({ message: "Request received", userId: user._id });
  } catch (e) { next(e); }
});