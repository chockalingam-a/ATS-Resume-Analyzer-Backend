import express from "express";
import {
  getMatchedResumeDetails,
  uploadResume,
} from "../controllers/resume.controller";
import { uploadFile } from "../middlewares/fileUpload";

const router = express.Router();

// Upload Resume API
router.post(
  "/upload",
  uploadFile.array("resumes", 10),
  async (req, res, next) => {
    try {
      await uploadResume(req, res, next);
    } catch (error: any) {
      console.log("error", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// Matching API
router.post("/match", async (req, res, next) => {
  try {
    await getMatchedResumeDetails(req, res, next);
  } catch (error) {
    next(error);
  }
});

export default router;
