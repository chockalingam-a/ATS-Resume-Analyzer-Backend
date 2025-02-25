import { Request, Response, NextFunction } from "express";
import Resume from "../models/resume.model";
import { matchResumes } from "../services/matching.service";
import { parseResume } from "../utils/parseDocuments";

export const uploadResume = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const files = req.files as Express.Multer.File[];

    if (!files || !Array.isArray(files) || files.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No files uploaded" });
    }

    if (files.length > 10) {
      return res
        .status(400)
        .json({ success: false, message: "Max 10 resumes allowed per upload" });
    }

    const uploadedResumes = [];

    for (const file of files) {
      const content = await parseResume(file.path, file.mimetype);
      const s3Key = `resumes/${Date.now()}_${file.originalname}`;
      //await uploadFile(file, s3Key);

      const resume = new Resume({
        filename: file.originalname,
        s3Key,
        content: content.text,
        links: content.links,
      });
      await resume.save();

      uploadedResumes.push({ id: resume._id, filename: file.originalname });
    }

    res.status(200).json({
      success: true,
      message: "Resume uploaded successfully",
      data: uploadedResumes,
    });
  } catch (error) {
    console.log("Error:", error);
    next(error);
  }
};

export const getMatchedResumeDetails = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { resumeIds, jobDescription } = req.body;

    if (!resumeIds || !jobDescription) {
      return res.status(400).json({
        success: false,
        error: "Resume IDs and job description are required",
      });
    }

    const resumes = await Resume.find({ _id: { $in: resumeIds } });

    if (resumes.length === 0) {
      return res
        .status(404)
        .json({ success: false, error: "No resumes found" });
    }

    const matches = await matchResumes(resumeIds, jobDescription);

    return res
      .status(200)
      .json({ success: true, message: "Resume details", data: matches });
  } catch (error) {
    console.log("Error:", error);
    next(error);
  }
};
