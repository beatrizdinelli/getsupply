import { Router, type IRouter } from "express";
import healthRouter from "./health";
import marketplaceRouter from "./marketplace";
import supplierChatRouter from "./supplier-chat";
import stripeConnectRouter from "./stripe-connect";
import supplierDashboardRouter from "./supplier-dashboard";
import suppliersRouter from "./suppliers";

const router: IRouter = Router();

router.use(healthRouter);
router.use(marketplaceRouter);
router.use(supplierChatRouter);
router.use(stripeConnectRouter);
router.use(supplierDashboardRouter);
// Mounted last: GET /suppliers/:id is a catch-all for /suppliers/<segment> and
// must not shadow the more specific /suppliers/me* and /suppliers/register
// routes above.
router.use(suppliersRouter);

export default router;
