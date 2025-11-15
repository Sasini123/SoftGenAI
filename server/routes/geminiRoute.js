const express = require("express");
const { chat, getModels, getConfig } = require("../controller/geminiController");

const router = express.Router();

router.post("/", chat);
router.get("/models", getModels);
router.get("/config", getConfig);

module.exports = router;
