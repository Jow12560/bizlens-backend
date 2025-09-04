import express from 'express';
import { check } from 'express-validator';
import { loginUser,loginTech } from '../controllers/auth.controller.js';

const loginRouter = express.Router();

// POST route for login
loginRouter.post(
  '/',
  [
    check('email', 'Email is required').isEmail(),
    check('password', 'Password is required').notEmpty()
  ],
  loginUser
);

// POST route for technician login
loginRouter.post(
  '/tech',
  [
    check('username', 'Username is required').notEmpty(),
    check('password', 'Password is required').notEmpty()
  ],
  loginTech
);

export default loginRouter;