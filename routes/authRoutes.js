import  {Router} from 'express';
import  {login} from '../controllers/authController.js';
import  validate from '../middlewares/validate.js';
import {loginSchema} from '../validations/authValidation.js';

const router=Router();
router.post('/login',validate(loginSchema),login);

export default router;