const router = require("express").Router();
const { protect } = require("../middlewares/auth.middleware");
const { getConversations, getContacts, getMessages } = require("../controllers/chat.controller");
const asyncHandler = require("../helpers/asyncHandler");

router.use(protect);

router.get("/conversations", asyncHandler(getConversations));
router.get("/contacts", asyncHandler(getContacts));
router.get("/messages/:userId", asyncHandler(getMessages));

module.exports = router;