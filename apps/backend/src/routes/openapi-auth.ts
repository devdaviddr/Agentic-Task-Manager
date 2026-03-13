import { Router } from 'express';

// This route is no longer used directly; OpenAPI auth is handled by authMiddleware.
const openapiAuthRoutes = Router();
export default openapiAuthRoutes;
