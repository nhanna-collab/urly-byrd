import { NotificationService } from "./notificationService";
import { storage } from "../storage";

export const notificationService = new NotificationService(storage);
