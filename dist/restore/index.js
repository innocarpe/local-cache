"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const p = __importStar(require("path"));
const cache_1 = require("../utils/cache");
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            /*
              clean up caches
            */
            const cacheBase = core.getState('cache-base');
            const cleanKey = core.getInput('clean-key');
            const CLEAN_TIME = 7;
            if (cleanKey) {
                yield (0, cache_1.exec)(`/bin/bash -c "find ${cacheBase} -maxdepth 1 -name '${cleanKey}*' -type d -atime +${CLEAN_TIME} -exec rm -rf {} +"`);
            }
        }
        catch (error) {
            if (error instanceof Error)
                core.warning(error.message);
        }
        try {
            const key = core.getInput('key');
            const base = core.getInput('base');
            const path = core.getInput('path');
            const hardCopy = core.getBooleanInput('hard-copy');
            const cacheBase = (0, cache_1.getCacheBase)(base);
            const cachePath = (0, cache_1.getCachePath)(key, base);
            (0, cache_1.checkKey)(key);
            (0, cache_1.checkPaths)([path]);
            core.saveState('key', key);
            core.saveState('path', path);
            core.saveState('hard-copy', String(hardCopy));
            core.saveState('cache-base', cacheBase);
            core.saveState('cache-path', cachePath);
            yield (0, cache_1.exec)(`mkdir -p ${cacheBase}`);
            const find = yield (0, cache_1.exec)(`find ${cacheBase} -maxdepth 1 -name ${key} -type d`);
            const cacheHit = find.stdout ? true : false;
            core.saveState('cache-hit', String(cacheHit));
            core.setOutput('cache-hit', String(cacheHit));
            if (cacheHit === true) {
                let command;
                if (hardCopy) {
                    // 실제로 하드 카피
                    command = `cp -R ${p.join(cachePath, path.split('/').slice(-1)[0])} ./${path}`;
                }
                else {
                    // 심볼릭 링크만 생성
                    command = `ln -s ${p.join(cachePath, path.split('/').slice(-1)[0])} ./${path}`;
                }
                const result = yield (0, cache_1.exec)(command);
                core.info(result.stdout);
                if (result.stderr)
                    core.error(result.stderr);
                if (hardCopy) {
                    if (!result.stderr)
                        core.info(`[Hard Copy] Cache restored with key ${key}`);
                }
                else {
                    if (!result.stderr)
                        core.info(`[Symbolic Link] Cache restored with key ${key}`);
                }
            }
            else {
                core.info(`Cache not found for ${key}`);
            }
        }
        catch (error) {
            if (error instanceof Error)
                core.setFailed(error.message);
        }
    });
}
run();
//# sourceMappingURL=index.js.map