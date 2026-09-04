import { Router, type IRouter } from "express";
import healthRouter from "./health";
import marketplaceRouter from "./marketplace";
import supplierChatRouter from "./supplier-chat";

const router: IRouter = Router();

router.use(healthRouter);
router.use(marketplaceRouter);
router.use(supplierChatRouter);

export default router;
