import multer, { StorageEngine } from "multer";
import path from "path";
import fs from "fs";

const uploadDir = "uploads";

// Ensure the uploads directory exists
/*if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}**/

const storage: StorageEngine = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // Save uploaded files to 'uploads' folder
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Append timestamp to file name
  },
});

export const uploadFile = multer({
  storage,
  limits: { files: 10, fileSize: 5 * 1024 * 1024 }, // 10 files max, 5MB max per file
  //fileFilter,
});
