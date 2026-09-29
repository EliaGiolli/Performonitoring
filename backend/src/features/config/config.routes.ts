import { configKeyParamsSchema, updateConfigSchema } from '@pc-monitor/shared';
import { Router } from 'express';
import { validate } from '../../core/validation/validate.js';
import { getSafeEnvController, getThresholdsController, updateEnvController } from './config.controller.js';

const envRouter = Router();

envRouter.get('/', getSafeEnvController);
envRouter.get('/thresholds', getThresholdsController);
envRouter.patch(
  '/:key',
  validate({ params: configKeyParamsSchema, body: updateConfigSchema }),
  updateEnvController,
);

export default envRouter;
