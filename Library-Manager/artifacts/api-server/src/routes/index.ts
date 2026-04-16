import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import booksRouter from "./books";
import moviesRouter from "./movies";
import membershipsRouter from "./memberships";
import transactionsRouter from "./transactions";
import reportsRouter from "./reports";
import usersRouter from "./users";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(booksRouter);
router.use(moviesRouter);
router.use(membershipsRouter);
router.use(transactionsRouter);
router.use(reportsRouter);
router.use(usersRouter);

export default router;
