import { Router } from "express";
import{
    loginClient,
    registerClient,
    logoutClient,
    changePassword,
    loginGoogle,
    googleCallback

} from "../controllers/client.controller.js"
import { verifyJWTclient } from "../middlewares/authClient.middleware.js";

const router = Router()

router.route("/register").post(registerClient)
router.route("/login").post(loginClient)
router.route("/logout").post(verifyJWTclient,logoutClient)
router.route("/changePassword").post(verifyJWTclient, changePassword)
router.route("/sessions/google").get(loginGoogle)
router.route("/sessions/googleCallback").get(googleCallback)

export default router