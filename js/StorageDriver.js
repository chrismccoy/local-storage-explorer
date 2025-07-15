class StorageDriver {
  /**
   * Awaits the evaluation of a script in the inspected window.
   * @param {string} script - The script to execute.
   * @returns {Promise<any>} - A promise that resolves with the script's result.
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

  async getStoragesInfo() {
    const script =
      "(function() { return JSON.stringify({ls: localStorage.length, ss: sessionStorage.length}); })();";
    const result = await this._eval(script);
    return JSON.parse(result);
  }

  async getStorageByName(name) {
    const script = `(function() { return JSON.stringify(${name}); })();`;
    const result = await this._eval(script);
    return JSON.parse(result);
  }

  async removeKey(storageName, keyName) {
    // Use JSON.stringify to handle keys with special characters
    const script = `${storageName}.removeItem(${JSON.stringify(keyName)});`;
    await this._eval(script);
  }

  async clearStorage(storageName) {
    const script = `${storageName}.clear();`;
    await this._eval(script);
  }
}
