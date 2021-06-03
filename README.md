## React Native Orderbook
[![CodeQL](https://github.com/jduarter/orderbook_Jorge_2021_may25/actions/workflows/codeql-analysis.yml/badge.svg?branch=master)](https://github.com/jduarter/orderbook_Jorge_2021_may25/actions/workflows/codeql-analysis.yml)
[![type-coverage](https://img.shields.io/badge/dynamic/json.svg?label=type-coverage&prefix=%E2%89%A5&suffix=%&query=$.typeCoverage.atLeast&uri=https%3A%2F%2Fraw.githubusercontent.com%2Fjduarter%2Forderbook_Jorge_2021_may25%2Fmaster%2Fpackage.json)](https://github.com/jduarter/orderbook_Jorge_2021_may25)

## Install instructions.

- [ ] ```npm install``` # Please do not use yarn (package-lock.json)
- [ ] ```npx pod-install```
- [ ] ```npm test```

## Configuration

- [ ] Add a new .env file in the root of the project with the following data:

    ```
    WEBSOCKET_URI=wss://www.cryptofacilities.com/ws/v1
    ```

- [ ] Start the project

   ``` npx react-native ios```

### 1. Project bootstrapping.

I've added common development-assist packages like: `prettier` and `eslint` and their respective configuration files.

I was setting up the most optimal project directory structure for the project:

| **Directory** | **Description**             |
| ------------- | --------------------------- |
| scripts/      | Helper scripts              |
| src/          | Source files of the project |

Additionally, I've added some package.json scripts for ease of development and execution:

| **Command**     | **Description**                              |
| --------------- | -------------------------------------------- |
| npm install                | Install needed dependencies.                 |
| npx pod-install            | Install iOS pods.                            |
| npm test                   | Runs the test suite.                         |
| npm run lint:check         | Runs the linter in check (no-fix) mode.      |
| npm run format:fix         | Runs the linter in format (fix) mode.        |
| npm run cache:clearfull    | Completely wipes the RN cache.               |
| npm run typescript.        | Performs static typing validation (TS).      |
| npm run sec:hash           | Generates new hashes for integrity control.  |
| npm run sec:detect-secrets | Scans the code for included secrets          | 
| npm run sec:lockfile       | Scans lockfile for suspicious pkgs.          |
| npm run sec:outdated.      | Scans outdated packages.                     |
| npm clean                  | Cleans the build and node_modules directory. |
 
## License.

This project is licensed with MIT.

Copyright 2021 (c) Jorge Duarte Rodríguez <info@malagadev.com>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
