import { HelloController } from "../../application/controllers/HelloController";
import { lambdaHttpAdater } from "../adapters/lambdaHttpAdapter";

const controller = new HelloController();

export const handler = lambdaHttpAdater(controller);
