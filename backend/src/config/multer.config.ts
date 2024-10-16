import multer from "multer";
// import fs from "fs";
// import path from "path";

// const UPLOAD_DIR = "uploads/";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

// !!! To use disk storage, uncomment the following code !!!
/* const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        fs.mkdirSync(UPLOAD_DIR, { recursive: true });
        cb(null, UPLOAD_DIR);
    },
    filename: (_req, file, cb) => {
        const uniqueSuffix = `${Date.now().toString()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
    },
}); */

export const upload = multer({
    // storage: multer.diskStorage(storage),
    storage: multer.memoryStorage(),
    limits: {
        fileSize: MAX_FILE_SIZE,
    },
    fileFilter: (_req, file, cb) => {
        const allowedMimes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Invalid file type. Only JPEG, PNG and GIF are allowed."));
        }
    },
});
