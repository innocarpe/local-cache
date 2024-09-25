import * as core from '@actions/core'
import * as p from 'path'
import {
  checkKey,
  checkPaths,
  exec,
  getCacheBase,
  getCachePath
} from '../utils/cache'

async function run(): Promise<void> {
  try {
    /* 
      clean up caches
    */
      const cacheBase = core.getState('cache-base')
      const cleanKey = core.getInput('clean-key')
      const CLEAN_TIME = 7
  
      if (cleanKey) {
        await exec(
          `/bin/bash -c "find ${cacheBase} -maxdepth 1 -name '${cleanKey}*' -type d -atime +${CLEAN_TIME} -exec rm -rf {} +"`
        )
      }
    } catch (error) {
      if (error instanceof Error) core.warning(error.message)
    }

  try {
    const key = core.getInput('key')
    const base = core.getInput('base')
    const path = core.getInput('path')
    const hardCopy = core.getBooleanInput('hard-copy')
    const cacheBase = getCacheBase(base)
    const cachePath = getCachePath(key, base)

    checkKey(key)
    checkPaths([path])

    core.saveState('key', key)
    core.saveState('path', path)
    core.saveState('hard-copy', String(hardCopy))
    core.saveState('cache-base', cacheBase)
    core.saveState('cache-path', cachePath)

    await exec(`mkdir -p ${cacheBase}`)
    const find = await exec(
      `find ${cacheBase} -maxdepth 1 -name ${key} -type d`
    )
    const cacheHit = find.stdout ? true : false
    core.saveState('cache-hit', String(cacheHit))
    core.setOutput('cache-hit', String(cacheHit))

    if (cacheHit === true) {
      let command
      if (hardCopy) {
        // 실제로 하드 카피
        command = `cp -R ${p.join(cachePath, path.split('/').slice(-1)[0])} ./${path}`
      } else {
        // 심볼릭 링크만 생성
        command = `ln -s ${p.join(cachePath, path.split('/').slice(-1)[0])} ./${path}`
      }
      const result = await exec(command)

      core.info(result.stdout)
      if (result.stderr) core.error(result.stderr)
      if (hardCopy) {
        if (!result.stderr) core.info(`[Hard Copy] Cache restored with key ${key}`)
      } else {
        if (!result.stderr) core.info(`[Symbolic Link] Cache restored with key ${key}`)
      }
    } else {
      core.info(`Cache not found for ${key}`)
    }
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
