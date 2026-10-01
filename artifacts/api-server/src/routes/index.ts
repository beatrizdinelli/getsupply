import { Router, type IRouter } from "express";
import healthRouter from "./health";
import marketplaceRouter from "./marketplace";
import supplierChatRouter from "./supplier-chat";
import stripeConnectRouter from "./stripe-connect";
import supplierDashboardRouter from "./supplier-dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(marketplaceRouter);
router.use(supplierChatRouter);
router.use(stripeConnectRouter);
router.use(supplierDashboardRouter);

export default router;
