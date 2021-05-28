## React Native Orderbook

## Install instructions.

- [ ] npm install # Please do not use yarn (package-lock.json)
- [ ] npx pod-install
- [ ] npm test

## Configuration

- [ ] Add a new .env file in the root of the project with the following data:

    ADB_IP=(your LAN IP address)
    REACT_NATIVE_PACKAGER_HOSTNAME=(your LAN IP address)
    WEBSOCKET_URI=wss://www.cryptofacilities.com/ws/v1

- [ ] Start the metro packager

    npx react-native start

- [ ] Execute docker to generate the container

    docker-compose build orderbook1rn
    docker run -e ADB_IP=(your LAN IP address) \
     -e REACT_NATIVE_PACKAGER_HOSTNAME=(your LAN IP address) \
     -p 19000:19000 \
     -p 19001:19001 \
     orderbook1rn

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
| npm install     | Install needed dependencies.                 |
| npx pod-install | Install iOS pods.                            |
| npm test        | Runs the test suite.                         |
| npm clean       | Cleans the build and node_modules directory. |

## Possible improvements:

- Safe compilation of regexps used by json-2.js sanitizer (src/json-sanitizer.js) to prevent regexp-security issues.
- Test: malformed JSON.
- Test: unsafe JSONs.
- Test: the reading date will always have the time set to 00:00:00.000

## License.

This project is licensed with MIT.

Copyright 2021 (c) Jorge Duarte Rodríguez <info@malagadev.com>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
