import { Router } from 'express'
import { OpenAlexController } from '@/controllers/opalex'

const router = Router();

router.get('/works', OpenAlexController.getWorks);
router.get('/works/:id', OpenAlexController.getWorkById);
router.get('/authors', OpenAlexController.getAuthors);
router.get('/authors/:id', OpenAlexController.getAuthorById);
router.get('/institutions', OpenAlexController.getInstitutions);
router.get('/institutions/:id', OpenAlexController.getInstitutionById);

export default router;
