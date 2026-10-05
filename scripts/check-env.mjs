import {validateFrontendConfig} from './frontend-config.mjs';
validateFrontendConfig(process.env);
console.log('Required public frontend configuration validated (values withheld).');
