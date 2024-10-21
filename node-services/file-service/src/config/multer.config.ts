import multer from "multer";

// const UPLOAD_DIR = "uploads/";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

// !!! To use disk storage, uncomment the following code !!!
/* const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        fs.mkdirSync(UPLOAD_DIR, { recursive: true });
        cb(null, UPLOAD_DIR);
    },
    filename: (_req, file, cb) => {
        const uniqueSuffix = `${DateTime.utc().toFormat("yyyyMMdd-HHmmss")}-${Math.round(Math.random() * 1e9)}`;
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
        // TODO: We can remove this file filter and let the file-process-service handle the file type validation
        const allowedMimes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Invalid file type. Only JPEG, PNG and GIF are allowed."));
        }
    },
});
