import { setDefaultTimeout } from "@cucumber/cucumber"
import { appConfig } from "../config/env";

//If too low this will affect playwright timeouts
setDefaultTimeout(appConfig.cucumberTimeout);