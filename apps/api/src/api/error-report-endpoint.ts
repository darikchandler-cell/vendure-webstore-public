/**
 * API Endpoint for receiving error reports from clients
 * Handles error reports from storefronts and forwards to error reporter
 */

import { Request, Response } from 'express';
import { reportError } from '../utils/error-reporter';

export async function handleErrorReportRequest(req: Request, res: Response) {
  try {
    const reportData = req.body;

    // Validate request
    if (!reportData || !reportData.error) {
      return res.status(400).json({ error: 'Invalid error report format' });
    }

    // Convert report data to Error object
    const error = new Error(reportData.error.message || 'Unknown error');
    error.name = reportData.error.name || 'Error';
    error.stack = reportData.error.stack;

    // Extract context
    const context = {
      source: reportData.context?.source || 'unknown',
      url: reportData.context?.url,
      method: req.method,
      userAgent: reportData.context?.userAgent || req.headers['user-agent'],
      userId: reportData.context?.userId,
      ...reportData.context,
    };

    // Report the error (sends email and creates GitHub issue)
    await reportError(error, context);

    // Return success
    return res.status(200).json({
      success: true,
      message: 'Error reported successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('❌ Error in error report endpoint:', err);
    return res.status(500).json({
      error: 'Failed to process error report',
      message: err.message,
    });
  }
}

