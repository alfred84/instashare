import { Router } from 'express';
import multer from 'multer';
import { authMiddleware, AuthenticatedRequest } from './auth.middleware';
import { FilesService } from './files.service';

const router = Router();
const filesService = new FilesService();

// Configure multer for in-memory file storage
const upload = multer({ storage: multer.memoryStorage() });

// Use auth middleware for all file routes
router.use(authMiddleware);

// POST /api/files/upload - Upload a new file
router.post('/upload', upload.single('file'), async (req: AuthenticatedRequest, res) => {
    const file = req.file;

  if (!file) {
    return res.status(400).json({ message: 'No file uploaded.' });
  }

  try {
    const result = await filesService.createFile(file, req.user.userId);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ message: 'Error uploading file.', error: error.message });
  }
});

// GET /api/files - List all files for the authenticated user
router.get('/', async (req: AuthenticatedRequest, res) => {
  try {
    const files = await filesService.listFiles(req.user.userId);
    res.status(200).json(files);
  } catch (error) {
    res.status(500).json({ message: 'Error listing files.', error: error.message });
  }
});

// GET /api/files/:id - Download a specific file
router.get('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const file = await filesService.getFile(req.params.id, req.user.userId);

    if (!file) {
      return res.status(404).json({ message: 'File not found or access denied.' });
    }

    // Set headers to trigger browser download
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);

    // Send the binary file data
    res.send(file.fileData);
  } catch (error) {
    res.status(500).json({ message: 'Error downloading file.', error: error.message });
  }
});

// DELETE /api/files/:id - Delete a specific file
router.delete('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const result = await filesService.deleteFile(req.params.id, req.user.userId);

    if (!result) {
      return res.status(404).json({ message: 'File not found or access denied.' });
    }

    res.status(204).send(); // No Content
  } catch (error) {
    res.status(500).json({ message: 'Error deleting file.', error: error.message });
  }
});

export const FilesController = router;
