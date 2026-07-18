const router = require("express").Router();
const { getSongs, deleteSong } = require("../controllers/songController");

router.get("/", getSongs);
router.delete("/:id", deleteSong);

module.exports = router;