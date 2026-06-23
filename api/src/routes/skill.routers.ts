import { Router } from 'express'
import skillsController from '../controller/skill.controller';
const router = Router();

router.get('/skills', skillsController.getSkills);
router.get('/skill/:id', skillsController.getSkillById);

export default router;