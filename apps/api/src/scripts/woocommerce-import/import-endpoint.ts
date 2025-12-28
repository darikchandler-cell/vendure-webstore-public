/**
 * HTTP Endpoint to Trigger Import
 * This can be called via HTTP to trigger the import remotely
 */

import 'reflect-metadata';
import { Request, Response } from 'express';
import { importProducts } from './index';

export async function handleImportRequest(req: Request, res: Response) {
  try {
    const { limit, dryRun, skipImages } = req.query;

    const options = {
      limit: limit ? parseInt(limit as string, 10) : undefined,
      dryRun: dryRun === 'true',
      skipImages: skipImages === 'true',
    };

    // Run import in background
    importProducts(options).catch(err => {
      console.error('Import error:', err);
    });

    res.json({
      success: true,
      message: 'Import started',
      options,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}



