const express = require("express");
const User = require("../models/user");
const auth = require("../middleware/auth");
const multer = require("multer");
const sharp = require("sharp");
const {
  sendWelcomeEmail,
  sendCancelEmail
} = require("../emails/account");
const router = new express.Router();

/**
 * Creates the endpoint for users creation
 */
router.post("/users", async (req, res) => {
  const user = new User(req.body);

  try {
    await user.save();
    sendWelcomeEmail(user.email, user.name);
    const token = await user.generateAuthToken();
    res.status(201).send({
      user,
      token
    });
  } catch (error) {
    res.status(400).send(error);
  }
});

/**
 * Creates the endpoint for users to login
 */
router.post("/users/login", async (req, res) => {
  try {
    const {
      email,
      password
    } = req.body;
    const user = await User.findByCredencials(email, password);
    const token = await user.generateAuthToken();
    res.send({
      user,
      token
    });
  } catch (error) {
    res.status(400).send();
  }
});

/**
 * Creates route to logout user
 */
router.post("/users/logout", auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter(token => {
      token.token !== req.token;
    });
    await req.user.save();

    res.send();
  } catch (error) {
    res.status(500).send();
  }
});

/**
 * Creates route to logout all sessions
 */
router.post("/users/logoutAll", auth, async (req, res) => {
  try {
    req.user.tokens = [];
    await req.user.save();

    res.send();
  } catch (error) {
    res.status(500).send();
  }
});

/**
 * Creates route to fetch the user information
 */
router.get("/users/me", auth, async (req, res) => {
  res.send(req.user);
});

/**
 * Creates the endpoint to update an user
 */
router.patch("/users/me", auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ["name", "email", "password", "age"];
  const isValidOperator = updates.every(update =>
    allowedUpdates.includes(update)
  );

  if (!isValidOperator)
    return res.status(400).send({
      error: "Invalid updates!"
    });

  try {
    updates.forEach(update => (req.user[update] = req.body[update]));
    await req.user.save();
    res.send(req.user);
  } catch (error) {
    res.status(400).send();
  }
});

/**
 * Creates the endpoint to delete an user
 */
router.delete("/users/me", auth, async (req, res) => {
  try {
    await req.user.remove();
    sendCancelEmail(req.user.email, req.user.name);
    res.send(req.user);
  } catch (error) {
    res.status(500).send();
  }
});

/**
 * Creates the endpoint to upload an avatar
 */
const upload = multer({
  limits: {
    fileSize: 1000000
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error("Please upload an image"));
    }

    cb(undefined, true);
  }
});

router.post(
  "/users/me/avatar",
  auth,
  upload.single("avatar"),
  async (req, res) => {
      const buffer = await sharp(req.file.buffer)
        .resize({
          width: 250,
          height: 250
        })
        .png()
        .toBuffer();
      req.user.avatar = buffer;
      await req.user.save();
      res.send();
    },
    (error, req, res, next) => {
      res.status(400).send({
        error: error.message
      });
    }
);

/**
 * Creates the endpoint to delete an avatar
 */
router.delete("/users/me/avatar", auth, async (req, res) => {
  req.user.avatar = undefined;
  await req.user.save();
  res.send();
});

/**
 * Creates the endpoint to fetch the image url
 */
router.get("/users/:id/avatar", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || !user.avatar) throw new Error();

    res.set("Content-Type", "image/png");
    res.send(user.avatar);
  } catch (error) {
    res.status(404).send();
  }
});

module.exports = router;