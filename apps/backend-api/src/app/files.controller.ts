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

    // Add detailed logging for debugging
    console.log('--- Initiating File Download ---');
    console.log(`File ID: ${file.id}, Status: ${file.status}`);
    console.log(`Zipped Data Exists: ${!!file.zippedData}`);
    console.log(`Zipped Data Length: ${file.zippedData ? file.zippedData.length : 'N/A'}`);
    console.log('---------------------------------');

    // Handle file download based on its status
    if (file.status === 'COMPLETED' && file.zippedData) {
      console.log('Action: Serving compressed (zipped) file.');
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}.zip"`);
      res.send(file.zippedData);
    } else if (file.status === 'UPLOADED' || file.status === 'PROCESSING') {
      console.log('Action: Responding with 202 - file is processing.');
      res.status(202).json({ message: 'File is still being processed. Please try again later.' });
    } else if (file.status === 'FAILED') {
      console.log('Action: Responding with 500 - file processing failed.');
      res.status(500).json({ message: 'File processing failed. Please try re-uploading the file.' });
    } else {
      console.log('Action: Responding with 500 - unexpected status or missing data.');
      // This case should ideally not be reached if status is handled correctly
      res.status(500).json({ message: 'An unexpected error occurred.' });
    }
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


// PATCH /api/files/:id/rename - Rename a specific file
router.patch('/:id/rename', async (req: AuthenticatedRequest, res) => {
  const { newName } = req.body;

  if (!newName) {
    return res.status(400).json({ message: 'New name is required.' });
  }

  try {
    const result = await filesService.renameFile(req.params.id, req.user.userId, newName);

    if (!result) {
      return res.status(404).json({ message: 'File not found or access denied.' });
    }

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: 'Error renaming file.', error: error.message });
  }
});

export const FilesController = router;
