/**
 * @class StorageDriver
 * @description A driver for interacting with the inspected window's storage.
 * It uses `chrome.devtools.inspectedWindow.eval` to execute scripts on the inspected page.
 */
class StorageDriver {
  /**
   * Awaits the evaluation of a script in the inspected window.
   * @param {string} script - The script to execute.
   * @returns {Promise<any>} - A promise that resolves with the script's result.
   * @private
   */
  _eval(script) {
    return new Promise((resolve, reject) => {
      chrome.devtools.inspectedWindow.eval(
        script,
        (result, isException) => {
          if (isException) {
            console.error("Evaluation Error:", isException);
            return reject(isException);
          }
          resolve(result);
        }
      );
    });
  }

  /**
   * @method getStoragesInfo
   * @description Retrieves the number of items in both localStorage and sessionStorage.
   * @returns {Promise<{ls: number, ss: number}>} A promise that resolves to an object with item counts.
   * @async
   */
  async getStoragesInfo() {
    const script =
      "(function() { return JSON.stringify({ls: localStorage.length, ss: sessionStorage.length}); })();";
    const result = await this._eval(script);
    return JSON.parse(result);
  }

  /**
   * @method getStorageByName
   * @description Retrieves all key-value pairs from the specified storage type.
   * @param {string} name - The name of the storage ('localStorage' or 'sessionStorage').
   * @returns {Promise<Object<string, string>>} A promise that resolves to the storage object.
   * @async
   */
  async getStorageByName(name) {
    const script = `(function() { return JSON.stringify(${name}); })();`;
    const result = await this._eval(script);
    return JSON.parse(result);
  }

  /**
   * @method removeKey
   * @description Removes a specific key from the specified storage.
   * @param {string} storageName - The name of the storage ('localStorage' or 'sessionStorage').
   * @param {string} keyName - The key to remove.
   * @returns {Promise<void>} A promise that resolves when the key has been removed.
   * @async
   */
  async removeKey(storageName, keyName) {
    // Use JSON.stringify to handle keys with special characters
    const script = `${storageName}.removeItem(${JSON.stringify(keyName)});`;
    await this._eval(script);
  }

  /**
   * @method clearStorage
   * @description Clears all items from the specified storage.
   * @param {string} storageName - The name of the storage to clear ('localStorage' or 'sessionStorage').
   * @returns {Promise<void>} A promise that resolves when the storage has been cleared.
   * @async
   */
  async clearStorage(storageName) {
    const script = `${storageName}.clear();`;
    await this._eval(script);
  }
}
