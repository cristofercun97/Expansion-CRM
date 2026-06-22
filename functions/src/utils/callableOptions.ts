import type {CallableOptions} from "firebase-functions/v2/https";

export const callableOptions: CallableOptions = {
  region: "europe-west1",
  cors: true,
  invoker: "public",
};
