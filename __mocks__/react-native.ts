/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *                                                               *
 *                    | react-native-orderbook |                 *
 *                                                               *
 *  License |  MIT General Public License                        *
 *  Author  |  Jorge Duarte Rodríguez <info@malagadev.com>       *
 *                                                               *
 *                            (c) 2021                           *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
import { NativeModules } from 'react-native';

NativeModules.RNCNetInfo = {
  getCurrentConnectivity: jest.fn(),
  isConnectionMetered: jest.fn(),
  addListener: jest.fn(),
  removeListeners: jest.fn(),
};
