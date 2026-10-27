import { Request, Response } from 'express';
import { ApiResponse, HealthResponse } from '../types/api.js';

export function getHealth(_req: Request, res: Response): void {
  const response: ApiResponse<HealthResponse> = {
    success: true,
    data: {
      status: 'UP',
      service: 'kone-compliance-checker',
    },
  };

  res.status(200).json(response);
}
