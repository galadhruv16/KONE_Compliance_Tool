import { Request, Response, NextFunction } from 'express';
import { ExcelTdsParser } from '../parsers/excel.parser.js';
import { PdfKtocParser } from '../parsers/pdf.parser.js';
import { ComplianceEngine } from '../engine/compliance.engine.js';
import { GroqProvider } from '../services/groq/groq.service.js';
import { MockGroqProvider } from '../services/groq/groq.mock.js';
import { logger } from '../logging/logger.js';

const tdsParser = new ExcelTdsParser();
const pdfParser = new PdfKtocParser();

// Use real Groq provider if GROQ_API_KEY is configured, otherwise safe fallback to Mock
const groqProvider = process.env.GROQ_API_KEY ? new GroqProvider() : new MockGroqProvider();
const complianceEngine = new ComplianceEngine(groqProvider);

export async function compareDocumentsHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const tdsFile = files?.['tdsFile']?.[0];
    const ktocFile = files?.['ktocFile']?.[0];

    if (!tdsFile || !ktocFile) {
      res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_FILES',
          message: 'Both tdsFile (.xlsx) and ktocFile (.pdf) must be provided in the multipart upload.',
        },
      });
      return;
    }

    logger.info('Processing compliance comparison request', {
      tdsFilename: tdsFile.originalname,
      ktocFilename: ktocFile.originalname,
      tdsSize: tdsFile.size,
      ktocSize: ktocFile.size,
    });

    // 1. Deterministic Extraction
    const tdsData = await tdsParser.parseBuffer(tdsFile.buffer);
    const ktocData = await pdfParser.parseBuffer(ktocFile.buffer);

    // 2. Deterministic Comparison with Semantic Alias Resolution
    const report = await complianceEngine.compare(tdsData, ktocData);

    res.status(200).json({
      success: true,
      data: report,
    });
  } catch (err) {
    logger.error('Error during compliance comparison', {
      error: err instanceof Error ? err.message : String(err),
    });
    next(err);
  }
}
