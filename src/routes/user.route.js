import express from 'express';
import { getAllUsers, createUser, updateUser, deleteUser } from '../controllers/user.controller.js';

const userRouter = express.Router();

userRouter.get('/', getAllUsers);
userRouter.post('/', createUser);
userRouter.patch('/:id', updateUser);
userRouter.delete('/:id', deleteUser);

export default userRouter;
