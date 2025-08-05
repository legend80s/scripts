import fs from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { Logger, toUnixPath } from './utils';

const logger = new Logger('[bun][fix]');
logger.debugging = true;

beforeAll(() => {
  fixFollowRedirectsFirstArgumentMustBeAnErrorObject();
});

/**  635 |       Error.captureStackTrace(this, this.constructor);
 *                   ^
 * TypeError: First argument must be an Error object
 *       at new CustomError (D:\workspace\nanhu\new-maas-fronted\node_modules\follow-redirects\index.js:635:13)
 *       at createErrorType (D:\workspace\nanhu\new-maas-fronted\node_modules\follow-redirects\index.js:643:27)
 *       at <anonymous> (D:\workspace\nanhu\new-maas-fronted\node_modules\follow-redirects\index.js:64:29)
 */
function fixFollowRedirectsFirstArgumentMustBeAnErrorObject() {
  const originalPath = require.resolve('follow-redirects');
  const originalDir = path.dirname(originalPath);

  const tempPath = path.join(tmpdir(), 'follow-redirects-index.js');
  logger.log('tempPath:', tempPath);

  // 备份原始模块
  const originalCode = fs.readFileSync(originalPath, 'utf8');

  // 修改模块内容
  // fix error: Cannot find module './debug' from 'C:\Users\foo\AppData\Local\Temp\follow-redirects-index.js'
  let modifiedCode = originalCode.replace(
    /require\(['"](\.\/[^'"]+)['"]\)/g,
    (_, relPath) => {
      const absPath = path.join(originalDir, relPath);
      const unixPath = toUnixPath(absPath);
      logger.log('absPath:', absPath);
      logger.log('unixPath:', unixPath);

      return `require('${unixPath}')`;
    }
  );

  modifiedCode = modifiedCode.replace(
    /Error\.captureStackTrace\(this, this\.constructor\);/g,
    'Error.captureStackTrace(new Error(), this.constructor);'
  );
  fs.writeFileSync(tempPath, modifiedCode);

  // 覆盖 require 缓存
  const tempModule = require(tempPath);
  const originalModule = require(originalPath);

  originalModule.exports = tempModule;

  afterAll(() => {
    restoreFile();
  });

  function restoreFile() {
    logger.log('restoring...');
    delete require.cache[originalPath];

    try {
      fs.unlinkSync(tempPath);
    } catch (unlinkError) {
      logger.error('不应该报错 Error restoring original file:', unlinkError);

      throw unlinkError;
    }
  }
}
